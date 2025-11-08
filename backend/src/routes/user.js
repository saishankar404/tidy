import express from 'express';
import { DatabaseService } from '../services/database.js';
import { validateUserId, validateUserSettings, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// Initialize service lazily
let databaseService = null;

const getDatabaseService = () => {
  if (!databaseService) {
    databaseService = new DatabaseService();
  }
  return databaseService;
};

// Get user settings
router.get('/:userId', validateUserId, handleValidationErrors, async (req, res) => {
  try {
    const { userId } = req.params;
    let user = await getDatabaseService().getUser(userId);

    // Create default user if doesn't exist
    if (!user) {
      user = await getDatabaseService().createUser(userId);
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user settings' });
  }
});

// Update user settings
router.put('/:userId', validateUserId, validateUserSettings, handleValidationErrors, async (req, res) => {
  try {
    const { userId } = req.params;
    const { settings } = req.body;

    console.log('Updating user settings for:', userId, settings);

    const updatedUser = await getDatabaseService().updateUser(userId, { settings });

    console.log('Updated user result:', updatedUser);

    if (!updatedUser) {
      return res.status(500).json({ error: 'Failed to update user settings' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user settings' });
  }
});

// Create or get user (for anonymous users)
router.post('/', async (req, res) => {
  try {
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const user = await getDatabaseService().createUser(userId);

    res.json(user);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Delete user (for cleanup/testing)
router.delete('/:userId', validateUserId, handleValidationErrors, async (req, res) => {
  try {
    const { userId } = req.params;

    // Note: Replit DB doesn't have a direct delete method for users
    // We'll just mark as inactive or remove settings
    const updatedUser = await getDatabaseService().updateUser(userId, {
      settings: null,
      lastActive: new Date().toISOString()
    });

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, message: 'User data cleared' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;