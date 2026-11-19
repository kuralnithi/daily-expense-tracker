import { Request, Response, NextFunction } from 'express';
import { query } from '../db/connection';
import { HttpError } from '../middleware/errorHandler';
import { User, CreateUserDto, UpdateUserDto } from '../types';
import { seedDefaultCategories } from '../db/migrate';

export async function getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const result = await query<User>(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw new HttpError('User not found', 404);
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

export async function getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;

    const result = await query<User>(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new HttpError('User not found', 404);
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto: CreateUserDto = req.body;

    // Check for existing email
    if (dto.email) {
      const emailCheck = await query<User>(
        'SELECT id FROM users WHERE email = $1',
        [dto.email]
      );
      if (emailCheck.rows.length > 0) {
        throw new HttpError('Email already registered', 409);
      }
    }

    const result = await query<User>(
      `INSERT INTO users (name, email, currency)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [dto.name, dto.email || null, dto.currency || 'INR']
    );

    const newUser = result.rows[0];

    // Seed default categories for the new user
    try {
      await seedDefaultCategories(newUser.id);
    } catch (seedError) {
      console.error('Warning: failed to seed categories for new user:', seedError);
    }

    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;
    const dto: UpdateUserDto = req.body;

    const setClauses: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (dto.name !== undefined) { setClauses.push(`name = $${idx}`); params.push(dto.name); idx++; }
    if (dto.email !== undefined) { setClauses.push(`email = $${idx}`); params.push(dto.email); idx++; }
    if (dto.currency !== undefined) { setClauses.push(`currency = $${idx}`); params.push(dto.currency); idx++; }

    if (setClauses.length === 0) {
      throw new HttpError('No fields to update', 400);
    }

    setClauses.push(`updated_at = NOW()`);
    params.push(userId);

    const result = await query<User>(
      `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      throw new HttpError('User not found', 404);
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
}
