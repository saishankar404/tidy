import { useState } from "react";
import { EditorSidebar } from "@/components/EditorSidebar";
import { EditorHeader } from "@/components/EditorHeader";
import { CodeEditor } from "@/components/CodeEditor";

const Index = () => {
  const [currentFile, setCurrentFile] = useState("index.tsx");
  const [content, setContent] = useState(`import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`);

  const handleFileSelect = (fileName: string, fileContent: string) => {
    setCurrentFile(fileName);
    setContent(fileContent);
  };

  const getLanguage = (fileName: string) => {
    const ext = fileName.split(".").pop();
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
          <EditorSidebar onFileSelect={handleFileSelect} />
        </div>
        
        <div className="flex-1 overflow-hidden">
          <CodeEditor
            content={content}
            language={getLanguage(currentFile)}
            onChange={setContent}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
