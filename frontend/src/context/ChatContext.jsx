import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { sendMessage, sendVoiceMessage, getChatHistory, listChats, updateChat, deleteChat } from '../services/api'

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
  const streamingIntervalRef = useRef(null)
  
  // Cleanup streaming interval on unmount
  useEffect(() => {
    return () => {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current)
      }
    }
  }, [])

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
      // Simulate AI response with streaming for UI testing
      setTimeout(async () => {
        const fullText = 'I understand how you\'re feeling. This is a demo response since the backend is not configured. When you deploy the backend, you\'ll get real AI-powered empathetic responses.'
        const aiMessageId = `ai-demo-${Date.now()}`
        
        // Stop loading first
        setLoading(false)
        
        // Add empty message first for streaming effect
        const streamingMessage = {
          id: aiMessageId,
          text: '',
          sender: 'ai',
          timestamp: new Date().toISOString(),
          sentiment: 'NEUTRAL',
          isStreaming: true,
        }
        
        // Use functional update
        setMessages((prev) => {
          const exists = prev.find(msg => msg.id === aiMessageId)
          if (exists) return prev
          return [...prev, streamingMessage]
        })
        
        // Clear any existing streaming interval
        if (streamingIntervalRef.current) {
          clearInterval(streamingIntervalRef.current)
        }
        
        const startStreaming = () => {
          // Stream the response character by character
          let currentIndex = 0
          const streamSpeed = 20
          
          streamingIntervalRef.current = setInterval(() => {
            if (currentIndex < fullText.length) {
              const chunk = fullText.slice(0, currentIndex + 1)
              const stillStreaming = currentIndex < fullText.length - 1
              
              setMessages((prev) => {
                return prev.map((msg) => {
                  if (msg.id === aiMessageId) {
                    return { 
                      ...msg, 
                      text: chunk, 
                      isStreaming: stillStreaming 
                    }
                  }
                  return msg
                })
              })
              
              currentIndex++
            } else {
              if (streamingIntervalRef.current) {
                clearInterval(streamingIntervalRef.current)
                streamingIntervalRef.current = null
              }
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMessageId ? { ...msg, isStreaming: false } : msg
                )
              )
            }
          }, streamSpeed)
        }
        
        // Small delay to ensure state is set
        setTimeout(startStreaming, 100)
        
        // Create new chat if needed
        if (!currentChatId) {
          const newChatId = `demo-${Date.now()}`
          setCurrentChatId(newChatId)
          await loadChatList()
        }
      }, 500) // Simulate 0.5 second delay before streaming starts
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
      
      // Create AI message with streaming effect
      const aiMessageId = `ai-${Date.now()}`
      const fullText = (response.message || response.response || '').trim()
      const sentiment = response.sentiment
      
      if (!fullText) {
        console.error('No message in response:', response)
        throw new Error('No response message received')
      }
      
      console.log('Starting stream for message:', fullText.substring(0, 50) + '...')
      
      // Stop loading first
      setLoading(false)
      
      // Add empty message first for streaming effect
      const streamingMessage = {
        id: aiMessageId,
        text: '',
        sender: 'ai',
        timestamp: new Date().toISOString(),
        sentiment: sentiment,
        isStreaming: true,
      }
      
      // Use functional update to ensure we're working with latest state
      setMessages((prev) => {
        // Check if message already exists (shouldn't, but safety check)
        const exists = prev.find(msg => msg.id === aiMessageId)
        if (exists) return prev
        return [...prev, streamingMessage]
      })
      
      // Clear any existing streaming interval
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current)
        streamingIntervalRef.current = null
      }
      
      // Use setTimeout instead of await to avoid blocking
      setTimeout(() => {
        // Stream the response character by character (like ChatGPT)
        let currentIndex = 0
        const streamSpeed = 20 // milliseconds per character (adjust for speed)
        
        console.log('Starting streaming interval, text length:', fullText.length)
        
        streamingIntervalRef.current = setInterval(() => {
          if (currentIndex < fullText.length) {
            const chunk = fullText.slice(0, currentIndex + 1)
            const stillStreaming = currentIndex < fullText.length - 1
            
            setMessages((prev) => {
              return prev.map((msg) => {
                if (msg.id === aiMessageId) {
                  return { 
                    ...msg, 
                    text: chunk, 
                    isStreaming: stillStreaming 
                  }
                }
                return msg
              })
            })
            
            currentIndex++
          } else {
            console.log('Streaming complete')
            if (streamingIntervalRef.current) {
              clearInterval(streamingIntervalRef.current)
              streamingIntervalRef.current = null
            }
            // Mark streaming as complete
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId ? { ...msg, isStreaming: false } : msg
              )
            )
          }
        }, streamSpeed)
      }, 100)
      
    } catch (err) {
      setError(err.message || 'Failed to send message. Please try again.')
      console.error('Chat error:', err)
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

  const addVoiceMessage = useCallback(async (audioBlob, audioFormat, responseFormat, title = null) => {
    if (!audioBlob) return

    // Create user voice message placeholder
    const userMessage = {
      id: Date.now().toString(),
      text: '🎤 Voice message',
      sender: 'user',
      timestamp: new Date().toISOString(),
      isVoice: true,
      audioBlob: audioBlob
    }

    setMessages((prev) => [...prev, userMessage])
    setLoading(true)
    setError(null)

    // Skip API call if endpoint is not configured (for local UI testing)
    if (!import.meta.env.VITE_API_ENDPOINT) {
      setTimeout(async () => {
        const fullText = 'I understand how you\'re feeling. This is a demo response since the backend is not configured.'
        const aiMessageId = `ai-demo-${Date.now()}`
        
        setLoading(false)
        
        const streamingMessage = {
          id: aiMessageId,
          text: '',
          sender: 'ai',
          timestamp: new Date().toISOString(),
          sentiment: 'NEUTRAL',
          isStreaming: true,
          responseFormat: responseFormat,
          ...(responseFormat === 'voice' && { audioBlob: new Blob(['demo'], { type: 'audio/mp3' }) })
        }
        
        setMessages((prev) => {
          const exists = prev.find(msg => msg.id === aiMessageId)
          if (exists) return prev
          return [...prev, streamingMessage]
        })
        
        if (streamingIntervalRef.current) {
          clearInterval(streamingIntervalRef.current)
        }
        
        const startStreaming = () => {
          let currentIndex = 0
          const streamSpeed = 20
          
          streamingIntervalRef.current = setInterval(() => {
            if (currentIndex < fullText.length) {
              const chunk = fullText.slice(0, currentIndex + 1)
              const stillStreaming = currentIndex < fullText.length - 1
              
              setMessages((prev) => {
                return prev.map((msg) => {
                  if (msg.id === aiMessageId) {
                    return { 
                      ...msg, 
                      text: chunk, 
                      isStreaming: stillStreaming 
                    }
                  }
                  return msg
                })
              })
              
              currentIndex++
            } else {
              if (streamingIntervalRef.current) {
                clearInterval(streamingIntervalRef.current)
                streamingIntervalRef.current = null
              }
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMessageId ? { ...msg, isStreaming: false } : msg
                )
              )
            }
          }, streamSpeed)
        }
        
        setTimeout(startStreaming, 100)
        
        if (!currentChatId) {
          const newChatId = `demo-${Date.now()}`
          setCurrentChatId(newChatId)
          await loadChatList()
        }
      }, 500)
      return
    }

    try {
      console.log('Sending voice message, format:', audioFormat, 'responseFormat:', responseFormat)
      const response = await sendVoiceMessage(audioBlob, audioFormat, responseFormat, currentChatId, title)
      console.log('Voice message response received:', {
        hasAudio: !!response.audio,
        hasAudioBlob: !!response.audioBlob,
        audioBlobSize: response.audioBlob?.size,
        responseFormat: response.responseFormat
      })
      
      // Update current chat ID if this is a new chat
      if (response.chatId && !currentChatId) {
        setCurrentChatId(response.chatId)
        await loadChatList()
      }
      
      // Update user message with transcript (preserve audioBlob and isVoice)
      setMessages((prev) => prev.map((msg) => {
        if (msg.id === userMessage.id) {
          const updated = { 
            ...msg, 
            text: response.transcript || '🎤 Voice message', 
            isVoice: true, 
            audioBlob: msg.audioBlob // Preserve original audio blob
          }
          console.log('Updated user message with transcript, audioBlob preserved:', !!updated.audioBlob)
          return updated
        }
        return msg
      }))
      
      // Create AI message
      const aiMessageId = `ai-${Date.now()}`
      const fullText = (response.response || '').trim()
      const sentiment = response.sentiment
      
      if (!fullText) {
        throw new Error('No response message received')
      }
      
      setLoading(false)
      
      const aiMessage = {
        id: aiMessageId,
        text: fullText,
        sender: 'ai',
        timestamp: new Date().toISOString(),
        sentiment: sentiment,
        responseFormat: responseFormat,
        isStreaming: false,
        ...(responseFormat === 'voice' && response.audioBlob && { 
          audioBlob: response.audioBlob,
          isVoice: true 
        })
      }
      
      console.log('AI message created with audioBlob:', !!aiMessage.audioBlob, 'size:', aiMessage.audioBlob?.size)
      setMessages((prev) => [...prev, aiMessage])
      
    } catch (err) {
      setError(err.message || 'Failed to send voice message. Please try again.')
      console.error('Voice message error:', err)
      setLoading(false)
      // Remove user message on error
      setMessages((prev) => prev.filter(msg => msg.id !== userMessage.id))
    }
  }, [currentChatId, loadChatList])

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
    addVoiceMessage,
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

