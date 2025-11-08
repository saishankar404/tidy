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
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastTextLengthRef = useRef<number>(0);
  const completionCacheRef = useRef<Map<string, { completion: string; timestamp: number }>>(new Map());
  const disposablesRef = useRef<monaco.IDisposable[]>([]);
  const quotaExceededRef = useRef<boolean>(false);

  // Clear cache when settings change (in case model changes)
  useEffect(() => {
    console.log('Clearing completion cache due to settings change');
    setContextCache(new Map());
  }, [settings.ai.model]);

  // Expose cache clearing function to window for debugging
  useEffect(() => {
    (window as any).clearAICache = () => {
      console.log('Manually clearing AI completion cache...');
      setContextCache(new Map());
      console.log('Cache cleared! If you still see errors, do a hard refresh (Ctrl+Shift+R)');
    };

    (window as any).forceReload = () => {
      console.log('Forcing page reload...');
      window.location.reload();
    };

    return () => {
      delete (window as any).clearAICache;
      delete (window as any).forceReload;

      // Cleanup on unmount
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Dispose all registered providers
      disposablesRef.current.forEach(d => d.dispose());
      disposablesRef.current = [];
    };
  }, []);

  // Helper method to parse AI response into Monaco suggestions
  const parseSuggestions = useCallback((response: string): monaco.languages.InlineCompletion[] => {
    if (!response || !response.trim()) {
      return [];
    }

    let cleanedResponse = response.trim();

    // Remove markdown code fences
    cleanedResponse = cleanedResponse.replace(/^```[\w]*\n?/gm, '');
    cleanedResponse = cleanedResponse.replace(/\n?```$/gm, '');

    // Remove cursor marker if it's echoed back
    cleanedResponse = cleanedResponse.replace(/█/g, '');

    // Remove common prompt echoes - be more selective
    const instructionPatterns = [
      /^Complete from cursor:\s*/i,
      /^You are an expert/i,
      /^Rules:\s*/i,
      /^Code:\s*/i,
    ];

    // Split into lines
    let lines = cleanedResponse.split('\n');

    // Remove instruction lines only from the start
    while (lines.length > 0 && instructionPatterns.some(regex => regex.test(lines[0]))) {
      lines.shift();
    }

    cleanedResponse = lines.join('\n').trim();

    // If still no valid content, return empty
    if (!cleanedResponse || cleanedResponse.length === 0) {
      return [];
    }

    // Limit to reasonable length (first 5 lines max for inline suggestions)
    lines = cleanedResponse.split('\n').slice(0, 5);
    cleanedResponse = lines.join('\n').trim();

    const suggestion: monaco.languages.InlineCompletion = {
      insertText: cleanedResponse,
    };

    return [suggestion];
  }, []);

  // Initialize AI service when settings change
  useEffect(() => {
    console.log('🔧 AI Settings:', settings.ai);
    if (settings.ai.enabled && settings.ai.apiKey) {
      console.log('✅ Creating Gemini service with API key:', settings.ai.apiKey.substring(0, 10) + '...');
      const config = {
        apiKey: settings.ai.apiKey,
        model: settings.ai.model,
        temperature: settings.ai.temperature,
        maxTokens: settings.ai.maxTokens,
      };
      const service = new GeminiService(config);
      setGeminiService(service);
      geminiServiceRef.current = service;
      console.log('✅ Gemini service initialized successfully');
    } else {
      console.log('❌ AI not enabled or no API key - inline completions disabled');
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

  // Helper function to provide debounced inline completions
  const provideInlineCompletionsWithDebounce = useCallback((
    editor: Parameters<OnMount>[0],
    position: monaco.IPosition,
    token: monaco.CancellationToken
  ): Promise<monaco.languages.InlineCompletions> => {
    return new Promise((resolve) => {
      let model: monaco.editor.ITextModel | null = null;

      try {
        console.log('🤖 Inline completion triggered at', position);

        // Check if quota exceeded - don't make API calls
        if (quotaExceededRef.current) {
          console.log('⏸️ Quota exceeded - inline completions disabled');
          resolve({ items: [] });
          return;
        }

        // Early validation - check editor state
        if (!editor || !geminiServiceRef.current) {
          console.log('❌ No editor or Gemini service - skipping completion');
          resolve({ items: [] });
          return;
        }

        model = editor.getModel();
        if (!model) {
          console.log('❌ No model available');
          resolve({ items: [] });
          return;
        }
      } catch (error) {
        console.error('Error in initial validation:', error);
        resolve({ items: [] });
        return;
      }

      // Check if user is deleting text (backspace/delete) - skip completions
      const currentTextLength = model.getValueLength();
      const isDeleting = currentTextLength < lastTextLengthRef.current;
      lastTextLengthRef.current = currentTextLength;

      if (isDeleting) {
        resolve({ items: [] });
        return;
      }

      // Clear any existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      // Check if request was cancelled by Monaco
      if (token.isCancellationRequested) {
        resolve({ items: [] });
        return;
      }

       // Set up debounce timer (800ms to reduce API calls)
       debounceTimerRef.current = setTimeout(async () => {
        console.log('⏱️ Debounce timer fired - generating completion');

        // Double-check everything is still valid after debounce
        if (!geminiServiceRef.current || !editor) {
          console.log('❌ Service/editor lost after debounce');
          resolve({ items: [] });
          return;
        }

        const modelCheck = editor.getModel();
        if (!modelCheck) {
          console.log('❌ No model after debounce');
          resolve({ items: [] });
          return;
        }

        // Check again if cancelled
        if (token.isCancellationRequested) {
          console.log('❌ Cancelled after debounce');
          resolve({ items: [] });
          return;
        }

        // Get current line content for cache key
        let lineContent;
        try {
          lineContent = modelCheck.getLineContent(position.lineNumber);
        } catch (error) {
          resolve({ items: [] });
          return;
        }

        const textBeforeCursor = lineContent.substring(0, position.column - 1);
        const trimmedText = textBeforeCursor.trim();

        // Create cache key from current context
        const completionCacheKey = `${position.lineNumber}:${position.column}:${trimmedText}`;

        // Check cache first (valid for 30 seconds)
        const cached = completionCacheRef.current.get(completionCacheKey);
        if (cached && (Date.now() - cached.timestamp) < 30000) {
          console.log('📋 Using cached completion');
          resolve({
            items: [{
              insertText: cached.completion,
              range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: position.column
              }
            }]
          });
          return;
        }

        // Skip if completely empty line
        if (trimmedText.length === 0) {
          console.log('⏭️ Skipping - empty line');
          resolve({ items: [] });
          return;
        }

        // Skip if line is too short (less than 3 characters)
        if (trimmedText.length < 3) {
          console.log('⏭️ Skipping - line too short');
          resolve({ items: [] });
          return;
        }

        // Skip if ends with common punctuation that doesn't need completion
        if (/[;,.{}()[\]]$/ .test(textBeforeCursor)) {
          console.log('⏭️ Skipping - ends with punctuation');
          resolve({ items: [] });
          return;
        }

        // Skip if it's just a variable declaration without assignment
        if (/^(const|let|var)\s+\w+$/.test(trimmedText)) {
          console.log('⏭️ Skipping - incomplete variable declaration');
          resolve({ items: [] });
          return;
        }

        // Allow completions for keywords and short snippets
        // Don't require 3 chars - allow after any text
        console.log('📝 Text before cursor:', textBeforeCursor);

        // Better cache key that includes actual text context to avoid redundant API calls
        const cacheKey = `${position.lineNumber}:${textBeforeCursor.trim()}`;

        let codeContext;
        try {
          codeContext = ContextAnalyzer.collectContext(editor, []);
        } catch (error: any) {
          // ContextAnalyzer failed (likely old cached code), bail out silently
          // This should never happen with updated code
          console.debug('ContextAnalyzer error (ignore if browser just loaded):', error.message);
          resolve({ items: [] });
          return;
        }

        if (!codeContext) {
          // Editor model not available yet, bail out gracefully
          resolve({ items: [] });
          return;
        }

        try {
          // Check cache first
          if (contextCache.has(cacheKey)) {
            const cached = contextCache.get(cacheKey)!;
            console.log('💾 Using cached completion');

            // Verify editor is still valid before returning cached results
            if (!editor || !editor.getModel()) {
              console.log('⚠️ Editor/model disposed - skipping cached result');
              resolve({ items: [] });
              return;
            }

            resolve({ items: parseSuggestions(cached) });
            return;
          }

          // Get surrounding context (5 lines before and after for better context)
          const startLine = Math.max(1, position.lineNumber - 5);
          const endLine = Math.min(modelCheck.getLineCount(), position.lineNumber + 3);
          const contextLines = [];
          for (let i = startLine; i <= endLine; i++) {
            if (i === position.lineNumber) {
              // Include only text before cursor on current line
              contextLines.push(textBeforeCursor + '█'); // Cursor marker
            } else {
              contextLines.push(modelCheck.getLineContent(i));
            }
          }
          const surroundingContext = contextLines.join('\n');

          // Smart prompt based on what user is typing
          const prompt = `You are an expert code completion AI. Complete the ${language} code at the cursor (█).

Rules:
- Return ONLY the completion text that comes after the cursor
- NO explanations, NO markdown, NO code fences
- Keep completions SHORT and relevant (1-3 lines max)
- Match the indentation and style

Code:
${surroundingContext.trim()}

Complete from cursor:`;

          // Create new AbortController for this request
          abortControllerRef.current = new AbortController();

          console.log('🚀 Calling Gemini API...');
          const completion = await geminiServiceRef.current!.generateCompletion(prompt);
          console.log('✅ Received completion:', completion.substring(0, 50) + '...');

          // Check if cancelled during request or editor/model disposed
          if (token.isCancellationRequested) {
            console.log('⏹️ Cancelled during request');
            resolve({ items: [] });
            return;
          }

          // Verify editor and model are still valid after async operation
          if (!editor || !editor.getModel()) {
            console.log('⚠️ Editor/model no longer valid after completion');
            resolve({ items: [] });
            return;
          }

           // Cache the result
           setContextCache(prev => new Map(prev.set(cacheKey, completion)));

           // Also cache in our completion cache
           completionCacheRef.current.set(completionCacheKey, {
             completion: completion,
             timestamp: Date.now()
           });

           // Clean up old cache entries (keep only last 50)
           if (completionCacheRef.current.size > 50) {
             const entries = Array.from(completionCacheRef.current.entries());
             entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
             completionCacheRef.current = new Map(entries.slice(0, 50));
           }

          const suggestions = parseSuggestions(completion);

          resolve({ items: suggestions });
        } catch (error: any) {
          // Check if quota exceeded
          if (error instanceof Error && error.message.includes('QUOTA_EXCEEDED')) {
            quotaExceededRef.current = true;
            console.error('🚫 QUOTA EXCEEDED - Inline completions disabled until quota resets');
            console.error('💡 Your API quota will reset in ~24 hours. You can still edit code normally.');
          } else if (error?.name !== 'AbortError') {
            // Don't log abort errors
            console.error('AI completion error:', error);
          }

          // Fallback to empty suggestions on error
          resolve({ items: [] });
        }
      }, 400); // 400ms debounce - better responsiveness with rate limiting handled by GeminiService
    });
  }, [contextCache, parseSuggestions]);

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

    // Register inline completions provider for all languages
    const languages = ['typescript', 'javascript', 'typescriptreact', 'javascriptreact', 'json', 'html', 'css', 'python', 'java', 'cpp', 'go', 'rust', 'php'];

    // Dispose any previously registered providers
    disposablesRef.current.forEach(d => d.dispose());
    disposablesRef.current = [];

    languages.forEach(lang => {
      try {
        const disposable = monaco.languages.registerInlineCompletionsProvider(lang, {
          provideInlineCompletions: async (_model, position, _context, token) => {
            try {
              return await provideInlineCompletionsWithDebounce(editor, position, token);
            } catch (error) {
              console.error('Error in provideInlineCompletions:', error);
              return { items: [] };
            }
          },
          freeInlineCompletions: (_completions) => {
            // Optional cleanup for completions
          },
          disposeInlineCompletions: (_completions) => {
            // Required by Monaco - cleanup when completions are disposed
          },
        });
        disposablesRef.current.push(disposable);
      } catch (error) {
        console.error(`Failed to register inline completions provider for ${lang}:`, error);
      }
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
          inlineSuggest: {
            enabled: true,
          },
          quickSuggestions: true,
          suggest: {
            preview: true,
            showInlineDetails: true,
          }
        }}
      />
    </div>
  );
}
