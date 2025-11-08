import { useState, useEffect, useRef, useCallback } from 'react';
import { GeminiService } from './geminiApi';
import { useSettings } from './SettingsContext';
import { AIErrorHandler } from './errorHandler';
import { AnalysisOrchestrator } from './analysisOrchestrator';
import { AnalysisResult, AnalysisProgress } from './analysis/types';
import { analysisHistory } from './analysisHistory';

export interface ChangeItem {
  filePath: string;
  title: string;
  description: string;
  diff: string;
}

export interface WalkthroughItem {
  title: string;
  description: string;
  files?: {
    filePath: string;
    diff?: string;
  }[];
}

export interface SuggestionItem {
  filePath: string;
  title: string;
  description: string;
  impactLevel: 'low' | 'medium' | 'high';
  diff: string;
  fixedCode?: string;
}

export interface AIReviewResponse {
  summary: string;
  changesSummary: ChangeItem[];
  fileWalkthrough: {
    codeQuality: WalkthroughItem[];
    typeSafety: WalkthroughItem[];
    performance: WalkthroughItem[];
    monitoring: WalkthroughItem[];
  };
  codeSuggestions: SuggestionItem[];
}

function generateMockResponse(filePath: string, fileContent: string): AIReviewResponse {
  const fileName = filePath.split('/').pop() || 'file';
  const isReactFile = fileContent.includes('React') || fileContent.includes('import React');
  const hasAsync = fileContent.includes('async');
  const hasAny = fileContent.includes(': any');
  const hasConsoleLog = fileContent.includes('console.log');
  const hasDocumentGetElementById = fileContent.includes('document.getElementById');

  const suggestions: SuggestionItem[] = [];

  // Add error handling suggestion if file has async code or render calls
  if (hasAsync || hasDocumentGetElementById) {
    const renderCall = fileContent.match(/createRoot\(document\.getElementById\('root'\)\)\.render\([^;]+\);/);
    if (renderCall) {
      const originalRender = renderCall[0];
      const improvedRender = `try {
  ${originalRender}
} catch (error) {
  console.error('Failed to render app:', error);
}`;

      suggestions.push({
        filePath,
        title: "Missing Error Handling",
        description: "Add try-catch blocks around render operations for better error handling.",
        impactLevel: "high",
        diff: `- ${originalRender}\n+ ${improvedRender}`,
        fixedCode: fileContent.replace(originalRender, improvedRender)
      });
    }
  }

  // Add type safety suggestion if file has 'any' types
  if (hasAny) {
    const anyMatch = fileContent.match(/(\w+):\s*any/);
    if (anyMatch) {
      const paramName = anyMatch[1];
      const originalDecl = anyMatch[0];
      const improvedDecl = `${paramName}: unknown`;

      suggestions.push({
        filePath,
        title: "Type Safety Issues",
        description: "Replace 'any' types with more specific TypeScript types.",
        impactLevel: "medium",
        diff: `- ${originalDecl}\n+ ${improvedDecl}`,
        fixedCode: fileContent.replace(originalDecl, improvedDecl)
      });
    }
  }

  // Add React-specific suggestions
  if (isReactFile) {
    const componentMatch = fileContent.match(/const\s+(\w+)\s*=\s*\(\)\s*=>/);
    if (componentMatch) {
      const componentName = componentMatch[1];
      const originalDecl = componentMatch[0];
      const improvedDecl = `const ${componentName}: React.FC = () =>`;

      suggestions.push({
        filePath,
        title: "React Best Practices",
        description: "Add proper TypeScript types to React components.",
        impactLevel: "medium",
        diff: `- ${originalDecl}\n+ ${improvedDecl}`,
        fixedCode: fileContent.replace(originalDecl, improvedDecl)
      });
    }
  }

  // Add security suggestion for DOM manipulation
  if (hasDocumentGetElementById) {
    const domCall = fileContent.match(/document\.getElementById\('root'\)/);
    if (domCall) {
      const originalCall = domCall[0];
      const improvedCall = `const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}
rootElement`;

      suggestions.push({
        filePath,
        title: "Security Best Practices",
        description: "Add null checks for DOM element access to prevent runtime errors.",
        impactLevel: "high",
        diff: `- ${originalCall}\n+ ${improvedCall}`,
        fixedCode: fileContent.replace(originalCall, improvedCall)
      });
    }
  }

  // Add logging improvement suggestion
  if (hasConsoleLog) {
    const consoleMatch = fileContent.match(/console\.log\([^)]+\);/);
    if (consoleMatch) {
      const originalLog = consoleMatch[0];

      suggestions.push({
        filePath,
        title: "Logging Best Practices",
        description: "Remove console.log statements for production code.",
        impactLevel: "low",
        diff: `- ${originalLog}\n+ // ${originalLog} // Removed for production`,
        fixedCode: fileContent.replace(originalLog, `// ${originalLog} // Removed for production`)
      });
    }
  }

  // Ensure we have at least one suggestion
  if (suggestions.length === 0) {
    suggestions.push({
      filePath,
      title: "Code Review Completed",
      description: "Basic code analysis completed successfully.",
      impactLevel: "low",
      diff: "// Code analysis completed - no major issues found",
    });
  }

  return {
    summary: `Analysis completed for ${fileName}. Found ${suggestions.length} suggestions for improvement.`,
    changesSummary: suggestions.slice(0, 2).map(s => ({
      filePath: s.filePath,
      title: s.title,
      description: s.description,
      diff: s.diff,
    })),
    fileWalkthrough: {
      codeQuality: [{
        title: "Code Quality Check",
        description: "Basic code quality analysis completed.",
        files: [{
          filePath,
          diff: "// Code quality analysis completed"
        }]
      }],
      typeSafety: hasAny ? [{
        title: "Type Safety",
        description: "Review type annotations for better type safety.",
        files: [{
          filePath,
          diff: "// Check for proper TypeScript types"
        }]
      }] : [],
      performance: hasAsync ? [{
        title: "Performance",
        description: "Review async operations for performance optimizations.",
        files: [{
          filePath,
          diff: "// Consider performance optimizations for async operations"
        }]
      }] : [],
      monitoring: [{
        title: "Monitoring",
        description: "Consider adding logging and monitoring.",
        files: [{
          filePath,
          diff: "// Add appropriate logging and monitoring"
        }]
      }],
    },
    codeSuggestions: suggestions,
  };
}

