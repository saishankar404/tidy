import { DocsLayout } from "@/components/docs/DocsLayout";
import { Badge } from "@/components/ui/badge";

const Architecture = () => {
  return (
    <DocsLayout>
      <div className="mb-8">
        <Badge variant="secondary" className="mb-4">Technical</Badge>
        <h1 id="architecture">Architecture</h1>
        <p className="text-xl text-muted-foreground">
          System design, components, and data flow in TIDY Editor.
        </p>
      </div>

      <h2 id="overview">System Overview</h2>
      <p>
        TIDY Editor follows a modern React architecture with clear separation of concerns. The application is built using a component-based approach with centralized state management and AI integration.
      </p>

      <h2 id="core-layers">Core Layers</h2>

      <h3 id="presentation">Presentation Layer</h3>
      <p>React components organized by feature:</p>
      <ul>
        <li><strong>Pages</strong> - Top-level route components</li>
        <li><strong>Components</strong> - Reusable UI components</li>
        <li><strong>UI Components</strong> - shadcn/ui primitives</li>
      </ul>

      <h3 id="business">Business Logic Layer</h3>
      <p>Core application logic and AI integration:</p>
      <ul>
        <li><strong>Analysis Orchestrator</strong> - Coordinates AI analyzers</li>
        <li><strong>Chat Assistant</strong> - Manages AI conversations</li>
        <li><strong>Snippet Manager</strong> - Handles snippet CRUD</li>
        <li><strong>File System</strong> - Virtual file management</li>
      </ul>

      <h3 id="data">Data Layer</h3>
      <p>Data persistence and state management:</p>
      <ul>
        <li><strong>Local Storage</strong> - Browser-based persistence</li>
        <li><strong>React Query</strong> - Server state caching</li>
        <li><strong>Context API</strong> - Global state (settings)</li>
      </ul>

      <h3 id="integration">Integration Layer</h3>
      <p>External service connections:</p>
      <ul>
        <li><strong>Gemini API</strong> - AI analysis and chat</li>
        <li><strong>Monaco Editor</strong> - Code editing capabilities</li>
      </ul>

      <h2 id="components">Key Components</h2>

      <h3 id="code-editor">CodeEditor</h3>
      <p>Monaco-based editor wrapper:</p>
      <pre><code>{`<CodeEditor
  value={code}
  onChange={handleChange}
  language="typescript"
  theme="vs-dark"
  options={{
    minimap: { enabled: settings.minimap },
    lineNumbers: 'on',
    wordWrap: 'on'
  }}
/>`}</code></pre>

      <h3 id="sidebar">EditorSidebar</h3>
      <p>File tree navigation with virtual file system:</p>
      <ul>
        <li>Create, rename, delete files and folders</li>
        <li>Hierarchical file structure</li>
        <li>File selection and navigation</li>
        <li>Context menu actions</li>
      </ul>

      <h3 id="reviewer">CodeReviewerSidebar</h3>
      <p>AI analysis and chat interface:</p>
      <ul>
        <li>Trigger code analysis</li>
        <li>View analysis results by category</li>
        <li>Apply code suggestions</li>
        <li>Chat with AI assistant</li>
      </ul>

      <h2 id="data-flow">Data Flow</h2>

      <h3 id="analysis-flow">Code Analysis Flow</h3>
      <pre><code>{`User clicks "Analyze"
  ↓
CodeReviewerSidebar triggers analysis
  ↓
AnalysisOrchestrator receives code
  ↓
Parallel execution of 6 analyzers
  ↓
Each analyzer calls Gemini API
  ↓
Results aggregated and formatted
  ↓
Displayed in UI by category
  ↓
Saved to analysis history`}</code></pre>

      <h3 id="chat-flow">Chat Flow</h3>
      <pre><code>{`User sends message
  ↓
ChatAssistant receives input
  ↓
Code context attached to message
  ↓
Gemini API generates response
  ↓
Response parsed and formatted
  ↓
Displayed in chat interface
  ↓
Saved to chat history`}</code></pre>

      <h3 id="snippet-flow">Snippet Creation Flow</h3>
      <pre><code>{`User saves code snippet
  ↓
SaveSnippetModal opens
  ↓
AI analyzes code for categorization
  ↓
Suggests category and tags
  ↓
User confirms or modifies
  ↓
Snippet saved to localStorage
  ↓
Available in Snippet Library`}</code></pre>

      <h2 id="state">State Management</h2>

      <h3 id="settings-context">Settings Context</h3>
      <p>Global application settings:</p>
      <pre><code>{`{
  aiConfig: {
    apiKey: string,
    model: string,
    temperature: number,
    maxTokens: number
  },
  experimentalFeatures: {
    minimap: boolean,
    tabBar: boolean
  },
  theme: 'light' | 'dark'
}`}</code></pre>

      <h3 id="local-state">Local Component State</h3>
      <p>Component-specific state with React hooks:</p>
      <ul>
        <li><code>useState</code> - Component state</li>
        <li><code>useEffect</code> - Side effects</li>
        <li><code>useCallback</code> - Memoized callbacks</li>
        <li><code>useMemo</code> - Computed values</li>
      </ul>

      <h3 id="react-query">React Query</h3>
      <p>Server state and caching:</p>
      <ul>
        <li>API request caching</li>
        <li>Automatic refetching</li>
        <li>Loading and error states</li>
        <li>Optimistic updates</li>
      </ul>

      <h2 id="ai-integration">AI Integration Architecture</h2>

      <h3 id="orchestrator">Analysis Orchestrator</h3>
      <p>Centralized AI analysis management:</p>
      <ul>
        <li>Parallel analyzer execution</li>
        <li>Error handling and retries</li>
        <li>Timeout management</li>
        <li>Result aggregation</li>
        <li>Offline mode fallback</li>
      </ul>

      <h3 id="analyzers">Individual Analyzers</h3>
      <p>Specialized analysis modules:</p>
      <table>
        <thead>
          <tr>
            <th>Analyzer</th>
            <th>Focus Area</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Code Quality</td>
            <td>Readability, best practices</td>
          </tr>
          <tr>
            <td>Security</td>
            <td>Vulnerabilities, risks</td>
          </tr>
          <tr>
            <td>Performance</td>
            <td>Optimization opportunities</td>
          </tr>
          <tr>
            <td>Maintainability</td>
            <td>Long-term code health</td>
          </tr>
          <tr>
            <td>Testing</td>
            <td>Test coverage, quality</td>
          </tr>
          <tr>
            <td>Documentation</td>
            <td>Comment quality, docs</td>
          </tr>
        </tbody>
      </table>

      <h2 id="error-handling">Error Handling</h2>

      <h3 id="api-errors">API Error Handling</h3>
      <ul>
        <li>Exponential backoff retry logic</li>
        <li>Rate limiting detection</li>
        <li>Offline mode activation</li>
        <li>User-friendly error messages</li>
      </ul>

      <h3 id="ui-errors">UI Error Handling</h3>
      <ul>
        <li>React Error Boundaries</li>
        <li>Toast notifications for errors</li>
        <li>Graceful degradation</li>
        <li>Fallback UI components</li>
      </ul>

      <h2 id="performance">Performance Optimization</h2>

      <h3 id="code-splitting">Code Splitting</h3>
      <p>Dynamic imports for large components:</p>
      <pre><code>{`const HeavyComponent = lazy(() => 
  import('./HeavyComponent')
);`}</code></pre>

      <h3 id="memoization">Memoization</h3>
      <ul>
        <li><code>React.memo</code> for expensive components</li>
        <li><code>useMemo</code> for computed values</li>
        <li><code>useCallback</code> for stable callbacks</li>
      </ul>

      <h3 id="virtualization">Virtualization</h3>
      <p>Efficient rendering of large lists in snippet library and file tree.</p>

      <h2 id="security">Security Considerations</h2>
      <ul>
        <li>API keys stored securely</li>
        <li>No sensitive data exposed to client</li>
        <li>Input sanitization for chat messages</li>
        <li>HTTPS-only communication</li>
        <li>CSP headers for XSS protection</li>
      </ul>
    </DocsLayout>
  );
};

export default Architecture;