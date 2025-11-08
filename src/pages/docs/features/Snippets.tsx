import { DocsLayout } from "@/components/docs/DocsLayout";
import { Badge } from "@/components/ui/badge";

const Snippets = () => {
  return (
    <DocsLayout>
      <div className="mb-8">
        <Badge variant="secondary" className="mb-4">Features</Badge>
        <h1 id="snippet-library">Snippet Library</h1>
        <p className="text-xl text-muted-foreground">
          Organize and reuse code patterns with AI-powered categorization.
        </p>
      </div>

      <h2 id="overview">Overview</h2>
      <p>
        The Snippet Library is your personal code knowledge base. Save useful code patterns, reusable functions, and common solutions for quick access. AI automatically categorizes and tags snippets for easy discovery.
      </p>

      <h2 id="features">Key Features</h2>

      <h3 id="auto-categorization">AI Auto-Categorization</h3>
      <p>When you save a snippet, AI analyzes it and automatically:</p>
      <ul>
        <li>Assigns appropriate category</li>
        <li>Generates relevant tags</li>
        <li>Suggests improvements to title/description</li>
        <li>Detects programming language</li>
      </ul>

      <h3 id="categories">Built-in Categories</h3>
      <ul>
        <li><Badge>Security</Badge> - Authentication, encryption, validation</li>
        <li><Badge>Performance</Badge> - Optimization, caching, lazy loading</li>
        <li><Badge>Error Handling</Badge> - Try-catch, error boundaries, logging</li>
        <li><Badge>UI</Badge> - Components, layouts, animations</li>
        <li><Badge>Utility</Badge> - Helper functions, formatters, validators</li>
        <li><Badge>Custom</Badge> - Your own categories</li>
      </ul>

      <h3 id="search">Advanced Search</h3>
      <p>Find snippets quickly with full-text search across:</p>
      <ul>
        <li>Snippet titles</li>
        <li>Descriptions</li>
        <li>Code content</li>
        <li>Tags</li>
        <li>Categories</li>
      </ul>

      <h3 id="tracking">Usage Tracking</h3>
      <p>The library tracks:</p>
      <ul>
        <li>Usage count for each snippet</li>
        <li>Last used timestamp</li>
        <li>Creation date</li>
        <li>Source (manual, chat, analysis)</li>
      </ul>

      <h2 id="managing">Managing Snippets</h2>

      <h3 id="creating">Creating Snippets</h3>

      <h4>From Editor</h4>
      <ol>
        <li>Select code you want to save</li>
        <li>Click "Save as Snippet"</li>
        <li>Add title and description</li>
        <li>AI suggests category and tags</li>
        <li>Click Save</li>
      </ol>

      <h4>From Chat</h4>
      <ol>
        <li>Receive code suggestion in chat</li>
        <li>Click "Save to Snippets"</li>
        <li>Review AI-generated metadata</li>
        <li>Confirm save</li>
      </ol>

      <h4>From Analysis</h4>
      <ol>
        <li>Get code suggestions from analysis</li>
        <li>Click "Save" on useful suggestions</li>
        <li>Snippet created automatically</li>
      </ol>

      <h3 id="editing">Editing Snippets</h3>
      <p>Update existing snippets:</p>
      <ul>
        <li>Modify title or description</li>
        <li>Update code content</li>
        <li>Change category</li>
        <li>Add or remove tags</li>
      </ul>

      <h3 id="using">Using Snippets</h3>
      <ol>
        <li>Browse or search for snippet</li>
        <li>Click to view details</li>
        <li>Copy code to clipboard</li>
        <li>Or insert directly into editor</li>
      </ol>

      <h2 id="organization">Organization</h2>

      <h3 id="filtering">Filtering & Sorting</h3>
      <p>Find snippets efficiently:</p>
      <ul>
        <li>Filter by category</li>
        <li>Filter by language</li>
        <li>Sort by most used</li>
        <li>Sort by recently added</li>
        <li>Sort by last used</li>
      </ul>

      <h3 id="tagging">Smart Tagging</h3>
      <p>AI generates contextual tags like:</p>
      <ul>
        <li><code>async</code>, <code>promise</code> for async operations</li>
        <li><code>react-hook</code>, <code>useState</code> for React patterns</li>
        <li><code>validation</code>, <code>input</code> for form handling</li>
        <li><code>api</code>, <code>fetch</code> for API calls</li>
      </ul>

      <h2 id="metadata">Snippet Metadata</h2>

      <h3 id="structure">Data Structure</h3>
      <pre><code>{`{
  "id": "unique-id",
  "title": "Error Boundary Component",
  "description": "React error boundary with fallback UI",
  "code": "class ErrorBoundary extends React.Component {...}",
  "language": "typescript",
  "tags": ["react", "error-handling", "component"],
  "category": "error-handling",
  "createdAt": "2024-01-15T10:30:00Z",
  "lastUsed": "2024-01-20T14:22:00Z",
  "usageCount": 5,
  "source": "chat-suggestion",
  "metadata": {
    "framework": "react",
    "complexity": "intermediate"
  }
}`}</code></pre>

      <h2 id="best-practices">Best Practices</h2>

      <h3 id="titles">Descriptive Titles</h3>
      <ul>
        <li>Use clear, searchable titles</li>
        <li>Include context (e.g., "React" vs generic "Component")</li>
        <li>Be consistent with naming conventions</li>
      </ul>

      <h3 id="descriptions">Detailed Descriptions</h3>
      <ul>
        <li>Explain what the snippet does</li>
        <li>Mention key features or requirements</li>
        <li>Include usage notes if relevant</li>
      </ul>

      <h3 id="maintenance">Regular Maintenance</h3>
      <ul>
        <li>Review and update outdated snippets</li>
        <li>Remove duplicates</li>
        <li>Consolidate similar snippets</li>
        <li>Archive rarely used snippets</li>
      </ul>

      <h2 id="examples">Example Use Cases</h2>

      <h3 id="common-patterns">Common Patterns</h3>
      <p>Save frequently used patterns:</p>
      <ul>
        <li>API fetch wrappers</li>
        <li>Form validation logic</li>
        <li>Date formatting functions</li>
        <li>Component templates</li>
      </ul>

      <h3 id="solutions">Problem Solutions</h3>
      <p>Store solutions to common problems:</p>
      <ul>
        <li>Cross-browser compatibility fixes</li>
        <li>Performance optimization techniques</li>
        <li>Complex algorithm implementations</li>
        <li>Integration patterns</li>
      </ul>

      <h3 id="templates">Code Templates</h3>
      <p>Quick-start templates for:</p>
      <ul>
        <li>New React components</li>
        <li>API route handlers</li>
        <li>Test suites</li>
        <li>Configuration files</li>
      </ul>

      <h2 id="persistence">Data Persistence</h2>
      <p>
        Snippets are stored in browser's localStorage. This means:
      </p>
      <ul>
        <li>✅ Instant access, no network required</li>
        <li>✅ Private, data never leaves your browser</li>
        <li>⚠️ Clearing browser data removes snippets</li>
        <li>⚠️ Not synced across devices</li>
      </ul>

      <h2 id="export-import">Export & Import</h2>
      <p>Future features planned:</p>
      <ul>
        <li>Export snippets as JSON</li>
        <li>Import from other sources</li>
        <li>Share snippets with team</li>
        <li>Cloud sync across devices</li>
      </ul>

      <h2 id="tips">Pro Tips</h2>
      <ul>
        <li>Save snippets as you discover useful patterns</li>
        <li>Use descriptive tags for better searchability</li>
        <li>Review most-used snippets for optimization</li>
        <li>Create snippet collections for different projects</li>
        <li>Document snippet requirements and dependencies</li>
      </ul>
    </DocsLayout>
  );
};

export default Snippets;