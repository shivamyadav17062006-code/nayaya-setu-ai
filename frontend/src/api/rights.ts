import apiClient from './client'
import type { RightCategory, LegalSection, ApiResponse } from '@/types'

export const rightsApi = {
  getCategories: async (): Promise<RightCategory[]> => {
    try {
      const { data } = await apiClient.get<any>('/rights')
      if (Array.isArray(data)) return data
      if (data?.data && Array.isArray(data.data)) return data.data
      return []
    } catch {
      return []
    }
  },

  getCategory: async (categoryId: string): Promise<RightCategory> => {
    const { data } = await apiClient.get<any>(`/rights/${categoryId}`)
    return data?.data || data
  },

  getCategorySections: async (categoryId: string): Promise<{ category?: RightCategory; sections: LegalSection[] }> => {
    try {
      const { data } = await apiClient.get<any>(`/rights/${categoryId}`)
      const payload = data?.data || data
      if (payload?.sections) {
        return { category: payload, sections: payload.sections }
      }
      return { sections: Array.isArray(payload) ? payload : [] }
    } catch {
      return { sections: [] }
    }
  },

  getSections: async (params: {
    categoryId?: string
    state?: string
    beneficiaryType?: string
    search?: string
    page?: number
    limit?: number
  }): Promise<ApiResponse<LegalSection[]>> => {
    const { data } = await apiClient.get<ApiResponse<LegalSection[]>>('/rights/sections', { params })
    return data
  },

  getSection: async (sectionId: string): Promise<LegalSection> => {
    const { data } = await apiClient.get<ApiResponse<LegalSection>>(`/rights/sections/${sectionId}`)
    return data.data
  },

  searchRights: async (query: string, language?: string): Promise<LegalSection[]> => {
    const { data } = await apiClient.get<ApiResponse<LegalSection[]>>('/rights/search', {
      params: { q: query, language },
    })
    return data.data
  },
}
