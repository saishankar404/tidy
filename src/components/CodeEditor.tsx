import { useRef } from "react";
import Editor, { OnMount } from "@monaco-editor/react";

interface CodeEditorProps {
  content: string;
  language: string;
  onChange?: (value: string) => void;
}

export function CodeEditor({ content, language, onChange }: CodeEditorProps) {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Define custom theme matching our design
    monaco.editor.defineTheme("custom-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "comment", foreground: "8e8e8e", fontStyle: "italic" },
        { token: "keyword", foreground: "ff6b35", fontStyle: "bold" },
        { token: "string", foreground: "4a9d5f" },
        { token: "number", foreground: "d97706" },
        { token: "type", foreground: "0891b2" },
        { token: "function", foreground: "7c3aed" },
      ],
      colors: {
        "editor.background": "#fafafa",
        "editor.foreground": "#262626",
        "editor.lineHighlightBackground": "#f5f5f4",
        "editorLineNumber.foreground": "#a3a3a3",
        "editorLineNumber.activeForeground": "#525252",
        "editor.selectionBackground": "#fde4d8",
        "editor.inactiveSelectionBackground": "#f5f5f4",
        "editorCursor.foreground": "#ff6b35",
        "editorWhitespace.foreground": "#e5e5e5",
      },
    });

    monaco.editor.setTheme("custom-light");
  };

  return (
    <div className="h-full bg-editor-bg">
      <Editor
        height="100%"
        language={language}
        value={content}
        onChange={(value) => onChange?.(value || "")}
        onMount={handleEditorDidMount}
        options={{
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
          lineHeight: 24,
          padding: { top: 16, bottom: 16 },
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          renderLineHighlight: "all",
          lineNumbers: "on",
          glyphMargin: false,
          folding: true,
          lineDecorationsWidth: 10,
          lineNumbersMinChars: 3,
          renderWhitespace: "selection",
          smoothScrolling: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          bracketPairColorization: {
            enabled: true,
          },
        }}
      />
    </div>
  );
}
