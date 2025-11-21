import ReactMarkdown from 'react-markdown'
import AudioPlayer from './AudioPlayer'
import './MessageBubble.css'

const MessageBubble = ({ message }) => {
  const isUser = message.sender === 'user'
  const timestamp = new Date(message.timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const isStreaming = message.isStreaming === true
  const isVoiceMessage = message.isVoice === true
  const responseFormat = message.responseFormat || 'text'

  return (
    <div className={`message-bubble ${isUser ? 'user-message' : 'ai-message'}`}>
      <div className="message-content">
        {isUser && isVoiceMessage ? (
          <div className="voice-message-content">
            <div className="voice-message-label">🎤 Voice Message</div>
            {message.audioBlob && (
              <div className="voice-message-audio">
                <AudioPlayer audioBlob={message.audioBlob} />
              </div>
            )}
            {message.text && message.text !== '🎤 Voice message' && (
              <div className="voice-transcript">
                <span className="transcript-label">Transcript:</span>
                <span className="transcript-text">{message.text}</span>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="message-text">
              {isUser ? (
                message.text
              ) : (
                <ReactMarkdown>{message.text}</ReactMarkdown>
              )}
              {isStreaming && <span className="streaming-cursor">▊</span>}
            </div>
            {!isUser && !isStreaming && responseFormat === 'voice' && message.audioBlob && (
              <div className="voice-response-audio">
                <AudioPlayer audioBlob={message.audioBlob} />
              </div>
            )}
          </>
        )}
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

