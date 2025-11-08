import express from 'express';
import { GeminiService } from '../services/geminiService.js';
import { validateCompletionRequest, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// Initialize Gemini service lazily
let geminiService = null;

const getGeminiService = () => {
  if (!geminiService) {
    try {
      geminiService = new GeminiService({
        apiKey: process.env.GEMINI_API_KEY,
        model: 'gemini-2.5-flash',
        temperature: 0.3, // Lower temperature for more focused completions
        maxTokens: 1024 // Reasonable limit for code completions
      });
    } catch (error) {
      console.error('Failed to initialize Gemini service for completions:', error.message);
      throw error;
    }
  }
  return geminiService;
};

router.post('/', validateCompletionRequest, handleValidationErrors, async (req, res) => {
  try {
    const { code, cursorPosition, language, userId = 'anonymous' } = req.body;

    console.log(`Processing completion request for user ${userId}, language: ${language}`);

    // Extract code before cursor for context
    const codeBeforeCursor = code.substring(0, cursorPosition);
    const codeAfterCursor = code.substring(cursorPosition);

    // Build completion prompt
    const prompt = `You are an AI code completion assistant. Complete the following ${language} code at the cursor position.

Current code:
\`\`\`${language}
${codeBeforeCursor}[CURSOR]${codeAfterCursor}
\`\`\`

Provide a short, relevant completion that would naturally follow the code before the cursor. Return only the text to insert, no explanations or markdown formatting.

Completion:`;

    let completion;
    try {
      completion = await getGeminiService().generateCompletion(prompt);
    } catch (error) {
      console.error('Gemini API error, using fallback:', error.message);
      // Provide basic fallback completions for common patterns
      const fallback = getFallbackCompletion(codeBeforeCursor, language);
      if (fallback) {
        completion = fallback;
      } else {
        throw error; // Re-throw if no fallback available
      }
    }

    // Clean up the completion (remove any markdown, explanations, etc.)
    let cleanCompletion = completion.trim();

    // Remove common unwanted prefixes
    cleanCompletion = cleanCompletion.replace(/^```[\w]*\n?/g, '');
    cleanCompletion = cleanCompletion.replace(/\n```$/g, '');
    cleanCompletion = cleanCompletion.replace(/^Completion:\s*/i, '');
    cleanCompletion = cleanCompletion.replace(/^Answer:\s*/i, '');

    // Limit completion length for inline suggestions
    if (cleanCompletion.length > 100) {
      cleanCompletion = cleanCompletion.substring(0, 100);
    }

    const response = {
      suggestions: cleanCompletion ? [{
        insertText: cleanCompletion,
        kind: 'text',
        detail: 'AI completion'
      }] : [],
      isIncomplete: false
    };

    console.log(`Completion generated for user ${userId}: "${cleanCompletion.substring(0, 50)}${cleanCompletion.length > 50 ? '...' : ''}"`);

    res.json(response);

  } catch (error) {
    console.error('Completion route error:', error);

    // Return empty suggestions on error rather than failing
    res.status(200).json({
      suggestions: [],
      isIncomplete: false,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Fallback completion function for when AI service fails
function getFallbackCompletion(codeBeforeCursor, language) {
  const trimmed = codeBeforeCursor.trim();

  // JavaScript/TypeScript fallbacks
  if (language === 'javascript' || language === 'typescript' || language === 'typescriptreact' || language === 'javascriptreact') {
    if (trimmed.endsWith('console.log(')) {
      return ');';
    }
    if (trimmed.endsWith('function ')) {
      return '() {\n  \n}';
    }
    if (trimmed.endsWith('if (')) {
      return ') {\n  \n}';
    }
    if (trimmed.endsWith('for (')) {
      return 'let i = 0; i < ; i++) {\n  \n}';
    }
    if (trimmed.endsWith('const ') || trimmed.endsWith('let ') || trimmed.endsWith('var ')) {
      return '= ';
    }
  }

  // Python fallbacks
  if (language === 'python') {
    if (trimmed.endsWith('print(')) {
      return ')';
    }
    if (trimmed.endsWith('def ')) {
      return '():\n    pass';
    }
    if (trimmed.endsWith('if ')) {
      return ':\n    pass';
    }
    if (trimmed.endsWith('for ')) {
      return 'in :\n    pass';
    }
  }

  return null; // No fallback available
}

export default router;