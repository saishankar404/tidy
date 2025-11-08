import { DocsLayout } from "@/components/docs/DocsLayout";
import { Badge } from "@/components/ui/badge";

const Development = () => {
  return (
    <DocsLayout>
      <div className="mb-8">
        <Badge variant="secondary" className="mb-4">Developer</Badge>
        <h1 id="development">Development Guide</h1>
        <p className="text-xl text-muted-foreground">
          Best practices, workflows, and optimization tips for developing TIDY Editor.
        </p>
      </div>

      <h2 id="workflow">Development Workflow</h2>

      <h3 id="setup">Initial Setup</h3>
      <ol>
        <li>Clone repository</li>
        <li>Install dependencies: <code>npm install</code></li>
        <li>Configure environment variables</li>
        <li>Start dev server: <code>npm run dev</code></li>
      </ol>

      <h3 id="dev-server">Development Server</h3>
      <p>Vite provides instant hot module replacement:</p>
      <pre><code>{`npm run dev
# Server starts on http://localhost:8080
# Changes reflect instantly without full reload`}</code></pre>

      <h3 id="type-checking">Type Checking</h3>
      <p>TypeScript ensures type safety throughout:</p>
      <pre><code>{`# Run type checker
npx tsc --noEmit

# Watch mode for continuous checking
npx tsc --noEmit --watch`}</code></pre>

      <h2 id="code-quality">Code Quality</h2>

      <h3 id="linting">ESLint</h3>
      <p>Maintain code quality with ESLint:</p>
      <pre><code>{`# Run linter
npm run lint

# Auto-fix issues
npx eslint . --fix`}</code></pre>

      <h3 id="formatting">Code Formatting</h3>
      <p>Consistent code style (if Prettier is added):</p>
      <pre><code>{`# Format all files
npx prettier --write .

# Check formatting
npx prettier --check .`}</code></pre>

      <h2 id="component-dev">Component Development</h2>

      <h3 id="creating">Creating Components</h3>
      <p>Follow this structure for new components:</p>
      <pre><code>{`import React from 'react';
import { cn } from '@/lib/utils';

interface MyComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export function MyComponent({
  className,
  children
}: MyComponentProps) {
  return (
    <div className={cn("base-classes", className)}>
      {children}
    </div>
  );
}

MyComponent.displayName = 'MyComponent';`}</code></pre>

      <h3 id="hooks">Custom Hooks</h3>
      <p>Create reusable hooks in <code>/hooks</code>:</p>
      <pre><code>{`import { useState, useEffect } from 'react';

export function useCustomHook() {
  const [state, setState] = useState();

  useEffect(() => {
    // Effect logic
  }, []);

  return { state, setState };
}`}</code></pre>

      <h2 id="testing">Testing</h2>

      <h3 id="unit-tests">Unit Testing</h3>
      <p>Test individual functions and utilities:</p>
      <pre><code>{`import { describe, it, expect } from 'vitest';
import { myFunction } from './myModule';

describe('myFunction', () => {
  it('should return expected result', () => {
    expect(myFunction('input')).toBe('output');
  });
});`}</code></pre>

      <h3 id="component-tests">Component Testing</h3>
      <p>Test React components with React Testing Library:</p>
      <pre><code>{`import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});`}</code></pre>

      <h2 id="optimization">Performance Optimization</h2>

      <h3 id="memo">React.memo</h3>
      <p>Prevent unnecessary re-renders:</p>
      <pre><code>{`export const ExpensiveComponent = React.memo(
  function ExpensiveComponent({ data }) {
    // Component logic
  }
);`}</code></pre>

      <h3 id="use-callback">useCallback</h3>
      <p>Memoize callback functions:</p>
      <pre><code>{`const handleClick = useCallback(() => {
  // Handler logic
}, [dependencies]);`}</code></pre>

      <h3 id="use-memo">useMemo</h3>
      <p>Memoize expensive computations:</p>
      <pre><code>{`const computedValue = useMemo(() => {
  return expensiveComputation(data);
}, [data]);`}</code></pre>

      <h3 id="lazy">Lazy Loading</h3>
      <p>Code split large components:</p>
      <pre><code>{`const HeavyComponent = lazy(() =>
  import('./HeavyComponent')
);

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  );
}`}</code></pre>

      <h2 id="debugging">Debugging</h2>

      <h3 id="react-devtools">React DevTools</h3>
      <p>Use browser extension for React debugging:</p>
      <ul>
        <li>Inspect component hierarchy</li>
        <li>View props and state</li>
        <li>Track re-renders</li>
        <li>Profile performance</li>
      </ul>

      <h3 id="console">Console Logging</h3>
      <p>Structured logging for debugging:</p>
      <pre><code>{`console.log('Debug:', { variable, state });
console.error('Error:', error);
console.warn('Warning:', warning);`}</code></pre>

      <h3 id="source-maps">Source Maps</h3>
      <p>Development builds include source maps for debugging original TypeScript code.</p>

      <h2 id="git">Git Workflow</h2>

      <h3 id="branching">Branch Strategy</h3>
      <pre><code>{`main           # Production-ready code
develop        # Integration branch
feature/*      # New features
bugfix/*       # Bug fixes
hotfix/*       # Critical production fixes`}</code></pre>

      <h3 id="commits">Commit Messages</h3>
      <p>Follow conventional commits:</p>
      <pre><code>{`feat: Add snippet search functionality
fix: Resolve analysis timeout issue
docs: Update API documentation
style: Format code with prettier
refactor: Simplify chat assistant logic
test: Add unit tests for utilities
chore: Update dependencies`}</code></pre>

      <h2 id="build">Building for Production</h2>

      <h3 id="production-build">Production Build</h3>
      <pre><code>{`# Create optimized build
npm run build

# Output in /dist directory
# Includes minification, tree-shaking, compression`}</code></pre>

      <h3 id="preview">Preview Build</h3>
      <pre><code>{`# Preview production build locally
npm run preview

# Serves build from /dist
# Test production behavior before deployment`}</code></pre>

      <h2 id="optimization-tips">Optimization Tips</h2>

      <h3 id="bundle">Bundle Size</h3>
      <ul>
        <li>Use dynamic imports for large dependencies</li>
        <li>Avoid importing entire libraries</li>
        <li>Remove unused dependencies</li>
        <li>Check bundle size: <code>npm run build -- --analyze</code></li>
      </ul>

      <h3 id="runtime">Runtime Performance</h3>
      <ul>
        <li>Minimize re-renders with memo and useCallback</li>
        <li>Virtualize long lists</li>
        <li>Debounce frequent operations</li>
        <li>Use web workers for heavy computations</li>
      </ul>

      <h3 id="loading">Loading Performance</h3>
      <ul>
        <li>Code split by routes</li>
        <li>Lazy load non-critical components</li>
        <li>Optimize images and assets</li>
        <li>Implement progressive loading</li>
      </ul>

      <h2 id="troubleshooting">Common Issues</h2>

      <h3 id="hmr">HMR Not Working</h3>
      <pre><code>{`# Clear Vite cache
rm -rf node_modules/.vite

# Restart dev server
npm run dev`}</code></pre>

      <h3 id="type-errors">Type Errors</h3>
      <pre><code>{`# Rebuild TypeScript declarations
npx tsc --build --clean
npx tsc --build`}</code></pre>

      <h3 id="dependency-issues">Dependency Issues</h3>
      <pre><code>{`# Clean install
rm -rf node_modules package-lock.json
npm install`}</code></pre>

      <h2 id="best-practices">Best Practices</h2>

      <h3 id="dos">Do's</h3>
      <ul>
        <li>✅ Write TypeScript for all new code</li>
        <li>✅ Use semantic HTML elements</li>
        <li>✅ Keep components small and focused</li>
        <li>✅ Extract reusable logic to hooks</li>
        <li>✅ Handle errors gracefully</li>
        <li>✅ Write meaningful comments</li>
        <li>✅ Test critical functionality</li>
      </ul>

      <h3 id="donts">Don'ts</h3>
      <ul>
        <li>❌ Avoid inline styles</li>
        <li>❌ Don't ignore TypeScript errors</li>
        <li>❌ Avoid deeply nested components</li>
        <li>❌ Don't bypass ESLint rules</li>
        <li>❌ Avoid premature optimization</li>
        <li>❌ Don't commit debug code</li>
      </ul>

      <h2 id="resources">Additional Resources</h2>
      <ul>
        <li><a href="https://react.dev" target="_blank" rel="noopener noreferrer">React Documentation</a></li>
        <li><a href="https://www.typescriptlang.org/docs/" target="_blank" rel="noopener noreferrer">TypeScript Handbook</a></li>
        <li><a href="https://vitejs.dev/guide/" target="_blank" rel="noopener noreferrer">Vite Guide</a></li>
        <li><a href="https://tailwindcss.com/docs" target="_blank" rel="noopener noreferrer">Tailwind CSS Docs</a></li>
        <li><a href="https://ui.shadcn.com" target="_blank" rel="noopener noreferrer">shadcn/ui Components</a></li>
      </ul>
    </DocsLayout>
  );
};

export default Development;