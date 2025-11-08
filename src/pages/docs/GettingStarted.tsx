import { DocsLayout } from "@/components/docs/DocsLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

const GettingStarted = () => {
  return (
    <DocsLayout>
      <h1 id="installation">Installation</h1>
      <p>
        Get started with TIDY Editor UI in minutes. Follow these steps to set up your development environment.
      </p>

      <h2 id="prerequisites">Prerequisites</h2>
      <p>Before you begin, ensure you have the following installed:</p>
      <ul>
        <li><strong>Node.js</strong> version 16 or higher</li>
        <li><strong>npm</strong>, <strong>yarn</strong>, or <strong>pnpm</strong> package manager</li>
        <li><strong>Git</strong> for version control</li>
      </ul>

      <Alert className="my-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          We recommend using the latest LTS version of Node.js for optimal performance and compatibility.
        </AlertDescription>
      </Alert>

      <h2 id="installation-steps">Installation Steps</h2>

      <h3 id="clone">1. Clone the Repository</h3>
      <pre><code>{`git clone <repository-url>
cd tidy-editor-ui`}</code></pre>

      <h3 id="install">2. Install Dependencies</h3>
      <p>Choose your preferred package manager:</p>
      <pre><code>{`# Using npm
npm install

# Using yarn
yarn install

# Using pnpm
pnpm install`}</code></pre>

      <h3 id="env">3. Environment Setup</h3>
      <p>Create a <code>.env</code> file in the root directory for your API keys:</p>
      <pre><code>{`# Google Gemini API
VITE_GEMINI_API_KEY=your_api_key_here

# Optional: Analytics
VITE_ANALYTICS_ID=your_analytics_id`}</code></pre>

      <Alert className="my-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          You can configure the Gemini API key later in the application settings if you prefer not to use environment variables.
        </AlertDescription>
      </Alert>

      <h3 id="start">4. Start Development Server</h3>
      <pre><code>{`npm run dev

# Server starts on http://localhost:8080`}</code></pre>

      <h2 id="build-commands">Build Commands</h2>
      <p>TIDY Editor provides several npm scripts for different tasks:</p>

      <table>
        <thead>
          <tr>
            <th>Command</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>npm run dev</code></td>
            <td>Start development server with hot reload</td>
          </tr>
          <tr>
            <td><code>npm run build</code></td>
            <td>Create production build</td>
          </tr>
          <tr>
            <td><code>npm run build:dev</code></td>
            <td>Development build with source maps</td>
          </tr>
          <tr>
            <td><code>npm run preview</code></td>
            <td>Preview production build locally</td>
          </tr>
          <tr>
            <td><code>npm run lint</code></td>
            <td>Run ESLint code quality checks</td>
          </tr>
        </tbody>
      </table>

      <h2 id="first-run">First Run</h2>
      <p>After starting the development server, you'll see the main editor interface. Here's what to do next:</p>

      <ol>
        <li><strong>Configure AI Settings</strong> - Click the settings icon to configure your Gemini API key</li>
        <li><strong>Create a File</strong> - Use the file tree sidebar to create your first code file</li>
        <li><strong>Write Code</strong> - Start typing in the Monaco editor</li>
        <li><strong>Analyze Code</strong> - Click "Analyze now" to get AI-powered insights</li>
        <li><strong>Use Chat</strong> - Ask the AI assistant questions about your code</li>
      </ol>

      <h2 id="troubleshooting">Troubleshooting</h2>

      <h3 id="port-conflict">Port Already in Use</h3>
      <p>If port 8080 is already in use, modify <code>vite.config.ts</code>:</p>
      <pre><code>{`server: {
  host: "::",
  port: 3000, // Change to any available port
}`}</code></pre>

      <h3 id="api-errors">API Connection Errors</h3>
      <p>If you encounter API connection issues:</p>
      <ul>
        <li>Verify your Gemini API key is correct</li>
        <li>Check your internet connection</li>
        <li>Enable offline mode in settings if API is unavailable</li>
      </ul>

      <h2 id="next-steps">Next Steps</h2>
      <ul>
        <li><a href="/docs/features/ai-analysis">Learn about AI Analysis</a></li>
        <li><a href="/docs/features/editor">Explore Editor Features</a></li>
        <li><a href="/docs/technical/configuration">Configure Advanced Settings</a></li>
      </ul>
    </DocsLayout>
  );
};

export default GettingStarted;