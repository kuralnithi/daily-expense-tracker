import { Request, Response, NextFunction } from 'express';
import { query } from '../db/connection';
import { CategoryTotal, DailySummary, MonthlySummary, WeeklySummary, BudgetComparison } from '../types';

export async function getMonthlySummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // last day of month

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

    // Daily breakdown
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

    // Budget comparison
    const budgetResult = await query<BudgetComparison>(
      `SELECT 
         b.id as budget_id,
         b.category_id,
         COALESCE(c.name, 'Overall') as category_name,
         b.amount as budgeted,
         COALESCE(SUM(e.amount), 0) as spent
       FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.id
       LEFT JOIN expenses e ON e.user_id = b.user_id 
         AND (b.category_id IS NULL OR e.category_id = b.category_id)
         AND e.date BETWEEN $2 AND $3
         AND e.type = 'expense'
       WHERE b.user_id = $1 AND b.year = $4 AND (b.month = $5 OR b.period = 'monthly')
       GROUP BY b.id, b.category_id, c.name, b.amount`,
      [userId, startDate, endDate, year, month]
    );

    const summary: MonthlySummary = {
      month,
      year,
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
      budget_comparison: budgetResult.rows.map((r) => {
        const budgeted = parseFloat(r.budgeted as unknown as string);
        const spent = parseFloat(r.spent as unknown as string);
        return {
          ...r,
          budgeted,
          spent,
          remaining: budgeted - spent,
          percentage_used: budgeted > 0 ? Math.round((spent / budgeted) * 100) : 0,
        };
      }),
    };

    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
}

export async function getWeeklySummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;

    // Week start: Monday of the current week (or provided date)
    let weekStart: Date;
    if (req.query.week_start) {
      weekStart = new Date(req.query.week_start as string);
    } else {
      weekStart = new Date();
      const day = weekStart.getDay();
      const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1); // Monday
      weekStart.setDate(diff);
    }
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const startDate = weekStart.toISOString().split('T')[0];
    const endDate = weekEnd.toISOString().split('T')[0];

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

    const summary: WeeklySummary = {
      week_start: startDate,
      week_end: endDate,
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

export async function getCategoryBreakdown(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;
    const type = req.query.type as 'expense' | 'income' | undefined;

    if (!startDate || !endDate) {
      res.status(400).json({ success: false, error: 'start_date and end_date are required' });
      return;
    }

    const params: unknown[] = [userId, startDate, endDate];
    let typeFilter = '';
    if (type) {
      typeFilter = `AND e.type = $4`;
      params.push(type);
    }

    const result = await query<CategoryTotal>(
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
       WHERE e.user_id = $1 AND e.date BETWEEN $2 AND $3 ${typeFilter}
       GROUP BY e.category_id, c.name, c.icon, c.color, e.type
       ORDER BY total DESC`,
      params
    );

    const grandTotal = result.rows.reduce((sum, r) => sum + parseFloat(r.total as unknown as string), 0);

    const breakdown = result.rows.map((r) => {
      const total = parseFloat(r.total as unknown as string);
      return {
        ...r,
        total,
        count: parseInt(r.count as unknown as string, 10),
        percentage: grandTotal > 0 ? Math.round((total / grandTotal) * 100 * 10) / 10 : 0,
      };
    });

    res.json({
      success: true,
      data: {
        start_date: startDate,
        end_date: endDate,
        grand_total: grandTotal,
        breakdown,
      },
    });
  } catch (error) {
    next(error);
  }
}
