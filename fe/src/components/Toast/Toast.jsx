import { useEffect } from 'react'
import { useCargoStore } from '../../store/useCargoStore'
import './Toast.css'

const AUTO_DISMISS_MS = 3000

function Toast() {
  const { notification, clearNotification } = useCargoStore()

  useEffect(() => {
    if (!notification) return
    const timer = setTimeout(clearNotification, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [notification])

  if (!notification) return null

  return (
    <div className={`toast toast--${notification.type}`}>
      <span>{notification.message}</span>
      <button className="toast__close" onClick={clearNotification}>✕</button>
    </div>
  )
}

export default Toast
