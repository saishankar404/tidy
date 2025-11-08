import * as monaco from 'monaco-editor';

export interface CodeContext {
  currentFile: string;
  fileContent: string;
  cursorPosition: { line: number; column: number };
  selectedText?: string;
  language: string;
  projectStructure: FileItem[];
  recentEdits: EditHistory[];
  imports: string[];
  functionSignatures: FunctionInfo[];
}

export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  content?: string;
}

export interface EditHistory {
  timestamp: number;
  changes: string;
}

export interface FunctionInfo {
  name: string;
  signature: string;
  startLine: number;
  endLine: number;
}

export class ContextAnalyzer {
  static collectContext(
    editor: monaco.editor.IStandaloneCodeEditor,
    files: FileItem[],
    maxContextSize = 100
  ): CodeContext | null {
    const model = editor.getModel();
    if (!model) {
      // Silently fail - this is normal during editor initialization
      return null;
    }

    const position = editor.getPosition();
    if (!position) {
      // Silently fail - this is normal during editor initialization
      return null;
    }

    const fileContent = model.getValue();
    const language = model.getLanguageId();

    // Get selected text
    const selection = editor.getSelection();
    const selectedText = selection && !selection.isEmpty()
      ? model.getValueInRange(selection)
      : undefined;

    // Extract context around cursor
    const contextSnippet = this.getRelevantCodeSnippet(fileContent, position, maxContextSize);

    // Extract imports and function signatures
    const imports = this.extractImports(fileContent, language);
    const functionSignatures = this.extractFunctionSignatures(fileContent, language);

    return {
      currentFile: model.uri.path,
      fileContent: contextSnippet,
      cursorPosition: { line: position.lineNumber, column: position.column },
      selectedText,
      language,
      projectStructure: files,
      recentEdits: [], // TODO: Implement edit history
      imports,
      functionSignatures,
    };
  }

  static getRelevantCodeSnippet(
    content: string,
    position: monaco.IPosition,
    maxLines: number
  ): string {
    const lines = content.split('\n');
    const startLine = Math.max(0, position.lineNumber - Math.floor(maxLines / 2));
    const endLine = Math.min(lines.length, startLine + maxLines);

    return lines.slice(startLine, endLine).join('\n');
  }

  static extractImports(content: string, language: string): string[] {
    const imports: string[] = [];

    if (language === 'typescript' || language === 'javascript') {
      const importRegex = /^import\s+.*from\s+['"]([^'"]+)['"]/gm;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
    }

    return imports;
  }

  static extractFunctionSignatures(content: string, language: string): FunctionInfo[] {
    const functions: FunctionInfo[] = [];

    if (language === 'typescript' || language === 'javascript') {
      // Simple regex for function detection (can be enhanced with AST parsing)
      const funcRegex = /^(\s*)(function|const|let)\s+(\w+)\s*=\s*(?:\(([^)]*)\)\s*=>|function\s*\(([^)]*)\))/gm;
      let match;
      while ((match = funcRegex.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        functions.push({
          name: match[3],
          signature: match[0].trim(),
          startLine: lineNum,
          endLine: lineNum, // TODO: Calculate actual end line
        });
      }
    }

    return functions;
  }
}