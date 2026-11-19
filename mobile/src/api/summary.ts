import apiClient from './client';
import { ExpenseSummary, DailySummary, ApiResponse } from '../types';

export interface SummaryParams {
  month?: number;
  year?: number;
  start_date?: string;
  end_date?: string;
}

export const summaryApi = {
  getSummary: async (params: SummaryParams = {}): Promise<ApiResponse<ExpenseSummary>> => {
    const response = await apiClient.get('/summary', { params });
    return response.data;
  },

  getDaily: async (params: SummaryParams = {}): Promise<ApiResponse<DailySummary[]>> => {
    const response = await apiClient.get('/summary/daily', { params });
    return response.data;
  },

  getMonthly: async (year?: number): Promise<ApiResponse<any[]>> => {
    const params = year ? { year } : {};
    const response = await apiClient.get('/summary/monthly', { params });
    return response.data;
  },
};
