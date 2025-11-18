import { useEffect } from 'react'
import { useChat } from '../context/ChatContext'
import './ChatSidebar.css'

const ChatSidebar = () => {
  const { chatList, currentChatId, selectChat, startNewChat, loadChatList } = useChat()

  useEffect(() => {
    loadChatList()
  }, [loadChatList])

  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="chat-sidebar">
      <div className="sidebar-header">
        <h3>Your Chats</h3>
        <button onClick={startNewChat} className="new-chat-button" title="New Chat">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>
      
      <div className="chat-list">
        {chatList.length === 0 ? (
          <div className="empty-chat-list">
            <p>No chats yet</p>
            <p className="hint">Start a new conversation to begin</p>
          </div>
        ) : (
          chatList.map((chat) => (
            <div
              key={chat.chatId}
              className={`chat-item ${currentChatId === chat.chatId ? 'active' : ''}`}
              onClick={() => selectChat(chat.chatId)}
            >
              <div className="chat-item-content">
                <h4 className="chat-title">{chat.title || 'Untitled Chat'}</h4>
                <p className="chat-time">{formatTime(chat.lastMessageTime)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ChatSidebar

