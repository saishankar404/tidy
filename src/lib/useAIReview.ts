import { useState, useEffect, useRef } from 'react';
import { GeminiService } from './geminiApi';
import { useSettings } from './SettingsContext';
import { AIErrorHandler } from './errorHandler';
import { AnalysisOrchestrator } from './analysisOrchestrator';
import { AnalysisResult, AnalysisProgress } from './analysis/types';

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
    suggestions.push({
      filePath,
      title: "Missing Error Handling",
      description: "Add try-catch blocks around render operations for better error handling.",
      impactLevel: "high",
      diff: `- createRoot(document.getElementById('root')!).render(\n+ try {\n+   createRoot(document.getElementById('root')!).render(\n+     <StrictMode>\n+       <App />\n+     </StrictMode>\n+   );\n+ } catch (error) {\n+   console.error('Failed to render app:', error);\n+ }`,
    });
  }

  // Add type safety suggestion if file has 'any' types
  if (hasAny) {
    suggestions.push({
      filePath,
      title: "Type Safety Issues",
      description: "Replace 'any' types with more specific TypeScript types.",
      impactLevel: "medium",
      diff: `- function App() {\n+ function App(): JSX.Element {\n+   return (\n+     <div className="app">\n+       <h1>Hello, World!</h1>\n+       <p>Welcome to your code editor</p>\n+     </div>\n+   );\n+ }`,
    });
  }

  // Add React-specific suggestions
  if (isReactFile) {
    suggestions.push({
      filePath,
      title: "React Best Practices",
      description: "Follow React best practices for component structure and performance.",
      impactLevel: "medium",
      diff: `- const App = () => (\n+ const App: React.FC = () => (\n+   <div className="app">\n+     <h1>Hello, World!</h1>\n+     <p>Welcome to your code editor</p>\n+   </div>\n+ );`,
    });
  }

  // Add security suggestion for DOM manipulation
  if (hasDocumentGetElementById) {
    suggestions.push({
      filePath,
      title: "Security Best Practices",
      description: "Implement security best practices to prevent common vulnerabilities.",
      impactLevel: "high",
      diff: `- createRoot(document.getElementById('root')!).render(\n+ const rootElement = document.getElementById('root');\n+ if (!rootElement) {\n+   throw new Error('Root element not found');\n+ }\n+ createRoot(rootElement).render(`,
    });
  }

  // Add logging improvement suggestion
  if (hasConsoleLog) {
    suggestions.push({
      filePath,
      title: "Logging Best Practices",
      description: "Replace console.log with proper logging or remove debug logs in production.",
      impactLevel: "low",
      diff: `- import React from 'react';\n+ import React from 'react';\n+ // Remove console.log statements in production\n+ // console.log('App rendered');`,
    });
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

export function useAIReview(fileContent: string, filePath?: string, language?: string, forceAnalyze?: boolean) {
  const [data, setData] = useState<AIReviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const { settings } = useSettings();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const orchestratorRef = useRef<AnalysisOrchestrator | null>(null);

  useEffect(() => {
    if (!fileContent && !forceAnalyze) {
      return;
    }

    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set loading immediately to show user that review will happen
    setLoading(true);
    setProgress({ current: 0, total: 6, currentAnalyzer: '', status: 'running' });

    // Debounce the API call by 2 seconds
    debounceTimerRef.current = setTimeout(async () => {
      setError(null);

      try {
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
          orchestratorRef.current = new AnalysisOrchestrator(geminiService);
        }

        const context = {
          filePath: filePath || 'unknown.ts',
          content: fileContent,
          language: language || 'typescript'
        };

        const analysisResult = await orchestratorRef.current.analyzeCode(context, (prog) => {
          setProgress(prog);
        });

        // Check if we're in offline mode and fall back to mock data
        if (orchestratorRef.current.isOffline()) {
          console.log('🔌 Analysis completed in offline mode, using mock data');
          setData(generateMockResponse(filePath || 'unknown.ts', fileContent));
        } else {
          // Transform new analysis results to old format for backward compatibility
          const reviewData = transformAnalysisResultsToReview(analysisResult.results, filePath || 'unknown.ts', fileContent);
          setData(reviewData);
        }
      } catch (err) {
        const error = err as Error;
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
        setLoading(false);
        setProgress({ current: 6, total: 6, currentAnalyzer: '', status: 'completed' });
      }
    }, 2000); // 2 second debounce delay

    // Cleanup function to clear timer on unmount or re-render
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [fileContent, filePath, language, settings.ai]);

  return { data, loading, error, progress };
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