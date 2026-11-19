import { create } from 'zustand';
import { Category } from '../types';
import { categoriesApi } from '../api/categories';

interface CategoryState {
  categories: Category[];
  expenseCategories: Category[];
  incomeCategories: Category[];
  loading: boolean;
  error: string | null;

  fetchCategories: () => Promise<void>;
  clearError: () => void;
}

export const useCategoryStore = create<CategoryState>((set) => ({
  categories: [],
  expenseCategories: [],
  incomeCategories: [],
  loading: false,
  error: null,

  fetchCategories: async () => {
    set({ loading: true, error: null });
    try {
      const response = await categoriesApi.getAll();
      const all = response.data;
      set({
        categories: all,
        expenseCategories: all.filter((c) => c.type === 'expense'),
        incomeCategories: all.filter((c) => c.type === 'income'),
        loading: false,
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
