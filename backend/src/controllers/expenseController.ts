import { formatDate, calculateDateRange, paginationHelper } from '../utils/helpers';
import { query } from '../db/connection';
import { HttpError } from '../middleware/errorHandler';
import {
  CreateExpenseDto,
  UpdateExpenseDto,
  ExpenseFilters,
  Expense,
  PaginatedResponse,
  ExpenseSummary,
  DailySummary,
  CategoryTotal,
} from '../types';
import { Request, Response, NextFunction } from 'express';

export async function getExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;
    const filters: ExpenseFilters = {
      startDate: req.query.start_date as string,
      endDate: req.query.end_date as string,
      category_id: req.query.category_id as string,
      short_term_budget_id: req.query.short_term_budget_id as string,
      type: req.query.type as 'expense' | 'income' | undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    };

    const { offset, limit } = paginationHelper(filters.page!, filters.limit!);

    const conditions: string[] = ['e.user_id = $1'];
    const params: unknown[] = [userId];
    let paramIdx = 2;

    if (filters.startDate) {
      conditions.push(`e.date >= $${paramIdx}`);
      params.push(filters.startDate);
      paramIdx++;
    }
    if (filters.endDate) {
      conditions.push(`e.date <= $${paramIdx}`);
      params.push(filters.endDate);
      paramIdx++;
    }
    if (filters.category_id) {
      conditions.push(`e.category_id = $${paramIdx}`);
      params.push(filters.category_id);
      paramIdx++;
    }
    if (filters.short_term_budget_id) {
      conditions.push(`e.short_term_budget_id = $${paramIdx}`);
      params.push(filters.short_term_budget_id);
      paramIdx++;
    }
    if (filters.type) {
      conditions.push(`e.type = $${paramIdx}`);
      params.push(filters.type);
      paramIdx++;
    }

    const whereClause = conditions.join(' AND ');

    // Count query
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM expenses e WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Data query
    const dataResult = await query<Expense>(
      `SELECT e.*, 
              c.name as category_name, 
              c.icon as category_icon, 
              c.color as category_color,
              stb.name as short_term_budget_name
       FROM expenses e
       LEFT JOIN categories c ON e.category_id = c.id
       LEFT JOIN short_term_budgets stb ON e.short_term_budget_id = stb.id
       WHERE ${whereClause}
       ORDER BY e.date DESC, e.created_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset]
    );

    const totalPages = Math.ceil(total / limit);
    const response: PaginatedResponse<Expense> = {
      success: true,
      data: dataResult.rows,
      pagination: {
        page: filters.page!,
        limit,
        total,
        totalPages,
        hasNext: filters.page! < totalPages,
        hasPrev: filters.page! > 1,
      },
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function createExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;
    const dto: CreateExpenseDto = req.body;

    const result = await query<Expense>(
      `INSERT INTO expenses (user_id, category_id, short_term_budget_id, amount, description, note, date, type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        userId,
        dto.category_id || null,
        dto.short_term_budget_id || null,
        dto.amount,
        dto.description || null,
        dto.note || null,
        dto.date || formatDate(new Date()),
        dto.type || 'expense',
      ]
    );

    // Fetch with category and budget info
    const expense = await query<Expense>(
      `SELECT e.*, 
              c.name as category_name, 
              c.icon as category_icon, 
              c.color as category_color,
              stb.name as short_term_budget_name
       FROM expenses e
       LEFT JOIN categories c ON e.category_id = c.id
       LEFT JOIN short_term_budgets stb ON e.short_term_budget_id = stb.id
       WHERE e.id = $1`,
      [result.rows[0].id]
    );

    res.status(201).json({ success: true, data: expense.rows[0] });
  } catch (error) {
    next(error);
  }
}

export async function updateExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const dto: UpdateExpenseDto = req.body;

    // Verify ownership
    const existing = await query<Expense>(
      'SELECT id FROM expenses WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (existing.rows.length === 0) {
      throw new HttpError('Expense not found', 404);
    }

    const setClauses: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (dto.amount !== undefined) { setClauses.push(`amount = $${idx}`); params.push(dto.amount); idx++; }
    if (dto.description !== undefined) { setClauses.push(`description = $${idx}`); params.push(dto.description); idx++; }
    if (dto.note !== undefined) { setClauses.push(`note = $${idx}`); params.push(dto.note); idx++; }
    if (dto.date !== undefined) { setClauses.push(`date = $${idx}`); params.push(dto.date); idx++; }
    if (dto.category_id !== undefined) { setClauses.push(`category_id = $${idx}`); params.push(dto.category_id); idx++; }
    if (dto.short_term_budget_id !== undefined) { setClauses.push(`short_term_budget_id = $${idx}`); params.push(dto.short_term_budget_id); idx++; }
    if (dto.type !== undefined) { setClauses.push(`type = $${idx}`); params.push(dto.type); idx++; }

    if (setClauses.length === 0) {
      throw new HttpError('No fields to update', 400);
    }

    setClauses.push(`updated_at = NOW()`);
    params.push(id, userId);

    await query(
      `UPDATE expenses SET ${setClauses.join(', ')} WHERE id = $${idx} AND user_id = $${idx + 1}`,
      params
    );

    const updated = await query<Expense>(
      `SELECT e.*, 
              c.name as category_name, 
              c.icon as category_icon, 
              c.color as category_color,
              stb.name as short_term_budget_name
       FROM expenses e
       LEFT JOIN categories c ON e.category_id = c.id
       LEFT JOIN short_term_budgets stb ON e.short_term_budget_id = stb.id
       WHERE e.id = $1`,
      [id]
    );

    res.json({ success: true, data: updated.rows[0] });
  } catch (error) {
    next(error);
  }
}

