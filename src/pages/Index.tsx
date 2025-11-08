import { useState, useEffect } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { EditorSidebar, FileItem } from "@/components/EditorSidebar";
import { EditorHeader } from "@/components/EditorHeader";
import { CodeEditor } from "@/components/CodeEditor";
import { TabBar } from "@/components/TabBar";
import { CodeReviewerSidebar } from "@/components/CodeReviewerSidebar";
import { useSettings } from "@/lib/SettingsContext";
import { toast } from "sonner";

const initialFiles: FileItem[] = [
  {
    name: "src",
    type: "folder",
    path: "src",
    children: [
      {
        name: "index.tsx",
        type: "file",
        language: "typescript",
        path: "src/index.tsx",
      },
      {
        name: "App.tsx",
        type: "file",
        language: "typescript",
        path: "src/App.tsx",
      },
      {
        name: "components",
        type: "folder",
        path: "src/components",
        children: [
          {
            name: "Button.tsx",
            type: "file",
            language: "typescript",
            path: "src/components/Button.tsx",
          },
        ],
      },
    ],
  },
  {
    name: "styles.css",
    type: "file",
    language: "css",
    path: "styles.css",
  },
  {
    name: "utils.ts",
    type: "file",
    language: "typescript",
    path: "utils.ts",
  },
];

