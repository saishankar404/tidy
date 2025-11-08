export interface CodeLocation {
  file: string;
  line?: number;
  column?: number;
  start?: number;
  end?: number;
}

export interface AnalysisIssue {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location?: CodeLocation;
  fix?: string;
  category: string;
  confidence: number; // 0-1
}

export interface AnalysisSuggestion {
  id: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  location?: CodeLocation;
  code?: string;
  explanation: string;
}

export interface AnalysisResult {
  type: 'codeQuality' | 'security' | 'performance' | 'maintainability' | 'testing' | 'documentation';
  score: number; // 0-100
  issues: AnalysisIssue[];
  suggestions: AnalysisSuggestion[];
  summary: string;
  metadata: {
    analysisTime: number;
    linesAnalyzed: number;
    language: string;
  };
}

export interface CodeContext {
  filePath: string;
  content: string;
  language: string;
  projectStructure?: string;
  dependencies?: string[];
  framework?: string;
}

export interface AnalysisConfig {
  enabledAnalyzers: string[];
  timeout: number;
  maxConcurrency: number;
  includeSuggestions: boolean;
}

export interface AnalysisProgress {
  current: number;
  total: number;
  currentAnalyzer: string;
  status: 'idle' | 'running' | 'completed' | 'error';
}

export interface AnalysisError {
  analyzer: string;
  error: string;
  fallback?: boolean;
}

export interface CodeSnippet {
  id: string;
  title: string;
  description: string;
  code: string;
  language: string;
  tags: string[];
  category: 'security' | 'performance' | 'error-handling' | 'ui' | 'utility' | 'custom';
  source: 'chat-suggestion' | 'analysis-result' | 'manual' | 'chat-request';
  createdAt: Date;
  lastUsed?: Date;
  usageCount: number;
  metadata: {
    originalFile?: string;
    analysisType?: string;
    confidence?: number;
    chatContext?: string;
  };
}

export interface SnippetFilters {
  search?: string;
  category?: string;
  tags?: string[];
  language?: string;
  source?: string;
  sortBy?: 'createdAt' | 'lastUsed' | 'usageCount' | 'title';
  sortOrder?: 'asc' | 'desc';
}