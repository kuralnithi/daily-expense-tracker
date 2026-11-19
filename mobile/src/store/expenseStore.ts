import { create } from 'zustand';
import { Expense, CreateExpenseDto, UpdateExpenseDto } from '../types';
import { expensesApi, GetExpensesParams } from '../api/expenses';

interface ExpenseState {
  expenses: Expense[];
  recentExpenses: Expense[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;

  fetchExpenses: (params?: GetExpensesParams) => Promise<void>;
  fetchRecentExpenses: () => Promise<void>;
  createExpense: (data: CreateExpenseDto) => Promise<Expense>;
  updateExpense: (id: string, data: UpdateExpenseDto) => Promise<Expense>;
  deleteExpense: (id: string) => Promise<void>;
  refresh: (params?: GetExpensesParams) => Promise<void>;
  clearError: () => void;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  recentExpenses: [],
  loading: false,
  refreshing: false,
  error: null,
  totalPages: 1,
  currentPage: 1,

  fetchExpenses: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await expensesApi.getAll({ limit: 50, ...params });
      set({
        expenses: response.data,
        totalPages: response.pagination.pages,
        currentPage: response.pagination.page,
        loading: false,
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchRecentExpenses: async () => {
    try {
      const response = await expensesApi.getAll({ limit: 5, sort: 'created_at', order: 'desc' });
      set({ recentExpenses: response.data });
    } catch (err: any) {
      // silent fail for recent
    }
  },

  createExpense: async (data: CreateExpenseDto) => {
    const response = await expensesApi.create(data);
    const newExpense = response.data;
    set((state) => ({
      expenses: [newExpense, ...state.expenses],
      recentExpenses: [newExpense, ...state.recentExpenses].slice(0, 5),
    }));
    return newExpense;
  },

  updateExpense: async (id: string, data: UpdateExpenseDto) => {
    const response = await expensesApi.update(id, data);
    const updated = response.data;
    set((state) => ({
      expenses: state.expenses.map((e) => (e.id === id ? updated : e)),
      recentExpenses: state.recentExpenses.map((e) => (e.id === id ? updated : e)),
    }));
    return updated;
  },

  deleteExpense: async (id: string) => {
    await expensesApi.delete(id);
    set((state) => ({
      expenses: state.expenses.filter((e) => e.id !== id),
      recentExpenses: state.recentExpenses.filter((e) => e.id !== id),
    }));
  },

  refresh: async (params = {}) => {
    set({ refreshing: true, error: null });
    try {
      const response = await expensesApi.getAll({ limit: 50, ...params });
      set({
        expenses: response.data,
        totalPages: response.pagination.pages,
        currentPage: response.pagination.page,
        refreshing: false,
      });
    } catch (err: any) {
      set({ error: err.message, refreshing: false });
    }
  },

  clearError: () => set({ error: null }),
}));
