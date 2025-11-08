import { DocsLayout } from "@/components/docs/DocsLayout";
import { Badge } from "@/components/ui/badge";

const API = () => {
  return (
    <DocsLayout>
      <div className="mb-8">
        <Badge variant="secondary" className="mb-4">Technical</Badge>
        <h1 id="api-reference">API Reference</h1>
        <p className="text-xl text-muted-foreground">
          Data structures, interfaces, and API documentation.
        </p>
      </div>

      <h2 id="core-types">Core Data Types</h2>

      <h3 id="code-snippet">CodeSnippet</h3>
      <p>Represents a saved code snippet:</p>
      <pre><code>{`interface CodeSnippet {
  id: string;                    // Unique identifier
  title: string;                 // Snippet title
  description: string;           // Detailed description
  code: string;                  // Code content
  language: string;              // Programming language
  tags: string[];                // Search tags
  category: SnippetCategory;     // Category classification
  createdAt: Date;              // Creation timestamp
  lastUsed: Date;               // Last usage timestamp
  usageCount: number;           // Usage counter
  source: SnippetSource;        // Origin of snippet
  metadata?: Record<string, any>; // Additional metadata
}

type SnippetCategory = 
  | 'security'
  | 'performance'
  | 'error-handling'
  | 'ui'
  | 'utility'
  | 'custom';

type SnippetSource = 
  | 'chat-suggestion'
  | 'manual'
  | 'analysis';`}</code></pre>

      <h3 id="analysis-session">AnalysisSession</h3>
      <p>Represents a code analysis session:</p>
      <pre><code>{`interface AnalysisSession {
  id: string;                    // Unique session ID
  fileName: string;              // Analyzed file name
  timestamp: Date;              // Analysis timestamp
  score: number;                // Overall code score (0-100)
  summary: string;              // Analysis summary
  issuesCount: number;          // Total issues found
  suggestionsCount: number;     // Total suggestions made
  fullResults: AIReviewResponse; // Complete analysis results
}`}</code></pre>

      <h3 id="ai-review">AIReviewResponse</h3>
      <p>AI analysis results structure:</p>
      <pre><code>{`interface AIReviewResponse {
  overallScore: number;          // 0-100 score
  summary: string;               // Brief summary
  categories: AnalysisCategory[]; // Analysis by category
  generalRecommendations: string[]; // High-level recommendations
  metadata: {
    analyzedAt: Date;
    model: string;
    analysisTime: number;
  };
}

interface AnalysisCategory {
  name: string;                  // Category name
  score: number;                 // Category score (0-100)
  issues: Issue[];               // Found issues
  suggestions: Suggestion[];     // Improvement suggestions
}`}</code></pre>

      <h3 id="issue">Issue</h3>
      <p>Represents a code issue:</p>
      <pre><code>{`interface Issue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  lineNumber?: number;
  codeSnippet?: string;
  category: string;
}`}</code></pre>

      <h3 id="suggestion">Suggestion</h3>
      <p>Code improvement suggestion:</p>
      <pre><code>{`interface Suggestion {
  id: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  original: string;              // Original code
  suggested: string;             // Suggested code
  explanation: string;           // Why this change helps
  category: string;
}`}</code></pre>

      <h2 id="chat-types">Chat Types</h2>

      <h3 id="chat-message">ChatMessage</h3>
      <pre><code>{`interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  codeContext?: {
    fileName: string;
    code: string;
    language: string;
  };
  metadata?: {
    model: string;
    tokensUsed: number;
  };
}`}</code></pre>

      <h3 id="chat-history">ChatHistory</h3>
      <pre><code>{`interface ChatHistory {
  sessionId: string;
  messages: ChatMessage[];
  createdAt: Date;
  lastUpdated: Date;
}`}</code></pre>

      <h2 id="settings-types">Settings Types</h2>

      <h3 id="ai-config">AIConfig</h3>
      <pre><code>{`interface AIConfig {
  apiKey: string;
  model: 'gemini-pro' | 'gemini-pro-vision';
  temperature: number;           // 0.0 - 1.0
  maxTokens: number;            // Response length limit
  timeout: number;              // API timeout (ms)
  offlineMode: boolean;
}`}</code></pre>

      <h3 id="experimental">ExperimentalFeatures</h3>
      <pre><code>{`interface ExperimentalFeatures {
  minimap: boolean;             // Editor minimap
  tabBar: boolean;              // File tab bar
  aiSuggestions: boolean;       // Inline AI suggestions
}`}</code></pre>

      <h2 id="storage-api">Storage API</h2>

      <h3 id="snippet-storage">Snippet Storage</h3>
      <pre><code>{`// Save snippet
function saveSnippet(snippet: CodeSnippet): void

// Get all snippets
function getSnippets(): CodeSnippet[]

// Get snippet by ID
function getSnippet(id: string): CodeSnippet | null

// Update snippet
function updateSnippet(
  id: string, 
  updates: Partial<CodeSnippet>
): void

// Delete snippet
function deleteSnippet(id: string): void

// Search snippets
function searchSnippets(query: string): CodeSnippet[]

// Get snippets by category
function getSnippetsByCategory(
  category: SnippetCategory
): CodeSnippet[]`}</code></pre>

      <h3 id="analysis-storage">Analysis History Storage</h3>
      <pre><code>{`// Save analysis session
function saveAnalysisSession(
  session: AnalysisSession
): void

// Get all sessions
function getAnalysisSessions(): AnalysisSession[]

// Get session by ID
function getAnalysisSession(
  id: string
): AnalysisSession | null

// Delete session
function deleteAnalysisSession(id: string): void

// Search sessions
function searchAnalysisSessions(
  query: string
): AnalysisSession[]`}</code></pre>

      <h2 id="ai-api">AI API</h2>

      <h3 id="analysis-api">Analysis API</h3>
      <pre><code>{`// Analyze code
async function analyzeCode(
  code: string,
  language: string,
  options?: AnalysisOptions
): Promise<AIReviewResponse>

interface AnalysisOptions {
  enabledAnalyzers?: string[];
  includeCodeSuggestions?: boolean;
  maxSuggestions?: number;
}`}</code></pre>

      <h3 id="chat-api">Chat API</h3>
      <pre><code>{`// Send chat message
async function sendChatMessage(
  message: string,
  context?: CodeContext
): Promise<ChatMessage>

interface CodeContext {
  code: string;
  language: string;
  fileName: string;
  analysisResults?: AIReviewResponse;
}`}</code></pre>

      <h2 id="utility-api">Utility Functions</h2>

      <h3 id="code-utils">Code Utilities</h3>
      <pre><code>{`// Format code
function formatCode(
  code: string,
  language: string
): string

// Detect language
function detectLanguage(
  filename: string
): string

// Calculate code metrics
function calculateMetrics(
  code: string
): CodeMetrics

interface CodeMetrics {
  lines: number;
  characters: number;
  complexity: number;
}`}</code></pre>

      <h3 id="validation">Validation</h3>
      <pre><code>{`// Validate snippet
function validateSnippet(
  snippet: Partial<CodeSnippet>
): ValidationResult

// Validate settings
function validateSettings(
  settings: Partial<AIConfig>
): ValidationResult

interface ValidationResult {
  valid: boolean;
  errors: string[];
}`}</code></pre>

      <h2 id="events">Event System</h2>

      <h3 id="custom-events">Custom Events</h3>
      <pre><code>{`// Analysis events
'analysis:start'
'analysis:progress'
'analysis:complete'
'analysis:error'

// Chat events
'chat:message:sent'
'chat:message:received'
'chat:error'

// Snippet events
'snippet:created'
'snippet:updated'
'snippet:deleted'
'snippet:used'`}</code></pre>

      <h2 id="error-types">Error Types</h2>

      <h3 id="api-error">APIError</h3>
      <pre><code>{`class APIError extends Error {
  code: string;
  statusCode: number;
  retryable: boolean;
  
  constructor(
    message: string,
    code: string,
    statusCode: number
  );
}`}</code></pre>

      <h3 id="validation-error">ValidationError</h3>
      <pre><code>{`class ValidationError extends Error {
  field: string;
  validationErrors: string[];
  
  constructor(
    field: string,
    errors: string[]
  );
}`}</code></pre>
    </DocsLayout>
  );
};

export default API;