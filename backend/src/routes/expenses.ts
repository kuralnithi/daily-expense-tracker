import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validate, extractUserId } from '../middleware/validate';
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getSummary,
  getDailySummary,
} from '../controllers/expenseController';

const router = Router();

// All expense routes require user identity
router.use(extractUserId);

// GET /expenses - list with filters and pagination
router.get(
  '/',
  validate([
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1-100'),
    query('start_date').optional().isDate().withMessage('start_date must be YYYY-MM-DD'),
    query('end_date').optional().isDate().withMessage('end_date must be YYYY-MM-DD'),
    query('type').optional().isIn(['expense', 'income']).withMessage('type must be expense or income'),
    query('category_id').optional().isUUID().withMessage('category_id must be a UUID'),
  ]),
  getExpenses
);

// GET /expenses/summary - aggregated summary
router.get(
  '/summary',
  validate([
    query('period').optional().isIn(['today', 'week', 'month', 'year']).withMessage('period must be today|week|month|year'),
    query('start_date').optional().isDate().withMessage('start_date must be YYYY-MM-DD'),
    query('end_date').optional().isDate().withMessage('end_date must be YYYY-MM-DD'),
  ]),
  getSummary
);

// GET /expenses/daily - daily totals
router.get(
  '/daily',
  validate([
    query('date').optional().isDate().withMessage('date must be YYYY-MM-DD'),
  ]),
  getDailySummary
);

// POST /expenses - create
router.post(
  '/',
  validate([
    body('amount').isFloat({ gt: 0 }).withMessage('amount must be a positive number'),
    body('description').optional().isString().isLength({ max: 255 }),
    body('note').optional().isString().isLength({ max: 1000 }),
    body('date').optional().isDate().withMessage('date must be YYYY-MM-DD'),
    body('category_id').optional({ nullable: true }).isUUID().withMessage('category_id must be a UUID'),
    body('type').optional().isIn(['expense', 'income']).withMessage('type must be expense or income'),
  ]),
  createExpense
);

// PUT /expenses/:id - update
router.put(
  '/:id',
  validate([
    param('id').isUUID().withMessage('id must be a UUID'),
    body('amount').optional().isFloat({ gt: 0 }).withMessage('amount must be a positive number'),
    body('description').optional().isString().isLength({ max: 255 }),
    body('note').optional().isString().isLength({ max: 1000 }),
    body('date').optional().isDate().withMessage('date must be YYYY-MM-DD'),
    body('category_id').optional({ nullable: true }).isUUID().withMessage('category_id must be a UUID'),
    body('type').optional().isIn(['expense', 'income']).withMessage('type must be expense or income'),
  ]),
  updateExpense
);

// DELETE /expenses/:id
router.delete(
  '/:id',
  validate([param('id').isUUID().withMessage('id must be a UUID')]),
  deleteExpense
);

export default router;
