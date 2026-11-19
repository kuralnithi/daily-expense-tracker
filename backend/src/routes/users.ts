import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate, extractUserId } from '../middleware/validate';
import { getUser, getCurrentUser, createUser, updateUser } from '../controllers/userController';

const router = Router();

// GET /users/me - current user (from X-User-Id header)
router.get('/me', extractUserId, getCurrentUser);

// GET /users/:id
router.get(
  '/:id',
  validate([param('id').isUUID().withMessage('id must be a UUID')]),
  getUser
);

// POST /users - create user
router.post(
  '/',
  validate([
    body('name').notEmpty().isString().isLength({ max: 100 }).withMessage('name is required'),
    body('email').optional().isEmail().withMessage('email must be valid'),
    body('currency').optional().isString().isLength({ max: 10 }).withMessage('currency max 10 chars'),
  ]),
  createUser
);

// PUT /users/me - update current user
router.put(
  '/me',
  extractUserId,
  validate([
    body('name').optional().isString().isLength({ max: 100 }),
    body('email').optional().isEmail().withMessage('email must be valid'),
    body('currency').optional().isString().isLength({ max: 10 }),
  ]),
  updateUser
);

export default router;
