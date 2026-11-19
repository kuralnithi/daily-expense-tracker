import { create } from 'zustand';
import {
  ShortTermBudget,
  CreateShortTermBudgetDto,
  UpdateShortTermBudgetDto,
} from '../types';
import { shortTermBudgetsApi } from '../api/shortTermBudgets';

interface ShortTermBudgetState {
  budgets: ShortTermBudget[];
  selectedBudget: ShortTermBudget | null;
  loading: boolean;
  error: string | null;

  fetchBudgets: () => Promise<void>;
  fetchBudgetById: (id: string) => Promise<ShortTermBudget | null>;
  createBudget: (data: CreateShortTermBudgetDto) => Promise<boolean>;
  updateBudget: (id: string, data: UpdateShortTermBudgetDto) => Promise<boolean>;
  addFunds: (id: string, amount: number) => Promise<boolean>;
  deleteBudget: (id: string) => Promise<boolean>;
  clearSelected: () => void;
}

export const useShortTermBudgetStore = create<ShortTermBudgetState>((set, get) => ({
  budgets: [],
  selectedBudget: null,
  loading: false,
  error: null,

  fetchBudgets: async () => {
    set({ loading: true, error: null });
    try {
      const response = await shortTermBudgetsApi.getAll();
      set({ budgets: response.data || [], loading: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to load short-term budgets',
        loading: false,
      });
    }
  },

  fetchBudgetById: async (id: string) => {
    try {
      const response = await shortTermBudgetsApi.getById(id);
      if (response.data) {
        set({ selectedBudget: response.data });
        return response.data;
      }
      return null;
    } catch {
      return null;
    }
  },

  createBudget: async (data: CreateShortTermBudgetDto) => {
    set({ loading: true, error: null });
    try {
      const response = await shortTermBudgetsApi.create(data);
      if (response.data) {
        set((state) => ({
          budgets: [response.data, ...state.budgets],
          loading: false,
        }));
        return true;
      }
      return false;
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to create budget',
        loading: false,
      });
      return false;
    }
  },

  updateBudget: async (id: string, data: UpdateShortTermBudgetDto) => {
    try {
      const response = await shortTermBudgetsApi.update(id, data);
      if (response.data) {
        set((state) => ({
          budgets: state.budgets.map((b) => (b.id === id ? response.data : b)),
          selectedBudget: state.selectedBudget?.id === id ? response.data : state.selectedBudget,
        }));
        return true;
      }
      return false;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to update budget' });
      return false;
    }
  },

  addFunds: async (id: string, amount: number) => {
    try {
      const response = await shortTermBudgetsApi.addFunds(id, amount);
      if (response.data) {
        set((state) => ({
          budgets: state.budgets.map((b) => (b.id === id ? response.data : b)),
          selectedBudget: state.selectedBudget?.id === id ? response.data : state.selectedBudget,
        }));
        return true;
      }
      return false;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to add funds' });
      return false;
    }
  },

  deleteBudget: async (id: string) => {
    try {
      await shortTermBudgetsApi.delete(id);
      set((state) => ({
        budgets: state.budgets.filter((b) => b.id !== id),
        selectedBudget: state.selectedBudget?.id === id ? null : state.selectedBudget,
      }));
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to delete budget' });
      return false;
    }
  },

  clearSelected: () => set({ selectedBudget: null }),
}));
