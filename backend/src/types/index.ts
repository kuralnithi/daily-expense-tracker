// Core entity types
export interface User {
  id: string;
  name: string;
  email: string | null;
  currency: string;
  created_at: Date;
  updated_at: Date;
}

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
  is_default: boolean;
  created_at: Date;
}

export interface Expense {
  id: string;
  user_id: string;
  category_id: string | null;
  short_term_budget_id?: string | null;
  amount: number;
  description: string | null;
  note: string | null;
  date: string;
  type: 'expense' | 'income';
  created_at: Date;
  updated_at: Date;
  // Joined fields
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  short_term_budget_name?: string;
}

export interface ShortTermBudget {
  id: string;
  user_id: string;
  name: string;
  total_amount: number;
  description: string | null;
  color: string;
  icon: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  // Calculated fields
  total_spent?: number;
  remaining_amount?: number;
  percentage_used?: number;
  expense_count?: number;
  expenses?: Expense[];
}

export interface CreateShortTermBudgetDto {
  name: string;
  total_amount: number;
  description?: string;
  color?: string;
  icon?: string;
  start_date?: string;
  end_date?: string;
}

export interface UpdateShortTermBudgetDto {
  name?: string;
  total_amount?: number;
  description?: string;
  color?: string;
  icon?: string;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}

export interface AddBudgetFundsDto {
  amount: number;
  note?: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly';
  month: number | null;
  year: number;
  created_at: Date;
  // Joined fields
  category_name?: string;
  spent?: number;
}

// DTOs (Data Transfer Objects)
export interface CreateExpenseDto {
  amount: number;
  description?: string;
  note?: string;
  date?: string;
  category_id?: string;
  short_term_budget_id?: string;
  type?: 'expense' | 'income';
}

export interface UpdateExpenseDto {
  amount?: number;
  description?: string;
  note?: string;
  date?: string;
  category_id?: string | null;
  short_term_budget_id?: string | null;
  type?: 'expense' | 'income';
}

export interface CreateCategoryDto {
  name: string;
  icon?: string;
  color?: string;
  type?: 'expense' | 'income';
}

export interface UpdateCategoryDto {
  name?: string;
  icon?: string;
  color?: string;
  type?: 'expense' | 'income';
}

export interface CreateUserDto {
  name: string;
  email?: string;
  currency?: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  currency?: string;
}

// API response wrappers
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Filters
export interface ExpenseFilters {
  startDate?: string;
  endDate?: string;
  category_id?: string;
  short_term_budget_id?: string;
  type?: 'expense' | 'income';
  page?: number;
  limit?: number;
}

// Summary types
export interface CategoryTotal {
  category_id: string | null;
  category_name: string;
  category_icon: string;
  category_color: string;
  type: 'expense' | 'income';
  total: number;
  count: number;
}

export interface DailySummary {
  date: string;
  total_expense: number;
  total_income: number;
  net: number;
  count: number;
}

export interface ExpenseSummary {
  total_expense: number;
  total_income: number;
  net: number;
  by_category: CategoryTotal[];
  daily: DailySummary[];
}

export interface MonthlySummary {
  month: number;
  year: number;
  total_expense: number;
  total_income: number;
  net: number;
  by_category: CategoryTotal[];
  daily: DailySummary[];
  budget_comparison?: BudgetComparison[];
}

export interface WeeklySummary {
  week_start: string;
  week_end: string;
  total_expense: number;
  total_income: number;
  net: number;
  by_category: CategoryTotal[];
  daily: DailySummary[];
}

export interface BudgetComparison {
  budget_id: string;
  category_id: string | null;
  category_name: string;
  budgeted: number;
  spent: number;
  remaining: number;
  percentage_used: number;
}

// Express request extension
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
