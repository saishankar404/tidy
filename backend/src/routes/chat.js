import express from 'express';
import { GeminiService } from '../services/geminiService.js';
import { DatabaseService } from '../services/database.js';
import { validateChatRequest, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// Initialize services lazily to ensure env vars are loaded
let geminiService = null;
let databaseService = null;

const getGeminiService = () => {
  if (!geminiService) {
    try {
      geminiService = new GeminiService({
        apiKey: process.env.GEMINI_API_KEY,
        model: 'gemini-2.5-flash',
        temperature: 0.7, // Higher temperature for more conversational responses
        maxTokens: 2048
      });
    } catch (error) {
      console.error('Failed to initialize Gemini service:', error.message);
      throw error;
    }
  }
  return geminiService;
};

const getDatabaseService = () => {
  if (!databaseService) {
    databaseService = new DatabaseService();
  }
  return databaseService;
};

router.post('/', validateChatRequest, handleValidationErrors, async (req, res) => {
  try {
    const { messages, context, userId = 'anonymous', sessionId } = req.body;

    // Build context-aware prompt
    let contextPrompt = '';

    if (context) {
      contextPrompt = `
You are a helpful coding assistant. The user is working on code and has analysis results available.

Current context:
- File: ${context.filePath || 'Unknown'}
- Language: ${context.language || 'Unknown'}
${context.code ? `- Code snippet: ${context.code.substring(0, 500)}${context.code.length > 500 ? '...' : ''}` : ''}

Analysis results summary:
${context.analysisResults ?
  context.analysisResults.map(r =>
    `- ${r.type}: ${r.issues} issues, score: ${r.score}/100`
  ).join('\n')
  : 'No analysis results available yet.'
}

Conversation history:
${messages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Assistant:`;
    } else {
      contextPrompt = `You are a helpful coding assistant.

Conversation history:
${messages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Assistant:`;
    }

    console.log(`Processing chat request for user ${userId}`);

    const response = await getGeminiService().generateCompletion(contextPrompt);

    // Generate some basic suggestions based on the response
    const suggestions = generateSuggestions(response, context);

    const chatResponse = {
      message: response,
      suggestions
    };

    // Save chat session if sessionId provided
    if (sessionId) {
      const sessionData = {
        messages: [...messages, { role: 'assistant', content: response }],
        context,
        lastMessage: new Date().toISOString()
      };

      await getDatabaseService().saveChatSession(userId, sessionId, sessionData);
    }

    console.log(`Chat response generated for user ${userId}`);

    res.json(chatResponse);

  } catch (error) {
    console.error('Chat route error:', error);

    res.status(500).json({
      error: 'Chat failed',
      message: error.message
    });
  }
});

// Get chat session
router.get('/session/:userId/:sessionId', async (req, res) => {
  try {
    const { userId, sessionId } = req.params;
    const session = await getDatabaseService().getChatSession(userId, sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    res.json(session);
  } catch (error) {
    console.error('Get chat session error:', error);
    res.status(500).json({ error: 'Failed to retrieve chat session' });
  }
});

// Delete chat session
router.delete('/session/:userId/:sessionId', async (req, res) => {
  try {
    const { userId, sessionId } = req.params;
    const deleted = await getDatabaseService().deleteChatSession(userId, sessionId);

    if (!deleted) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete chat session error:', error);
    res.status(500).json({ error: 'Failed to delete chat session' });
  }
});

function generateSuggestions(response, context) {
  const suggestions = [];

  // Basic suggestion generation based on response content
  const responseLower = response.toLowerCase();

  if (responseLower.includes('test') || responseLower.includes('testing')) {
    suggestions.push('Add unit tests');
    suggestions.push('Consider integration tests');
  }

  if (responseLower.includes('error') || responseLower.includes('exception')) {
    suggestions.push('Add error handling');
    suggestions.push('Implement proper logging');
  }

  if (responseLower.includes('performance') || responseLower.includes('slow')) {
    suggestions.push('Profile the code');
    suggestions.push('Consider optimization techniques');
  }

  if (responseLower.includes('security') || responseLower.includes('vulnerable')) {
    suggestions.push('Review input validation');
    suggestions.push('Implement security best practices');
  }

  if (responseLower.includes('refactor') || responseLower.includes('improve')) {
    suggestions.push('Extract methods');
    suggestions.push('Improve variable names');
  }

  // Limit to 3 suggestions max
  return suggestions.slice(0, 3);
}

export default router;