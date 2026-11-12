import apiClient from './client'
import type { EligibilityInput, EligibilityResult } from '@/types'

export const eligibilityApi = {
  checkEligibility: async (input: EligibilityInput): Promise<EligibilityResult> => {
    try {
      const { data } = await apiClient.post<any>('/eligibility', input)
      return data?.data || data
    } catch {
      // Re-throw so page fallback activates
      throw new Error('Eligibility service offline')
    }
  },
}
