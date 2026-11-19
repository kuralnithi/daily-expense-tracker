import { Request, Response, NextFunction } from 'express';
import { query } from '../db/connection';
import { HttpError } from '../middleware/errorHandler';
import {
  ShortTermBudget,
  CreateShortTermBudgetDto,
  UpdateShortTermBudgetDto,
  AddBudgetFundsDto,
  Expense,
} from '../types';

export async function getShortTermBudgets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;

    const result = await query<ShortTermBudget>(
      `SELECT stb.*,
              COALESCE(SUM(CASE WHEN e.type = 'expense' THEN e.amount ELSE 0 END), 0)::numeric AS total_spent,
              (stb.total_amount - COALESCE(SUM(CASE WHEN e.type = 'expense' THEN e.amount ELSE 0 END), 0))::numeric AS remaining_amount,
              CASE 
                WHEN stb.total_amount > 0 THEN 
                  ROUND((COALESCE(SUM(CASE WHEN e.type = 'expense' THEN e.amount ELSE 0 END), 0) / stb.total_amount) * 100, 1)::numeric
                ELSE 0 
              END AS percentage_used,
              COUNT(e.id)::int AS expense_count
       FROM short_term_budgets stb
       LEFT JOIN expenses e ON stb.id = e.short_term_budget_id
       WHERE stb.user_id = $1
       GROUP BY stb.id
       ORDER BY stb.is_active DESC, stb.created_at DESC`,
      [userId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
}

export async function getShortTermBudgetById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const budgetResult = await query<ShortTermBudget>(
      `SELECT stb.*,
              COALESCE(SUM(CASE WHEN e.type = 'expense' THEN e.amount ELSE 0 END), 0)::numeric AS total_spent,
              (stb.total_amount - COALESCE(SUM(CASE WHEN e.type = 'expense' THEN e.amount ELSE 0 END), 0))::numeric AS remaining_amount,
              CASE 
                WHEN stb.total_amount > 0 THEN 
                  ROUND((COALESCE(SUM(CASE WHEN e.type = 'expense' THEN e.amount ELSE 0 END), 0) / stb.total_amount) * 100, 1)::numeric
                ELSE 0 
              END AS percentage_used,
              COUNT(e.id)::int AS expense_count
       FROM short_term_budgets stb
       LEFT JOIN expenses e ON stb.id = e.short_term_budget_id
       WHERE stb.id = $1 AND stb.user_id = $2
       GROUP BY stb.id`,
      [id, userId]
    );

    if (budgetResult.rows.length === 0) {
      throw new HttpError('Short-term budget not found', 404);
    }

    const budget = budgetResult.rows[0];

    // Fetch linked expenses
    const expensesResult = await query<Expense>(
      `SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM expenses e
       LEFT JOIN categories c ON e.category_id = c.id
       WHERE e.short_term_budget_id = $1 AND e.user_id = $2
       ORDER BY e.date DESC, e.created_at DESC`,
      [id, userId]
    );

    budget.expenses = expensesResult.rows;

    res.json({ success: true, data: budget });
  } catch (error) {
    next(error);
  }
}

