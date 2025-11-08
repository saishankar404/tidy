import { body, param, validationResult } from 'express-validator';

// Validation middleware
export const validateAnalysisRequest = [
  body('code')
    .isString()
    .notEmpty()
    .withMessage('Code is required')
    .isLength({ max: 100000 })
    .withMessage('Code too long (max 100KB)'),
  body('filePath')
    .isString()
    .notEmpty()
    .withMessage('File path is required'),
  body('language')
    .isString()
    .notEmpty()
    .withMessage('Language is required'),
  body('framework')
    .optional()
    .isString(),
  body('projectStructure')
    .optional()
    .isString(),
  body('dependencies')
    .optional()
    .isArray(),
  body('config')
    .optional()
    .isObject(),
  body('userId')
    .optional()
    .isString(),
];

export const validateChatRequest = [
  body('messages')
    .isArray({ min: 1 })
    .withMessage('Messages array is required'),
  body('messages.*.role')
    .isIn(['user', 'assistant'])
    .withMessage('Invalid message role'),
  body('messages.*.content')
    .isString()
    .notEmpty()
    .withMessage('Message content is required'),
  body('context')
    .optional()
    .isObject(),
  body('userId')
    .optional()
    .isString(),
];

export const validateUserSettings = [
  body('settings')
    .isObject()
    .withMessage('Settings object is required'),
  body('settings.experimental')
    .optional()
    .isObject(),
  body('settings.ai')
    .optional()
    .isObject(),
];

export const validateUserId = [
  param('userId')
    .isString()
    .notEmpty()
    .withMessage('User ID is required'),
];

// Error handling middleware for validation
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};