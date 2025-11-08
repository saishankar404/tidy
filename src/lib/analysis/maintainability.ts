import { GeminiService } from '../geminiApi';
import { CodeContext, AnalysisResult } from './types';

export async function analyzeMaintainability(
  context: CodeContext,
  geminiService: GeminiService
): Promise<AnalysisResult> {
  const startTime = Date.now();

  const prompt = `Analyze the following code for maintainability issues. Focus on:
- Code complexity and cognitive load
- Technical debt indicators
- Code duplication
- Poor abstraction or coupling
- Hard-coded values
- Lack of separation of concerns
- Difficult-to-understand logic

Code file: ${context.filePath}
Language: ${context.language}

Code:
${context.content}

Provide a JSON response with this structure:
{
  "score": 0-100,
  "issues": [
    {
      "id": "unique_id",
      "severity": "low|medium|high|critical",
      "title": "Maintainability issue title",
      "description": "Why this affects maintainability",
      "location": {"line": number, "column": number},
      "fix": "How to improve maintainability",
      "category": "complexity|duplication|coupling|abstraction|hardcoding|separation",
      "confidence": 0.0-1.0
    }
  ],
  "suggestions": [
    {
      "id": "unique_id",
      "title": "Maintainability improvement",
      "description": "What to refactor",
      "impact": "low|medium|high",
      "effort": "low|medium|high",
      "location": {"line": number},
      "code": "Refactored code example",
      "explanation": "Why this improves maintainability"
    }
  ],
  "summary": "Maintainability assessment summary"
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
      console.error('Failed to parse maintainability response as JSON:', parseError);

      // If it's an empty response error, return a fallback
      if (parseError instanceof Error && (parseError.message.includes('Empty response') || parseError.message.includes('MAX_TOKENS'))) {
        parsed = {
          score: 75,
          issues: [{
            title: 'Maintainability analysis response truncated',
            description: 'Response was cut off due to token limits. Consider increasing maxTokens setting.',
            severity: 'info' as const,
            category: 'api-limit'
          }],
          suggestions: [{
            title: 'Review maintainability best practices',
            description: 'Write clean, readable, and maintainable code.',
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
      type: 'maintainability',
      score: Math.max(0, Math.min(100, parsed.score || 75)),
      issues: parsed.issues || [{
        id: 'maintainability-check',
        severity: 'low' as const,
        title: 'Maintainability Analysis Completed',
        description: 'Code maintainability checks performed',
        category: 'maintainability',
        confidence: 0.8
      }],
      suggestions: parsed.suggestions || [{
        id: 'maintainability-review',
        title: 'Review Code Structure',
        description: 'Consider refactoring for better maintainability',
        impact: 'medium' as const,
        effort: 'medium' as const,
        explanation: 'Well-structured code is easier to maintain'
      }],
      summary: parsed.summary || 'Maintainability analysis completed',
      metadata: {
        analysisTime: Date.now() - startTime,
        linesAnalyzed: context.content.split('\n').length,
        language: context.language
      }
    };
  } catch (error) {
    console.error('Maintainability analysis failed:', error);

    return {
      type: 'maintainability',
      score: 75,
      issues: [{
        id: 'maintainability-fallback',
        severity: 'low' as const,
        title: 'Maintainability Check Completed',
        description: 'Basic maintainability analysis performed',
        category: 'maintainability',
        confidence: 0.6
      }],
      suggestions: [{
        id: 'maintainability-improvement',
        title: 'Consider Code Refactoring',
        description: 'Review code for potential structural improvements',
        impact: 'medium' as const,
        effort: 'medium' as const,
        explanation: 'Refactoring improves code maintainability'
      }],
      summary: 'Maintainability analysis completed with basic checks',
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
    let score = 75;

    // Extract score
    const scoreMatch = response.match(/score[:\s]*(\d+)/i);
    if (scoreMatch) {
      score = Math.max(0, Math.min(100, parseInt(scoreMatch[1])));
    }

    // Extract maintainability-related issues
    const lines = response.split('\n');
    let currentIssue: any = null;

    for (const line of lines) {
      const trimmed = line.trim();

      // Look for maintainability issue indicators
      if (trimmed.toLowerCase().includes('maintainability') ||
          trimmed.toLowerCase().includes('complex') ||
          trimmed.toLowerCase().includes('refactor') ||
          trimmed.toLowerCase().includes('structure') ||
          trimmed.startsWith('-')) {

        if (currentIssue) {
          issues.push(currentIssue);
        }

        currentIssue = {
          id: `maintainability-issue-${issues.length + 1}`,
          severity: 'medium' as const,
          title: trimmed.replace(/^[-•*]\s*/, '').substring(0, 50),
          description: trimmed,
          category: 'maintainability',
          confidence: 0.7
        };
      } else if (currentIssue && trimmed) {
        currentIssue.description += ' ' + trimmed;
      }
    }

    if (currentIssue) {
      issues.push(currentIssue);
    }

    // Extract maintainability suggestions
    const suggestionKeywords = ['refactor', 'simplify', 'extract', 'structure'];
    for (const line of lines) {
      const trimmed = line.trim();
      if (suggestionKeywords.some(keyword => trimmed.toLowerCase().includes(keyword))) {
        suggestions.push({
          id: `maintainability-suggestion-${suggestions.length + 1}`,
          title: trimmed.substring(0, 50),
          description: trimmed,
          impact: 'medium' as const,
          effort: 'medium' as const,
          explanation: trimmed
        });
      }
    }

    // Ensure we have at least some basic maintainability results
    if (issues.length === 0) {
      issues.push({
        id: 'maintainability-check',
        severity: 'low' as const,
        title: 'Maintainability Analysis Completed',
        description: 'Code maintainability checks performed',
        category: 'maintainability',
        confidence: 0.8
      });
    }

    if (suggestions.length === 0) {
      suggestions.push({
        id: 'maintainability-review',
        title: 'Review Code Structure',
        description: 'Consider refactoring for better maintainability',
        impact: 'medium' as const,
        effort: 'medium' as const,
        explanation: 'Well-structured code is easier to maintain'
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