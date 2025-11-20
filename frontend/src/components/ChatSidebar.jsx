import { useEffect, useState, useRef } from 'react'
import { useChat } from '../context/ChatContext'
import './ChatSidebar.css'

const ChatSidebar = ({ isVisible, onClose }) => {
  const { chatList, currentChatId, selectChat, startNewChat, loadChatList, updateChatTitle, removeChat } = useChat()
  const [openMenuId, setOpenMenuId] = useState(null)
  const [editingChatId, setEditingChatId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const menuRefs = useRef({})
  const editInputRef = useRef(null)

  useEffect(() => {
    loadChatList()
  }, [loadChatList])

  useEffect(() => {
    // Close menu when clicking outside
    const handleClickOutside = (event) => {
      if (openMenuId && menuRefs.current[openMenuId] && !menuRefs.current[openMenuId].contains(event.target)) {
        setOpenMenuId(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openMenuId])

  useEffect(() => {
    // Focus input when editing starts
    if (editingChatId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingChatId])

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

  const handleMenuToggle = (e, chatId) => {
    e.stopPropagation()
    setOpenMenuId(openMenuId === chatId ? null : chatId)
  }

  const handleEdit = (e, chat) => {
    e.stopPropagation()
    setOpenMenuId(null)
    setEditingChatId(chat.chatId)
    setEditTitle(chat.title || 'Untitled Chat')
  }

  const handleEditSubmit = async (e, chatId) => {
    e.stopPropagation()
    if (editTitle.trim()) {
      await updateChatTitle(chatId, editTitle.trim())
    }
    setEditingChatId(null)
    setEditTitle('')
  }

  const handleEditCancel = (e) => {
    e.stopPropagation()
    setEditingChatId(null)
    setEditTitle('')
  }

  const handleDelete = async (e, chatId) => {
    e.stopPropagation()
    setOpenMenuId(null)
    if (window.confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      await removeChat(chatId)
    }
  }

  const handleChatClick = (chatId) => {
    if (!editingChatId) {
      selectChat(chatId)
      // Auto-hide sidebar on mobile after selecting a chat
      if (window.innerWidth < 768 && onClose) {
        onClose()
      }
    }
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className="chat-sidebar">
      <div className="sidebar-header">
        <h3>Your Chats</h3>
        <button onClick={startNewChat} className="new-chat-button" title="New Chat" aria-label="New Chat">
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
              className={`chat-item ${currentChatId === chat.chatId ? 'active' : ''} ${editingChatId === chat.chatId ? 'editing' : ''}`}
              onClick={() => handleChatClick(chat.chatId)}
            >
              <div className="chat-item-content">
                {editingChatId === chat.chatId ? (
                  <form
                    onSubmit={(e) => handleEditSubmit(e, chat.chatId)}
                    onClick={(e) => e.stopPropagation()}
                    className="edit-form"
                  >
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={(e) => {
                        if (editTitle.trim()) {
                          handleEditSubmit(e, chat.chatId)
                        } else {
                          handleEditCancel(e)
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          handleEditCancel(e)
                        }
                      }}
                      className="edit-input"
                      placeholder="Chat title"
                    />
                  </form>
                ) : (
                  <>
                    <h4 className="chat-title">{chat.title || 'Untitled Chat'}</h4>
                    <p className="chat-time">{formatTime(chat.lastMessageTime)}</p>
                  </>
                )}
              </div>
              {!editingChatId && (
                <div className="chat-item-actions">
                  <button
                    className="chat-menu-button"
                    onClick={(e) => handleMenuToggle(e, chat.chatId)}
                    aria-label="Chat options"
                    title="Chat options"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="1"></circle>
                      <circle cx="12" cy="5" r="1"></circle>
                      <circle cx="12" cy="19" r="1"></circle>
                    </svg>
                  </button>
                  {openMenuId === chat.chatId && (
                    <div
                      ref={(el) => (menuRefs.current[chat.chatId] = el)}
                      className="chat-menu"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="menu-item"
                        onClick={(e) => handleEdit(e, chat)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        <span>Edit</span>
                      </button>
                      <button
                        className="menu-item menu-item-danger"
                        onClick={(e) => handleDelete(e, chat.chatId)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ChatSidebar
