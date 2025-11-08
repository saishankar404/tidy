import { SafeJsonParser } from './safeJsonParser';

/**
 * Centralized response formatter for consistent API response handling
 */
export class GeminiResponseFormatter {
  /**
   * Format and validate Gemini API responses
   */
  static formatResponse(rawResponse: string, expectedFormat: 'json' | 'text' = 'json'): any {
    if (!rawResponse || typeof rawResponse !== 'string') {
      throw new Error('Invalid response: must be a non-empty string');
    }

    try {
      if (expectedFormat === 'json') {
        return SafeJsonParser.parse(rawResponse);
      }

      // Enhanced text parsing with better pattern recognition
      return this.parseTextResponse(rawResponse);

    } catch (error) {
      console.warn('Response formatting failed, using fallback:', error);
      return SafeJsonParser.createFallbackResponse('unknown', error as Error);
    }
  }

  /**
   * Parse text responses with improved pattern recognition
   */
  private static parseTextResponse(text: string): any {
    const issues: any[] = [];
    const suggestions: any[] = [];
    let score = 75;

    // Extract score with multiple patterns
    const scorePatterns = [
      /score[:\s]*(\d+)/i,
      /rating[:\s]*(\d+)/i,
      /(\d+)[\/\\]100/i,
      /(\d+)%/i
    ];

    for (const pattern of scorePatterns) {
      const match = text.match(pattern);
      if (match) {
        score = Math.max(0, Math.min(100, parseInt(match[1])));
        break;
      }
    }

    // Extract issues with better pattern recognition
    const lines = text.split('\n');
    let currentIssue: any = null;
    let currentSuggestion: any = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Issue patterns
      const issuePatterns = [
        /(?:issue|problem|error|vulnerability)[:\s]*(.+)/i,
        /^[-•*]\s*(.+)/,
        /(?:security|warning|danger)[:\s]*(.+)/i
      ];

      // Suggestion patterns
      const suggestionPatterns = [
        /(?:suggestion|recommendation|fix)[:\s]*(.+)/i,
        /(?:should|consider|try)[:\s]*(.+)/i,
        /(?:improve|enhance|optimize)[:\s]*(.+)/i
      ];

      let matched = false;

      // Check for issues
      for (const pattern of issuePatterns) {
        const match = trimmed.match(pattern);
        if (match) {
          if (currentIssue) {
            issues.push(currentIssue);
          }
          currentIssue = {
            id: `issue-${issues.length + 1}`,
            severity: this.inferSeverity(trimmed),
            title: match[1].substring(0, 50),
            description: match[1],
            category: this.inferCategory(trimmed),
            confidence: 0.7
          };
          currentSuggestion = null; // Reset suggestion
          matched = true;
          break;
        }
      }

      // Check for suggestions
      if (!matched) {
        for (const pattern of suggestionPatterns) {
          const match = trimmed.match(pattern);
          if (match) {
            if (currentSuggestion) {
              suggestions.push(currentSuggestion);
            }
            currentSuggestion = {
              id: `suggestion-${suggestions.length + 1}`,
              title: match[1].substring(0, 50),
              description: match[1],
              impact: this.inferImpact(trimmed),
              effort: 'medium' as const,
              explanation: match[1]
            };
            currentIssue = null; // Reset issue
            matched = true;
            break;
          }
        }
      }

      // Continue building current item
      if (!matched && trimmed.length > 10) {
        if (currentIssue && !trimmed.startsWith('-') && !trimmed.startsWith('•')) {
          currentIssue.description += ' ' + trimmed;
        } else if (currentSuggestion && !trimmed.startsWith('-') && !trimmed.startsWith('•')) {
          currentSuggestion.explanation += ' ' + trimmed;
        }
      }
    }

    // Push final items
    if (currentIssue) issues.push(currentIssue);
    if (currentSuggestion) suggestions.push(currentSuggestion);

    // Ensure we have at least basic results
    if (issues.length === 0) {
      issues.push({
        id: 'basic-analysis',
        severity: 'info' as const,
        title: 'Analysis completed',
        description: 'Basic analysis performed successfully',
        category: 'general',
        confidence: 0.8
      });
    }

    if (suggestions.length === 0) {
      suggestions.push({
        id: 'general-improvement',
        title: 'Review code for potential improvements',
        description: 'Consider reviewing the code for best practices and optimizations',
        impact: 'medium' as const,
        effort: 'medium' as const,
        explanation: 'Regular code review helps maintain quality'
      });
    }

    return {
      score,
      issues,
      suggestions,
      summary: text.substring(0, 200) + (text.length > 200 ? '...' : '')
    };
  }

  /**
   * Infer severity from text content
   */
  private static inferSeverity(text: string): 'low' | 'medium' | 'high' | 'critical' {
    const lower = text.toLowerCase();

    if (lower.includes('critical') || lower.includes('severe') || lower.includes('danger')) {
      return 'critical';
    }
    if (lower.includes('high') || lower.includes('important') || lower.includes('major')) {
      return 'high';
    }
    if (lower.includes('medium') || lower.includes('moderate')) {
      return 'medium';
    }

    // Default based on keywords
    if (lower.includes('security') || lower.includes('vulnerability') || lower.includes('injection')) {
      return 'high';
    }
    if (lower.includes('performance') || lower.includes('error') || lower.includes('bug')) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Infer category from text content
   */
  private static inferCategory(text: string): string {
    const lower = text.toLowerCase();

    if (lower.includes('security') || lower.includes('vulnerability') || lower.includes('injection') || lower.includes('xss')) {
      return 'security';
    }
    if (lower.includes('performance') || lower.includes('speed') || lower.includes('optimization')) {
      return 'performance';
    }
    if (lower.includes('maintainability') || lower.includes('readability') || lower.includes('complexity')) {
      return 'maintainability';
    }
    if (lower.includes('test') || lower.includes('testing') || lower.includes('coverage')) {
      return 'testing';
    }
    if (lower.includes('documentation') || lower.includes('comment') || lower.includes('doc')) {
      return 'documentation';
    }

    return 'general';
  }

  /**
   * Infer impact level from text content
   */
  private static inferImpact(text: string): 'low' | 'medium' | 'high' {
    const lower = text.toLowerCase();

    if (lower.includes('critical') || lower.includes('severe') || lower.includes('high impact')) {
      return 'high';
    }
    if (lower.includes('medium') || lower.includes('moderate')) {
      return 'medium';
    }

    // Default to medium for most suggestions
    return 'medium';
  }

  /**
   * Validate response structure
   */
  static validateResponse(response: any, expectedFormat: 'json' | 'text'): boolean {
    if (!response) return false;

    if (expectedFormat === 'json') {
      return typeof response === 'object' &&
             typeof response.score === 'number' &&
             Array.isArray(response.issues) &&
             Array.isArray(response.suggestions);
    }

    // For text format, we accept any object with basic structure
    return typeof response === 'object';
  }
}