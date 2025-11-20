import { useState, useEffect, useRef } from 'react'
import { useChat } from '../context/ChatContext'
import { useAuth } from '../context/AuthContext'
import MessageBubble from './MessageBubble'
import LoadingIndicator from './LoadingIndicator'
import ChatSidebar from './ChatSidebar'
import './ChatInterface.css'

const ChatInterface = () => {
  const { messages, currentChatId, loading, error, addMessage, startNewChat, loadChatList } = useChat()
  const { logout } = useAuth()
  const [inputText, setInputText] = useState('')
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    loadChatList()
  }, [loadChatList])

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

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
    await addMessage(text)
    inputRef.current?.focus()
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible)
  }

  return (
    <div className={`chat-container ${!sidebarVisible ? 'sidebar-hidden' : ''}`}>
      <ChatSidebar isVisible={sidebarVisible} onClose={() => setSidebarVisible(false)} />
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

      <form onSubmit={handleSubmit} className="chat-input-container">
        <div className="chat-input-wrapper">
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
          <div className="voice-button-wrapper">
            <button
              type="button"
              className="voice-button"
              disabled
              title="Voice chat is coming soon"
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
            <span className="voice-tooltip">Voice chat is coming soon</span>
          </div>
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
        </div>
      </form>
      </div>
    </div>
  )
}

export default ChatInterface

