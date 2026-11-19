import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validate';
import {
  getShortTermBudgets,
  getShortTermBudgetById,
  createShortTermBudget,
  updateShortTermBudget,
  addFundsToBudget,
  deleteShortTermBudget,
} from '../controllers/shortTermBudgetController';

const router = Router();

// Validation chains
const createBudgetValidation = [
  body('name').trim().notEmpty().withMessage('Budget name is required'),
  body('total_amount')
    .isFloat({ min: 0.01 })
    .withMessage('Total amount must be greater than zero'),
  body('description').optional().isString(),
  body('color').optional().isString(),
  body('icon').optional().isString(),
  body('start_date').optional().isISO8601().withMessage('Start date must be YYYY-MM-DD'),
  body('end_date').optional().isISO8601().withMessage('End date must be YYYY-MM-DD'),
  validate,
];

const updateBudgetValidation = [
  param('id').isUUID().withMessage('Invalid budget ID'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('total_amount').optional().isFloat({ min: 0.01 }).withMessage('Total amount must be greater than zero'),
  body('is_active').optional().isBoolean(),
  validate,
];

const addFundsValidation = [
  param('id').isUUID().withMessage('Invalid budget ID'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than zero'),
  validate,
];

const uuidParamValidation = [
  param('id').isUUID().withMessage('Invalid budget ID'),
  validate,
];

router.get('/', getShortTermBudgets);
router.post('/', createBudgetValidation, createShortTermBudget);
router.get('/:id', uuidParamValidation, getShortTermBudgetById);
router.put('/:id', updateBudgetValidation, updateShortTermBudget);
router.post('/:id/add-funds', addFundsValidation, addFundsToBudget);
router.delete('/:id', uuidParamValidation, deleteShortTermBudget);

export default router;
