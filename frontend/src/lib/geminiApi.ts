import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import PQueue from 'p-queue';

export interface GeminiConfig {
  apiKey: string;
  model: 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gemini-2.0-flash' | 'gemini-pro';
  temperature: number;
  maxTokens: number;
}

export interface CodeContext {
  currentFile: string;
  fileContent: string;
  cursorPosition: { line: number; column: number };
  selectedText?: string;
  language: string;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private modelName: string;
  private rateLimiter: RateLimiterMemory;
  private requestQueue: PQueue;
  private backoffUntil: number = 0; // Timestamp when backoff expires

  constructor(config: GeminiConfig) {
    this.modelName = config.model;
    this.genAI = new GoogleGenerativeAI(config.apiKey);

    // Set model-specific rate limits to match Gemini API actual limits (free tier)
    // gemini-2.5-flash: 15 RPM (free tier)
    // gemini-2.5-pro: 2 RPM (free tier, lower due to capability)
    // gemini-2.0-flash: 15 RPM (free tier)
    // gemini-pro: 60 RPM (legacy model)
    const rateLimit = this.getModelRateLimit(config.model);

    this.rateLimiter = new RateLimiterMemory({
      keyPrefix: 'gemini',
      points: rateLimit, // requests per minute based on model
      duration: 60, // per 60 seconds
    });

    // Set to 1 to prevent rate limit issues (10 RPM is very restrictive)
    this.requestQueue = new PQueue({ concurrency: 1 });
  }

  private getModelRateLimit(model: string): number {
    // Match actual Gemini API rate limits for free tier
    // Being conservative to avoid 429 errors
    if (model === 'gemini-2.5-flash') return 8; // Actual limit is 10, use 8 to be safe
    if (model === 'gemini-2.5-pro') return 2; // Pro has lower free tier limit
    if (model === 'gemini-2.0-flash') return 12; // Slightly below 15 RPM limit
    if (model === 'gemini-pro') return 50; // Below 60 RPM limit
    return 8; // Conservative default for unknown models
  }

