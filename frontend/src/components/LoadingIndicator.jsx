import './LoadingIndicator.css'

const LoadingIndicator = () => {
  return (
    <div className="loading-message">
      <div className="loading-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <p className="loading-text">EmpaMind is thinking...</p>
    </div>
  )
}

export default LoadingIndicator

