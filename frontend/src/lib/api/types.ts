import { CodeContext, AnalysisResult, AnalysisProgress, AnalysisError } from '../analysis/types';

export interface AnalyzeRequest {
  code: string;
  filePath: string;
  language: string;
  framework?: string;
  projectStructure?: string;
  dependencies?: string[];
  config?: {
    enabledAnalyzers?: string[];
    timeout?: number;
    maxConcurrency?: number;
    includeSuggestions?: boolean;
  };
}

export interface AnalyzeResponse {
  results: AnalysisResult[];
  errors: AnalysisError[];
  summary: {
    overallScore: number;
    totalIssues: number;
    totalSuggestions: number;
    analysisTime: number;
  };
}

export interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  context?: {
    code?: string;
    filePath?: string;
    language?: string;
    analysisResults?: AnalysisResult[];
  };
}

export interface ChatResponse {
  message: string;
  suggestions?: string[];
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
}