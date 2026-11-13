import apiClient from './client'
import type { ChatMessage, ChatRequest, ChatResponse, ChatSession, Citation } from '@/types'

interface ApiEnvelope<T> {
  success: boolean
  data: T
}

interface BackendSource {
  act?: string
  section?: string
  year?: number
  title?: string
  relevance?: string
  sourceUrl?: string
}

interface BackendChatResponse {
  answer: string
  sessionId: string
  language?: string
  sources?: BackendSource[]
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function toCitations(sources: BackendSource[] = []): Citation[] {
  return sources.map((source) => ({
    id: newId(),
    actName: source.act ?? 'Indian Statute',
    sectionNumber: source.section,
    year: source.year,
    url: source.sourceUrl,
  }))
}

export const chatApi = {
  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    const { data } = await apiClient.post<ApiEnvelope<BackendChatResponse>>('/chat', request)
    const payload = data.data

    const message: ChatMessage = {
      id: newId(),
      role: 'assistant',
      content: payload.answer,
      timestamp: new Date(),
      language: payload.language ?? request.language,
      citations: toCitations(payload.sources),
    }

    return {
      sessionId: payload.sessionId ?? request.sessionId ?? '',
      message,
    }
  },

  getSession: async (sessionId: string): Promise<ChatSession> => {
    const { data } = await apiClient.get<ChatSession>(`/chat/sessions/${sessionId}`)
    return data
  },

  getSessions: async (): Promise<ChatSession[]> => {
    const { data } = await apiClient.get<ChatSession[]>('/chat/sessions')
    return data
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    await apiClient.delete(`/chat/sessions/${sessionId}`)
  },
}
