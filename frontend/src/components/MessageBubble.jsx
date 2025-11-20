import './MessageBubble.css'

const MessageBubble = ({ message }) => {
  const isUser = message.sender === 'user'
  const timestamp = new Date(message.timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const isStreaming = message.isStreaming === true

  return (
    <div className={`message-bubble ${isUser ? 'user-message' : 'ai-message'}`}>
      <div className="message-content">
        <div className="message-text">
          {message.text}
          {isStreaming && <span className="streaming-cursor">▊</span>}
        </div>
        {message.sentiment && !isUser && !isStreaming && (
          <div className="message-sentiment">
            <span className="sentiment-label">Detected:</span>
            <span className={`sentiment-value sentiment-${message.sentiment.toLowerCase()}`}>
              {message.sentiment}
            </span>
          </div>
        )}
        {!isStreaming && <div className="message-timestamp">{timestamp}</div>}
      </div>
    </div>
  )
}

export default MessageBubble