export async function deleteExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const result = await query(
      'DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rowCount === 0) {
      throw new HttpError('Expense not found', 404);
    }

    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;
    const { period } = req.query;

    let startDate: string;
    let endDate: string;

    if (period === 'week') {
      const range = calculateDateRange('week');
      startDate = range.startDate;
      endDate = range.endDate;
    } else if (period === 'month') {
      const range = calculateDateRange('month');
      startDate = range.startDate;
      endDate = range.endDate;
    } else if (req.query.start_date && req.query.end_date) {
      startDate = req.query.start_date as string;
      endDate = req.query.end_date as string;
    } else {
      const range = calculateDateRange('month');
      startDate = range.startDate;
      endDate = range.endDate;
    }

    // Totals
    const totalsResult = await query<{ total_expense: string; total_income: string }>(
      `SELECT 
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income
       FROM expenses
       WHERE user_id = $1 AND date BETWEEN $2 AND $3`,
      [userId, startDate, endDate]
    );

    const totals = totalsResult.rows[0];
    const total_expense = parseFloat(totals.total_expense);
    const total_income = parseFloat(totals.total_income);

    // By category
    const categoryResult = await query<CategoryTotal>(
      `SELECT 
         e.category_id,
         COALESCE(c.name, 'Uncategorized') as category_name,
         COALESCE(c.icon, 'circle') as category_icon,
         COALESCE(c.color, '#94a3b8') as category_color,
         e.type,
         SUM(e.amount) as total,
         COUNT(*) as count
       FROM expenses e
       LEFT JOIN categories c ON e.category_id = c.id
       WHERE e.user_id = $1 AND e.date BETWEEN $2 AND $3
       GROUP BY e.category_id, c.name, c.icon, c.color, e.type
       ORDER BY total DESC`,
      [userId, startDate, endDate]
    );

    // Daily totals
    const dailyResult = await query<DailySummary>(
      `SELECT 
         date::TEXT as date,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as net,
         COUNT(*) as count
       FROM expenses
       WHERE user_id = $1 AND date BETWEEN $2 AND $3
       GROUP BY date
       ORDER BY date ASC`,
      [userId, startDate, endDate]
    );

    const summary: ExpenseSummary = {
      total_expense,
      total_income,
      net: total_income - total_expense,
      by_category: categoryResult.rows.map((r) => ({
        ...r,
        total: parseFloat(r.total as unknown as string),
        count: parseInt(r.count as unknown as string, 10),
      })),
      daily: dailyResult.rows.map((r) => ({
        ...r,
        total_expense: parseFloat(r.total_expense as unknown as string),
        total_income: parseFloat(r.total_income as unknown as string),
        net: parseFloat(r.net as unknown as string),
        count: parseInt(r.count as unknown as string, 10),
      })),
    };

    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
}

export async function getDailySummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;
    const date = req.query.date as string || formatDate(new Date());

    const totalsResult = await query<{ total_expense: string; total_income: string; count: string }>(
      `SELECT 
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
         COUNT(*) as count
       FROM expenses
       WHERE user_id = $1 AND date = $2`,
      [userId, date]
    );

    const expensesResult = await query<Expense>(
      `SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM expenses e
       LEFT JOIN categories c ON e.category_id = c.id
       WHERE e.user_id = $1 AND e.date = $2
       ORDER BY e.created_at DESC`,
      [userId, date]
    );

    const t = totalsResult.rows[0];
    const total_expense = parseFloat(t.total_expense);
    const total_income = parseFloat(t.total_income);

    res.json({
      success: true,
      data: {
        date,
        total_expense,
        total_income,
        net: total_income - total_expense,
        count: parseInt(t.count, 10),
        expenses: expensesResult.rows,
      },
    });
  } catch (error) {
    next(error);
  }
}
