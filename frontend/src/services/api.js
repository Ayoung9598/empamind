import axios from 'axios'
import { fetchAuthSession } from 'aws-amplify/auth'

const API_BASE_URL = import.meta.env.VITE_API_ENDPOINT || ''

const getAuthHeaders = async () => {
  // Skip auth if API endpoint is not configured (for local UI testing)
  if (!API_BASE_URL || !import.meta.env.VITE_COGNITO_USER_POOL_ID) {
    return {
      'Content-Type': 'application/json',
    }
  }
  
  try {
    const session = await fetchAuthSession()
    if (session.tokens?.idToken) {
      return {
        Authorization: `Bearer ${session.tokens.idToken.toString()}`,
        'Content-Type': 'application/json',
      }
    }
  } catch (error) {
    console.error('Failed to get auth session:', error)
  }
  return {
    'Content-Type': 'application/json',
  }
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
})

apiClient.interceptors.request.use(
  async (config) => {
    const headers = await getAuthHeaders()
    config.headers = { ...config.headers, ...headers }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      throw new Error(error.response.data?.message || error.response.data?.error || 'Request failed')
    } else if (error.request) {
      throw new Error('Network error. Please check your connection.')
    } else {
      throw new Error(error.message || 'An unexpected error occurred')
    }
  }
)

export const sendMessage = async (message, chatId = null, title = null) => {
  const payload = { message }
  if (chatId) payload.chatId = chatId
  if (title) payload.title = title
  return apiClient.post('/chat', payload)
}

export const getChatHistory = async (chatId) => {
  if (!chatId) {
    throw new Error('chatId is required to get chat history')
  }
  return apiClient.get(`/chat/${chatId}`)
}

export const listChats = async () => {
  return apiClient.get('/chats')
}

export const updateChat = async (chatId, title) => {
  if (!chatId) {
    throw new Error('chatId is required to update chat')
  }
  if (!title || !title.trim()) {
    throw new Error('title is required to update chat')
  }
  return apiClient.put(`/chat/${chatId}`, { title: title.trim() })
}

export const deleteChat = async (chatId) => {
  if (!chatId) {
    throw new Error('chatId is required to delete chat')
  }
  return apiClient.delete(`/chat/${chatId}`)
}

