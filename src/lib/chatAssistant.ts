import { GeminiService } from './geminiApi';
import { AnalysisResult } from './analysis/types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
   codeSuggestion?: {
     description: string;
     originalSnippet: string;
     suggestedSnippet: string;
     applyCommand: string;
     type: 'snippet' | 'improvement';
   };
};

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

  // Parse markdown responses from AI to extract code suggestions
  parseMarkdownResponse(markdownText: string): { description: string; originalSnippet: string; suggestedSnippet: string; applyCommand: string } | null {
    try {
      // Extract code blocks from markdown
      const codeBlockRegex = /```(?:\w+)?\n?([\s\S]*?)```/g;
      const matches = [...markdownText.matchAll(codeBlockRegex)];

      if (matches.length >= 1) {
        // Extract description (everything before first code block)
        const firstCodeBlockIndex = markdownText.indexOf('```');
        const description = markdownText.substring(0, firstCodeBlockIndex).trim();

        // Clean up description
        const cleanDescription = description
          .replace(/^[*]*\s*/, '') // Remove leading asterisks
          .replace(/\s*[*]*$/, '') // Remove trailing asterisks
          .replace(/\*\*/g, '') // Remove bold markers
          .trim();

        if (matches.length >= 2) {
          // Has both before and after code
          return {
            description: cleanDescription || 'Code improvement suggestion',
            originalSnippet: matches[0][1].trim(),
            suggestedSnippet: matches[1][1].trim(),
            applyCommand: `replace:${matches[0][1].trim()}:${matches[1][1].trim()}`
          };
        } else {
          // Only one code block - assume it's the improved version
          return {
            description: cleanDescription || 'Code improvement suggestion',
            originalSnippet: this.context.code?.substring(0, 100) + '...' || '// Original code',
            suggestedSnippet: matches[0][1].trim(),
            applyCommand: `replace:${this.context.code?.substring(0, 100) + '...' || ''}:${matches[0][1].trim()}`
          };
        }
      }
    } catch (error) {
      console.warn('Failed to parse markdown response:', error);
    }
    return null;
  }

  // Generate code improvement suggestions for demo
  async generateCodeSuggestion(userRequest: string, code: string): Promise<{ description: string; originalSnippet: string; suggestedSnippet: string; applyCommand: string } | null> {
    const request = userRequest.toLowerCase();

    // Expanded pattern matching for more improvement types
    const patterns = {
      errorHandling: ['error handling', 'add try catch', 'catch errors', 'handle errors'],
      async: ['async', 'make async', 'async function', 'await', 'asynchronous'],
      types: ['types', 'typescript', 'add types', 'type annotations', 'typing'],
      performance: ['optimize', 'performance', 'speed up', 'faster', 'efficient'],
      security: ['security', 'secure', 'sanitize', 'validate', 'safe'],
      readability: ['readable', 'clean', 'refactor', 'improve', 'better', 'suggestion', 'enhance'],
      documentation: ['docs', 'document', 'comments', 'javadoc', 'explain'],
      snippets: ['snippet', 'boilerplate', 'example', 'pattern', 'template', 'code example']
    };

    // Check for snippet/boilerplate requests
    if (patterns.snippets.some(p => request.includes(p))) {
      // Generate AI-powered code snippets based on the request
      const snippetResult = await this.generateAISnippet(userRequest, code);
      if (snippetResult) {
        return snippetResult;
      }
      // If AI fails, fallback should still work, but ensure we return something
      return this.generateFallbackSnippet(userRequest);
    }

    // Check for error handling improvements
    if (patterns.errorHandling.some(p => request.includes(p))) {
      const functionMatch = code.match(/function\s+(\w+)\s*\([^)]*\)\s*{[^}]*}/s);
      if (functionMatch) {
        const functionCode = functionMatch[0];
        const functionName = functionMatch[1];

        const improvedCode = functionCode.replace(
          /function\s+(\w+)\s*\([^)]*\)\s*{([^}]*)}/s,
          (match, name, body) => {
            const indentedBody = body.trim().split('\n').map(line => '    ' + line.trim()).join('\n');
            return `async function ${name}() {\n  try {\n${indentedBody}\n  } catch (error) {\n    console.error('Error in ${name}:', error);\n    throw error;\n  }\n}`;
          }
        );

        return {
          description: `Add error handling to ${functionName} function`,
          originalSnippet: functionCode,
          suggestedSnippet: improvedCode,
          applyCommand: `replace:${functionCode}:${improvedCode}`
        };
      }
    }

    // Check for async improvements
    if (patterns.async.some(p => request.includes(p))) {
      const functionMatch = code.match(/function\s+(\w+)\s*\([^)]*\)\s*{[^}]*return[^}]*}/s);
      if (functionMatch) {
        const functionCode = functionMatch[0];
        const improvedCode = functionCode.replace(
          /function\s+(\w+)\s*\(/,
          'async function $1('
        );

        return {
          description: 'Make function async',
          originalSnippet: functionCode,
          suggestedSnippet: improvedCode,
          applyCommand: `replace:${functionCode}:${improvedCode}`
        };
      }
    }

    // Check for type improvements
    if (patterns.types.some(p => request.includes(p))) {
      const functionMatch = code.match(/function\s+(\w+)\s*\(([^)]*)\)/);
      if (functionMatch) {
        const functionCode = functionMatch[0];
        const params = functionMatch[2];

        let improvedCode = functionCode;
        if (params.trim()) {
          improvedCode = functionCode.replace(
            /\(([^)]*)\)/,
            '($1: any)'
          );
        }
        improvedCode = improvedCode.replace(
          /function\s+(\w+)/,
          'function $1'
        ) + ': any';

        return {
          description: 'Add TypeScript types',
          originalSnippet: functionCode,
          suggestedSnippet: improvedCode,
          applyCommand: `replace:${functionCode}:${improvedCode}`
        };
      }
    }

    // For general improvement requests or when no specific pattern matches,
    // generate a general code improvement based on the current code
    if (patterns.readability.some(p => request.includes(p)) ||
        request.includes('improve') || request.includes('better') ||
        request.includes('enhance') || request.includes('suggestion')) {

      // Try to find a function to improve
      const functionMatch = code.match(/function\s+(\w+)\s*\([^)]*\)\s*{[^}]*}/s);
      if (functionMatch) {
        const functionCode = functionMatch[0];
        const functionName = functionMatch[1];

        // Add JSDoc comments if not present
        if (!functionCode.includes('/**')) {
          const improvedCode = `/**
 * ${functionName} function - improved with documentation
 */
${functionCode}`;

          return {
            description: `Add documentation to ${functionName} function`,
            originalSnippet: functionCode,
            suggestedSnippet: improvedCode,
            applyCommand: `replace:${functionCode}:${improvedCode}`
          };
        }

        // If already has docs, suggest adding error handling
        if (!functionCode.includes('try') && !functionCode.includes('catch')) {
          const improvedCode = functionCode.replace(
            /function\s+(\w+)\s*\([^)]*\)\s*{([^}]*)}/s,
            (match, name, body) => {
              const indentedBody = body.trim().split('\n').map(line => '  ' + line.trim()).join('\n');
              return `function ${name}() {\n  try {\n${indentedBody}\n  } catch (error) {\n    console.error('Error in ${name}:', error);\n    throw error;\n  }\n}`;
            }
          );

          return {
            description: `Add error handling to ${functionName} function`,
            originalSnippet: functionCode,
            suggestedSnippet: improvedCode,
            applyCommand: `replace:${functionCode}:${improvedCode}`
          };
        }
      }

      // If no function found, try to improve variable declarations or general code
      if (code.includes('const') || code.includes('let')) {
        // Suggest using const over let where appropriate
        let improvedCode = code;

        // Simple heuristic: suggest const for variables that appear to be constants
        improvedCode = improvedCode.replace(/\blet\s+(\w+)\s*=\s*([^;]+);/g, (match, varName, value) => {
          // If it's a primitive value or array/object literal, suggest const
          if (/^['"`\[\{]/.test(value.trim()) || /^\d/.test(value.trim()) || value.trim() === 'true' || value.trim() === 'false' || value.trim() === 'null' || value.trim() === 'undefined') {
            return `const ${varName} = ${value};`;
          }
          return match; // Keep as let for complex expressions
        });

        if (improvedCode !== code) {
          return {
            description: 'Use const instead of let for variables that are not reassigned',
            originalSnippet: code.substring(0, 200) + '...',
            suggestedSnippet: improvedCode.substring(0, 200) + '...',
            applyCommand: `replace:${code}:${improvedCode}`
          };
        }
      }

      // Look for console.log statements to suggest removing them
      if (code.includes('console.log')) {
        const improvedCode = code.replace(/^\s*console\.log\([^)]+\);\s*$/gm, '');

        if (improvedCode !== code) {
          return {
            description: 'Remove console.log statements for production code',
            originalSnippet: code.match(/^\s*console\.log\([^)]+\);\s*$/gm)?.[0] || 'console.log(...);',
            suggestedSnippet: '',
            applyCommand: `replace:${code.match(/^\s*console\.log\([^)]+\);\s*$/gm)?.[0] || 'console.log(...);'}:`
          };
        }
      }

      // Look for missing return type annotations in TypeScript
      if (code.includes('function') && !code.includes(': ')) {
        const functionMatch = code.match(/function\s+(\w+)\s*\([^)]*\)/);
        if (functionMatch) {
          const functionDecl = functionMatch[0];
          const improvedCode = code.replace(functionDecl, `${functionDecl}: void`);

          return {
            description: 'Add return type annotation to function',
            originalSnippet: functionDecl,
            suggestedSnippet: `${functionDecl}: void`,
            applyCommand: `replace:${functionDecl}:${functionDecl}: void`
          };
        }
      }
    }

    // For other improvement types, return null to let AI handle it
    // This will be caught by the markdown parser
    return null;
  }

  async generateResponse(userMessage: string): Promise<string | { type: 'code_suggestion'; data: { description: string; originalSnippet: string; suggestedSnippet: string; applyCommand: string; type: 'snippet' | 'improvement' } }> {
    // Add user message to history
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    this.addMessage(userMsg);

    // Check if this is a code improvement request
    const codeRequest = userMessage.toLowerCase();
    if (codeRequest.includes('improve') || codeRequest.includes('fix') ||
        codeRequest.includes('error handling') || codeRequest.includes('async') ||
        codeRequest.includes('types') || codeRequest.includes('typescript') ||
        codeRequest.includes('optimize') || codeRequest.includes('performance') ||
        codeRequest.includes('security') || codeRequest.includes('readable') ||
        codeRequest.includes('clean') || codeRequest.includes('refactor') ||
        codeRequest.includes('docs') || codeRequest.includes('document') ||
        codeRequest.includes('comments') || codeRequest.includes('better') ||
        codeRequest.includes('suggestion') || codeRequest.includes('enhance') ||
        codeRequest.includes('snippet') || codeRequest.includes('boilerplate') ||
        codeRequest.includes('example') || codeRequest.includes('pattern')) {

      // Try pattern matching first (handles snippets and specific improvement types)
      const patternSuggestion = await this.generateCodeSuggestion(userMessage, this.context.code || '');
      if (patternSuggestion) {
        return {
          type: 'code_suggestion',
          data: patternSuggestion
        };
      }

       // For general improvement requests, try to generate a suggestion from current code
       if (codeRequest.includes('improve') || codeRequest.includes('better') ||
           codeRequest.includes('suggestion') || codeRequest.includes('enhance') ||
           codeRequest.includes('fix') || codeRequest.includes('error') ||
           codeRequest.includes('optimize') || codeRequest.includes('refactor') ||
           codeRequest.includes('clean') || codeRequest.includes('make') ||
           codeRequest.includes('resolve') || codeRequest.includes('address') ||
           codeRequest.includes('performance') || codeRequest.includes('speed') ||
           codeRequest.includes('efficient') || codeRequest.includes('faster')) {

        // First check if we have analysis results to suggest from
        if (this.context.analysisResults && this.context.analysisResults.length > 0) {
          // Try to generate a specific suggestion based on analysis results
          const analysisSuggestion = this.generateSuggestionFromAnalysis(userMessage);
          if (analysisSuggestion) {
            return {
              type: 'code_suggestion',
              data: analysisSuggestion
            };
          }
          return "I can see you've run code analysis! Check the analysis results above - there are specific suggestions you can apply. Would you like me to help you implement any of those improvements?";
        }

        // If no analysis results, try AI-powered improvement generation first
        const aiImprovement = await this.generateAIImprovement(userMessage, this.context.code || '');
        if (aiImprovement) {
          return {
            type: 'code_suggestion',
            data: aiImprovement
          };
        }

        // Fall back to pattern-based improvements
        const generalSuggestion = this.generateGeneralImprovement(this.context.code || '');
        if (generalSuggestion) {
          return {
            type: 'code_suggestion',
            data: generalSuggestion
          };
        }

        // If we can't generate a specific suggestion, create a generic improvement suggestion
        // This ensures improvement requests always get code suggestion UI instead of plain text
        const code = this.context.code || '';
        if (code.trim()) {
          return {
            type: 'code_suggestion',
            data: {
              description: 'General code improvement suggestions',
              originalSnippet: code.substring(0, 100) + (code.length > 100 ? '...' : ''),
              suggestedSnippet: `// TODO: Consider these improvements:\n// 1. Add proper error handling\n// 2. Add JSDoc comments\n// 3. Use const/let appropriately\n// 4. Consider TypeScript types\n${code}`,
              applyCommand: `replace:${code.substring(0, 100) + (code.length > 100 ? '...' : '')}: // TODO: Consider these improvements:\n// 1. Add proper error handling\n// 2. Add JSDoc comments\n// 3. Use const/let appropriately\n// 4. Consider TypeScript types\n${code}`,
              type: 'improvement'
            }
          };
        }

        // Only fall through to AI processing if there's no code context at all
      }

      // If no pattern match, this will fall through to AI processing below
      // The AI response will be parsed for markdown code blocks
    }

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
      const fallbackMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fallbackResponse,
        timestamp: new Date()
      };
      this.addMessage(fallbackMsg);

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

    // Note: Improvement requests are now handled above in generateResponse
    // This fallback should not be reached for improvement requests

    return "I'm here to help you with your code! I can explain concepts, suggest improvements, help fix bugs, or answer questions about your codebase. What would you like to work on? Feel free to ask me anything about programming, best practices, or your specific code.";
  }

  // Generate suggestions based on analysis results
  private generateSuggestionFromAnalysis(userMessage: string): { description: string; originalSnippet: string; suggestedSnippet: string; applyCommand: string; type: 'snippet' | 'improvement' } | null {
    if (!this.context.analysisResults || this.context.analysisResults.length === 0) {
      return null;
    }

    const request = userMessage.toLowerCase();

    // Look for issues that match the user's request
    for (const analysis of this.context.analysisResults) {
      for (const issue of analysis.issues) {
        const issueText = (issue.title + ' ' + issue.description).toLowerCase();

        // Match user request with issue type
        if ((request.includes('error') || request.includes('fix')) && issue.category.toLowerCase().includes('error')) {
          return this.generateFixForIssue(issue, this.context.code || '');
        }
        if ((request.includes('security') || request.includes('secure')) && issue.category.toLowerCase().includes('security')) {
          return this.generateFixForIssue(issue, this.context.code || '');
        }
        if ((request.includes('performance') || request.includes('optimize')) && issue.category.toLowerCase().includes('performance')) {
          return this.generateFixForIssue(issue, this.context.code || '');
        }
        if ((request.includes('type') || request.includes('typescript')) && issue.category.toLowerCase().includes('type')) {
          return this.generateFixForIssue(issue, this.context.code || '');
        }
      }
    }

    // If no specific match, return the first high-priority issue
    const highPriorityIssues = this.context.analysisResults
      .flatMap(r => r.issues)
      .filter(issue => issue.severity === 'high')
      .sort((a, b) => b.severity.localeCompare(a.severity));

    if (highPriorityIssues.length > 0) {
      return this.generateFixForIssue(highPriorityIssues[0], this.context.code || '');
    }

    return null;
  }

  private generateFixForIssue(issue: Issue, code: string): { description: string; originalSnippet: string; suggestedSnippet: string; applyCommand: string; type: 'snippet' | 'improvement' } | null {
    // Simple fix generation based on issue type
    const issueTitle = issue.title.toLowerCase();

    if (issueTitle.includes('error handling') || issueTitle.includes('try catch')) {
      const result = this.applyErrorHandlingPattern(code);
      if (result) {
        return {
          description: `Add error handling to improve code reliability`,
          originalSnippet: code,
          suggestedSnippet: result.fixedCode,
          applyCommand: `replace:${code}:${result.fixedCode}`,
          type: 'improvement'
        };
      }
    }

    if (issueTitle.includes('type safety') || issueTitle.includes('typescript')) {
      const result = this.applyTypeSafetyPattern(code);
      if (result) {
        return {
          description: `Improve type safety in the code`,
          originalSnippet: code,
          suggestedSnippet: result.fixedCode,
          applyCommand: `replace:${code}:${result.fixedCode}`,
          type: 'improvement'
        };
      }
    }

    if (issueTitle.includes('security') || issueTitle.includes('sanitize')) {
      const result = this.applySecurityPattern(code);
      if (result) {
        return {
          description: `Address security issue: ${issue.title}`,
          originalSnippet: code,
          suggestedSnippet: result.fixedCode,
          applyCommand: `replace:${code}:${result.fixedCode}`,
          type: 'improvement'
        };
      }
    }

    // For other issues, provide a generic suggestion
        return {
          description: `Address ${issue.category} issue: ${issue.title}`,
          originalSnippet: code.substring(0, 100) + '...',
          suggestedSnippet: `// TODO: ${issue.description}\n${code}`,
          applyCommand: `replace:${code.substring(0, 100) + '...'}: // TODO: ${issue.description}\n${code}`,
          type: 'improvement' as const
        };
  }

  // Generate a general code improvement without requiring full analysis
  private generateGeneralImprovement(code: string): { description: string; originalSnippet: string; suggestedSnippet: string; applyCommand: string; type: 'snippet' | 'improvement' } | null {
    if (!code || code.trim().length === 0) {
      return null;
    }

    // Look for functions that could use improvements
    const functionMatches = code.match(/function\s+(\w+)\s*\([^)]*\)\s*{[^}]*}/g);
    if (functionMatches) {
      for (const funcMatch of functionMatches) {
        const funcNameMatch = funcMatch.match(/function\s+(\w+)/);
        if (funcNameMatch) {
          const funcName = funcNameMatch[1];

          // Check if function has JSDoc comments
          const funcStart = code.indexOf(funcMatch);
          const beforeFunc = code.substring(Math.max(0, funcStart - 200), funcStart);
          const hasJSDoc = beforeFunc.includes('/**') || beforeFunc.includes('/*');

          if (!hasJSDoc) {
            // Add JSDoc comment
            const improvedFunc = `/**
 * ${funcName} function
 */
${funcMatch}`;

            return {
              description: `Add documentation to the ${funcName} function`,
              originalSnippet: funcMatch,
              suggestedSnippet: improvedFunc,
              applyCommand: `replace:${funcMatch}:${improvedFunc}`,
              type: 'improvement'
            };
          }

          // Check if function has error handling
          if (!funcMatch.includes('try') && !funcMatch.includes('catch')) {
            // Add basic error handling
            const improvedFunc = funcMatch.replace(
              /function\s+(\w+)\s*\([^)]*\)\s*{([^}]*)}/s,
              (match, name, body) => {
                const indentedBody = body.trim().split('\n').map((line: string) => '  ' + line.trim()).join('\n');
                return `function ${name}() {\n  try {\n${indentedBody}\n  } catch (error) {\n    console.error('Error in ${name}:', error);\n    throw error;\n  }\n}`;
              }
            );

            return {
              description: `Add error handling to the ${funcName} function`,
              originalSnippet: funcMatch,
              suggestedSnippet: improvedFunc,
              applyCommand: `replace:${funcMatch}:${improvedFunc}`,
              type: 'improvement'
            };
          }
        }
      }
    }

    // Look for console.log statements
    const consoleMatches = code.match(/console\.log\([^)]+\);/g);
    if (consoleMatches) {
      const firstConsole = consoleMatches[0];
      return {
        description: 'Remove console.log statement for production code',
        originalSnippet: firstConsole,
        suggestedSnippet: `// ${firstConsole} // Removed for production`,
        applyCommand: `replace:${firstConsole}:// ${firstConsole} // Removed for production`,
        type: 'improvement'
      };
    }

    // Look for let declarations that could be const
    const letMatches = code.match(/let\s+(\w+)\s*=\s*[^;]+;/g);
    if (letMatches) {
      for (const letMatch of letMatches) {
        const varMatch = letMatch.match(/let\s+(\w+)\s*=\s*([^;]+);/);
        if (varMatch) {
          const varName = varMatch[1];
          const value = varMatch[2].trim();

          // Simple heuristic: if it's a primitive or literal, suggest const
          if (/^['"`\[\{]/.test(value) || /^\d/.test(value) ||
              value === 'true' || value === 'false' || value === 'null' || value === 'undefined') {

            const constVersion = letMatch.replace('let', 'const');
            return {
              description: `Use const instead of let for variable ${varName}`,
              originalSnippet: letMatch,
              suggestedSnippet: constVersion,
              applyCommand: `replace:${letMatch}:${constVersion}`,
              type: 'improvement'
            };
          }
        }
      }
    }

    // Look for functions without return type annotations (TypeScript)
    const tsFunctionMatches = code.match(/function\s+(\w+)\s*\([^)]*\)\s*{/g);
    if (tsFunctionMatches) {
      for (const funcMatch of tsFunctionMatches) {
        if (!funcMatch.includes(':')) {
          const funcNameMatch = funcMatch.match(/function\s+(\w+)/);
          if (funcNameMatch) {
            const funcName = funcNameMatch[1];
            const improvedFunc = funcMatch.replace(
              /function\s+(\w+)\s*\(/,
              `function ${funcName}(`
            ) + ': void';

            return {
              description: `Add return type annotation to ${funcName} function`,
              originalSnippet: funcMatch,
              suggestedSnippet: improvedFunc,
              applyCommand: `replace:${funcMatch}:${improvedFunc}`,
              type: 'improvement'
            };
          }
        }
      }
    }

    // If no specific improvements found, suggest adding a comment
    if (code.length > 50) {
      const firstLines = code.split('\n').slice(0, 3).join('\n');
      const improvedCode = `// Code improvement: Add proper documentation\n${firstLines}`;

      return {
        description: 'Add documentation comment to improve code readability',
        originalSnippet: firstLines,
        suggestedSnippet: improvedCode,
        applyCommand: `replace:${firstLines}:${improvedCode}`,
        type: 'improvement'
      };
    }

    return null;
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
          const renderStart = i;
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

  // Generate AI-powered code snippets using Gemini API
  private async generateAISnippet(userRequest: string, code: string): Promise<{ description: string; originalSnippet: string; suggestedSnippet: string; applyCommand: string; type: 'snippet' | 'improvement' } | null> {
    try {
      const prompt = this.buildSnippetPrompt(userRequest, code);
      // Use higher token limit for snippet generation to avoid truncation
      const aiResponse = await this.geminiService.generateCompletion(prompt, { maxTokens: 8192 });

      // First, try to parse the AI response using the structured format
      const parsedResult = this.parseSnippetResponse(aiResponse, userRequest);
      if (parsedResult) {
        console.log('Successfully parsed AI snippet response');
        return { ...parsedResult, type: 'snippet' };
      }

      // If structured parsing failed, try more aggressive code extraction
      console.warn('Structured parsing failed, trying aggressive extraction');

      // Look for any code blocks, even if not properly formatted
      const codeBlockPatterns = [
        /```[\w]*\n?([\s\S]*?)```/g,  // Standard markdown code blocks
        /```\n([\s\S]*?)```/g,         // Code blocks without language
        /`([\s\S]*?)`/g                // Inline code (as fallback)
      ];

      for (const pattern of codeBlockPatterns) {
        const matches = [...aiResponse.matchAll(pattern)];
        for (const match of matches) {
          if (match[1] && match[1].trim().length > 5) { // At least 5 chars of code
            const snippet = match[1].trim();
            // Basic validation - check if it looks like code
            if (this.isValidCodeSnippet(snippet)) {
              console.log('Found valid code via aggressive extraction');
              const placeholder = this.generateSnippetPlaceholder(userRequest);
              return {
                description: `AI-generated code snippet for: ${userRequest}`,
                originalSnippet: placeholder,
                suggestedSnippet: snippet,
                applyCommand: `replace:${placeholder}:${snippet}`,
                type: 'snippet'
              };
            }
          }
        }
      }

      // If no code blocks found, check if the entire response looks like code
      if (this.isValidCodeSnippet(aiResponse)) {
        console.log('Using entire AI response as code');
        const placeholder = this.generateSnippetPlaceholder(userRequest);
        return {
          description: `AI-generated code for: ${userRequest}`,
          originalSnippet: placeholder,
          suggestedSnippet: aiResponse.trim(),
          applyCommand: `replace:${placeholder}:${aiResponse.trim()}`,
          type: 'snippet'
        };
      }

      // As a last resort, try to extract any programming constructs
      const codeConstructs = aiResponse.match(/(?:function|class|const|let|var|if|for|while)\s+[\s\S]+?(?:;|$|})(?:\n|$)/g);
      if (codeConstructs && codeConstructs.length > 0) {
        const extractedCode = codeConstructs.join('\n');
        if (extractedCode.length > 10) {
          console.log('Extracted code constructs from AI response');
          const placeholder = this.generateSnippetPlaceholder(userRequest);
          return {
            description: `Extracted code from AI response for: ${userRequest}`,
            originalSnippet: placeholder,
            suggestedSnippet: extractedCode,
            applyCommand: `replace:${placeholder}:${extractedCode}`,
            type: 'snippet'
          };
        }
      }

      // Only fall back to dummy data if all AI extraction attempts fail
      console.warn('All AI extraction attempts failed, using fallback templates as last resort');
      return this.generateFallbackSnippet(userRequest);

    } catch (error) {
      console.warn('AI snippet generation failed, using fallback templates:', error);
      // Only use dummy data if AI completely fails
      return this.generateFallbackSnippet(userRequest);
    }
  }

  private buildSnippetPrompt(userRequest: string, code: string): string {
    const language = this.context.language || 'javascript';
    const currentCode = code || 'No code context available';

    return `You are an expert ${language} developer. Generate a practical code snippet for: "${userRequest}"

Context: ${currentCode.substring(0, 200)}${currentCode.length > 200 ? '...' : ''}

Requirements:
1. Provide COMPLETE, RUNNABLE code in markdown code blocks
2. Include JSDoc comments and error handling
3. Make it production-ready and concise

Format:
DESCRIPTION: Brief description

CODE:
\`\`\`${language}
// Complete working code with examples
\`\`\`

Example for "add two numbers":
DESCRIPTION: Function to add two numbers with validation

CODE:
\`\`\`javascript
/**
 * Adds two numbers with input validation
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} The sum
 */
function addNumbers(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('Both arguments must be numbers');
  }
  return a + b;
}

// Usage:
console.log(addNumbers(5, 3)); // 8
\`\`\`

Provide actual code, not descriptions.`;
  }

  private isValidCodeSnippet(text: string): boolean {
    const codeIndicators = [
      /\b(function|class|const|let|var|if|for|while|return|export|import)\b/,
      /[{}();]/,
      /\b(console|document|window|process|require|module)\b/,
      /[=+*/<>!&|-]{1,2}/
    ];

    const hasCodeIndicators = codeIndicators.some(pattern => pattern.test(text));
    const hasEnoughContent = text.trim().length > 10;
    const notJustText = !/^[a-zA-Z\s,.!?]+$/.test(text.trim()); // Not just plain English text

    return hasCodeIndicators && hasEnoughContent && notJustText;
  }

  private async generateAIImprovement(userRequest: string, code: string): Promise<{ description: string; originalSnippet: string; suggestedSnippet: string; applyCommand: string; type: 'snippet' | 'improvement' } | null> {
    if (!code || code.trim().length === 0) {
      return null;
    }

    try {
      const prompt = `You are an expert code reviewer. Analyze and improve this code based on the request: "${userRequest}"

Current code:
${code}

Requirements:
1. Provide SPECIFIC improvements to the existing code
2. Show both the original problematic code and the improved version
3. Focus on the most important improvements first
4. Make sure the improved code is syntactically correct and runnable

Format your response as:
DESCRIPTION: What improvement this provides

ORIGINAL:
\`\`\`
// The original code that needs improvement
\`\`\`

IMPROVED:
\`\`\`
// The improved version
\`\`\`

Be specific about what you're improving and why. Only suggest changes that actually make the code better.`;

      const aiResponse = await this.geminiService.generateCompletion(prompt, { maxTokens: 4096 });

      // Parse the AI improvement response
      return this.parseImprovementResponse(aiResponse, code, userRequest);

    } catch (error) {
      console.warn('AI improvement generation failed:', error);
      return null;
    }
  }

  private parseImprovementResponse(aiResponse: string, originalCode: string, userRequest: string): { description: string; originalSnippet: string; suggestedSnippet: string; applyCommand: string; type: 'snippet' | 'improvement' } | null {
    try {
      // Extract description
      const descriptionMatch = aiResponse.match(/DESCRIPTION:\s*(.+?)(?:\n|$)/i);
      const description = descriptionMatch ? descriptionMatch[1].trim() : `Code improvement for: ${userRequest}`;

      // Extract original code block
      const originalMatch = aiResponse.match(/ORIGINAL:\s*```[\w]*\n?([\s\S]*?)```/i);
      const originalSnippet = originalMatch ? originalMatch[1].trim() : originalCode.substring(0, 100) + '...';

      // Extract improved code block
      const improvedMatch = aiResponse.match(/IMPROVED:\s*```[\w]*\n?([\s\S]*?)```/i);
      if (improvedMatch && improvedMatch[1].trim()) {
        const suggestedSnippet = improvedMatch[1].trim();

        return {
          description,
          originalSnippet,
          suggestedSnippet,
          applyCommand: `replace:${originalSnippet}:${suggestedSnippet}`,
          type: 'improvement'
        };
      }

      // If structured parsing fails, try to find any code improvements
      const codeBlocks = [...aiResponse.matchAll(/```[\w]*\n?([\s\S]*?)```/g)];
      if (codeBlocks.length >= 2) {
        // Assume first block is original, second is improved
        const suggestedSnippet = codeBlocks[1][1].trim();
        return {
          description: description || 'AI-generated code improvement',
          originalSnippet: codeBlocks[0][1].trim(),
          suggestedSnippet,
          applyCommand: `replace:${codeBlocks[0][1].trim()}:${suggestedSnippet}`,
          type: 'improvement'
        };
      }

    } catch (error) {
      console.warn('Failed to parse AI improvement response:', error);
    }

    return null;
  }

  private parseSnippetResponse(aiResponse: string, userRequest: string): { description: string; originalSnippet: string; suggestedSnippet: string; applyCommand: string } | null {
    try {
      // Extract description - look for various formats
      let description = `Code snippet for: ${userRequest}`;
      const descriptionPatterns = [
        /DESCRIPTION:\s*(.+?)(?:\n|$)/i,
        /^(.+?)(?:\n```|\nCODE:|$)/s,
        /This snippet (.+?)\./i
      ];

      for (const pattern of descriptionPatterns) {
        const match = aiResponse.match(pattern);
        if (match && match[1].trim().length > 10) {
          description = match[1].trim();
          break;
        }
      }

      // Extract code from markdown code blocks
      const codeBlockRegex = /```(?:\w+)?\n?([\s\S]*?)```/g;
      const matches = [...aiResponse.matchAll(codeBlockRegex)];

      if (matches.length > 0) {
        let snippet = matches[0][1].trim();

        // Clean up the snippet
        if (snippet) {
          // Remove any leading/trailing whitespace and ensure it's valid code
          snippet = snippet.replace(/^\s*[\r\n]+|[\r\n]+\s*$/g, '');

          // Create a placeholder for replacement
          const placeholder = this.generateSnippetPlaceholder(userRequest);

          return {
            description,
            originalSnippet: placeholder,
            suggestedSnippet: snippet,
            applyCommand: `replace:${placeholder}:${snippet}`
          };
        }
      }

      // If no code blocks found, try to extract code after "CODE:" or similar markers
      const codePatterns = [
        /CODE:\s*```(?:\w+)?\n?([\s\S]*?)```/i,
        /```\w*\n([\s\S]*?)```/i,
        /(?:function|class|const|let|var)\s+[\s\S]+?(?:;|$)(?:\n|$)/i
      ];

      for (const pattern of codePatterns) {
        const match = aiResponse.match(pattern);
        if (match && match[1] && match[1].trim().length > 10) {
          const snippet = match[1].trim();
          const placeholder = this.generateSnippetPlaceholder(userRequest);

          return {
            description,
            originalSnippet: placeholder,
            suggestedSnippet: snippet,
            applyCommand: `replace:${placeholder}:${snippet}`
          };
        }
      }

      // If still no code found, the entire response might be code
      if (aiResponse.includes('function') || aiResponse.includes('const') || aiResponse.includes('class')) {
        const placeholder = this.generateSnippetPlaceholder(userRequest);
        return {
          description,
          originalSnippet: placeholder,
          suggestedSnippet: aiResponse.trim(),
          applyCommand: `replace:${placeholder}:${aiResponse.trim()}`
        };
      }

    } catch (error) {
      console.warn('Failed to parse AI snippet response:', error);
    }

    return null;
  }

  private generateSnippetPlaceholder(userRequest: string): string {
    const request = userRequest.toLowerCase();

    if (request.includes('error') || request.includes('try') || request.includes('catch')) {
      return '// Add error handling here';
    }
    if (request.includes('async') || request.includes('await') || request.includes('promise')) {
      return '// Add async function here';
    }
    if (request.includes('react') || request.includes('component') || request.includes('jsx')) {
      return '// Add React component here';
    }
    if (request.includes('function') || request.includes('utility')) {
      return '// Add utility function here';
    }

    return '// Add code snippet here';
  }

  // Fallback hardcoded snippets if AI fails
  private generateFallbackSnippet(userRequest: string): { description: string; originalSnippet: string; suggestedSnippet: string; applyCommand: string; type: 'snippet' | 'improvement' } | null {
    const request = userRequest.toLowerCase();

    // Error handling snippets
    if (request.includes('error') || request.includes('try') || request.includes('catch') || request.includes('exception')) {
      const snippet = `try {
  // Your code here
  const result = performOperation();
  console.log('Operation completed successfully');
  return result;
} catch (error) {
  console.error('An error occurred:', error);
  // Handle the error appropriately
  throw error;
}`;
      return {
        description: 'Error handling boilerplate with try-catch',
        originalSnippet: '// Add error handling here',
        suggestedSnippet: snippet,
        applyCommand: `replace:// Add error handling here:${snippet}`,
        type: 'snippet'
      };
    }

    // Async/Promise snippets
    if (request.includes('async') || request.includes('await') || request.includes('promise')) {
      const snippet = `async function performAsyncOperation() {
  try {
    const result = await someAsyncFunction();
    console.log('Result:', result);
    return result;
  } catch (error) {
    console.error('Async operation failed:', error);
    throw error;
  }
}

// Usage:
performAsyncOperation()
  .then(result => console.log('Success:', result))
  .catch(error => console.error('Failed:', error));`;
      return {
        description: 'Async/await function with promise handling',
        originalSnippet: '// Add async function here',
        suggestedSnippet: snippet,
        applyCommand: `replace:// Add async function here:${snippet}`,
        type: 'snippet'
      };
    }

    // React component snippets
    if (request.includes('react') || request.includes('component') || request.includes('jsx') || request.includes('hook')) {
      const snippet = `import React, { useState, useEffect } from 'react';

interface ComponentProps {
  title?: string;
  onAction?: () => void;
}

const MyComponent: React.FC<ComponentProps> = ({
  title = 'My Component',
  onAction
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAction = async () => {
    setLoading(true);
    setError(null);

    try {
      // Perform your action here
      const result = await performAction();
      setData(result);
      onAction?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-component">
      <h2>{title}</h2>

      {loading && <div>Loading...</div>}
      {error && <div className="error">Error: {error}</div>}

      <button onClick={handleAction} disabled={loading}>
        {loading ? 'Processing...' : 'Perform Action'}
      </button>

      {data && (
        <div className="result">
          Result: {JSON.stringify(data, null, 2)}
        </div>
      )}
    </div>
  );
};

export default MyComponent;`;
      return {
        description: 'React component boilerplate with hooks and async data fetching',
        originalSnippet: '// Add React component here',
        suggestedSnippet: snippet,
        applyCommand: `replace:// Add React component here:${snippet}`,
        type: 'snippet'
      };
    }

    // Arithmetic operation snippets (add, sum, numbers, etc.)
    if (request.includes('add') || request.includes('sum') || request.includes('number') ||
        request.includes('plus') || request.includes('math') || request.includes('calculate') ||
        request.includes('arithmetic')) {
      const snippet = `/**
 * Adds two numbers and returns the result
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} The sum of a and b
 */
function addNumbers(a, b) {
  // Validate inputs
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('Both arguments must be numbers');
  }

  return a + b;
}

// Example usage:
const result = addNumbers(5, 3);
console.log(result); // Output: 8

// You can also use it with variables:
const x = 10;
const y = 20;
const sum = addNumbers(x, y);
console.log(\`The sum of \${x} and \${y} is \${sum}\`);`;
      return {
        description: 'Function to add two numbers with input validation',
        originalSnippet: '// Add code snippet here',
        suggestedSnippet: snippet,
        applyCommand: `replace:// Add code snippet here:${snippet}`,
        type: 'snippet' as const
      };
    }

    // Default snippet - a simple utility function
    const snippet = `/**
 * Reusable utility function
 * @param {any} param - Input parameter
 * @returns {any} Processed result
 */
function utilityFunction(param) {
  // Validate input
  if (!param) {
    throw new Error('Parameter is required');
  }

  // Process the parameter
  const result = param; // Add your logic here

  // Return the result
  return result;
}

// Example usage:
// const result = utilityFunction('input');
// console.log(result);

export default utilityFunction;`;
    return {
      description: 'Reusable utility function with input validation and error handling',
      originalSnippet: '// Add utility function here',
      suggestedSnippet: snippet,
      applyCommand: `replace:// Add utility function here:${snippet}`,
      type: 'snippet'
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