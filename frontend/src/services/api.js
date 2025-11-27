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

// Create a separate client for voice messages with longer timeout
// Voice processing (transcription + TTS) can take 30-60+ seconds
const voiceApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90000, // 90 seconds for voice messages
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

// Apply same interceptors to voice client
voiceApiClient.interceptors.request.use(
  async (config) => {
    const headers = await getAuthHeaders()
    config.headers = { ...config.headers, ...headers }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

voiceApiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      throw new Error(error.response.data?.message || error.response.data?.error || 'Request failed')
    } else if (error.request) {
      // Check if it's a timeout
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Voice processing may take longer. Please try again.')
      }
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

export const sendVoiceMessage = async (audioBlob, audioFormat = 'webm', responseFormat = 'voice', chatId = null, title = null) => {
  // Convert audio blob to base64
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = async () => {
      try {
        // Remove data URL prefix (e.g., "data:audio/webm;base64,")
        const base64Audio = reader.result.split(',')[1] || reader.result
        
        const payload = {
          audio: base64Audio,
          audioFormat: audioFormat,
          responseFormat: responseFormat
        }
        if (chatId) payload.chatId = chatId
        if (title) payload.title = title
        
        // Use voiceApiClient instead of apiClient for longer timeout
        const response = await voiceApiClient.post('/chat/voice', payload)
        
        // If response has audio, convert base64 to blob
        if (response.audio) {
          try {
            // Handle base64 string (may or may not have data URL prefix)
            let base64Data = response.audio
            if (base64Data.includes(',')) {
              base64Data = base64Data.split(',')[1]
            }
            
            // Decode base64 to binary
            const binaryString = atob(base64Data)
            const audioArray = new Uint8Array(binaryString.length)
            for (let i = 0; i < binaryString.length; i++) {
              audioArray[i] = binaryString.charCodeAt(i)
            }
            
            // Create blob with proper MIME type
            response.audioBlob = new Blob([audioArray], { type: 'audio/mpeg' })
            console.log('Audio blob created successfully, size:', response.audioBlob.size, 'bytes')
          } catch (error) {
            console.error('Error converting audio base64 to blob:', error)
            // Don't fail the whole request if audio conversion fails
            response.audioBlob = null
          }
        }
        
        resolve(response)
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(audioBlob)
  })
}

