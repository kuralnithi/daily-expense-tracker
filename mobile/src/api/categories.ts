import apiClient from './client';
import { Category, CreateCategoryDto, ApiResponse } from '../types';

export const categoriesApi = {
  getAll: async (type?: 'expense' | 'income'): Promise<ApiResponse<Category[]>> => {
    const params = type ? { type } : {};
    const response = await apiClient.get('/categories', { params });
    return response.data;
  },

  create: async (data: CreateCategoryDto): Promise<ApiResponse<Category>> => {
    const response = await apiClient.post('/categories', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateCategoryDto>): Promise<ApiResponse<Category>> => {
    const response = await apiClient.put(`/categories/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/categories/${id}`);
    return response.data;
  },
};
