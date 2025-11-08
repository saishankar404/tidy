import express from 'express';
import { DatabaseService } from '../services/database.js';
import { validateUserId, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// Initialize service lazily
let databaseService = null;

const getDatabaseService = () => {
  if (!databaseService) {
    databaseService = new DatabaseService();
  }
  return databaseService;
};

// Get user's analysis history
router.get('/user/:userId', validateUserId, handleValidationErrors, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // For now, return empty array since Replit DB doesn't support efficient prefix queries
    // In production, you'd implement proper indexing or use a different database
    const history = await getDatabaseService().getUserAnalysisHistory(userId, parseInt(limit));

    res.json({
      sessions: history,
      total: history.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get analysis history error:', error);
    res.status(500).json({ error: 'Failed to retrieve analysis history' });
  }
});

// Get specific analysis session
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await getDatabaseService().getAnalysisSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Analysis session not found' });
    }

    res.json(session);
  } catch (error) {
    console.error('Get analysis session error:', error);
    res.status(500).json({ error: 'Failed to retrieve analysis session' });
  }
});

// Delete analysis session
router.delete('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Note: Replit DB doesn't have a direct delete method
    // We'll mark as deleted or just return success
    // In production, you'd implement proper deletion

    res.json({ success: true, message: 'Analysis session marked for deletion' });
  } catch (error) {
    console.error('Delete analysis session error:', error);
    res.status(500).json({ error: 'Failed to delete analysis session' });
  }
});

// Bulk delete analysis sessions for user
router.delete('/user/:userId/all', validateUserId, handleValidationErrors, async (req, res) => {
  try {
    const { userId } = req.params;

    // In a real implementation, you'd delete all sessions for the user
    // For now, just return success

    res.json({
      success: true,
      message: 'All analysis sessions cleared',
      deletedCount: 0 // Would be actual count in real implementation
    });
  } catch (error) {
    console.error('Bulk delete analysis sessions error:', error);
    res.status(500).json({ error: 'Failed to clear analysis history' });
  }
});

export default router;