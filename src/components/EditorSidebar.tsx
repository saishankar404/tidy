import { Search, FileCode, Folder, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EditorSidebarProps {
  onFileSelect: (fileName: string, content: string) => void;
}

const sampleFiles = [
  { name: "index.tsx", type: "file", language: "typescript" },
  { name: "App.tsx", type: "file", language: "typescript" },
  { name: "styles.css", type: "file", language: "css" },
  { name: "utils.ts", type: "file", language: "typescript" },
];

const sampleContents: Record<string, string> = {
  "index.tsx": `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
  "App.tsx": `import React from 'react';

function App() {
  return (
    <div className="app">
      <h1>Hello, World!</h1>
      <p>Welcome to your code editor</p>
    </div>
  );
}

export default App;`,
  "styles.css": `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #f5f5f5;
  color: #1a1a1a;
}

.app {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}`,
  "utils.ts": `export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}`,
};

export function EditorSidebar({ onFileSelect }: EditorSidebarProps) {
  return (
    <div className="h-full bg-sidebar-bg border-r border-border flex flex-col">
      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            className="pl-9 bg-background border-border h-9 text-sm"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <div className="flex items-center justify-between px-2 py-1 mb-2">
            <span className="text-xs font-medium text-foreground uppercase tracking-wider">
              Files
            </span>
            <Button variant="ghost" size="icon" className="h-5 w-5">
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <div className="space-y-0.5">
            {sampleFiles.map((file) => (
              <button
                key={file.name}
                onClick={() => onFileSelect(file.name, sampleContents[file.name] || "")}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted text-sm text-foreground transition-colors"
              >
                <FileCode className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-xs">{file.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-2 mt-4">
          <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted text-sm text-foreground transition-colors">
            <Folder className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs">Components</span>
            <ChevronRight className="h-3 w-3 ml-auto text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
