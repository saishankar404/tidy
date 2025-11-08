import { DocsLayout } from "@/components/docs/DocsLayout";
import { Badge } from "@/components/ui/badge";

const AIAnalysis = () => {
  return (
    <DocsLayout>
      <div className="mb-8">
        <Badge variant="secondary" className="mb-4">Features</Badge>
        <h1 id="ai-analysis">AI-Powered Code Analysis</h1>
        <p className="text-xl text-muted-foreground">
          Multi-dimensional code analysis powered by Google Gemini AI.
        </p>
      </div>

      <h2 id="overview">Overview</h2>
      <p>
        TIDY Editor uses Google Gemini AI to perform comprehensive code analysis across multiple dimensions. The analysis system provides actionable insights and suggestions to improve your code quality, security, and performance.
      </p>

      <h2 id="analysis-types">Analysis Types</h2>

      <h3 id="code-quality">Code Quality Analysis</h3>
      <p>Evaluates code readability, maintainability, and adherence to best practices:</p>
      <ul>
        <li>Code organization and structure</li>
        <li>Naming conventions and clarity</li>
        <li>Code duplication detection</li>
        <li>Complexity metrics</li>
        <li>Best practices compliance</li>
      </ul>

      <h3 id="security">Security Analysis</h3>
      <p>Identifies potential security vulnerabilities and risks:</p>
      <ul>
        <li>Input validation issues</li>
        <li>Injection vulnerabilities</li>
        <li>Authentication and authorization flaws</li>
        <li>Sensitive data exposure</li>
        <li>Insecure dependencies</li>
      </ul>

      <h3 id="performance">Performance Analysis</h3>
      <p>Detects performance bottlenecks and optimization opportunities:</p>
      <ul>
        <li>Algorithm efficiency</li>
        <li>Memory usage patterns</li>
        <li>Database query optimization</li>
        <li>Render performance (React)</li>
        <li>Network request optimization</li>
      </ul>

      <h3 id="maintainability">Maintainability Analysis</h3>
      <p>Assesses long-term code maintainability:</p>
      <ul>
        <li>Code modularity</li>
        <li>Dependency management</li>
        <li>Technical debt indicators</li>
        <li>Refactoring opportunities</li>
        <li>Architecture patterns</li>
      </ul>

      <h3 id="testing">Testing Analysis</h3>
      <p>Reviews test coverage and quality:</p>
      <ul>
        <li>Test coverage gaps</li>
        <li>Test case completeness</li>
        <li>Edge case handling</li>
        <li>Test organization</li>
        <li>Mock and stub usage</li>
      </ul>

      <h3 id="documentation">Documentation Analysis</h3>
      <p>Evaluates code documentation quality:</p>
      <ul>
        <li>Comment clarity and usefulness</li>
        <li>API documentation completeness</li>
        <li>Function and class descriptions</li>
        <li>Example usage documentation</li>
        <li>README and guide quality</li>
      </ul>

      <h2 id="how-it-works">How It Works</h2>

      <h3 id="analysis-flow">Analysis Flow</h3>
      <ol>
        <li><strong>Code Submission</strong> - Your code is sent to the Analysis Orchestrator</li>
        <li><strong>Parallel Analysis</strong> - Multiple analyzers run concurrently</li>
        <li><strong>Result Aggregation</strong> - Results are combined and formatted</li>
        <li><strong>Presentation</strong> - Issues and suggestions are displayed with severity levels</li>
      </ol>

      <h3 id="orchestrator">Analysis Orchestrator</h3>
      <p>
        The orchestrator coordinates multiple AI analyzers, managing concurrent execution, error handling, and result aggregation. It ensures efficient API usage through:
      </p>
      <ul>
        <li>Batch processing of multiple analyzers</li>
        <li>Timeout management</li>
        <li>Retry logic with exponential backoff</li>
        <li>Rate limiting compliance</li>
        <li>Offline mode fallback</li>
      </ul>

      <h2 id="suggestions">Understanding Suggestions</h2>

      <h3 id="impact-levels">Impact Levels</h3>
      <table>
        <thead>
          <tr>
            <th>Level</th>
            <th>Description</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><Badge variant="destructive">Critical</Badge></td>
            <td>Severe issues requiring immediate attention</td>
            <td>Fix immediately</td>
          </tr>
          <tr>
            <td><Badge variant="outline" className="text-orange-600">High</Badge></td>
            <td>Important improvements for better code quality</td>
            <td>Address soon</td>
          </tr>
          <tr>
            <td><Badge variant="secondary">Medium</Badge></td>
            <td>Beneficial changes for maintainability</td>
            <td>Consider implementing</td>
          </tr>
          <tr>
            <td><Badge variant="outline">Low</Badge></td>
            <td>Minor improvements and optimizations</td>
            <td>Optional enhancement</td>
          </tr>
        </tbody>
      </table>

      <h3 id="diff-view">Diff Visualization</h3>
      <p>
        For each suggestion, TIDY provides a side-by-side diff view showing the original code and the proposed changes. This helps you understand exactly what the AI recommends and why.
      </p>

      <h2 id="usage">Using the Analysis Feature</h2>

      <h3 id="trigger">Triggering Analysis</h3>
      <ol>
        <li>Write or open code in the editor</li>
        <li>Click the "Analyze now" button in the code reviewer sidebar</li>
        <li>Wait for analysis to complete (usually 5-15 seconds)</li>
        <li>Review results organized by category</li>
      </ol>

      <h3 id="applying">Applying Suggestions</h3>
      <ol>
        <li>Review the suggestion and its impact level</li>
        <li>Examine the diff view to understand changes</li>
        <li>Click "Apply" to implement the suggestion</li>
        <li>Code is automatically updated in the editor</li>
      </ol>

      <h2 id="configuration">Configuration</h2>

      <h3 id="analyzer-settings">Analyzer Settings</h3>
      <p>Customize which analyzers run and their behavior:</p>
      <pre><code>{`{
  "enabledAnalyzers": [
    "code-quality",
    "security",
    "performance",
    "maintainability",
    "testing",
    "documentation"
  ],
  "apiTimeout": 30000,
  "maxRetries": 3,
  "concurrentAnalyzers": 6
}`}</code></pre>

      <h3 id="ai-model">AI Model Configuration</h3>
      <p>Configure Gemini model parameters in settings:</p>
      <ul>
        <li><strong>Model</strong> - Choose from available Gemini models</li>
        <li><strong>Temperature</strong> - Control response creativity (0.0-1.0)</li>
        <li><strong>Max Tokens</strong> - Limit response length</li>
      </ul>

      <h2 id="best-practices">Best Practices</h2>
      <ul>
        <li>Run analysis regularly during development</li>
        <li>Review high and critical suggestions first</li>
        <li>Consider context before applying suggestions</li>
        <li>Use analysis results as learning opportunities</li>
        <li>Save useful suggestions to snippet library</li>
      </ul>

      <h2 id="limitations">Limitations</h2>
      <ul>
        <li>Analysis quality depends on code context and size</li>
        <li>Very large files may require longer processing time</li>
        <li>API rate limits may affect frequent analysis</li>
        <li>AI suggestions should be reviewed, not blindly applied</li>
      </ul>
    </DocsLayout>
  );
};

export default AIAnalysis;