const fileContents: Record<string, string> = {
  "src/index.tsx": `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
  "src/App.tsx": `import React from 'react';

function App() {
  return (
    <div className="app">
      <h1>Hello, World!</h1>
      <p>Welcome to your code editor</p>
    </div>
  );
}

export default App;`,
  "src/components/Button.tsx": `import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ children, onClick }: ButtonProps) {
  return (
    <button onClick={onClick} className="btn">
      {children}
    </button>
  );
}`,
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

const Index = () => {
  const [files, setFiles] = useState<FileItem[]>(initialFiles);
  const [contents, setContents] = useState<Record<string, string>>(fileContents);
  const [openFiles, setOpenFiles] = useState<string[]>(["src/index.tsx"]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [modifiedFiles, setModifiedFiles] = useState<Set<string>>(new Set());
  const [isCodeReviewerOpen, setIsCodeReviewerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (filePath: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const index = openFiles.indexOf(filePath);
      if (index === -1) {
        setOpenFiles([...openFiles, filePath]);
        setActiveIndex(openFiles.length);
      } else {
        setActiveIndex(index);
      }
    } catch (err) {
      setError(`Failed to open file: ${err instanceof Error ? err.message : 'Unknown error'}`);
      toast.error("Failed to open file");
    } finally {
      setIsLoading(false);
    }
  };

  const findAndUpdateTree = (
    items: FileItem[],
    predicate: (item: FileItem) => boolean,
    updater: (item: FileItem) => FileItem | null
  ): FileItem[] => {
    return items.reduce((acc: FileItem[], item) => {
      if (predicate(item)) {
        const updated = updater(item);
        if (updated) acc.push(updated);
      } else if (item.type === "folder" && item.children) {
        acc.push({
          ...item,
          children: findAndUpdateTree(item.children, predicate, updater),
        });
      } else {
        acc.push(item);
      }
      return acc;
    }, []);
  };

  const addToTree = (
    items: FileItem[],
    newItem: FileItem,
    parentPath?: string
  ): FileItem[] => {
    if (!parentPath) {
      return [...items, newItem];
    }

    return items.map((item) => {
      if (item.path === parentPath && item.type === "folder") {
        return {
          ...item,
          children: [...(item.children || []), newItem],
        };
      } else if (item.type === "folder" && item.children) {
        return {
          ...item,
          children: addToTree(item.children, newItem, parentPath),
        };
      }
      return item;
    });
  };

  const handleFileAdd = (fileName: string, folderPath?: string) => {
    const ext = fileName.split(".").pop() || "";
    const language = getLanguageFromExt(ext);
    const path = folderPath ? `${folderPath}/${fileName}` : fileName;

    // Check if file already exists
    if (contents[path]) {
      toast.error("File already exists");
      return;
    }

    const newFile: FileItem = {
      name: fileName,
      type: "file",
      language,
      path,
    };

    setFiles((prev) => addToTree(prev, newFile, folderPath));
    setContents((prev) => ({
      ...prev,
      [path]: `// New file: ${fileName}\n`,
    }));
    setOpenFiles([...openFiles, path]);
    setActiveIndex(openFiles.length);
  };

  const handleFolderAdd = (folderName: string, parentPath?: string) => {
    const path = parentPath ? `${parentPath}/${folderName}` : folderName;

    const newFolder: FileItem = {
      name: folderName,
      type: "folder",
      path,
      children: [],
    };

    setFiles((prev) => addToTree(prev, newFolder, parentPath));
  };

  const handleFileRename = (oldPath: string, newPath: string) => {
    // Check if new path already exists
    if (contents[newPath]) {
      toast.error("File already exists");
      return;
    }

    setFiles((prev) =>
      findAndUpdateTree(
        prev,
        (item) => item.path === oldPath,
        (item) => ({
          ...item,
          name: newPath.split("/").pop() || item.name,
          path: newPath,
        })
      )
    );

    if (contents[oldPath]) {
      setContents((prev) => {
        const newContents = { ...prev };
        newContents[newPath] = prev[oldPath];
        delete newContents[oldPath];
        return newContents;
      });
    }

    if (openFiles.includes(oldPath)) {
      setOpenFiles(openFiles.map(f => f === oldPath ? newPath : f));
    }
  };

  const handleFileDelete = (filePath: string) => {
    setFiles((prev) =>
      findAndUpdateTree(
        prev,
        (item) => item.path === filePath,
        () => null
      )
    );

    setContents((prev) => {
      const newContents = { ...prev };
      delete newContents[filePath];
      return newContents;
    });

    const index = openFiles.indexOf(filePath);
    if (index !== -1) {
      const newOpenFiles = openFiles.filter(f => f !== filePath);
      setOpenFiles(newOpenFiles);
      if (activeIndex >= newOpenFiles.length) {
        setActiveIndex(Math.max(0, newOpenFiles.length - 1));
      } else if (activeIndex === index) {
        // stay at same index if possible
      }
    }
  };

  const handleFileMove = (fromPath: string, toFolderPath: string) => {
    const fileName = fromPath.split("/").pop();
    if (!fileName) return;

    const newPath = `${toFolderPath}/${fileName}`;

    // Check if destination already exists
    if (contents[newPath]) {
      toast.error("File already exists at destination");
      return;
    }

    // Remove from old location
    let movedItem: FileItem | null = null;
    setFiles((prev) =>
      findAndUpdateTree(
        prev,
        (item) => item.path === fromPath,
        (item) => {
          movedItem = { ...item, path: newPath };
          return null;
        }
      )
    );

    // Add to new location
    if (movedItem) {
      setFiles((prev) => addToTree(prev, movedItem!, toFolderPath));

      if (contents[fromPath]) {
        setContents((prev) => {
          const newContents = { ...prev };
          newContents[newPath] = prev[fromPath];
          delete newContents[fromPath];
          return newContents;
        });
      }

      if (openFiles.includes(fromPath)) {
        setOpenFiles(openFiles.map(f => f === fromPath ? newPath : f));
      }
    }
  };

  const handleContentChange = (newContent: string) => {
    const currentFile = openFiles[activeIndex];
    if (currentFile) {
      setContents((prev) => ({
        ...prev,
        [currentFile]: newContent,
      }));
      setModifiedFiles(new Set([...modifiedFiles, currentFile]));
    }
  };

  const handleSave = () => {
    const currentFile = openFiles[activeIndex];
    if (currentFile) {
      setModifiedFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentFile);
        return newSet;
      });
      toast.success("Saved");
    }
  };

  const handleTabClick = (index: number) => {
    setActiveIndex(index);
  };

  const handleTabClose = (index: number) => {
    const newOpenFiles = openFiles.filter((_, i) => i !== index);
    setOpenFiles(newOpenFiles);
    if (activeIndex >= newOpenFiles.length) {
      setActiveIndex(Math.max(0, newOpenFiles.length - 1));
    } else if (activeIndex > index) {
      setActiveIndex(activeIndex - 1);
    }
  };

  const handleTabReorder = (fromIndex: number, toIndex: number) => {
    const newOpenFiles = [...openFiles];
    const [moved] = newOpenFiles.splice(fromIndex, 1);
    newOpenFiles.splice(toIndex, 0, moved);
    setOpenFiles(newOpenFiles);
    if (activeIndex === fromIndex) {
      setActiveIndex(toIndex);
    } else if (activeIndex > fromIndex && activeIndex <= toIndex) {
      setActiveIndex(activeIndex - 1);
    } else if (activeIndex < fromIndex && activeIndex >= toIndex) {
      setActiveIndex(activeIndex + 1);
    }
  };

  const handleOpenDiff = (title: string, diffContent: string) => {
    const diffFileName = `Diff: ${title}`;
    const diffPath = `diff://${title}`;
    setContents(prev => ({ ...prev, [diffPath]: diffContent }));
    setOpenFiles([...openFiles, diffPath]);
    setActiveIndex(openFiles.length);
  };

  const handleApplyChanges = (filePath: string, newContent: string) => {
    setContents(prev => ({
      ...prev,
      [filePath]: newContent,
    }));
    setModifiedFiles(new Set([...modifiedFiles, filePath]));
    toast.success("Changes applied");
  };

  const handleAnalyze = () => {
    // TODO: Implement analyze functionality
    toast.info("Analyze feature coming soon!");
  };

  const handleConnectGitHub = () => {
    // TODO: Implement GitHub connection
    toast.info("GitHub integration coming soon!");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCodeReviewerOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const currentFile = openFiles[activeIndex] || "";
  const currentFileData = contents[currentFile];
  const getCurrentLanguage = () => {
    const ext = currentFile.split(".").pop() || "";
    return getLanguageFromExt(ext);
  };

  const { settings } = useSettings();

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-background">
      {error && (
        <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      <EditorHeader fileName={currentFile} onOpenCodeReviewer={() => setIsCodeReviewerOpen(true)} />

      {settings.experimental.tabBar && (
        <TabBar
          openFiles={openFiles}
          activeIndex={activeIndex}
          modifiedFiles={modifiedFiles}
          onTabClick={handleTabClick}
          onTabClose={handleTabClose}
          onTabReorder={handleTabReorder}
        />
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 flex-shrink-0">
          <EditorSidebar
            files={files}
            openFiles={openFiles}
            activeIndex={activeIndex}
            fileContents={contents}
            onFileSelect={handleFileSelect}
            onFileAdd={handleFileAdd}
            onFolderAdd={handleFolderAdd}
            onFileRename={handleFileRename}
            onFileDelete={handleFileDelete}
            onFileMove={handleFileMove}
          />
        </div>

        <PanelGroup direction="horizontal" className="flex-1">
          <Panel defaultSize={70} minSize={30}>
            <div className="h-full overflow-hidden">
              {isLoading ? (
                <div className="h-full flex items-center justify-center bg-editor-bg animate-fade-in">
                  <div className="text-center space-y-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground text-sm">Loading...</p>
                  </div>
                </div>
              ) : currentFileData ? (
                <CodeEditor
                  content={currentFileData}
                  language={getCurrentLanguage()}
                  onChange={handleContentChange}
                  enableMinimap={settings.experimental.minimap}
                  onSave={handleSave}
                  isDiff={currentFile.startsWith('diff://')}
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-editor-bg animate-fade-in">
                  <p className="text-muted-foreground text-sm">No file selected</p>
                </div>
              )}
            </div>
          </Panel>

        {isCodeReviewerOpen && (
          <CodeReviewerSidebar
            currentFile={currentFile}
            currentFileData={currentFileData}
            onClose={() => setIsCodeReviewerOpen(false)}
            onOpenDiff={handleOpenDiff}
            onApplyChanges={handleApplyChanges}
            onAnalyze={handleAnalyze}
            onConnectGitHub={handleConnectGitHub}
          />
        )}
        </PanelGroup>
      </div>
    </div>
  );
};

export default Index;