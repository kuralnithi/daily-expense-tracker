import { Router, Request, Response } from 'express';
import expensesRouter from './expenses';
import categoriesRouter from './categories';
import usersRouter from './users';
import summaryRouter from './summary';

const router = Router();

// Mount sub-routers
router.use('/expenses', expensesRouter);
router.use('/categories', categoriesRouter);
router.use('/users', usersRouter);
router.use('/summary', summaryRouter);

// API root info
router.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Daily Expense Tracker API v1',
    endpoints: {
      expenses: '/api/v1/expenses',
      categories: '/api/v1/categories',
      users: '/api/v1/users',
      summary: '/api/v1/summary',
    },
  });
});

export default router;
