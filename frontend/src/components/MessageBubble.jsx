import './MessageBubble.css'

const MessageBubble = ({ message }) => {
  const isUser = message.sender === 'user'
  const timestamp = new Date(message.timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className={`message-bubble ${isUser ? 'user-message' : 'ai-message'}`}>
      <div className="message-content">
        <div className="message-text">{message.text}</div>
        {message.sentiment && !isUser && (
          <div className="message-sentiment">
            <span className="sentiment-label">Detected:</span>
            <span className={`sentiment-value sentiment-${message.sentiment.toLowerCase()}`}>
              {message.sentiment}
            </span>
          </div>
        )}
        <div className="message-timestamp">{timestamp}</div>
      </div>
    </div>
  )
}

export default MessageBubble