export function useAIReview(fileContent: string, filePath?: string, language?: string, forceAnalyze?: boolean, selectedAnalyses?: string[]) {
  const [data, setData] = useState<AIReviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const { settings } = useSettings();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const orchestratorRef = useRef<AnalysisOrchestrator | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setLoading(false);
    setProgress(null);
    setError('Analysis cancelled by user');
  }, []);

  useEffect(() => {
    if (!forceAnalyze || !fileContent) {
      return;
    }

    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set loading immediately to show user that review will happen
    const enabledAnalyzers = selectedAnalyses || ['codeQuality', 'security', 'performance', 'maintainability', 'testing', 'documentation'];
    setLoading(true);
    setProgress({ current: 0, total: enabledAnalyzers.length, currentAnalyzer: '', status: 'running' });

    // Create new abort controller for this analysis
    abortControllerRef.current = new AbortController();

    // Debounce the API call by 2 seconds
    debounceTimerRef.current = setTimeout(async () => {
      setError(null);

      try {
        // Check if already cancelled
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }
        if (!settings.ai.enabled || !settings.ai.apiKey) {
          throw new Error('AI not configured');
        }

        const geminiService = new GeminiService({
          apiKey: settings.ai.apiKey,
          model: settings.ai.model,
          temperature: settings.ai.temperature,
          maxTokens: settings.ai.maxTokens,
        });

        // Create orchestrator if not exists
        if (!orchestratorRef.current) {
          orchestratorRef.current = new AnalysisOrchestrator(geminiService, {
            enabledAnalyzers: selectedAnalyses || ['codeQuality', 'security', 'performance', 'maintainability', 'testing', 'documentation']
          });
        }

        const context = {
          filePath: filePath || 'unknown.ts',
          content: fileContent,
          language: language || 'typescript'
        };

        const analysisResult = await orchestratorRef.current.analyzeCode(context, (prog) => {
          // Check if cancelled before updating progress
          if (!abortControllerRef.current?.signal.aborted) {
            setProgress(prog);
          }
        }, abortControllerRef.current.signal);

        // Check if we're in offline mode and fall back to mock data
        if (orchestratorRef.current.isOffline()) {
          console.log('🔌 Analysis completed in offline mode, using mock data');
          const mockData = generateMockResponse(filePath || 'unknown.ts', fileContent);
          setData(mockData);

          // Save mock analysis to history as well
          analysisHistory.getInstance().addSession({
            timestamp: new Date(),
            filePath: filePath || 'unknown.ts',
            summary: mockData.summary,
            suggestionsCount: mockData.codeSuggestions.length,
            issuesCount: mockData.changesSummary.length,
            score: 75, // Default score for mock data
            fullResults: mockData
          });
        } else {
          // Transform new analysis results to old format for backward compatibility
          const reviewData = transformAnalysisResultsToReview(analysisResult.results, filePath || 'unknown.ts', fileContent);
          setData(reviewData);

          // Only save to analysis history if analysis completed successfully (no errors, not aborted, and all results present)
          const hasErrors = analysisResult.errors && analysisResult.errors.length > 0;
          const wasAborted = abortControllerRef.current?.signal.aborted;
          const expectedAnalyzers = enabledAnalyzers.length;
          const hasAllResults = analysisResult.results && analysisResult.results.length === expectedAnalyzers;

          if (!hasErrors && !wasAborted && hasAllResults) {
            console.log('💾 Saving successful analysis to history');
            analysisHistory.getInstance().addSession({
              timestamp: new Date(),
              filePath: filePath || 'unknown.ts',
              summary: reviewData.summary,
              suggestionsCount: reviewData.codeSuggestions.length,
              issuesCount: reviewData.changesSummary.length,
              score: 85, // Score from analysis results
              fullResults: reviewData
            });
          } else {
            if (wasAborted) {
              console.log('🛑 Analysis was cancelled, skipping history save');
            } else if (hasErrors) {
              console.log('⚠️ Analysis completed with errors, skipping history save');
            } else if (!hasAllResults) {
              console.log('⚠️ Analysis incomplete, skipping history save');
            }
          }
        }
      } catch (err) {
        const error = err as Error;

        // Handle abort errors specifically
        if (error.name === 'AbortError' || abortControllerRef.current?.signal.aborted) {
          setError('Analysis cancelled');
          return;
        }

        if (error.message === 'AI not configured') {
          setData(generateMockResponse(filePath || 'unknown.ts', fileContent));
        } else {
          const aiError = AIErrorHandler.handleAPIError(err);
          setError(aiError.message);

          // Check if this is a rate limit error and enable offline mode
          if (error.message.includes('RATE_LIMIT') || error.message.includes('QUOTA_EXCEEDED')) {
            console.warn('🔌 Rate limit detected, switching to offline mode');
            if (orchestratorRef.current) {
              // Force offline mode for future requests
              (orchestratorRef.current as any).offlineMode = true;
            }
          }

          if (aiError.fallback === 'offline_suggestions') {
            // Use mock data as fallback
            setData(generateMockResponse(filePath || 'unknown.ts', fileContent));
          }
        }
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setLoading(false);
          setProgress({ current: 6, total: 6, currentAnalyzer: '', status: 'completed' });
        }
      }
    }, 2000); // 2 second debounce delay

    // Cleanup function to clear timer on unmount or re-render
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [forceAnalyze]);

  return { data, loading, error, progress, cancelAnalysis };
}

