import apiClient from './client';
import {
  ShortTermBudget,
  CreateShortTermBudgetDto,
  UpdateShortTermBudgetDto,
  ApiResponse,
} from '../types';

export const shortTermBudgetsApi = {
  // Get all short-term budgets with spent and remaining calculations
  getAll: async (): Promise<ApiResponse<ShortTermBudget[]>> => {
    const response = await apiClient.get<ApiResponse<ShortTermBudget[]>>('/short-term-budgets');
    return response.data;
  },

  // Get single budget with its expenses list
  getById: async (id: string): Promise<ApiResponse<ShortTermBudget>> => {
    const response = await apiClient.get<ApiResponse<ShortTermBudget>>(`/short-term-budgets/${id}`);
    return response.data;
  },

  // Create new short-term budget
  create: async (data: CreateShortTermBudgetDto): Promise<ApiResponse<ShortTermBudget>> => {
    const response = await apiClient.post<ApiResponse<ShortTermBudget>>('/short-term-budgets', data);
    return response.data;
  },

  // Update budget
  update: async (id: string, data: UpdateShortTermBudgetDto): Promise<ApiResponse<ShortTermBudget>> => {
    const response = await apiClient.put<ApiResponse<ShortTermBudget>>(`/short-term-budgets/${id}`, data);
    return response.data;
  },

  // Add more funds to an existing budget
  addFunds: async (id: string, amount: number): Promise<ApiResponse<ShortTermBudget>> => {
    const response = await apiClient.post<ApiResponse<ShortTermBudget>>(`/short-term-budgets/${id}/add-funds`, { amount });
    return response.data;
  },

  // Delete budget
  delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/short-term-budgets/${id}`);
    return response.data;
  },
};
