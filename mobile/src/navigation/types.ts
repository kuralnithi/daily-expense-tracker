import { NavigatorScreenParams } from '@react-navigation/native';
import { Expense } from '../types';

export type TabParamList = {
  Home: undefined;
  Expenses: undefined;
  Budgets: undefined;
  Analytics: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>;
  AddExpense: { expense?: Expense; prefilledBudgetId?: string } | undefined;
  EditExpense: { expense: Expense };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