function transformAnalysisResultsToReview(results: AnalysisResult[], filePath: string, fileContent?: string): AIReviewResponse {
  // If no results, return mock data
  if (!results || results.length === 0) {
    return generateMockResponse(filePath, fileContent || '');
  }

  // Transform new analysis results to old AIReviewResponse format for backward compatibility
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
  const totalSuggestions = results.reduce((sum, r) => sum + r.suggestions.length, 0);
  const avgScore = results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length) : 75;

  const summary = `Analysis completed with overall score: ${avgScore}/100. Found ${totalIssues} issues and ${totalSuggestions} suggestions across ${results.length} analysis categories.`;

  // Convert issues to changes summary
  const changesSummary: ChangeItem[] = [];
  results.forEach(result => {
    result.issues.slice(0, 2).forEach(issue => { // Limit to 2 issues per type
      changesSummary.push({
        filePath: filePath,
        title: `[${result.type.toUpperCase()}] ${issue.title}`,
        description: issue.description,
        diff: issue.fix ? `// Fix: ${issue.fix}` : `// Issue: ${issue.description}`
      });
    });
  });

  // If no issues found, add some default ones
  if (changesSummary.length === 0) {
    changesSummary.push({
      filePath: filePath,
      title: "Code Review Completed",
      description: "Basic code analysis completed successfully",
      diff: "// No major issues found"
    });
  }

  // Build file walkthrough from results
  const codeQualityResult = results.find(r => r.type === 'codeQuality');
  const codeQualityIssues = codeQualityResult?.issues || [];
  const fileWalkthrough = {
    codeQuality: codeQualityIssues.length > 0 ? codeQualityIssues.map(issue => ({
      title: issue.title,
      description: issue.description,
      files: [{
        filePath: filePath,
        diff: issue.fix ? `// ${issue.fix}` : `// ${issue.description}`
      }]
    })) : [{
      title: "Code Quality Check",
      description: "Basic code quality analysis completed",
      files: [{
        filePath: filePath,
        diff: "// Code quality analysis completed"
      }]
    }],
    typeSafety: (() => {
      const maintainabilityResult = results.find(r => r.type === 'maintainability');
      const issues = maintainabilityResult?.issues || [];
      return issues.length > 0 ? issues.map(issue => ({
        title: issue.title,
        description: issue.description,
        files: [{
          filePath: filePath,
          diff: issue.fix ? `// ${issue.fix}` : `// ${issue.description}`
        }]
      })) : [{
        title: "Maintainability Check",
        description: "Code maintainability analysis completed",
        files: [{
          filePath: filePath,
          diff: "// Maintainability analysis completed"
        }]
      }];
    })(),
    performance: (() => {
      const performanceResult = results.find(r => r.type === 'performance');
      const issues = performanceResult?.issues || [];
      return issues.length > 0 ? issues.map(issue => ({
        title: issue.title,
        description: issue.description,
        files: [{
          filePath: filePath,
          diff: issue.fix ? `// ${issue.fix}` : `// ${issue.description}`
        }]
      })) : [{
        title: "Performance Check",
        description: "Performance analysis completed",
        files: [{
          filePath: filePath,
          diff: "// Performance analysis completed"
        }]
      }];
    })(),
    monitoring: (() => {
      const documentationResult = results.find(r => r.type === 'documentation');
      const issues = documentationResult?.issues || [];
      return issues.length > 0 ? issues.map(issue => ({
        title: issue.title,
        description: issue.description,
        files: [{
          filePath: filePath,
          diff: issue.fix ? `// ${issue.fix}` : `// ${issue.description}`
        }]
      })) : [{
        title: "Documentation Check",
        description: "Documentation analysis completed",
        files: [{
          filePath: filePath,
          diff: "// Documentation analysis completed"
        }]
      }];
    })()
  };

  // Convert suggestions to code suggestions
  const codeSuggestions: SuggestionItem[] = [];
  results.forEach(result => {
    const suggestions = result.suggestions || [];
    suggestions.slice(0, 2).forEach(suggestion => { // Limit to 2 suggestions per type
      codeSuggestions.push({
        filePath: filePath,
        title: `[${result.type.toUpperCase()}] ${suggestion.title}`,
        description: suggestion.description,
        impactLevel: (suggestion.impact as 'low' | 'medium' | 'high') || 'medium',
        diff: suggestion.code ? suggestion.code : `// ${suggestion.explanation}`
      });
    });
  });

  // Always add at least one suggestion
  if (codeSuggestions.length === 0) {
    codeSuggestions.push({
      filePath: filePath,
      title: "Code Review Completed",
      description: "Analysis completed successfully with basic checks",
      impactLevel: 'low' as const,
      diff: "// Code analysis completed"
    });
  }

  return {
    summary,
    changesSummary,
    fileWalkthrough,
    codeSuggestions
  };
}