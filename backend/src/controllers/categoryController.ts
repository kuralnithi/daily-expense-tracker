import { Request, Response, NextFunction } from 'express';
import { query } from '../db/connection';
import { HttpError } from '../middleware/errorHandler';
import { Category, CreateCategoryDto, UpdateCategoryDto } from '../types';

export async function getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;

    // Return both user's own categories AND global defaults (user_id IS NULL)
    const result = await query<Category>(
      `SELECT * FROM categories
       WHERE user_id = $1 OR (is_default = true AND user_id = $1)
       ORDER BY is_default DESC, type ASC, name ASC`,
      [userId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
}

export async function createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;
    const dto: CreateCategoryDto = req.body;

    // Check for duplicate name for this user
    const existing = await query<Category>(
      'SELECT id FROM categories WHERE user_id = $1 AND LOWER(name) = LOWER($2)',
      [userId, dto.name]
    );
    if (existing.rows.length > 0) {
      throw new HttpError('Category with this name already exists', 409);
    }

    const result = await query<Category>(
      `INSERT INTO categories (user_id, name, icon, color, type, is_default)
       VALUES ($1, $2, $3, $4, $5, false)
       RETURNING *`,
      [
        userId,
        dto.name,
        dto.icon || 'circle',
        dto.color || '#6366f1',
        dto.type || 'expense',
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const dto: UpdateCategoryDto = req.body;

    // Verify ownership (cannot update defaults of other users)
    const existing = await query<Category>(
      'SELECT id FROM categories WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (existing.rows.length === 0) {
      throw new HttpError('Category not found or not editable', 404);
    }

    const setClauses: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (dto.name !== undefined) { setClauses.push(`name = $${idx}`); params.push(dto.name); idx++; }
    if (dto.icon !== undefined) { setClauses.push(`icon = $${idx}`); params.push(dto.icon); idx++; }
    if (dto.color !== undefined) { setClauses.push(`color = $${idx}`); params.push(dto.color); idx++; }
    if (dto.type !== undefined) { setClauses.push(`type = $${idx}`); params.push(dto.type); idx++; }

    if (setClauses.length === 0) {
      throw new HttpError('No fields to update', 400);
    }

    params.push(id, userId);

    const result = await query<Category>(
      `UPDATE categories SET ${setClauses.join(', ')} WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`,
      params
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    // Disallow deleting default categories
    const existing = await query<Category>(
      'SELECT id, is_default FROM categories WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (existing.rows.length === 0) {
      throw new HttpError('Category not found', 404);
    }
    if (existing.rows[0].is_default) {
      throw new HttpError('Cannot delete a default category', 403);
    }

    await query('DELETE FROM categories WHERE id = $1 AND user_id = $2', [id, userId]);

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
}
