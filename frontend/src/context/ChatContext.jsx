import { createContext, useContext, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { sendMessage, getChatHistory, listChats, updateChat, deleteChat } from '../services/api'

const ChatContext = createContext()

export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}

export const ChatProvider = ({ children }) => {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [currentChatId, setCurrentChatId] = useState(null)
  const [chatList, setChatList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadChatList = useCallback(async () => {
    if (!user) return
    
    // Skip API call if endpoint is not configured (for local UI testing)
    if (!import.meta.env.VITE_API_ENDPOINT) {
      // Set mock data for UI testing
      setChatList([
        {
          chatId: 'demo-1',
          title: 'Feeling anxious today...',
          lastMessageTime: new Date().toISOString(),
          createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          chatId: 'demo-2',
          title: 'Need support',
          lastMessageTime: new Date(Date.now() - 3600000).toISOString(),
          createdAt: new Date(Date.now() - 172800000).toISOString()
        }
      ])
      return
    }
    
    try {
      const response = await listChats()
      if (response && response.chats) {
        setChatList(response.chats)
      }
    } catch (err) {
      console.error('Failed to load chat list:', err)
    }
  }, [user])

  const loadChatHistory = useCallback(async (chatId) => {
    if (!user || !chatId) return
    
    // Skip API call if endpoint is not configured (for local UI testing)
    if (!import.meta.env.VITE_API_ENDPOINT) {
      // Set mock messages for UI testing
      setMessages([
        {
          id: '1',
          text: 'Hello, I\'m feeling a bit anxious today.',
          sender: 'user',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '2',
          text: 'I understand that anxiety can be really challenging. Take a deep breath with me. What\'s been on your mind today?',
          sender: 'ai',
          timestamp: new Date(Date.now() - 3500000).toISOString(),
          sentiment: 'NEUTRAL'
        },
        {
          id: '3',
          text: 'Work has been really stressful lately.',
          sender: 'user',
          timestamp: new Date(Date.now() - 3400000).toISOString(),
        },
        {
          id: '4',
          text: 'Work stress can feel overwhelming. Remember, it\'s okay to take breaks and prioritize your wellbeing. What specific aspects of work are causing you the most stress?',
          sender: 'ai',
          timestamp: new Date(Date.now() - 3300000).toISOString(),
          sentiment: 'NEGATIVE'
        }
      ])
      setCurrentChatId(chatId)
      return
    }
    
    try {
      const history = await getChatHistory(chatId)
      if (history && history.messages) {
        setMessages(history.messages)
        setCurrentChatId(chatId)
      }
    } catch (err) {
      console.error('Failed to load chat history:', err)
    }
  }, [user])

  const addMessage = useCallback(async (text, title = null) => {
    if (!text.trim()) return

    const userMessage = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setLoading(true)
    setError(null)

    // Skip API call if endpoint is not configured (for local UI testing)
    if (!import.meta.env.VITE_API_ENDPOINT) {
      // Simulate AI response for UI testing
      setTimeout(async () => {
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          text: 'I understand how you\'re feeling. This is a demo response since the backend is not configured. When you deploy the backend, you\'ll get real AI-powered empathetic responses.',
          sender: 'ai',
          timestamp: new Date().toISOString(),
          sentiment: 'NEUTRAL',
        }
        setMessages((prev) => [...prev, aiMessage])
        setLoading(false)
        
        // Create new chat if needed
        if (!currentChatId) {
          const newChatId = `demo-${Date.now()}`
          setCurrentChatId(newChatId)
          await loadChatList()
        }
      }, 1000) // Simulate 1 second delay
      return
    }

    try {
      const response = await sendMessage(text.trim(), currentChatId, title)
      
      // Update current chat ID if this is a new chat
      if (response.chatId && !currentChatId) {
        setCurrentChatId(response.chatId)
        // Refresh chat list to include new chat
        await loadChatList()
      }
      
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: response.message,
        sender: 'ai',
        timestamp: new Date().toISOString(),
        sentiment: response.sentiment,
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (err) {
      setError(err.message || 'Failed to send message. Please try again.')
      console.error('Chat error:', err)
    } finally {
      setLoading(false)
    }
  }, [currentChatId, loadChatList])

  const startNewChat = useCallback(() => {
    setCurrentChatId(null)
    setMessages([])
    setError(null)
  }, [])

  const selectChat = useCallback(async (chatId) => {
    setCurrentChatId(chatId)
    await loadChatHistory(chatId)
  }, [loadChatHistory])

  const clearChat = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  const updateChatTitle = useCallback(async (chatId, newTitle) => {
    if (!chatId || !newTitle?.trim()) return false

    // Skip API call if endpoint is not configured (for local UI testing)
    if (!import.meta.env.VITE_API_ENDPOINT) {
      setChatList((prev) =>
        prev.map((chat) =>
          chat.chatId === chatId ? { ...chat, title: newTitle.trim() } : chat
        )
      )
      return true
    }

    try {
      await updateChat(chatId, newTitle)
      // Reload chat list to ensure consistency with backend
      await loadChatList()
      return true
    } catch (err) {
      setError(err.message || 'Failed to update chat title')
      console.error('Failed to update chat:', err)
      return false
    }
  }, [loadChatList])

  const removeChat = useCallback(async (chatId) => {
    if (!chatId) return false

    // Skip API call if endpoint is not configured (for local UI testing)
    if (!import.meta.env.VITE_API_ENDPOINT) {
      setChatList((prev) => prev.filter((chat) => chat.chatId !== chatId))
      if (currentChatId === chatId) {
        setCurrentChatId(null)
        setMessages([])
      }
      return true
    }

    try {
      await deleteChat(chatId)
      // Clear current chat if it was deleted
      if (currentChatId === chatId) {
        setCurrentChatId(null)
        setMessages([])
      }
      // Reload chat list to ensure consistency with backend
      await loadChatList()
      return true
    } catch (err) {
      setError(err.message || 'Failed to delete chat')
      console.error('Failed to delete chat:', err)
      return false
    }
  }, [currentChatId, loadChatList])

  const value = {
    messages,
    currentChatId,
    chatList,
    loading,
    error,
    addMessage,
    startNewChat,
    selectChat,
    clearChat,
    loadChatHistory,
    loadChatList,
    updateChatTitle,
    removeChat,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

