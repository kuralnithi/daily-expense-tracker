// All TypeScript types for the Daily Expense Tracker app

export interface User {
  id: string;
  name: string;
  email?: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id?: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
  is_default: boolean;
  created_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  category_id?: string;
  category?: Category;
  amount: number;
  description?: string;
  note?: string;
  date: string;
  type: 'expense' | 'income';
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id?: string;
  category?: Category;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly';
  month?: number;
  year: number;
  created_at: string;
}

export interface CreateExpenseDto {
  category_id?: string;
  amount: number;
  description?: string;
  note?: string;
  date: string;
  type: 'expense' | 'income';
}

export interface UpdateExpenseDto {
  category_id?: string;
  amount?: number;
  description?: string;
  note?: string;
  date?: string;
  type?: 'expense' | 'income';
}

export interface CreateCategoryDto {
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ExpenseSummary {
  total_expenses: number;
  total_income: number;
  net: number;
  expense_count: number;
  income_count: number;
  by_category: CategorySummary[];
}

export interface CategorySummary {
  category_id: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  total: number;
  count: number;
  percentage: number;
}

export interface DailySummary {
  date: string;
  total_expenses: number;
  total_income: number;
  net: number;
}

export interface MonthlyTrend {
  month: string;
  year: number;
  total_expenses: number;
  total_income: number;
}

export type ExpenseFilter = 'today' | 'week' | 'month' | 'all';
