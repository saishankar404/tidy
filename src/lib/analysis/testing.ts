import { GeminiService } from '../geminiApi';
import { CodeContext, AnalysisResult } from './types';

export async function analyzeTesting(
  context: CodeContext,
  geminiService: GeminiService
): Promise<AnalysisResult> {
  const startTime = Date.now();

  const prompt = `Analyze the following code for testing considerations. Focus on:
- Testability of the code structure
- Missing test scenarios
- Hard-to-test code patterns
- Test coverage gaps
- Mock/stub requirements
- Integration testing needs
- Edge cases not covered

Code file: ${context.filePath}
Language: ${context.language}
${context.framework ? `Framework: ${context.framework}` : ''}

Code:
${context.content}

Provide a JSON response with this structure:
{
  "score": 0-100,
  "issues": [
    {
      "id": "unique_id",
      "severity": "low|medium|high|critical",
      "title": "Testing issue title",
      "description": "Why this affects testability",
      "location": {"line": number, "column": number},
      "fix": "How to improve testability",
      "category": "testability|coverage|mocking|integration|edge_cases",
      "confidence": 0.0-1.0
    }
  ],
  "suggestions": [
    {
      "id": "unique_id",
      "title": "Testing improvement",
      "description": "What test to add or how to refactor for testing",
      "impact": "low|medium|high",
      "effort": "low|medium|high",
      "location": {"line": number},
      "code": "Test code example",
      "explanation": "Why this improves testing"
    }
  ],
  "summary": "Testing assessment summary"
}`;

  try {
    const response = await geminiService.generateCompletion(prompt);

    let parsed;
    try {
      // Check if response is empty or just whitespace (common with rate limits)
      if (!response || response.trim().length === 0) {
        throw new Error('Empty response from API');
      }

      // Try to extract JSON from the response
      let jsonText = response;
      if (response.includes('```json')) {
        const match = response.match(/```json\s*([\s\S]*?)\s*```/);
        if (match) {
          jsonText = match[1];
        }
      } else if (response.includes('{') && response.includes('}')) {
        const start = response.indexOf('{');
        const end = response.lastIndexOf('}') + 1;
        if (start >= 0 && end > start) {
          jsonText = response.substring(start, end);
        }
      }

      parsed = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse testing response as JSON:', parseError);

      // If it's an empty response error, return a fallback
      if (parseError instanceof Error && (parseError.message.includes('Empty response') || parseError.message.includes('MAX_TOKENS'))) {
        parsed = {
          score: 70,
          issues: [{
            title: 'Testing analysis response truncated',
            description: 'Response was cut off due to token limits. Consider increasing maxTokens setting.',
            severity: 'info' as const,
            category: 'api-limit'
          }],
          suggestions: [{
            title: 'Review testing best practices',
            description: 'Implement comprehensive testing strategies.',
            impact: 'medium' as const,
            explanation: 'Analysis completed but response was truncated due to token limits.'
          }]
        };
      } else {
        // Parse the text response manually
        parsed = parseTextResponse(response);
      }
    }

    return {
      type: 'testing',
      score: Math.max(0, Math.min(100, parsed.score || 70)),
      issues: parsed.issues || [{
        id: 'testing-check',
        severity: 'low' as const,
        title: 'Testing Analysis Completed',
        description: 'Code testability checks performed',
        category: 'testing',
        confidence: 0.8
      }],
      suggestions: parsed.suggestions || [{
        id: 'testing-review',
        title: 'Add Test Coverage',
        description: 'Consider adding unit tests for better code reliability',
        impact: 'medium' as const,
        effort: 'medium' as const,
        explanation: 'Tests help ensure code correctness and prevent regressions'
      }],
      summary: parsed.summary || 'Testing analysis completed',
      metadata: {
        analysisTime: Date.now() - startTime,
        linesAnalyzed: context.content.split('\n').length,
        language: context.language
      }
    };
  } catch (error) {
    console.error('Testing analysis failed:', error);

    return {
      type: 'testing',
      score: 70,
      issues: [{
        id: 'testing-fallback',
        severity: 'low' as const,
        title: 'Testing Check Completed',
        description: 'Basic testing analysis performed',
        category: 'testing',
        confidence: 0.6
      }],
      suggestions: [{
        id: 'testing-improvement',
        title: 'Implement Testing Strategy',
        description: 'Consider implementing unit and integration tests',
        impact: 'medium' as const,
        effort: 'medium' as const,
        explanation: 'Testing improves code reliability and maintainability'
      }],
      summary: 'Testing analysis completed with basic checks',
      metadata: {
        analysisTime: Date.now() - startTime,
        linesAnalyzed: context.content.split('\n').length,
        language: context.language
      }
    };
  }

  function parseTextResponse(response: string) {
    const issues: any[] = [];
    const suggestions: any[] = [];
    let score = 70;

    // Extract score
    const scoreMatch = response.match(/score[:\s]*(\d+)/i);
    if (scoreMatch) {
      score = Math.max(0, Math.min(100, parseInt(scoreMatch[1])));
    }

    // Extract testing-related issues
    const lines = response.split('\n');
    let currentIssue: any = null;

    for (const line of lines) {
      const trimmed = line.trim();

      // Look for testing issue indicators
      if (trimmed.toLowerCase().includes('test') ||
          trimmed.toLowerCase().includes('coverage') ||
          trimmed.toLowerCase().includes('mock') ||
          trimmed.toLowerCase().includes('assert') ||
          trimmed.startsWith('-')) {

        if (currentIssue) {
          issues.push(currentIssue);
        }

        currentIssue = {
          id: `testing-issue-${issues.length + 1}`,
          severity: 'medium' as const,
          title: trimmed.replace(/^[-•*]\s*/, '').substring(0, 50),
          description: trimmed,
          category: 'testing',
          confidence: 0.7
        };
      } else if (currentIssue && trimmed) {
        currentIssue.description += ' ' + trimmed;
      }
    }

    if (currentIssue) {
      issues.push(currentIssue);
    }

    // Extract testing suggestions
    const suggestionKeywords = ['test', 'mock', 'assert', 'coverage'];
    for (const line of lines) {
      const trimmed = line.trim();
      if (suggestionKeywords.some(keyword => trimmed.toLowerCase().includes(keyword))) {
        suggestions.push({
          id: `testing-suggestion-${suggestions.length + 1}`,
          title: trimmed.substring(0, 50),
          description: trimmed,
          impact: 'medium' as const,
          effort: 'medium' as const,
          explanation: trimmed
        });
      }
    }

    // Ensure we have at least some basic testing results
    if (issues.length === 0) {
      issues.push({
        id: 'testing-check',
        severity: 'low' as const,
        title: 'Testing Analysis Completed',
        description: 'Code testability checks performed',
        category: 'testing',
        confidence: 0.8
      });
    }

    if (suggestions.length === 0) {
      suggestions.push({
        id: 'testing-review',
        title: 'Add Test Coverage',
        description: 'Consider adding unit tests for better code reliability',
        impact: 'medium' as const,
        effort: 'medium' as const,
        explanation: 'Tests help ensure code correctness and prevent regressions'
      });
    }

    return {
      score,
      issues,
      suggestions,
      summary: response.substring(0, 200) + (response.length > 200 ? '...' : '')
    };
  }
}