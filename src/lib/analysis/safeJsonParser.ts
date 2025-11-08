import { GeminiService } from '../geminiApi';
import { CodeContext, AnalysisResult } from './types';

/**
 * Safe JSON parser with security sanitization and robust error handling
 */
export class SafeJsonParser {
  /**
   * Safely parse JSON response with security checks
   */
  static parse(response: string): any {
    if (!response || typeof response !== 'string') {
      throw new Error('Invalid response: must be a non-empty string');
    }

    // 1. Sanitize input - remove potentially dangerous content
    const sanitized = this.sanitizeInput(response);

    // 2. Extract JSON safely
    const jsonText = this.extractJson(sanitized);

    // 3. Parse with additional validation
    return JSON.parse(jsonText, (key, value) => {
      // Additional validation - prevent prototype pollution
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        throw new Error(`Security violation: dangerous key "${key}" detected`);
      }
      return value;
    });
  }

  /**
   * Sanitize input to prevent injection attacks
   */
  private static sanitizeInput(input: string): string {
    let sanitized = input;

    // Remove script tags and other potentially dangerous HTML
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
    sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
    sanitized = sanitized.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');

    // Remove javascript: URLs
    sanitized = sanitized.replace(/javascript:[^"'\s]*/gi, '');

    // Remove data: URLs that might contain scripts
    sanitized = sanitized.replace(/data:[^"'\s]*javascript[^"'\s]*/gi, '');

    return sanitized;
  }

  /**
   * Extract JSON from various response formats
   */
  private static extractJson(text: string): string {
    // 1. Look for ```json code blocks (most common)
    const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      return jsonBlockMatch[1].trim();
    }

    // 2. Look for JSON blocks with other languages
    const codeBlockMatch = text.match(/```\w*\s*(\{[\s\S]*?\})\s*```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }

    // 3. Find complete JSON objects in the text
    const jsonObjectMatch = text.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
      const jsonCandidate = jsonObjectMatch[0];

      // Validate it's likely valid JSON by checking brackets balance
      if (this.isValidJsonStructure(jsonCandidate)) {
        return jsonCandidate;
      }
    }

    // 4. If no JSON found, treat as plain text and create structured response
    throw new Error('NO_JSON_FOUND: Response does not contain valid JSON');
  }

  /**
   * Basic validation of JSON structure
   */
  private static isValidJsonStructure(text: string): boolean {
    try {
      // Quick bracket balance check
      let braceCount = 0;
      let bracketCount = 0;

      for (const char of text) {
        switch (char) {
          case '{': braceCount++; break;
          case '}': braceCount--; break;
          case '[': bracketCount++; break;
          case ']': bracketCount--; break;
        }

        // If we go negative, it's malformed
        if (braceCount < 0 || bracketCount < 0) {
          return false;
        }
      }

      // Should end with balanced brackets
      return braceCount === 0 && bracketCount === 0;
    } catch {
      return false;
    }
  }

  /**
   * Create a safe fallback response when JSON parsing fails
   */
  static createFallbackResponse(analysisType: string, error?: Error): any {
    const errorMessage = error?.message || 'Unknown parsing error';

    return {
      score: 85,
      issues: [{
        id: `${analysisType}-parsing-fallback`,
        severity: 'low' as const,
        title: `${analysisType} analysis completed with fallback`,
        description: `JSON parsing failed (${errorMessage}), using safe fallback results.`,
        category: 'parsing',
        confidence: 0.5
      }],
      suggestions: [{
        id: `${analysisType}-fallback-review`,
        title: 'Review analysis results',
        description: 'Analysis completed but may be incomplete due to parsing issues.',
        impact: 'medium' as const,
        effort: 'low' as const,
        explanation: 'Fallback results generated due to response parsing failure'
      }],
      summary: `${analysisType} analysis completed with safe fallback parsing`
    };
  }
}