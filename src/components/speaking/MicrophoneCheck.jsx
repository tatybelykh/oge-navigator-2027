import { useEffect, useRef, useState } from 'react'

export function MicrophoneCheck({ onReady }) {
  const [audioUrl, setAudioUrl] = useState(null)
  const [error, setError] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const audioUrlRef = useRef(null)

  useEffect(() => {
    audioUrlRef.current = audioUrl
  }, [audioUrl])

  useEffect(
    () => () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
      }
    },
    [],
  )

  const runCheck = async () => {
    setError('')
    setIsChecking(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks = []

      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      })
      recorder.addEventListener('stop', () => {
        const blob = new Blob(chunks, { type: recorder.mimeType })
        setAudioUrl((currentAudioUrl) => {
          if (currentAudioUrl) {
            URL.revokeObjectURL(currentAudioUrl)
          }

          return URL.createObjectURL(blob)
        })
        stream.getTracks().forEach((track) => track.stop())
        setIsChecking(false)
      })

      recorder.start()
      window.setTimeout(() => recorder.stop(), 1800)
    } catch {
      setError(
        'Не удалось получить доступ к микрофону. Проверьте разрешение в браузере и попробуйте ещё раз.',
      )
      setIsChecking(false)
    }
  }

  return (
    <article className="panel">
      <div className="panel-heading">
        <p className="eyebrow">Microphone</p>
        <h2>Проверка микрофона</h2>
      </div>
      <p className="empty-state">
        Разрешение запрашивается только после нажатия кнопки. Тестовая запись не сохраняется.
      </p>
      <div className="material-actions">
        <button className="primary-button" disabled={isChecking} onClick={runCheck} type="button">
          {isChecking ? 'Проверяем...' : 'Проверить микрофон'}
        </button>
        {audioUrl && (
          <button className="text-button" onClick={runCheck} type="button">
            Повторить проверку
          </button>
        )}
      </div>
      {error && <p className="form-error">{error}</p>}
      {audioUrl && (
        <div className="audio-review-row">
          <audio controls src={audioUrl}>
            <track kind="captions" />
          </audio>
          <button className="primary-button" onClick={onReady} type="button">
            Всё слышно
          </button>
        </div>
      )}
    </article>
  )
}
