import { GeminiService } from '../geminiApi';
import { AnalysisOrchestrator } from '../analysisOrchestrator';
import { AnalyzeRequest, AnalyzeResponse, ChatRequest, ChatResponse, HealthResponse } from './types';

export class AnalysisAPIClient {
  private geminiService: GeminiService;
  private orchestrator: AnalysisOrchestrator;

  constructor(geminiService: GeminiService) {
    this.geminiService = geminiService;
    this.orchestrator = new AnalysisOrchestrator(geminiService);
  }

  async analyzeCode(request: AnalyzeRequest): Promise<AnalyzeResponse> {
    // Update orchestrator config if provided
    if (request.config) {
      this.orchestrator.updateConfig(request.config);
    }

    const context = {
      filePath: request.filePath,
      content: request.code,
      language: request.language,
      framework: request.framework,
      projectStructure: request.projectStructure,
      dependencies: request.dependencies
    };

    const result = await this.orchestrator.analyzeCode(context);

    return {
      results: result.results,
      errors: result.errors,
      summary: result.summary
    };
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    // Build context-aware prompt
    let contextPrompt = '';

    if (request.context) {
      contextPrompt = `
You are a helpful coding assistant. The user is working on code and has analysis results available.

Current context:
- File: ${request.context.filePath || 'Unknown'}
- Language: ${request.context.language || 'Unknown'}
${request.context.code ? `- Code snippet: ${request.context.code.substring(0, 500)}${request.context.code.length > 500 ? '...' : ''}` : ''}

Analysis results summary:
${request.context.analysisResults ?
  request.context.analysisResults.map(r =>
    `- ${r.type}: ${r.issues.length} issues, score: ${r.score}/100`
  ).join('\n')
  : 'No analysis results available yet.'
}

Conversation history:
${request.messages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Assistant:`;
    } else {
      contextPrompt = `You are a helpful coding assistant.

Conversation history:
${request.messages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Assistant:`;
    }

    const response = await this.geminiService.generateCompletion(contextPrompt);

    // Generate some basic suggestions based on the response
    const suggestions = this.generateSuggestions(response, request.context);

    return {
      message: response,
      suggestions
    };
  }

  async healthCheck(): Promise<HealthResponse> {
    return {
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    };
  }

  private generateSuggestions(response: string, context?: ChatRequest['context']): string[] {
    const suggestions: string[] = [];

    // Basic suggestion generation based on response content
    const responseLower = response.toLowerCase();

    if (responseLower.includes('test') || responseLower.includes('testing')) {
      suggestions.push('Add unit tests');
      suggestions.push('Consider integration tests');
    }

    if (responseLower.includes('error') || responseLower.includes('exception')) {
      suggestions.push('Add error handling');
      suggestions.push('Implement proper logging');
    }

    if (responseLower.includes('performance') || responseLower.includes('slow')) {
      suggestions.push('Profile the code');
      suggestions.push('Consider optimization techniques');
    }

    if (responseLower.includes('security') || responseLower.includes('vulnerable')) {
      suggestions.push('Review input validation');
      suggestions.push('Implement security best practices');
    }

    if (responseLower.includes('refactor') || responseLower.includes('improve')) {
      suggestions.push('Extract methods');
      suggestions.push('Improve variable names');
    }

    // Limit to 3 suggestions max
    return suggestions.slice(0, 3);
  }
}