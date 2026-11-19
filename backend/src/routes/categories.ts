import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate, extractUserId } from '../middleware/validate';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController';

const router = Router();

router.use(extractUserId);

// GET /categories
router.get('/', getCategories);

// POST /categories
router.post(
  '/',
  validate([
    body('name').notEmpty().isString().isLength({ max: 100 }).withMessage('name is required (max 100 chars)'),
    body('icon').optional().isString().isLength({ max: 50 }),
    body('color').optional().isString().matches(/^#[0-9a-fA-F]{3,8}$/).withMessage('color must be a valid hex color'),
    body('type').optional().isIn(['expense', 'income']).withMessage('type must be expense or income'),
  ]),
  createCategory
);

// PUT /categories/:id
router.put(
  '/:id',
  validate([
    param('id').isUUID().withMessage('id must be a UUID'),
    body('name').optional().isString().isLength({ max: 100 }),
    body('icon').optional().isString().isLength({ max: 50 }),
    body('color').optional().isString().matches(/^#[0-9a-fA-F]{3,8}$/).withMessage('color must be a valid hex color'),
    body('type').optional().isIn(['expense', 'income']).withMessage('type must be expense or income'),
  ]),
  updateCategory
);

// DELETE /categories/:id
router.delete(
  '/:id',
  validate([param('id').isUUID().withMessage('id must be a UUID')]),
  deleteCategory
);

export default router;