export async function createShortTermBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;
    const dto: CreateShortTermBudgetDto = req.body;

    const result = await query<ShortTermBudget>(
      `INSERT INTO short_term_budgets (
        user_id, name, total_amount, description, color, icon, start_date, end_date
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *, 
                 0::numeric AS total_spent, 
                 total_amount AS remaining_amount, 
                 0::numeric AS percentage_used, 
                 0::int AS expense_count`,
      [
        userId,
        dto.name,
        dto.total_amount,
        dto.description || null,
        dto.color || '#6366f1',
        dto.icon || 'wallet',
        dto.start_date || new Date().toISOString().split('T')[0],
        dto.end_date || null,
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

export async function updateShortTermBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const dto: UpdateShortTermBudgetDto = req.body;

    const existing = await query<ShortTermBudget>(
      'SELECT id FROM short_term_budgets WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (existing.rows.length === 0) {
      throw new HttpError('Short-term budget not found', 404);
    }

    const setClauses: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (dto.name !== undefined) { setClauses.push(`name = $${idx}`); params.push(dto.name); idx++; }
    if (dto.total_amount !== undefined) { setClauses.push(`total_amount = $${idx}`); params.push(dto.total_amount); idx++; }
    if (dto.description !== undefined) { setClauses.push(`description = $${idx}`); params.push(dto.description); idx++; }
    if (dto.color !== undefined) { setClauses.push(`color = $${idx}`); params.push(dto.color); idx++; }
    if (dto.icon !== undefined) { setClauses.push(`icon = $${idx}`); params.push(dto.icon); idx++; }
    if (dto.start_date !== undefined) { setClauses.push(`start_date = $${idx}`); params.push(dto.start_date); idx++; }
    if (dto.end_date !== undefined) { setClauses.push(`end_date = $${idx}`); params.push(dto.end_date); idx++; }
    if (dto.is_active !== undefined) { setClauses.push(`is_active = $${idx}`); params.push(dto.is_active); idx++; }

    if (setClauses.length === 0) {
      throw new HttpError('No fields to update', 400);
    }

    setClauses.push(`updated_at = NOW()`);
    params.push(id, userId);

    await query(
      `UPDATE short_term_budgets SET ${setClauses.join(', ')} WHERE id = $${idx} AND user_id = $${idx + 1}`,
      params
    );

    const updated = await query<ShortTermBudget>(
      `SELECT stb.*,
              COALESCE(SUM(CASE WHEN e.type = 'expense' THEN e.amount ELSE 0 END), 0)::numeric AS total_spent,
              (stb.total_amount - COALESCE(SUM(CASE WHEN e.type = 'expense' THEN e.amount ELSE 0 END), 0))::numeric AS remaining_amount,
              CASE 
                WHEN stb.total_amount > 0 THEN 
                  ROUND((COALESCE(SUM(CASE WHEN e.type = 'expense' THEN e.amount ELSE 0 END), 0) / stb.total_amount) * 100, 1)::numeric
                ELSE 0 
              END AS percentage_used,
              COUNT(e.id)::int AS expense_count
       FROM short_term_budgets stb
       LEFT JOIN expenses e ON stb.id = e.short_term_budget_id
       WHERE stb.id = $1 AND stb.user_id = $2
       GROUP BY stb.id`,
      [id, userId]
    );

    res.json({ success: true, data: updated.rows[0] });
  } catch (error) {
    next(error);
  }
}

export async function addFundsToBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const dto: AddBudgetFundsDto = req.body;

    if (!dto.amount || dto.amount <= 0) {
      throw new HttpError('Amount to add must be greater than zero', 400);
    }

    const updated = await query<ShortTermBudget>(
      `UPDATE short_term_budgets 
       SET total_amount = total_amount + $1, updated_at = NOW() 
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [dto.amount, id, userId]
    );

    if (updated.rows.length === 0) {
      throw new HttpError('Short-term budget not found', 404);
    }

    const result = await query<ShortTermBudget>(
      `SELECT stb.*,
              COALESCE(SUM(CASE WHEN e.type = 'expense' THEN e.amount ELSE 0 END), 0)::numeric AS total_spent,
              (stb.total_amount - COALESCE(SUM(CASE WHEN e.type = 'expense' THEN e.amount ELSE 0 END), 0))::numeric AS remaining_amount,
              CASE 
                WHEN stb.total_amount > 0 THEN 
                  ROUND((COALESCE(SUM(CASE WHEN e.type = 'expense' THEN e.amount ELSE 0 END), 0) / stb.total_amount) * 100, 1)::numeric
                ELSE 0 
              END AS percentage_used,
              COUNT(e.id)::int AS expense_count
       FROM short_term_budgets stb
       LEFT JOIN expenses e ON stb.id = e.short_term_budget_id
       WHERE stb.id = $1 AND stb.user_id = $2
       GROUP BY stb.id`,
      [id, userId]
    );

    res.json({ 
      success: true, 
      message: `Successfully added ₹${dto.amount} to budget`, 
      data: result.rows[0] 
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteShortTermBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const result = await query(
      'DELETE FROM short_term_budgets WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      throw new HttpError('Short-term budget not found', 404);
    }

    res.json({ success: true, message: 'Short-term budget deleted successfully' });
  } catch (error) {
    next(error);
  }
}