  async generateCompletion(prompt: string, options?: { maxTokens?: number }): Promise<string> {
    // Check if we're in backoff period due to rate limiting
    const now = Date.now();
    if (this.backoffUntil > now) {
      const waitSeconds = Math.ceil((this.backoffUntil - now) / 1000);
      console.warn(`Rate limited. Waiting ${waitSeconds}s before retry...`);
      return ''; // Return empty instead of throwing
    }

    // Validate prompt before making API call
    if (!prompt || prompt.trim().length === 0) {
      console.error('Empty prompt provided');
      throw new Error('BAD_REQUEST: Empty prompt provided');
    }

    // Use custom maxTokens if provided, otherwise use the configured default
    let effectiveMaxTokens = options?.maxTokens || this.modelName === 'gemini-2.5-flash' ? 4096 : 2048;

    // For snippet generation, start with higher limit to avoid truncation
    if (prompt.includes('Generate a practical code snippet') || prompt.includes('Generate a practical, well-documented code snippet')) {
      effectiveMaxTokens = Math.max(effectiveMaxTokens, 8192);
    }

    // Reduced logging for production
    // console.log('🚀 Sending to Gemini API:', { model: this.modelName, promptLength: prompt.length, maxTokens: effectiveMaxTokens });

    try {
      await this.rateLimiter.consume('completion');

      return await this.requestQueue.add(async () => {
        try {
          // Create model with custom maxTokens for this request
          const requestModel = this.genAI.getGenerativeModel({
            model: this.modelName,
            generationConfig: {
              temperature: 0.2, // Use consistent temperature
              maxOutputTokens: effectiveMaxTokens,
            },
            safetySettings: [
              {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_NONE,
              },
              {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_NONE,
              },
              {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: HarmBlockThreshold.BLOCK_NONE,
              },
              {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.BLOCK_NONE,
              },
            ],
          });

          const result = await requestModel.generateContent(prompt);
          const response = await result.response;

          console.log('📥 API Response received:', {
            hasCandidates: !!response.candidates,
            candidatesCount: response.candidates?.length,
            hasPromptFeedback: !!response.promptFeedback,
            blockReason: response.promptFeedback?.blockReason
          });

          // Check if response was blocked by safety filters
          if (response.promptFeedback?.blockReason) {
            console.error('⚠️ Response blocked by safety filter:', response.promptFeedback.blockReason);
            console.error('Full feedback:', response.promptFeedback);
            throw new Error(`SAFETY_FILTER: Response blocked by safety filter: ${response.promptFeedback.blockReason}`);
          }

          // Try to get text, with fallback handling
          let text = '';
          try {
            text = response.text();
          } catch (textError) {
            // text() failed, try to extract from candidates manually
            console.warn('⚠️ response.text() failed, trying candidates...', textError);

            if (response.candidates && response.candidates.length > 0) {
              const candidate = response.candidates[0];
              console.log('Candidate info:', {
                hasContent: !!candidate.content,
                hasParts: !!candidate.content?.parts,
                partsCount: candidate.content?.parts?.length,
                finishReason: candidate.finishReason
              });

              if (candidate.content && candidate.content.parts) {
                text = candidate.content.parts.map((part: any) => part.text).join('');
              }
            }
          }

           // Final check
           if (!text || text.trim().length === 0) {
             console.error('❌ Empty text response from API');
             console.error('Response object:', JSON.stringify(response, null, 2));

             // Check if it's a MAX_TOKENS issue - retry with higher limit
             if (response.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
               console.warn('⚠️ Response was truncated due to maxTokens limit, retrying with higher limit...');
               // Retry with doubled token limit
               const retryOptions = { maxTokens: effectiveMaxTokens * 2 };
               return await this.generateCompletion(prompt, retryOptions);
             }

             // Empty response - likely safety filter or API issue
             throw new Error('EMPTY_RESPONSE: API returned empty response. This may be due to safety filters or API configuration.');
           }

          // Success - reduced logging
          // console.log('✅ Received:', text.length, 'chars');

          return text;
        } catch (apiError: unknown) {
          // Handle specific API errors with detailed logging
          const error = apiError as { status?: number; message?: string; errorDetails?: any; response?: any };

          // Log the full error for debugging
          console.error('❌ Gemini API Error:', {
            status: error?.status,
            message: error?.message,
            errorDetails: error?.errorDetails,
            response: error?.response,
            fullError: apiError
          });

          if (error?.status === 400) {
            const errorMsg = error?.message || '';
            if (errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('invalid')) {
              throw new Error('INVALID_API_KEY: Your Gemini API key is invalid. Please check your API key at https://aistudio.google.com/app/apikey');
            }
            throw new Error(`BAD_REQUEST: ${errorMsg || 'Invalid request to Gemini API. This could be due to safety filters, invalid content, or API configuration.'}`);
          }
          if (error?.status === 404) {
            throw new Error(`MODEL_NOT_FOUND: Model "${this.modelName}" not found. Please verify the model name is correct. Available models: gemini-2.5-flash, gemini-2.5-pro, gemini-2.0-flash, gemini-pro`);
          }
          if (error?.status === 403) {
            throw new Error('QUOTA_EXCEEDED: You have run out of API credits. Please check your billing status and quota at https://ai.google.dev/');
          }
          if (error?.status === 429) {
            // Check if this is a daily quota exceeded error vs per-minute rate limit
            const errorMsg = error?.message || '';
            const errorDetails = error?.errorDetails || [];

            // Check for quota failure indicators
            const quotaFailure = errorDetails.find((detail: any) =>
              detail['@type']?.includes('QuotaFailure') ||
              detail['@type']?.includes('quota')
            );

            const isQuotaExceeded = quotaFailure ||
              errorMsg.includes('quota') ||
              errorMsg.includes('Quota exceeded') ||
              errorMsg.includes('generativelanguage.googleapis.com/generate_content_free_tier_requests');

            if (isQuotaExceeded) {
              // Daily quota exceeded - more serious error
              const quotaInfo = quotaFailure?.violations?.[0];
              const quotaLimit = quotaInfo?.quotaValue || '250';

              console.error(`🚫 DAILY QUOTA EXCEEDED: You've used ${quotaLimit} requests today (free tier limit)`);

              throw new Error(`QUOTA_EXCEEDED: You've exceeded your daily API quota (${quotaLimit} requests/day). Your quota will reset in ~24 hours. Consider upgrading to a paid plan at https://ai.google.dev/pricing`);
            }

            // Per-minute rate limit - extract retry delay
            let retryDelay = 60; // Default 60 seconds
            try {
              const retryInfo = errorDetails.find((detail: any) => detail['@type']?.includes('RetryInfo'));
              if (retryInfo?.retryDelay) {
                const delayStr = retryInfo.retryDelay.replace('s', '');
                retryDelay = parseFloat(delayStr) || 60;
              }
            } catch (parseError) {
              // Use default retry delay
            }

            // Set backoff until timestamp
            this.backoffUntil = Date.now() + (retryDelay * 1000);
            console.warn(`Rate limited. Backing off for ${retryDelay} seconds.`);

            throw new Error(`RATE_LIMIT: Too many requests per minute. Please wait ${Math.ceil(retryDelay)} seconds before trying again.`);
          }
          if (error?.status === 500) {
            throw new Error('Gemini API server error. Please try again later.');
          }
          // Re-throw other errors
          throw apiError;
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        // Pass through already formatted error messages
        if (error.message.startsWith('RATE_LIMIT:') || error.message.startsWith('QUOTA_EXCEEDED:')) {
          throw error;
        }
        if (error.message.startsWith('BAD_REQUEST:') || error.message.startsWith('MODEL_NOT_FOUND:') || error.message.startsWith('INVALID_API_KEY:')) {
          throw error;
        }
        if (error.message.includes('rate limit') || error.message.includes('rate')) {
          throw new Error('RATE_LIMIT: Local rate limiter triggered. Please wait a moment before making more requests.');
        }
        if (error.message.includes('quota')) {
          throw new Error('QUOTA_EXCEEDED: API quota exceeded. Please check your usage limits.');
        }
        if (error.message.includes('Invalid API key') || error.message.includes('API access forbidden')) {
          throw error; // Re-throw API key errors
        }
        // If it's an empty response error, it's likely due to quota/rate limits
        if (error.message.includes('Empty response from API')) {
          // Check if we were rate limited recently - if so, this is likely quota exceeded
          if (this.backoffUntil > Date.now() - 60000) { // Within last minute
            throw new Error('QUOTA_EXCEEDED: Empty API response likely due to quota exceeded. Your quota will reset in ~24 hours.');
          }
          return '';
        }

        // Unexpected error - log only in development
        console.error('Gemini API error:', error.message);
        throw new Error(`Failed to generate completion: ${error.message}`);
      }

      // Non-Error object thrown
      throw new Error('Failed to generate completion. Please try again.');
    }
  }

  async analyzeCode(code: string, analysisType: string): Promise<unknown> {
    const prompt = `Analyze the following code for ${analysisType}:\n\n${code}`;
    // Use higher token limit for analysis tasks
    const response = await this.generateCompletion(prompt, { maxTokens: 4096 });

    try {
      return JSON.parse(response);
    } catch {
      // Fallback if response isn't valid JSON
      return { summary: response };
    }
  }

  async chat(messages: Array<{ role: string; content: string }>): Promise<string> {
    const conversation = messages.map(msg =>
      `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n\n');

    const prompt = `You are a helpful coding assistant. Continue this conversation:\n\n${conversation}\n\nAssistant:`;

    return this.generateCompletion(prompt);
  }

  // Offline fallback suggestions
  getOfflineSuggestions(context: CodeContext): string[] {
    const suggestions = [];

    if (context.language === 'typescript' || context.language === 'javascript') {
      if (context.fileContent.includes('function')) {
        suggestions.push('function body template');
      }
      if (context.fileContent.includes('if')) {
        suggestions.push('if block');
      }
      if (context.fileContent.includes('for') || context.fileContent.includes('while')) {
        suggestions.push('loop body');
      }
      if (context.fileContent.includes('console')) {
        suggestions.push('console.log with message');
      }
    }

    return suggestions;
  }
}