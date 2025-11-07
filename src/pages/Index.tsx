import { useState } from "react";
import { EditorSidebar } from "@/components/EditorSidebar";
import { EditorHeader } from "@/components/EditorHeader";
import { CodeEditor } from "@/components/CodeEditor";
import { toast } from "sonner";

interface FileData {
  name: string;
  type: "file";
  language: string;
  content: string;
}

const initialFiles: FileData[] = [
  {
    name: "index.tsx",
    type: "file",
    language: "typescript",
    content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
  },
  {
    name: "App.tsx",
    type: "file",
    language: "typescript",
    content: `import React from 'react';

function App() {
  return (
    <div className="app">
      <h1>Hello, World!</h1>
      <p>Welcome to your code editor</p>
    </div>
  );
}

export default App;`,
  },
  {
    name: "styles.css",
    type: "file",
    language: "css",
    content: `* {
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
  },
  {
    name: "utils.ts",
    type: "file",
    language: "typescript",
    content: `export function formatDate(date: Date): string {
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
  },
];

const Index = () => {
  const [files, setFiles] = useState<FileData[]>(initialFiles);
  const [currentFile, setCurrentFile] = useState("index.tsx");

  const currentFileData = files.find((f) => f.name === currentFile);

  const handleFileSelect = (fileName: string) => {
    setCurrentFile(fileName);
  };

  const handleFileAdd = (fileName: string) => {
    // Check if file already exists
    if (files.some((f) => f.name === fileName)) {
      toast.error("File already exists");
      return;
    }

    const ext = fileName.split(".").pop() || "";
    const language = getLanguageFromExt(ext);

    const newFile: FileData = {
      name: fileName,
      type: "file",
      language,
      content: `// New file: ${fileName}\n`,
    };

    setFiles([...files, newFile]);
    setCurrentFile(fileName);
  };

  const handleFileRename = (oldName: string, newName: string) => {
    // Check if new name already exists
    if (files.some((f) => f.name === newName)) {
      toast.error("File already exists");
      return;
    }

    setFiles(
      files.map((f) =>
        f.name === oldName ? { ...f, name: newName } : f
      )
    );

    if (currentFile === oldName) {
      setCurrentFile(newName);
    }
  };

  const handleFileDelete = (fileName: string) => {
    const newFiles = files.filter((f) => f.name !== fileName);
    setFiles(newFiles);

    // If we're deleting the current file, switch to another file
    if (currentFile === fileName) {
      setCurrentFile(newFiles.length > 0 ? newFiles[0].name : "");
    }
  };

  const handleContentChange = (newContent: string) => {
    setFiles(
      files.map((f) =>
        f.name === currentFile ? { ...f, content: newContent } : f
      )
    );
  };

  const getLanguageFromExt = (ext: string): string => {
    switch (ext) {
      case "tsx":
      case "ts":
        return "typescript";
      case "jsx":
      case "js":
        return "javascript";
      case "css":
        return "css";
      case "html":
        return "html";
      case "json":
        return "json";
      default:
        return "plaintext";
    }
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-background">
      <EditorHeader fileName={currentFile} />

      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 flex-shrink-0">
          <EditorSidebar
            files={files}
            currentFile={currentFile}
            onFileSelect={handleFileSelect}
            onFileAdd={handleFileAdd}
            onFileRename={handleFileRename}
            onFileDelete={handleFileDelete}
          />
        </div>

        <div className="flex-1 overflow-hidden">
          {currentFileData ? (
            <CodeEditor
              content={currentFileData.content}
              language={currentFileData.language}
              onChange={handleContentChange}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-editor-bg animate-fade-in">
              <p className="text-muted-foreground text-sm">No file selected</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
