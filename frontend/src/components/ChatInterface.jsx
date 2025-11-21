import { useState, useEffect, useRef } from 'react'
import { useChat } from '../context/ChatContext'
import { useAuth } from '../context/AuthContext'
import MessageBubble from './MessageBubble'
import LoadingIndicator from './LoadingIndicator'
import ChatSidebar from './ChatSidebar'
import VoiceRecorder from './VoiceRecorder'
import './ChatInterface.css'

const ChatInterface = () => {
  const { messages, currentChatId, loading, error, addMessage, addVoiceMessage, startNewChat, loadChatList } = useChat()
  const { logout } = useAuth()
  const [inputText, setInputText] = useState('')
  const [voiceMode, setVoiceMode] = useState(false)
  const [responseFormat, setResponseFormat] = useState('voice')
  // Sidebar hidden by default on mobile, visible on desktop
  const [sidebarVisible, setSidebarVisible] = useState(() => {
    return window.innerWidth >= 768
  })
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  
  // Auto-expand textarea based on content
  useEffect(() => {
    const textarea = inputRef.current
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto'
      // Set height to scrollHeight, but respect max-height
      const scrollHeight = textarea.scrollHeight
      const maxHeight = window.innerWidth < 768 ? 120 : 140
      const newHeight = Math.min(scrollHeight, maxHeight)
      textarea.style.height = `${newHeight}px`
      
      // If textarea is at max height, scroll to bottom to show cursor
      if (scrollHeight > maxHeight) {
        textarea.scrollTop = textarea.scrollHeight
      }
      
      // Scroll chat messages container to show input area when typing
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        const chatMessages = document.querySelector('.chat-messages')
        if (chatMessages) {
          // Only auto-scroll if user is near the bottom (within 100px)
          const isNearBottom = chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight < 100
          if (isNearBottom || inputText.length === 0) {
            chatMessages.scrollTop = chatMessages.scrollHeight
          }
        }
      })
    }
  }, [inputText])
  
  // Update sidebar visibility on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarVisible(true)
      } else {
        setSidebarVisible(false)
      }
      // Recalculate textarea height on resize
      const textarea = inputRef.current
      if (textarea) {
        textarea.style.height = 'auto'
        const scrollHeight = textarea.scrollHeight
        const maxHeight = window.innerWidth < 768 ? 120 : 140
        textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    loadChatList()
  }, [loadChatList])

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])
  
  // Auto-scroll during streaming
  useEffect(() => {
    const hasStreaming = messages.some(msg => msg.isStreaming)
    if (hasStreaming) {
      const scrollInterval = setInterval(() => {
        scrollToBottom()
      }, 100)
      return () => clearInterval(scrollInterval)
    }
  }, [messages])

  useEffect(() => {
    // Auto-focus input when component mounts or chat changes
    inputRef.current?.focus()
  }, [currentChatId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!inputText.trim() || loading) return

    const text = inputText
    setInputText('')
    // Reset textarea height after submit
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }
    await addMessage(text)
    inputRef.current?.focus()
  }

  const handleKeyPress = (e) => {
    // On mobile, allow Enter to create new lines
    // On desktop, Shift+Enter creates new line, Enter sends
    const isMobile = window.innerWidth < 768
    if (e.key === 'Enter' && !e.shiftKey && !isMobile) {
      e.preventDefault()
      handleSubmit(e)
    }
    // On mobile, Enter creates new line (default behavior)
    // User can use the send button to submit
  }

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible)
  }

  const handleVoiceRecordingComplete = async (audioBlob, audioFormat) => {
    await addVoiceMessage(audioBlob, audioFormat, responseFormat)
  }

  const toggleVoiceMode = () => {
    setVoiceMode(!voiceMode)
    if (!voiceMode) {
      // When switching to voice mode, focus is not needed
    } else {
      // When switching back to text mode, focus input
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  return (
    <div className={`chat-container ${!sidebarVisible ? 'sidebar-hidden' : ''}`}>
      {sidebarVisible && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarVisible(false)}
          aria-label="Close sidebar"
        />
      )}
      <ChatSidebar 
        isVisible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onChatSelect={() => {
          // Auto-hide on mobile after selecting
          if (window.innerWidth < 768) {
            setSidebarVisible(false)
          }
        }}
      />
      <div className="chat-main">
        <div className="chat-header">
          <button 
            onClick={toggleSidebar} 
            className="sidebar-toggle-button" 
            title={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
            aria-label={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
          >
            {sidebarVisible ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            )}
          </button>
          <div className="chat-header-content">
            <h2>Chat with EmpaMind</h2>
            <p className="chat-subtitle">Express yourself freely. I'm here to listen and support you.</p>
          </div>
          <div className="chat-actions">
            <button onClick={startNewChat} className="btn-secondary" title="New chat">
              New Chat
            </button>
            <button onClick={logout} className="btn-secondary" title="Sign out">
              Sign Out
            </button>
          </div>
        </div>

      <div className="chat-messages">
        {messages.length === 0 && !loading && !currentChatId && (
          <div className="welcome-message">
            <div className="welcome-icon">💬</div>
            <h3>Welcome to EmpaMind</h3>
            <p>Start a new conversation by typing a message below, or select an existing chat from the sidebar.</p>
          </div>
        )}
        
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {loading && <LoadingIndicator />}
        {error && (
          <div className="error-banner">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        {voiceMode ? (
          <div className="voice-mode-container">
            <div className="voice-mode-header">
              <button
                type="button"
                onClick={toggleVoiceMode}
                className="mode-toggle-button"
                title="Switch to text mode"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                Text Mode
              </button>
              <div className="response-format-selector">
                <label className="format-label">Response:</label>
                <button
                  type="button"
                  className={`format-button ${responseFormat === 'voice' ? 'active' : ''}`}
                  onClick={() => setResponseFormat('voice')}
                  disabled={loading}
                >
                  🎤 Voice
                </button>
                <button
                  type="button"
                  className={`format-button ${responseFormat === 'text' ? 'active' : ''}`}
                  onClick={() => setResponseFormat('text')}
                  disabled={loading}
                >
                  💬 Text
                </button>
              </div>
            </div>
            <VoiceRecorder
              onRecordingComplete={handleVoiceRecordingComplete}
              disabled={loading}
            />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="chat-input-wrapper">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
              className="chat-input"
              rows={1}
              disabled={loading}
            />
            <button
              type="button"
              onClick={toggleVoiceMode}
              className="voice-mode-toggle-button"
              title="Switch to voice mode"
              disabled={loading}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
            </button>
            <button
              type="submit"
              className="send-button"
              disabled={!inputText.trim() || loading}
              title="Send message"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        )}
      </div>
      </div>
    </div>
  )
}

export default ChatInterface

