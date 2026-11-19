import apiClient from './client';
import {
  Expense,
  CreateExpenseDto,
  UpdateExpenseDto,
  ApiResponse,
  PaginatedResponse,
} from '../types';

export interface GetExpensesParams {
  page?: number;
  limit?: number;
  type?: 'expense' | 'income';
  category_id?: string;
  start_date?: string;
  end_date?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export const expensesApi = {
  getAll: async (params: GetExpensesParams = {}): Promise<PaginatedResponse<Expense>> => {
    const response = await apiClient.get('/expenses', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Expense>> => {
    const response = await apiClient.get(`/expenses/${id}`);
    return response.data;
  },

  create: async (data: CreateExpenseDto): Promise<ApiResponse<Expense>> => {
    const response = await apiClient.post('/expenses', data);
    return response.data;
  },

  update: async (id: string, data: UpdateExpenseDto): Promise<ApiResponse<Expense>> => {
    const response = await apiClient.put(`/expenses/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/expenses/${id}`);
    return response.data;
  },
};
