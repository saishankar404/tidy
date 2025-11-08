import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import PQueue from 'p-queue';

export interface GeminiConfig {
  apiKey: string;
  model: 'gemini-1.5-flash' | 'gemini-1.5-pro' | 'gemini-pro';
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
  private model: GenerativeModel;
  private rateLimiter: RateLimiterMemory;
  private requestQueue: PQueue;

  constructor(config: GeminiConfig) {
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: config.model,
      generationConfig: {
        temperature: config.temperature,
        maxOutputTokens: config.maxTokens,
      },
    });

    this.rateLimiter = new RateLimiterMemory({
      keyPrefix: 'gemini',
      points: 60, // requests
      duration: 60, // per 60 seconds
    });

    this.requestQueue = new PQueue({ concurrency: 3 });
  }

  async generateCompletion(prompt: string): Promise<string> {
    try {
      await this.rateLimiter.consume('completion');

      return await this.requestQueue.add(async () => {
        try {
          const result = await this.model.generateContent(prompt);
          const response = await result.response;
          return response.text();
        } catch (apiError: unknown) {
          // Handle specific API errors
          const error = apiError as { status?: number };
          if (error?.status === 404) {
            throw new Error('Invalid API key or model name. Please check your Gemini API key and ensure the Generative Language API is enabled in your Google Cloud project.');
          }
          if (error?.status === 403) {
            throw new Error('API access forbidden. Please check your API key permissions and billing status.');
          }
          if (error?.status === 429) {
            throw new Error('API quota exceeded. Please check your usage limits.');
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
        if (error.message.includes('rate')) {
          throw new Error('Rate limit exceeded. Please wait before making another request.');
        }
        if (error.message.includes('quota')) {
          throw new Error('API quota exceeded. Please check your usage limits.');
        }
        if (error.message.includes('Invalid API key') || error.message.includes('API access forbidden')) {
          throw error; // Re-throw API key errors
        }
      }
      throw new Error('Failed to generate completion');
    }
  }

  async analyzeCode(code: string, analysisType: string): Promise<unknown> {
    const prompt = `Analyze the following code for ${analysisType}:\n\n${code}`;
    const response = await this.generateCompletion(prompt);

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