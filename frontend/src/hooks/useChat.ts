import { useState, useCallback, useRef, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import toast from 'react-hot-toast'
import type { ChatMessage, ChatSession } from '@/types'
import { chatApi } from '@/api/chat'

// Generate a simple UUID without depending on external package
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

interface UseChatOptions {
  language?: string
}

export function useChat({ language = 'en' }: UseChatOptions = {}) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const activeSession = sessions.find(s => s.id === activeSessionId)

  // Load persisted sessions from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nyayasaathi_sessions')
      if (saved) {
        const parsed = JSON.parse(saved) as ChatSession[]
        const restored = parsed.map(s => ({
          ...s,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
          messages: s.messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) })),
        }))
        setSessions(restored)
      }
    } catch {
      // ignore parse errors
    }
  }, [])

  const persistSessions = useCallback((updated: ChatSession[]) => {
    setSessions(updated)
    try {
      localStorage.setItem('nyayasaathi_sessions', JSON.stringify(updated))
    } catch {
      // ignore storage errors
    }
  }, [])

  const startNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: generateId(),
      title: 'New Conversation',
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: [],
      language,
    }
    persistSessions([newSession, ...sessions])
    setActiveSessionId(newSession.id)
    setMessages([])
    return newSession.id
  }, [sessions, language, persistSessions])

  const selectSession = useCallback((sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      setActiveSessionId(sessionId)
      setMessages(session.messages)
    }
  }, [sessions])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return

    // Ensure we have an active session
    let sessionId = activeSessionId
    if (!sessionId) {
      sessionId = startNewSession()
    }

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      language,
    }

    // Optimistically add user message
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setIsLoading(true)
    setIsTyping(true)

    // Update session with user message
    const updatedSessions = sessions.map(s =>
      s.id === sessionId
        ? {
            ...s,
            messages: updatedMessages,
            title: s.messages.length === 0 ? content.slice(0, 50) : s.title,
            updatedAt: new Date(),
          }
        : s
    )
    persistSessions(updatedSessions)

    try {
      abortRef.current = new AbortController()

      const response = await chatApi.sendMessage({
        message: content.trim(),
        sessionId: sessionId!,
        language,
      })

      setIsTyping(false)

      const assistantMessage: ChatMessage = {
        ...response.message,
        timestamp: new Date(response.message.timestamp),
      }

      const finalMessages = [...updatedMessages, assistantMessage]
      setMessages(finalMessages)

      const finalSessions = updatedSessions.map(s =>
        s.id === sessionId
          ? { ...s, messages: finalMessages, updatedAt: new Date() }
          : s
      )
      persistSessions(finalSessions)
    } catch (err) {
      setIsTyping(false)
      if (err instanceof Error && err.name !== 'AbortError') {
        // Add error message in chat
        const errorMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: 'I apologize, I encountered an error processing your request. Please try again.',
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, errorMessage])
        toast.error('Failed to send message. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [activeSessionId, isLoading, messages, sessions, language, startNewSession, persistSessions])

  const deleteSession = useCallback((sessionId: string) => {
    const updated = sessions.filter(s => s.id !== sessionId)
    persistSessions(updated)
    if (activeSessionId === sessionId) {
      setActiveSessionId(null)
      setMessages([])
    }
  }, [sessions, activeSessionId, persistSessions])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return {
    sessions,
    activeSession,
    activeSessionId,
    messages,
    isLoading,
    isTyping,
    sendMessage,
    startNewSession,
    selectSession,
    deleteSession,
    clearMessages,
  }
}
