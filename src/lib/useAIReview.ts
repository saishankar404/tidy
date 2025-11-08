import { useState, useEffect } from 'react';
import { GeminiService } from './geminiApi';
import { useSettings } from './SettingsContext';
import { AIErrorHandler } from './errorHandler';

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

const mockResponse: AIReviewResponse = {
  summary: "Overall, the code is well-structured but could benefit from more robustness and type safety.",
  changesSummary: [
    {
      filePath: "/src/example.ts",
      title: "Add Error Handling",
      description: "Implement try-catch for better error management.",
      diff: `- async function process() {\n+ async function process() {\n+   try {\n+     // existing code\n+   } catch (error) {\n+     console.error('Processing failed:', error);\n+   }\n+ }`,
    },
    {
      filePath: "/src/utils.ts",
      title: "Improve Type Safety",
      description: "Add type annotations to prevent runtime errors.",
      diff: `- function helper(data) {\n+ function helper(data: any) {\n+   // Add proper typing\n+ }`,
    },
  ],
  fileWalkthrough: {
    codeQuality: [
      {
        title: "Consistent Naming",
        description: "Use camelCase for variables.",
        files: [
          {
            filePath: "/src/example.ts",
            diff: `- function processData(data) {\n+ function processData(processedData) {\n    // consistent naming`
          },
          {
            filePath: "/src/utils.ts",
            diff: `- const DATA = [];\n+ const data = [];\n    // camelCase convention`
          }
        ]
      },
      {
        title: "Modular Structure",
        description: "Break down large functions.",
        files: [
          {
            filePath: "/src/example.ts",
            diff: `- function largeFunction() {\n+ function smallFunction() {\n    // part 1\n+ }\n+ \n+ function anotherFunction() {\n    // part 2\n+ }`
          }
        ]
      },
    ],
    typeSafety: [
      {
        title: "Interface Usage",
        description: "Define interfaces for data structures.",
        files: [
          {
            filePath: "/src/example.ts",
            diff: `- function process(obj: any) {\n+ interface Data {\n+   id: string;\n+   value: number;\n+ }\n+ \n+ function process(obj: Data) {`
          }
        ]
      },
      {
        title: "Avoid Any Types",
        description: "Replace 'any' with specific types.",
        files: [
          {
            filePath: "/src/utils.ts",
            diff: `- function helper(data: any) {\n+ function helper(data: string) {\n    // specific typing`
          }
        ]
      },
    ],
    performance: [
      {
        title: "Loop Optimization",
        description: "Use efficient loops.",
        files: [
          {
            filePath: "/src/example.ts",
            diff: `- for (let i = 0; i < arr.length; i++) {\n+ for (const item of arr) {\n    // more efficient iteration`
          }
        ]
      },
      {
        title: "Async Handling",
        description: "Optimize async operations.",
        files: [
          {
            filePath: "/src/utils.ts",
            diff: `- async function slow() {\n+ async function fast() {\n    // optimized async`
          }
        ]
      },
    ],
    monitoring: [
      {
        title: "Logging",
        description: "Add logs for key operations.",
        files: [
          {
            filePath: "/src/example.ts",
            diff: `- function process() {\n+ function process() {\n+   console.log('Processing started');\n    // existing code`
          }
        ]
      },
    ],
  },
  codeSuggestions: [
    {
      filePath: "/src/example.ts",
      title: "Missing Error Handling",
      description: "Add try-catch blocks around async operations.",
      impactLevel: "high",
      diff: `- async function process() {\n+ async function process() {\n+   try {\n+     // existing code\n+   } catch (error) {\n+     console.error('Processing failed:', error);\n+   }\n+ }`,
    },
    {
      filePath: "/src/utils.ts",
      title: "Type Safety Issues",
      description: "Use proper TypeScript types for function parameters.",
      impactLevel: "medium",
      diff: `- function helper(data) {\n+ function helper(data: string) {\n+   // Add proper typing\n+ }`,
    },
  ],
};

export function useAIReview(fileContent: string) {
  const [data, setData] = useState<AIReviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useSettings();

  useEffect(() => {
    if (!fileContent) return;

    const fetchReview = async () => {
      setLoading(true);
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

        const analysis = await geminiService.analyzeCode(fileContent, 'code review');

        // Transform Gemini response to expected format
        const reviewData = transformGeminiResponse(analysis);
        setData(reviewData);
      } catch (err) {
        const aiError = AIErrorHandler.handleAPIError(err);
        setError(aiError.message);

        if (aiError.fallback === 'offline_suggestions') {
          // Use mock data as fallback
          setData(mockResponse);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchReview();
  }, [fileContent, settings.ai]);

  return { data, loading, error };
}

function transformGeminiResponse(geminiResponse: unknown): AIReviewResponse {
  // Parse and structure Gemini's response to match expected interface
  try {
    const response = geminiResponse as Record<string, unknown>;
    return {
      summary: (response.summary as string) || 'Code analysis completed',
      changesSummary: (response.changes as ChangeItem[]) || [],
      fileWalkthrough: (response.walkthrough as typeof mockResponse.fileWalkthrough) || {
        codeQuality: [],
        typeSafety: [],
        performance: [],
        monitoring: [],
      },
      codeSuggestions: (response.suggestions as SuggestionItem[]) || [],
    };
  } catch {
    return mockResponse; // Fallback to mock
  }
}