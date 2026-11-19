import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserState {
  name: string;
  currency: string;
  monthlyBudget: number;
  loading: boolean;

  setName: (name: string) => Promise<void>;
  setCurrency: (currency: string) => Promise<void>;
  setMonthlyBudget: (budget: number) => Promise<void>;
  loadUserData: () => Promise<void>;
}

const STORAGE_KEYS = {
  NAME: '@user_name',
  CURRENCY: '@user_currency',
  BUDGET: '@monthly_budget',
};

export const useUserStore = create<UserState>((set) => ({
  name: 'User',
  currency: 'INR',
  monthlyBudget: 50000,
  loading: false,

  setName: async (name: string) => {
    await AsyncStorage.setItem(STORAGE_KEYS.NAME, name);
    set({ name });
  },

  setCurrency: async (currency: string) => {
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENCY, currency);
    set({ currency });
  },

  setMonthlyBudget: async (budget: number) => {
    await AsyncStorage.setItem(STORAGE_KEYS.BUDGET, budget.toString());
    set({ monthlyBudget: budget });
  },

  loadUserData: async () => {
    set({ loading: true });
    try {
      const [name, currency, budget] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.NAME),
        AsyncStorage.getItem(STORAGE_KEYS.CURRENCY),
        AsyncStorage.getItem(STORAGE_KEYS.BUDGET),
      ]);
      set({
        name: name || 'User',
        currency: currency || 'INR',
        monthlyBudget: budget ? parseFloat(budget) : 50000,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },
}));
