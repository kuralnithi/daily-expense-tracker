import { Router } from 'express';
import { query } from 'express-validator';
import { validate, extractUserId } from '../middleware/validate';
import {
  getMonthlySummary,
  getWeeklySummary,
  getCategoryBreakdown,
} from '../controllers/summaryController';

const router = Router();

router.use(extractUserId);

// GET /summary/monthly?month=11&year=2024
router.get(
  '/monthly',
  validate([
    query('month').optional().isInt({ min: 1, max: 12 }).withMessage('month must be 1-12'),
    query('year').optional().isInt({ min: 2000, max: 2100 }).withMessage('year must be 2000-2100'),
  ]),
  getMonthlySummary
);

// GET /summary/weekly?week_start=2024-11-11
router.get(
  '/weekly',
  validate([
    query('week_start').optional().isDate().withMessage('week_start must be YYYY-MM-DD'),
  ]),
  getWeeklySummary
);

// GET /summary/categories?start_date=...&end_date=...&type=expense
router.get(
  '/categories',
  validate([
    query('start_date').isDate().withMessage('start_date is required (YYYY-MM-DD)'),
    query('end_date').isDate().withMessage('end_date is required (YYYY-MM-DD)'),
    query('type').optional().isIn(['expense', 'income']).withMessage('type must be expense or income'),
  ]),
  getCategoryBreakdown
);

export default router;
