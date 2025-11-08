import { GeminiService } from './geminiApi';
import { AnalysisResult } from './analysis/types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatContext {
  code?: string;
  filePath?: string;
  language?: string;
  analysisResults?: AnalysisResult[];
  currentFile?: string;
}

export interface Issue {
  title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
}

export class ChatAssistant {
  private geminiService: GeminiService;
  private conversationHistory: ChatMessage[] = [];
  private context: ChatContext = {};

  constructor(geminiService: GeminiService) {
    this.geminiService = geminiService;
  }

  setContext(context: ChatContext): void {
    this.context = { ...this.context, ...context };
  }

  addMessage(message: ChatMessage): void {
    this.conversationHistory.push(message);
    // Keep only last 20 messages to avoid token limits
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }
  }

  async generateResponse(userMessage: string): Promise<string> {
    // Add user message to history
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    this.addMessage(userMsg);

    // Build context-aware prompt
    const prompt = this.buildPrompt(userMessage);

    try {
      const response = await this.geminiService.generateCompletion(prompt);

      // Add assistant response to history
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      this.addMessage(assistantMsg);

      return response;
    } catch (error) {
      console.error('Chat response generation failed:', error);
      const fallbackResponse = this.generateFallbackResponse(userMessage);

      // Add fallback response to history
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fallbackResponse,
        timestamp: new Date()
      };
      this.addMessage(assistantMsg);

      return fallbackResponse;
    }
  }

  private buildPrompt(userMessage: string): string {
    let contextInfo = '';

    // Add code context if available
    if (this.context.code) {
      contextInfo += `\nCurrent code file: ${this.context.filePath || 'Unknown'}
Language: ${this.context.language || 'Unknown'}

Code snippet:
${this.context.code.length > 1000 ? this.context.code.substring(0, 1000) + '...' : this.context.code}
`;
    }

    // Add analysis results if available
    if (this.context.analysisResults && this.context.analysisResults.length > 0) {
      contextInfo += `\nRecent code analysis results:
${this.context.analysisResults.map(result =>
  `- ${result.type}: ${result.issues.length} issues found, score: ${result.score}/100`
).join('\n')}
`;
    }

    // Add conversation history (last 5 exchanges)
    const recentHistory = this.conversationHistory.slice(-10);
    const historyText = recentHistory.length > 0 ?
      `\nRecent conversation:
${recentHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}\n` : '';

    return `You are Tidy, a helpful AI coding assistant. You help developers write better code, fix bugs, explain concepts, and provide suggestions for improvement.

${contextInfo}${historyText}
User: ${userMessage}

Assistant: Provide a helpful, concise response. Focus on being practical and actionable. If the user is asking about code, reference the current context when relevant.`;
  }

  private generateFallbackResponse(userMessage: string): string {
    const input = userMessage.toLowerCase();

    if (input.includes('explain') || input.includes('what')) {
      return "I'd be happy to explain that! Based on your current code, it looks like you're working on a React/TypeScript project. Could you be more specific about what you'd like me to explain?";
    }

    if (input.includes('fix') || input.includes('error') || input.includes('bug')) {
      return "I can help you fix issues in your code. Have you run the code analysis yet? The analysis results above might give us clues about what needs to be fixed. What specific error or issue are you encountering?";
    }

    if (input.includes('optimize') || input.includes('performance') || input.includes('slow')) {
      return "Performance optimization is important! Looking at your code structure, there are several areas we could focus on. Have you run the performance analysis? I'd recommend checking the analysis results for specific suggestions.";
    }

    if (input.includes('test') || input.includes('testing')) {
      return "Testing is crucial for code quality! I can help you write tests or improve your testing strategy. What kind of testing are you looking to implement - unit tests, integration tests, or something else?";
    }

    if (input.includes('security') || input.includes('secure')) {
      return "Security is paramount in development. The security analysis should have identified potential vulnerabilities. Let me know what specific security concerns you have, and I can provide guidance on best practices.";
    }

    return "I'm here to help you with your code! I can explain concepts, suggest improvements, help fix bugs, or answer questions about your codebase. What would you like to work on? Feel free to ask me anything about programming, best practices, or your specific code.";
  }

  getConversationHistory(): ChatMessage[] {
    return [...this.conversationHistory];
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }

  // Generate quick suggestions based on current context
  async generateFix(issue: Issue, code: string, filePath: string, suggestionDiff?: string): Promise<{ fixedCode: string; diff: string }> {
    console.log('generateFix called with:', {
      issueTitle: issue.title,
      issueCategory: issue.category,
      issueSeverity: issue.severity,
      filePath,
      hasSuggestionDiff: !!suggestionDiff,
      suggestionDiffPreview: suggestionDiff?.substring(0, 100)
    });

    try {
      // First try pattern-based fixes (faster and more reliable)
      const patternResult = this.applyPatternBasedFix(issue, code);
      console.log('Pattern-based fix result:', patternResult ? 'SUCCESS' : 'FAILED');
      if (patternResult && patternResult.diff.trim() !== '' && patternResult.diff !== code) {
        console.log('Using pattern-based fix with diff length:', patternResult.diff.length);
        console.log('Diff preview:', patternResult.diff.substring(0, 200));
        return patternResult;
      }

      // Check if we have a useful suggestion diff (not just a comment)
      if (suggestionDiff && !suggestionDiff.trim().startsWith('//') && suggestionDiff.includes('\n')) {
        console.log('Using suggestion diff as fallback');
        // Try to apply the suggestion diff directly
        const appliedResult = this.applySuggestionDiff(code, suggestionDiff);
        if (appliedResult) {
          console.log('Successfully applied suggestion diff');
          return appliedResult;
        }
      }

      // If we have a suggestion diff but couldn't apply it, return it as-is for display
      if (suggestionDiff) {
        console.log('Returning suggestion diff as-is for display');
        return {
          fixedCode: code,
          diff: suggestionDiff
        };
      }

      // Fall back to AI-generated fix
      console.log('Falling back to AI-generated fix');
      const prompt = `You are an expert code reviewer. I need you to apply a specific fix pattern to the code.

Issue Details:
- Title: ${issue.title}
- Description: ${issue.description}
- Category: ${issue.category}
- Severity: ${issue.severity}

File: ${filePath}
Original Code:
${code}

Please provide a complete fixed version of the entire code file that resolves this issue.

Return ONLY the corrected code, no explanations or markdown formatting. The code should be the complete, corrected file content.`;

      const fixedCode = await this.geminiService.generateCompletion(prompt);

      // Generate a simple diff
      const diff = this.generateSimpleDiff(code, fixedCode.trim());
      console.log('AI-generated diff length:', diff.length);
      console.log('AI-generated diff preview:', diff.substring(0, 200));

      // Check if the diff actually contains changes
      if (diff.trim() === '' || diff === code) {
        console.log('No changes detected in AI-generated diff');
        // Return a placeholder diff
        return {
          fixedCode: code,
          diff: `// Suggested improvement for: ${issue.title}\n// ${issue.description}\n${code}`
        };
      }

      return {
        fixedCode: fixedCode.trim(),
        diff
      };
    } catch (error) {
      console.error('Failed to generate fix:', error);
      return {
        fixedCode: code,
        diff: suggestionDiff || `// Could not generate fix for: ${issue.title}\n${code}`
      };
    }
  }

  private generateSimpleDiff(original: string, modified: string): string {
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');

    let diff = '';
    const maxLines = Math.max(originalLines.length, modifiedLines.length);

    for (let i = 0; i < maxLines; i++) {
      const origLine = originalLines[i] || '';
      const modLine = modifiedLines[i] || '';

      if (origLine !== modLine) {
        if (origLine) diff += `-${origLine}\n`;
        if (modLine) diff += `+${modLine}\n`;
      } else if (origLine) {
        diff += ` ${origLine}\n`;
      }
    }

    return diff.trim();
  }

  private applyPatternBasedFix(issue: Issue, code: string): { fixedCode: string; diff: string } | null {
    console.log('applyPatternBasedFix checking patterns for:', {
      title: issue.title.toLowerCase(),
      category: issue.category.toLowerCase()
    });

    // Pattern 1: Error handling for async functions and render calls
    if (issue.title.toLowerCase().includes('error') && issue.title.toLowerCase().includes('handling')) {
      console.log('Matched error handling pattern');
      return this.applyErrorHandlingPattern(code);
    }

    // Pattern 2: Type safety improvements
    if (issue.title.toLowerCase().includes('type') && issue.title.toLowerCase().includes('safety')) {
      console.log('Matched type safety pattern');
      return this.applyTypeSafetyPattern(code);
    }

    // Pattern 3: Security improvements for DOM access
    if (issue.title.toLowerCase().includes('security') ||
        issue.title.toLowerCase().includes('dom') ||
        issue.category.toLowerCase().includes('security') ||
        issue.title.toLowerCase().includes('practice')) {
      console.log('Matched security pattern');
      return this.applySecurityPattern(code);
    }

    console.log('No pattern matched');
    return null; // No pattern matched
  }

  private applyErrorHandlingPattern(code: string): { fixedCode: string; diff: string } | null {
    const lines = code.split('\n');
    const modifiedLines = [...lines];
    let hasChanges = false;

    // Find async functions that don't have try-catch
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Look for async function declarations
      if (line.includes('async function') || (line.includes('const') && line.includes('= async'))) {
        // Check if this function already has try-catch (look ahead)
        let hasTryCatch = false;
        for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
          if (lines[j].trim().startsWith('try {')) {
            hasTryCatch = true;
            break;
          }
          // Stop looking if we hit another function or end of function
          if (lines[j].includes('function') || (lines[j].includes('const') && lines[j].includes('=') && lines[j].includes('=>'))) {
            break;
          }
        }

        if (!hasTryCatch) {
          // Find the function body start
          let braceCount = 0;
          let bodyStart = -1;
          for (let j = i; j < lines.length; j++) {
            if (lines[j].includes('{')) {
              braceCount++;
              if (braceCount === 1) {
                bodyStart = j;
                break;
              }
            }
          }

          if (bodyStart !== -1) {
            // Find the function body end
            braceCount = 0;
            let bodyEnd = -1;
            for (let j = bodyStart; j < lines.length; j++) {
              if (lines[j].includes('{')) braceCount++;
              if (lines[j].includes('}')) braceCount--;
              if (braceCount === 0) {
                bodyEnd = j;
                break;
              }
            }

            if (bodyEnd !== -1 && bodyEnd > bodyStart) {
              // Extract function body
              const bodyLines = lines.slice(bodyStart + 1, bodyEnd);

              // Create try-catch wrapped version
              const wrappedBody = `    try {\n${bodyLines.map(line => `  ${line}`).join('\n')}\n    } catch (error) {\n      console.error('Error:', error);\n    }`;

              // Replace the function body
              modifiedLines.splice(bodyStart + 1, bodyEnd - bodyStart - 1, ...wrappedBody.split('\n'));
              hasChanges = true;
              break; // Only fix one function at a time
            }
          }
        }
      }
    }

    // Also check for ReactDOM.render or createRoot calls that should be wrapped in try-catch
    if (!hasChanges) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if ((line.includes('ReactDOM.render') || line.includes('createRoot')) && !line.includes('try {')) {
          // Look for the complete render call
          let renderStart = i;
          let renderEnd = i;
          let parenCount = 0;
          let braceCount = 0;

          // Find the end of the render call
          for (let j = i; j < lines.length; j++) {
            const currentLine = lines[j];
            for (const char of currentLine) {
              if (char === '(') parenCount++;
              if (char === ')') parenCount--;
              if (char === '{') braceCount++;
              if (char === '}') braceCount--;
            }
            renderEnd = j;
            if (parenCount === 0 && braceCount === 0 && currentLine.includes(';')) {
              break;
            }
          }

          if (renderEnd > renderStart) {
            // Extract the render call
            const renderLines = lines.slice(renderStart, renderEnd + 1);
            const renderCode = renderLines.join('\n');

            // Wrap in try-catch
            const wrappedRender = `try {\n  ${renderCode}\n} catch (error) {\n  console.error('Failed to render app:', error);\n}`;

            // Replace the render call
            modifiedLines.splice(renderStart, renderEnd - renderStart + 1, ...wrappedRender.split('\n'));
            hasChanges = true;
            break;
          }
        }
      }
    }

    if (hasChanges) {
      const fixedCode = modifiedLines.join('\n');
      const diff = this.generateSimpleDiff(code, fixedCode);
      return { fixedCode, diff };
    }

    return null;
  }

  private applyTypeSafetyPattern(code: string): { fixedCode: string; diff: string } | null {
    const lines = code.split('\n');
    const modifiedLines = [...lines];
    let hasChanges = false;

    // Find function parameters with 'any' type
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Look for function parameters
      if (line.includes('function') || (line.includes('const') && line.includes('='))) {
        // Check for 'any' parameters
        const anyParamMatch = line.match(/(\w+)\s*:\s*any/g);
        if (anyParamMatch) {
          // Replace 'any' with more specific types based on context
          let modifiedLine = line;
          modifiedLine = modifiedLine.replace(/(\w+)\s*:\s*any/g, (_, paramName) => {
            // Simple heuristic: if parameter name suggests type
            if (paramName.toLowerCase().includes('id') || paramName.toLowerCase().includes('index')) {
              return `${paramName}: number`;
            }
            if (paramName.toLowerCase().includes('name') || paramName.toLowerCase().includes('text')) {
              return `${paramName}: string`;
            }
            if (paramName.toLowerCase().includes('data') || paramName.toLowerCase().includes('config')) {
              return `${paramName}: object`;
            }
            return `${paramName}: unknown`; // Better than any
          });

          if (modifiedLine !== line) {
            modifiedLines[i] = modifiedLine;
            hasChanges = true;
          }
        }
      }
    }

    if (hasChanges) {
      const fixedCode = modifiedLines.join('\n');
      const diff = this.generateSimpleDiff(code, fixedCode);
      return { fixedCode, diff };
    }

    return null;
  }

  private applySecurityPattern(code: string): { fixedCode: string; diff: string } | null {
    const lines = code.split('\n');
    const modifiedLines = [...lines];
    let hasChanges = false;

    // Look for document.getElementById calls that should be made safer
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.includes('document.getElementById') && !line.includes('if (!') && !line.includes('throw new Error')) {
        // Find the variable assignment
        const match = line.match(/(\w+)\s*=\s*document\.getElementById\(['"]([^'"]+)['"]\)/);
        if (match) {
          const [, varName, elementId] = match;

          // Create safer version with null check
          const saferLines = [
            `const ${varName}Element = document.getElementById('${elementId}');`,
            `if (!${varName}Element) {`,
            `  throw new Error('${elementId} element not found');`,
            `}`,
            `const ${varName} = ${varName}Element;`
          ];

          // Replace the single line with safer version
          modifiedLines.splice(i, 1, ...saferLines);
          hasChanges = true;
          break; // Only fix one instance at a time
        }
      }
    }

    if (hasChanges) {
      const fixedCode = modifiedLines.join('\n');
      const diff = this.generateSimpleDiff(code, fixedCode);
      return { fixedCode, diff };
    }

    return null;
  }

  private applySuggestionDiff(code: string, suggestionDiff: string): { fixedCode: string; diff: string } | null {
    console.log('applySuggestionDiff called with diff preview:', suggestionDiff.substring(0, 200));

    // Try to parse and apply the suggestion diff
    // Handle different diff formats from mock data

    const diffLines = suggestionDiff.split('\n');
    let fixedCode = code;
    let hasChanges = false;

    // Look for simple patterns like:
    // - old line
    // + new line

    for (let i = 0; i < diffLines.length - 1; i++) {
      const currentLine = diffLines[i];
      const nextLine = diffLines[i + 1];

      if (currentLine.startsWith('-') && nextLine.startsWith('+')) {
        const oldContent = currentLine.substring(1).trim();
        const newContent = nextLine.substring(1).trim();

        console.log('Found diff pair:', { old: oldContent.substring(0, 50), new: newContent.substring(0, 50) });

        // Try to find and replace in the code
        if (fixedCode.includes(oldContent)) {
          fixedCode = fixedCode.replace(oldContent, newContent);
          hasChanges = true;
          console.log('Applied diff replacement');
        } else {
          // Try a more flexible match - look for partial matches
          const oldLines = oldContent.split('\n');

          // If the old content spans multiple lines, try to find the block
          if (oldLines.length > 1) {
            // Look for the first line of the old content
            const firstOldLine = oldLines[0].trim();
            const lastOldLine = oldLines[oldLines.length - 1].trim();

            const startIndex = fixedCode.indexOf(firstOldLine);
            if (startIndex !== -1) {
              const endIndex = fixedCode.indexOf(lastOldLine, startIndex + firstOldLine.length);
              if (endIndex !== -1) {
                // Extract the block and replace it
                const blockEnd = endIndex + lastOldLine.length;
                fixedCode = fixedCode.substring(0, startIndex) + newContent + fixedCode.substring(blockEnd);
                hasChanges = true;
                console.log('Applied block diff replacement');
              }
            }
          }
        }
      }
    }

    // If no changes were made with the simple pattern, try to extract the complete fixed code
    // from the diff (some diffs show the complete desired result)
    if (!hasChanges) {
      console.log('No simple replacements found, trying to extract complete code from diff');
      // Check if the diff contains a complete code block (not just individual line changes)
      const codeLines = diffLines.filter(line => !line.startsWith('-') && !line.startsWith('+') && !line.startsWith('+++') && !line.startsWith('---'));
      if (codeLines.length > 3) { // If there are multiple lines of actual code
        const extractedCode = codeLines.join('\n').trim();
        if (extractedCode.length > 50 && extractedCode !== code) { // Reasonable code length check
          console.log('Extracted complete code from diff, length:', extractedCode.length);
          fixedCode = extractedCode;
          hasChanges = true;
        } else {
          console.log('Extracted code too short or identical to original');
        }
      } else {
        console.log('Not enough code lines in diff for extraction');
      }
    }

    if (hasChanges) {
      const diff = this.generateSimpleDiff(code, fixedCode);
      console.log('Generated final diff, length:', diff.length);
      return { fixedCode, diff };
    }

    console.log('Could not apply suggestion diff, returning as-is');
    // If we can't apply the diff, return it as-is for display
    return {
      fixedCode: code,
      diff: suggestionDiff
    };
  }

  generateSuggestions(): string[] {
    const suggestions: string[] = [];

    if (this.context.analysisResults) {
      const hasIssues = this.context.analysisResults.some(r => r.issues.length > 0);
      const hasLowScore = this.context.analysisResults.some(r => r.score < 70);

      if (hasIssues) {
        suggestions.push('Review analysis issues');
      }

      if (hasLowScore) {
        suggestions.push('Focus on high-priority improvements');
      }

      if (this.context.analysisResults.some(r => r.type === 'testing' && r.score < 80)) {
        suggestions.push('Add more comprehensive tests');
      }

      if (this.context.analysisResults.some(r => r.type === 'documentation' && r.score < 70)) {
        suggestions.push('Improve code documentation');
      }
    }

    if (this.context.language === 'typescript') {
      suggestions.push('Consider using stricter TypeScript settings');
    }

    if (this.context.language === 'javascript') {
      suggestions.push('Consider migrating to TypeScript');
    }

    // Add general suggestions
    suggestions.push('Explain this code to me');
    suggestions.push('Suggest improvements');
    suggestions.push('Help me write tests');

    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }
}