import { DocsLayout } from "@/components/docs/DocsLayout";
import { Badge } from "@/components/ui/badge";

const Structure = () => {
  return (
    <DocsLayout showTOC={false}>
      <div className="mb-8">
        <Badge variant="secondary" className="mb-4">Developer</Badge>
        <h1 id="project-structure">Project Structure</h1>
        <p className="text-xl text-muted-foreground">
          Complete overview of the TIDY Editor codebase organization.
        </p>
      </div>

      <h2 id="directory-tree">Directory Tree</h2>
      <pre><code>{`tidy-editor-ui/
├── public/
│   ├── favicon.ico              # Application icon
│   ├── placeholder.svg          # Placeholder image
│   └── robots.txt              # SEO configuration
│
├── src/
│   ├── components/             # React components
│   │   ├── ui/                # shadcn/ui components
│   │   │   ├── accordion.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ... (40+ components)
│   │   │
│   │   ├── CodeEditor.tsx     # Monaco editor wrapper
│   │   ├── CodeReviewerSidebar.tsx # AI analysis & chat
│   │   ├── EditorHeader.tsx   # Top toolbar
│   │   ├── EditorSidebar.tsx  # File tree navigation
│   │   ├── ErrorBoundary.tsx  # Error handling
│   │   ├── NavLink.tsx       # Navigation component
│   │   ├── SaveSnippetModal.tsx # Snippet creation
│   │   ├── SettingsSheet.tsx # Settings panel
│   │   ├── SnippetCard.tsx   # Snippet display
│   │   └── TabBar.tsx        # File tabs (experimental)
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── use-mobile.tsx    # Mobile detection
│   │   └── use-toast.ts      # Toast notifications
│   │
│   ├── lib/                   # Core libraries and utilities
│   │   ├── analysis/         # AI analysis modules
│   │   │   ├── index.ts      # Main orchestrator
│   │   │   ├── types.ts      # Type definitions
│   │   │   ├── codeQuality.ts # Code quality analyzer
│   │   │   ├── security.ts   # Security analyzer
│   │   │   ├── performance.ts # Performance analyzer
│   │   │   ├── maintainability.ts # Maintainability
│   │   │   ├── testing.ts    # Testing analyzer
│   │   │   ├── documentation.ts # Doc analyzer
│   │   │   ├── responseFormatter.ts # Format results
│   │   │   └── safeJsonParser.ts # JSON parsing
│   │   │
│   │   ├── api/              # API client
│   │   │   ├── client.ts     # HTTP client
│   │   │   └── types.ts      # API types
│   │   │
│   │   ├── analysisHistory.ts # History management
│   │   ├── analysisOrchestrator.ts # Analysis coordinator
│   │   ├── chatAssistant.ts  # Chat functionality
│   │   ├── codeContext.ts   # Code context utilities
│   │   ├── errorHandler.ts  # Error handling
│   │   ├── geminiApi.ts     # Gemini API client
│   │   ├── SettingsContext.tsx # Settings state
│   │   ├── snippetStorage.ts # Snippet CRUD
│   │   └── utils.ts         # General utilities
│   │
│   ├── pages/                # Route components
│   │   ├── Index.tsx        # Main editor page
│   │   ├── AnalysisHistory.tsx # Analysis history
│   │   ├── SnippetLibrary.tsx # Snippet management
│   │   └── NotFound.tsx     # 404 page
│   │
│   ├── App.css              # Global styles
│   ├── App.tsx              # Root component
│   ├── index.css            # Tailwind & base styles
│   └── main.tsx            # Application entry point
│
├── .gitignore              # Git ignore rules
├── bun.lockb               # Bun lock file
├── components.json         # shadcn/ui config
├── eslint.config.js        # ESLint configuration
├── index.html              # HTML template
├── package.json            # Dependencies
├── package-lock.json       # NPM lock file
├── pnpm-lock.yaml          # PNPM lock file
├── postcss.config.js       # PostCSS config
├── README.md               # Project documentation
├── tailwind.config.ts      # Tailwind configuration
├── tsconfig.json           # TypeScript config
├── tsconfig.app.json       # App-specific TS config
├── tsconfig.node.json      # Node-specific TS config
└── vite.config.ts          # Vite configuration`}</code></pre>

      <h2 id="component-structure">Component Organization</h2>

      <h3 id="ui-components">UI Components (/components/ui)</h3>
      <p>shadcn/ui components - fully customizable and styled:</p>
      <ul>
        <li>Layout: Card, Separator, ScrollArea, Resizable</li>
        <li>Forms: Input, Textarea, Select, Checkbox, Switch, Radio</li>
        <li>Navigation: Tabs, Accordion, Navigation Menu, Breadcrumb</li>
        <li>Overlays: Dialog, Sheet, Popover, Dropdown Menu, Tooltip</li>
        <li>Feedback: Toast, Alert, Progress, Skeleton</li>
        <li>Data: Table, Calendar, Chart, Carousel</li>
      </ul>

      <h3 id="feature-components">Feature Components (/components)</h3>
      <p>Application-specific components:</p>
      <ul>
        <li><strong>CodeEditor</strong> - Monaco editor integration</li>
        <li><strong>EditorSidebar</strong> - File tree and navigation</li>
        <li><strong>CodeReviewerSidebar</strong> - AI analysis interface</li>
        <li><strong>EditorHeader</strong> - Top toolbar with actions</li>
        <li><strong>SaveSnippetModal</strong> - Snippet creation dialog</li>
        <li><strong>SnippetCard</strong> - Individual snippet display</li>
        <li><strong>SettingsSheet</strong> - Settings configuration panel</li>
      </ul>

      <h2 id="lib-organization">Library Organization</h2>

      <h3 id="analysis-lib">Analysis Library (/lib/analysis)</h3>
      <p>AI code analysis system:</p>
      <ul>
        <li><code>index.ts</code> - Main orchestrator, coordinates analyzers</li>
        <li><code>types.ts</code> - Shared type definitions</li>
        <li><code>*.ts</code> - Individual analyzer modules</li>
        <li><code>responseFormatter.ts</code> - Format AI responses</li>
        <li><code>safeJsonParser.ts</code> - Safe JSON parsing</li>
      </ul>

      <h3 id="utilities">Utilities (/lib)</h3>
      <p>Core utilities and helpers:</p>
      <ul>
        <li><code>geminiApi.ts</code> - Gemini API client wrapper</li>
        <li><code>chatAssistant.ts</code> - Chat functionality</li>
        <li><code>snippetStorage.ts</code> - localStorage operations</li>
        <li><code>analysisHistory.ts</code> - History management</li>
        <li><code>codeContext.ts</code> - Code context extraction</li>
        <li><code>errorHandler.ts</code> - Centralized error handling</li>
        <li><code>utils.ts</code> - General utility functions</li>
      </ul>

      <h2 id="routing">Routing Structure</h2>
      <p>Application routes defined in <code>App.tsx</code>:</p>
      <table>
        <thead>
          <tr>
            <th>Route</th>
            <th>Component</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>/</code></td>
            <td>Index</td>
            <td>Main editor interface</td>
          </tr>
          <tr>
            <td><code>/history</code></td>
            <td>AnalysisHistory</td>
            <td>Past analysis sessions</td>
          </tr>
          <tr>
            <td><code>/snippets</code></td>
            <td>SnippetLibrary</td>
            <td>Code snippet library</td>
          </tr>
          <tr>
            <td><code>*</code></td>
            <td>NotFound</td>
            <td>404 error page</td>
          </tr>
        </tbody>
      </table>

      <h2 id="config-files">Configuration Files</h2>

      <h3 id="typescript">TypeScript Configuration</h3>
      <ul>
        <li><code>tsconfig.json</code> - Base TypeScript config</li>
        <li><code>tsconfig.app.json</code> - Application-specific config</li>
        <li><code>tsconfig.node.json</code> - Node.js-specific config</li>
      </ul>

      <h3 id="build">Build Configuration</h3>
      <ul>
        <li><code>vite.config.ts</code> - Vite bundler configuration</li>
        <li><code>postcss.config.js</code> - PostCSS processing</li>
        <li><code>tailwind.config.ts</code> - Tailwind CSS setup</li>
      </ul>

      <h3 id="linting">Code Quality</h3>
      <ul>
        <li><code>eslint.config.js</code> - ESLint rules</li>
        <li><code>.gitignore</code> - Version control exclusions</li>
      </ul>

      <h2 id="naming">Naming Conventions</h2>

      <h3 id="files">File Naming</h3>
      <ul>
        <li><strong>Components</strong> - PascalCase (e.g., <code>CodeEditor.tsx</code>)</li>
        <li><strong>Utilities</strong> - camelCase (e.g., <code>geminiApi.ts</code>)</li>
        <li><strong>Hooks</strong> - kebab-case with "use-" prefix (e.g., <code>use-mobile.tsx</code>)</li>
        <li><strong>Pages</strong> - PascalCase (e.g., <code>Index.tsx</code>)</li>
      </ul>

      <h3 id="variables">Variable Naming</h3>
      <ul>
        <li><strong>Constants</strong> - UPPER_SNAKE_CASE</li>
        <li><strong>Functions</strong> - camelCase</li>
        <li><strong>Components</strong> - PascalCase</li>
        <li><strong>Interfaces/Types</strong> - PascalCase</li>
      </ul>

      <h2 id="import-paths">Import Path Aliases</h2>
      <p>Configured in <code>tsconfig.json</code> and <code>vite.config.ts</code>:</p>
      <pre><code>{`// Use @ alias for src directory
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Index from "@/pages/Index";`}</code></pre>

      <h2 id="module-structure">Module Structure Pattern</h2>
      <p>Consistent module organization:</p>
      <pre><code>{`// 1. External imports
import React from 'react';
import { Button } from '@/components/ui/button';

// 2. Internal imports
import { useToast } from '@/hooks/use-toast';
import { analyzeCode } from '@/lib/analysis';

// 3. Types
interface Props {
  // ...
}

// 4. Component/Function
export function MyComponent({ }: Props) {
  // ...
}

// 5. Exports (if needed)
export type { Props };`}</code></pre>
    </DocsLayout>
  );
};

export default Structure;