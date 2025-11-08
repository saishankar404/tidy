import express from 'express';
import { validateAnalysisRequest, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

router.post('/', validateAnalysisRequest, handleValidationErrors, async (req, res) => {
  try {
    // Import services dynamically to avoid initialization issues
    const { GeminiService } = await import('../services/geminiService.js');
    const { AnalysisOrchestrator } = await import('../services/analysisOrchestrator.js');
    const { DatabaseService } = await import('../services/database.js');

    const {
      code,
      filePath,
      language,
      framework,
      projectStructure,
      dependencies,
      config,
      userId = 'anonymous'
    } = req.body;

    // Initialize services
    const geminiService = new GeminiService({
      apiKey: process.env.GEMINI_API_KEY,
      model: 'gemini-2.5-flash',
      temperature: 0.2,
      maxTokens: 4096
    });

    const orchestrator = new AnalysisOrchestrator(geminiService);
    if (config) {
      orchestrator.updateConfig(config);
    }

    const context = {
      filePath,
      content: code,
      language,
      framework,
      projectStructure,
      dependencies
    };

    console.log(`Starting analysis for ${filePath} (${language})`);

    const result = await orchestrator.analyzeCode(context);

    // Save to database
    const databaseService = new DatabaseService();
    const sessionData = {
      id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      timestamp: new Date(),
      filePath,
      fileName: filePath.split('/').pop() || 'file',
      summary: result.summary?.overallSummary || 'Analysis completed',
      suggestionsCount: result.summary?.totalSuggestions || 0,
      issuesCount: result.summary?.totalIssues || 0,
      score: result.summary?.overallScore || 0,
      fullResults: result
    };

    await databaseService.saveAnalysisSession(sessionData);

    console.log(`Analysis completed for ${filePath}. Score: ${result.summary?.overallScore}`);

    res.json(result);

  } catch (error) {
    console.error('Analysis route error:', error);

    // Return a structured error response
    res.status(500).json({
      results: [],
      errors: [{
        type: 'analysis_error',
        message: error.message || 'Analysis failed',
        severity: 'high'
      }],
      summary: {
        overallScore: 0,
        totalIssues: 1,
        totalSuggestions: 0,
        analysisTime: 0,
        overallSummary: 'Analysis failed due to an error'
      }
    });
  }
});

// Get analysis session by ID
router.get('/:sessionId', async (req, res) => {
  try {
    const { DatabaseService } = await import('../services/database.js');
    const databaseService = new DatabaseService();

    const { sessionId } = req.params;
    const session = await databaseService.getAnalysisSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Analysis session not found' });
    }

    res.json(session);
  } catch (error) {
    console.error('Get analysis session error:', error);
    res.status(500).json({ error: 'Failed to retrieve analysis session' });
  }
});

export default router;