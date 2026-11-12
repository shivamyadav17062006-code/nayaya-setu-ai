import apiClient from './client'
import type { WorkflowCategory, Workflow, ApiResponse } from '@/types'

export const workflowsApi = {
  getCategories: async (): Promise<WorkflowCategory[]> => {
    try {
      const { data } = await apiClient.get<any>('/workflows')
      if (Array.isArray(data)) return data
      if (data?.data && Array.isArray(data.data)) return data.data
      return []
    } catch {
      return []
    }
  },

  getWorkflow: async (categoryId: string): Promise<Workflow> => {
    const { data } = await apiClient.get<any>(`/workflows/${categoryId}`)
    return data?.data || data
  },

  getWorkflowByCategory: async (category: string): Promise<Workflow> => {
    const { data } = await apiClient.get<any>(`/workflows/${category}`)
    return data?.data || data
  },
}
