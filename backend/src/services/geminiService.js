import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import PQueue from 'p-queue';

export class GeminiService {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.modelName = config.model || 'gemini-2.5-flash';
    this.temperature = config.temperature || 0.2;
    this.maxTokens = config.maxTokens || 4096;

    if (!this.apiKey) {
      throw new Error('Gemini API key is required');
    }

    this.genAI = new GoogleGenerativeAI(this.apiKey);

    // Set to 1 to prevent rate limit issues
    this.requestQueue = new PQueue({ concurrency: 1 });
  }

  async generateCompletion(prompt, options = {}) {
    return this.requestQueue.add(async () => {
      try {
        const model = this.genAI.getGenerativeModel({
          model: this.modelName,
          generationConfig: {
            temperature: this.temperature,
            maxOutputTokens: this.maxTokens,
            topP: 0.8,
            topK: 10,
          },
          safetySettings: [
            {
              category: HarmCategory.HARM_CATEGORY_HARASSMENT,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
          ],
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (!text) {
          throw new Error('Empty response from Gemini API');
        }

        return text;
      } catch (error) {
        console.error('Gemini API error:', error);

        if (error.message?.includes('429') || error.message?.includes('quota')) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }

        if (error.message?.includes('blocked') || error.message?.includes('safety')) {
          throw new Error('Content was blocked by safety filters.');
        }

        throw new Error(`AI service error: ${error.message}`);
      }
    });
  }

  async analyzeCode(code, language, context = {}) {
    const prompt = `You are an expert code analyzer. Analyze the following ${language} code and provide detailed feedback:

Code to analyze:
\`\`\`${language}
${code}
\`\`\`

Please provide:
1. Code quality assessment (score 1-10)
2. Security issues (if any)
3. Performance suggestions
4. Maintainability improvements
5. Best practices recommendations

Format your response as JSON with the following structure:
{
  "quality": { "score": number, "issues": string[] },
  "security": { "issues": string[], "severity": "low|medium|high" },
  "performance": { "suggestions": string[] },
  "maintainability": { "score": number, "improvements": string[] },
  "bestPractices": { "recommendations": string[] }
}`;

    const response = await this.generateCompletion(prompt);
    return this.parseAnalysisResponse(response);
  }

  parseAnalysisResponse(response) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback: create structured response from text
      return {
        quality: { score: 7, issues: ['Analysis completed'] },
        security: { issues: [], severity: 'low' },
        performance: { suggestions: [] },
        maintainability: { score: 7, improvements: [] },
        bestPractices: { recommendations: [] }
      };
    } catch (error) {
      console.error('Failed to parse analysis response:', error);
      return {
        quality: { score: 5, issues: ['Analysis failed to parse'] },
        security: { issues: [], severity: 'low' },
        performance: { suggestions: [] },
        maintainability: { score: 5, improvements: [] },
        bestPractices: { recommendations: [] }
      };
    }
  }
}