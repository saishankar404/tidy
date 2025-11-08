import { DocsLayout } from "@/components/docs/DocsLayout";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

const Configuration = () => {
  return (
    <DocsLayout>
      <div className="mb-8">
        <Badge variant="secondary" className="mb-4">Technical</Badge>
        <h1 id="configuration">Configuration</h1>
        <p className="text-xl text-muted-foreground">
          Customize TIDY Editor with comprehensive configuration options.
        </p>
      </div>

      <h2 id="ai-settings">AI Settings</h2>

      <h3 id="api-key">API Key Configuration</h3>
      <p>Configure your Google Gemini API key:</p>

      <h4>Via Environment Variables</h4>
      <pre><code>{`# .env file
VITE_GEMINI_API_KEY=your_api_key_here`}</code></pre>

      <h4>Via Settings UI</h4>
      <ol>
        <li>Click the settings icon in the header</li>
        <li>Navigate to "AI Configuration"</li>
        <li>Enter your API key</li>
        <li>Click Save</li>
      </ol>

      <Alert className="my-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          API keys are stored securely in browser localStorage and never sent to any server except Google's Gemini API.
        </AlertDescription>
      </Alert>

      <h3 id="model-selection">Model Selection</h3>
      <p>Choose from available Gemini models:</p>
      <table>
        <thead>
          <tr>
            <th>Model</th>
            <th>Description</th>
            <th>Best For</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>gemini-pro</code></td>
            <td>Standard text model</td>
            <td>Code analysis, chat</td>
          </tr>
          <tr>
            <td><code>gemini-pro-vision</code></td>
            <td>Multimodal model</td>
            <td>Image + text analysis</td>
          </tr>
        </tbody>
      </table>

      <h3 id="temperature">Temperature</h3>
      <p>Control response creativity and randomness:</p>
      <ul>
        <li><strong>0.0-0.3</strong> - Deterministic, focused (recommended for code analysis)</li>
        <li><strong>0.4-0.7</strong> - Balanced creativity and accuracy</li>
        <li><strong>0.8-1.0</strong> - More creative, less predictable</li>
      </ul>

      <pre><code>{`// Example configuration
{
  "temperature": 0.2,  // Low for consistent code suggestions
  "maxTokens": 2048
}`}</code></pre>

      <h3 id="max-tokens">Max Tokens</h3>
      <p>Limit response length:</p>
      <table>
        <thead>
          <tr>
            <th>Token Count</th>
            <th>Approximate Length</th>
            <th>Use Case</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>512</td>
            <td>Short paragraph</td>
            <td>Quick suggestions</td>
          </tr>
          <tr>
            <td>1024</td>
            <td>Medium response</td>
            <td>Standard analysis</td>
          </tr>
          <tr>
            <td>2048</td>
            <td>Detailed response</td>
            <td>Deep analysis</td>
          </tr>
          <tr>
            <td>4096</td>
            <td>Very detailed</td>
            <td>Comprehensive review</td>
          </tr>
        </tbody>
      </table>

      <h2 id="analysis-config">Analysis Configuration</h2>

      <h3 id="enabled-analyzers">Enabled Analyzers</h3>
      <p>Select which analyzers to run:</p>
      <pre><code>{`{
  "enabledAnalyzers": [
    "code-quality",      // Code readability and best practices
    "security",          // Security vulnerabilities
    "performance",       // Performance optimization
    "maintainability",   // Long-term maintainability
    "testing",           // Test coverage and quality
    "documentation"      // Documentation quality
  ]
}`}</code></pre>

      <h3 id="timeout">Timeout Settings</h3>
      <p>Configure API timeouts:</p>
      <pre><code>{`{
  "apiTimeout": 30000,      // 30 seconds per request
  "analysisTimeout": 60000  // 60 seconds total
}`}</code></pre>

      <h3 id="retry">Retry Configuration</h3>
      <pre><code>{`{
  "maxRetries": 3,
  "retryDelay": 1000,       // Initial delay in ms
  "retryBackoff": 2         // Exponential backoff multiplier
}`}</code></pre>

      <h3 id="concurrency">Concurrency</h3>
      <p>Number of parallel analyzer executions:</p>
      <pre><code>{`{
  "concurrentAnalyzers": 6  // Run up to 6 analyzers simultaneously
}`}</code></pre>

      <h2 id="editor-config">Editor Configuration</h2>

      <h3 id="monaco-options">Monaco Options</h3>
      <pre><code>{`{
  "editor": {
    "fontSize": 14,
    "fontFamily": "JetBrains Mono, Consolas, monospace",
    "lineHeight": 1.6,
    "minimap": {
      "enabled": false
    },
    "wordWrap": "on",
    "lineNumbers": "on",
    "renderWhitespace": "selection",
    "scrollBeyondLastLine": false,
    "automaticLayout": true,
    "tabSize": 2,
    "formatOnSave": true
  }
}`}</code></pre>

      <h3 id="theme">Theme Configuration</h3>
      <pre><code>{`{
  "theme": "vs-dark",  // 'vs-light' | 'vs-dark' | 'hc-black'
  "autoDetectSystemTheme": true
}`}</code></pre>

      <h2 id="experimental">Experimental Features</h2>

      <h3 id="feature-flags">Feature Flags</h3>
      <pre><code>{`{
  "experimentalFeatures": {
    "minimap": false,           // Editor minimap
    "tabBar": false,            // File tab bar
    "aiSuggestions": false,     // Inline AI suggestions
    "collaborativeEditing": false, // Real-time collaboration
    "voiceCommands": false      // Voice control
  }
}`}</code></pre>

      <Alert className="my-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Experimental features may be unstable. Enable at your own risk.
        </AlertDescription>
      </Alert>

      <h2 id="storage">Storage Configuration</h2>

      <h3 id="local-storage">localStorage Settings</h3>
      <pre><code>{`{
  "storage": {
    "maxSnippets": 1000,
    "maxAnalysisSessions": 100,
    "maxChatHistory": 50,
    "autoCleanup": true,
    "cleanupThresholdDays": 30
  }
}`}</code></pre>

      <h3 id="cache">Cache Settings</h3>
      <pre><code>{`{
  "cache": {
    "enableApiCache": true,
    "cacheExpiry": 3600000,  // 1 hour in ms
    "maxCacheSize": 50       // MB
  }
}`}</code></pre>

      <h2 id="performance">Performance Configuration</h2>

      <h3 id="optimization">Optimization Settings</h3>
      <pre><code>{`{
  "performance": {
    "lazyLoadComponents": true,
    "virtualizeListsThreshold": 100,
    "debounceInputMs": 300,
    "enableServiceWorker": true
  }
}`}</code></pre>

      <h2 id="security">Security Configuration</h2>

      <h3 id="csp">Content Security Policy</h3>
      <pre><code>{`{
  "security": {
    "strictCSP": true,
    "allowedHosts": ["api.gemini.google.com"],
    "sanitizeInputs": true,
    "enableRateLimiting": true,
    "maxRequestsPerMinute": 30
  }
}`}</code></pre>

      <h2 id="complete">Complete Configuration Example</h2>
      <pre><code>{`{
  "ai": {
    "apiKey": "your_api_key",
    "model": "gemini-pro",
    "temperature": 0.2,
    "maxTokens": 2048,
    "timeout": 30000,
    "offlineMode": false
  },
  "analysis": {
    "enabledAnalyzers": [
      "code-quality",
      "security",
      "performance",
      "maintainability",
      "testing",
      "documentation"
    ],
    "concurrentAnalyzers": 6,
    "maxRetries": 3
  },
  "editor": {
    "fontSize": 14,
    "theme": "vs-dark",
    "minimap": { "enabled": false },
    "wordWrap": "on",
    "formatOnSave": true
  },
  "experimental": {
    "minimap": false,
    "tabBar": false,
    "aiSuggestions": false
  },
  "storage": {
    "maxSnippets": 1000,
    "autoCleanup": true
  },
  "performance": {
    "lazyLoadComponents": true,
    "debounceInputMs": 300
  }
}`}</code></pre>

      <h2 id="env-vars">Environment Variables</h2>
      <p>Available environment variables:</p>
      <pre><code>{`# Required
VITE_GEMINI_API_KEY=your_api_key

# Optional
VITE_ANALYTICS_ID=your_analytics_id
VITE_API_TIMEOUT=30000
VITE_MAX_RETRIES=3
VITE_ENABLE_OFFLINE_MODE=false`}</code></pre>
    </DocsLayout>
  );
};

export default Configuration;