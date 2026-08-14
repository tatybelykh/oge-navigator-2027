import { useEffect, useState } from 'react'

export function SpeakingTimer({ endAt, onComplete }) {
  const [remaining, setRemaining] = useState(() => getRemainingSeconds(endAt))

  useEffect(() => {
    if (!endAt) {
      return undefined
    }

    const timerId = window.setInterval(() => {
      const nextRemaining = getRemainingSeconds(endAt)
      setRemaining(nextRemaining)

      if (nextRemaining <= 0) {
        window.clearInterval(timerId)
        onComplete()
      }
    }, 250)

    return () => window.clearInterval(timerId)
  }, [endAt, onComplete])

  return (
    <div
      aria-label={`Осталось ${remaining} секунд`}
      className={`speaking-timer ${remaining <= 10 ? 'is-low' : ''}`}
      role="timer"
    >
      {remaining}
    </div>
  )
}

function getRemainingSeconds(endAt) {
  if (!endAt) {
    return 0
  }

  return Math.max(0, Math.ceil((endAt - Date.now()) / 1000))
}
