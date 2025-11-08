import { useRef, useEffect, useCallback, useState } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import * as monaco from 'monaco-editor';
import { GeminiService } from '../lib/geminiApi';
import { ContextAnalyzer } from '../lib/codeContext';
import { useSettings } from '../lib/SettingsContext';

interface CodeEditorProps {
  content: string;
  language: string;
  onChange?: (value: string) => void;
  enableMinimap?: boolean;
  onSave?: () => void;
  isDiff?: boolean;
}

export function CodeEditor({ content, language, onChange, enableMinimap = false, onSave, isDiff = false }: CodeEditorProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const isExternalUpdateRef = useRef(false);
  const { settings } = useSettings();
  const [geminiService, setGeminiService] = useState<GeminiService | null>(null);
  const geminiServiceRef = useRef<GeminiService | null>(null);
  const [contextCache, setContextCache] = useState<Map<string, string>>(new Map());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper method to parse AI response into Monaco suggestions
  const parseSuggestions = (response: string): monaco.languages.InlineCompletion[] => {
    if (!response.trim()) return [];

    // Split response into lines and clean up
    const lines = response.split('\n').filter(line => line.trim());

    return [{
      insertText: lines.join('\n'),
      range: new monaco.Range(0, 0, 0, 0), // Will be set by Monaco
    }];
  };

  // Initialize AI service when settings change
  useEffect(() => {
    console.log('AI Settings:', settings.ai);
    if (settings.ai.enabled && settings.ai.apiKey) {
      console.log('Creating Gemini service with API key:', settings.ai.apiKey.substring(0, 10) + '...');
      const config = {
        apiKey: settings.ai.apiKey,
        model: settings.ai.model,
        temperature: settings.ai.temperature,
        maxTokens: settings.ai.maxTokens,
      };
      const service = new GeminiService(config);
      setGeminiService(service);
      geminiServiceRef.current = service;
    } else {
      console.log('AI not enabled or no API key');
      setGeminiService(null);
      geminiServiceRef.current = null;
    }
  }, [settings.ai]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSave]);

  // Update editor content when content prop changes (external updates only)
  useEffect(() => {
    if (editorRef.current && !isExternalUpdateRef.current) {
      const currentValue = editorRef.current.getValue();
      if (content !== currentValue) {
        isExternalUpdateRef.current = true;
        editorRef.current.setValue(content);
        // Reset the flag after a short delay to allow the change to propagate
        setTimeout(() => {
          isExternalUpdateRef.current = false;
        }, 0);
      }
    }
  }, [content]);

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (!isExternalUpdateRef.current) {
      onChange?.(value || "");
    }
  }, [onChange]);

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
        "editor.inlineCompletions.foreground": "#a3a3a3", // More faded ghost text
      },
    });

    monaco.editor.setTheme("custom-light");

    // Inline completions are now configured in options below

    if (isDiff) {
      const lines = content.split('\n');
      const decorations = lines.map((line, index) => {
        if (line.startsWith('+')) {
          return {
            range: new monaco.Range(index + 1, 1, index + 1, line.length + 1),
            options: {
              className: 'diff-add',
              inlineClassName: 'diff-add-inline',
            },
          };
        } else if (line.startsWith('-')) {
          return {
            range: new monaco.Range(index + 1, 1, index + 1, line.length + 1),
            options: {
              className: 'diff-remove',
              inlineClassName: 'diff-remove-inline',
            },
          };
        }
        return null;
      }).filter(Boolean);

      editor.deltaDecorations([], decorations as monaco.editor.IModelDeltaDecoration[]);
    }

    // Register inline completions provider for AI suggestions
    monaco.languages.registerInlineCompletionsProvider('typescript', {
      provideInlineCompletions: async (_model, position, _context, _token) => {
        console.log('TypeScript inline completions requested, service:', !!geminiServiceRef.current);
        if (!geminiServiceRef.current) {
          // Fallback to basic suggestions
          return { items: [] };
        }

        const codeContext = ContextAnalyzer.collectContext(editor, []);
        const cacheKey = `${codeContext.currentFile}:${position.lineNumber}:${position.column}`;

        try {
          // Check cache first
          if (contextCache.has(cacheKey)) {
            const cached = contextCache.get(cacheKey)!;
            return { items: parseSuggestions(cached) };
          }

          const prompt = `Complete the following code. Provide only the completion text without explanation:\n\n${codeContext.fileContent}`;

          const completion = await geminiServiceRef.current!.generateCompletion(prompt);

          // Cache the result
          setContextCache(prev => new Map(prev.set(cacheKey, completion)));

          return { items: parseSuggestions(completion) };
        } catch (error) {
          console.error('AI completion error:', error);
          // Fallback to basic suggestions on error
          const fallbackSuggestions = geminiServiceRef.current?.getOfflineSuggestions(codeContext) || [];
          return { items: parseSuggestions(fallbackSuggestions.join('\n')) };
        }
      },
      disposeInlineCompletions: () => {},
    });

    // Also for JavaScript
    monaco.languages.registerInlineCompletionsProvider('javascript', {
      provideInlineCompletions: async (_model, position, _context, _token) => {
        if (!geminiServiceRef.current) {
          // Fallback to basic suggestions
          return { items: [] };
        }

        const codeContext = ContextAnalyzer.collectContext(editor, []);
        const cacheKey = `${codeContext.currentFile}:${position.lineNumber}:${position.column}`;

        try {
          // Check cache first
          if (contextCache.has(cacheKey)) {
            const cached = contextCache.get(cacheKey)!;
            return { items: parseSuggestions(cached) };
          }

          const prompt = `Complete the following code. Provide only the completion text without explanation:\n\n${codeContext.fileContent}`;

          const completion = await geminiServiceRef.current!.generateCompletion(prompt);

          // Cache the result
          setContextCache(prev => new Map(prev.set(cacheKey, completion)));

          return { items: parseSuggestions(completion) };
        } catch (error) {
          console.error('AI completion error:', error);
          // Fallback to basic suggestions on error
          const fallbackSuggestions = geminiServiceRef.current?.getOfflineSuggestions(codeContext) || [];
          return { items: parseSuggestions(fallbackSuggestions.join('\n')) };
        }
      },
      disposeInlineCompletions: () => {},
    });
  };

  return (
    <div className="h-full bg-editor-bg">
      <Editor
        height="100%"
        language={language}
        value={content}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
          lineHeight: 24,
          padding: { top: 16, bottom: 16 },
          minimap: {
            enabled: enableMinimap,
            size: 'proportional',
            showSlider: 'always',
            renderCharacters: false,
          },
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
