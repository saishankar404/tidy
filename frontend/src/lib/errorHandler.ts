import { CodeContext } from './codeContext';

export enum AIErrorType {
  RATE_LIMIT = 'rate_limit',
  QUOTA_EXCEEDED = 'quota_exceeded',
  NETWORK_ERROR = 'network_error',
  INVALID_RESPONSE = 'invalid_response',
  API_KEY_INVALID = 'api_key_invalid',
  OFFLINE = 'offline',
}

export interface AIError {
  type: AIErrorType;
  message: string;
  retryable: boolean;
  fallback?: string;
}

export class AIErrorHandler {
  static handleAPIError(error: unknown): AIError {
    const err = error as Error;
    if (err.message?.includes('rate')) {
      return {
        type: AIErrorType.RATE_LIMIT,
        message: 'Rate limit exceeded. Please wait before retrying.',
        retryable: true,
      };
    }

    if (err.message?.includes('quota')) {
      return {
        type: AIErrorType.QUOTA_EXCEEDED,
        message: 'API quota exceeded. Please check your usage.',
        retryable: false,
      };
    }

    if (!navigator.onLine) {
      return {
        type: AIErrorType.OFFLINE,
        message: 'You appear to be offline. Using cached suggestions.',
        retryable: true,
        fallback: 'offline_suggestions',
      };
    }

    return {
      type: AIErrorType.NETWORK_ERROR,
      message: 'Network error occurred. Please check your connection.',
      retryable: true,
    };
  }

  static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const aiError = this.handleAPIError(error);

        if (!aiError.retryable || attempt === maxRetries) {
          throw error;
        }

        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error('Max retries exceeded');
  }

  static provideOfflineSuggestions(context: CodeContext): string[] {
    // Basic pattern-based suggestions when offline
    const suggestions = [];
    const content = context.fileContent.toLowerCase();

    if (content.includes('function')) {
      suggestions.push('function body with return statement');
    }
    if (content.includes('if')) {
      suggestions.push('if block with braces');
    }
    if (content.includes('for') || content.includes('while')) {
      suggestions.push('loop body');
    }
    if (content.includes('console')) {
      suggestions.push('console.log with message');
    }

    return suggestions;
  }
}