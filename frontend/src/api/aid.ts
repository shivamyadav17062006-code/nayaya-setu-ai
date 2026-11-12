import apiClient from './client'
import type { AidProvider, NalsaEligibilityResult, ApiResponse } from '@/types'

export const aidApi = {
  getProviders: async (params?: {
    state?: string
    district?: string
    category?: string
    type?: string
    page?: number
    limit?: number
  }): Promise<AidProvider[]> => {
    try {
      const { data } = await apiClient.get<any>('/aid', { params })
      if (Array.isArray(data)) return data
      if (data?.data && Array.isArray(data.data)) return data.data
      return []
    } catch {
      return []
    }
  },

  getProvider: async (id: string): Promise<AidProvider> => {
    const { data } = await apiClient.get<any>(`/aid/${id}`)
    return data?.data || data
  },

  checkNalsaEligibility: async (params: {
    income: number
    category: string
    state: string
  }): Promise<NalsaEligibilityResult> => {
    const { data } = await apiClient.post<NalsaEligibilityResult>('/aid/nalsa-eligibility', params)
    return data
  },

  getDistricts: async (state: string): Promise<string[]> => {
    const { data } = await apiClient.get<any>(`/aid/districts/${state}`)
    return data?.data || []
  },
}
