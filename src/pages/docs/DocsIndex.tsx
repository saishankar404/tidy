import { DocsLayout } from "@/components/docs/DocsLayout";
import { Badge } from "@/components/ui/badge";

const DocsIndex = () => {
  return (
    <DocsLayout>
      <div className="mb-8">
        <Badge variant="secondary" className="mb-4">Documentation</Badge>
        <h1 id="overview">TIDY Editor UI</h1>
        <p className="text-xl text-muted-foreground">
          AI-powered code editor with intelligent analysis, chat assistance, and snippet management.
        </p>
      </div>

      <h2 id="what-is-tidy">What is TIDY?</h2>
      <p>
        TIDY Editor UI is a modern code editor built with React and TypeScript. It combines a Monaco-based code editor with Google Gemini AI integration for code analysis, chat assistance, and intelligent code suggestions.
      </p>

      <h2 id="key-features">Key Features</h2>
      <div className="grid gap-4 my-6">
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold mb-2">🤖 AI-Powered Analysis</h4>
          <p className="text-sm text-muted-foreground">
            Multi-dimensional code analysis covering quality, security, performance, maintainability, testing, and documentation.
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold mb-2">💬 Intelligent Chat</h4>
          <p className="text-sm text-muted-foreground">
            Context-aware AI assistant that understands your code and provides targeted suggestions.
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold mb-2">📝 Code Editor</h4>
          <p className="text-sm text-muted-foreground">
            Full-featured Monaco editor with multi-file support, syntax highlighting, and IntelliSense.
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold mb-2">📚 Snippet Library</h4>
          <p className="text-sm text-muted-foreground">
            Organize and reuse code patterns with AI-powered categorization and search.
          </p>
        </div>
      </div>

      <h2 id="tech-stack">Tech Stack</h2>
      <h3 id="core">Core</h3>
      <ul>
        <li><strong>React 18.3.1</strong> - Modern React with hooks and concurrent features</li>
        <li><strong>TypeScript 5.8.3</strong> - Full type safety</li>
        <li><strong>Vite 5.4.19</strong> - Fast build tool and dev server</li>
      </ul>

      <h3 id="ui">UI & Styling</h3>
      <ul>
        <li><strong>shadcn/ui</strong> - Modern component library</li>
        <li><strong>Radix UI</strong> - Accessible UI primitives</li>
        <li><strong>Tailwind CSS 3.4.17</strong> - Utility-first CSS</li>
        <li><strong>Lucide React</strong> - Icon library</li>
      </ul>

      <h3 id="editor">Editor</h3>
      <ul>
        <li><strong>@monaco-editor/react 4.7.0</strong> - VS Code's editor for React</li>
        <li><strong>react-resizable-panels 2.1.9</strong> - Resizable layouts</li>
      </ul>

      <h3 id="ai">AI Integration</h3>
      <ul>
        <li><strong>@google/generative-ai 0.24.1</strong> - Google Gemini API</li>
        <li><strong>Custom Analysis Orchestrator</strong> - Multi-analyzer system</li>
      </ul>

      <h2 id="quick-start">Quick Start</h2>
      <pre><code>{`# Clone the repository
git clone <repository-url>
cd tidy-editor-ui

# Install dependencies
npm install

# Start development server
npm run dev

# Server runs on http://localhost:8080`}</code></pre>

      <h2 id="next-steps">Next Steps</h2>
      <ul>
        <li><a href="/docs/getting-started">Installation Guide</a> - Detailed setup instructions</li>
        <li><a href="/docs/features/ai-analysis">AI Analysis</a> - Learn about code analysis features</li>
        <li><a href="/docs/features/editor">Code Editor</a> - Editor capabilities and usage</li>
        <li><a href="/docs/technical/architecture">Architecture</a> - System design and components</li>
      </ul>
    </DocsLayout>
  );
};

export default DocsIndex;