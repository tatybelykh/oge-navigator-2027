import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { speakingTask2Config } from '../../data/speaking/task2Config'
import { localStorageService } from '../../services/localStorageService'
import { MicrophoneCheck } from './MicrophoneCheck'
import { SpeakingTimer } from './SpeakingTimer'
import { TeacherReview } from './TeacherReview'

const initialState = {
  currentQuestionIndex: 0,
  endAt: null,
  mode: null,
  status: 'idle',
}

function speakingReducer(state, action) {
  switch (action.type) {
    case 'MIC_CHECK':
      return { ...state, status: 'mic-check' }
    case 'READY':
      return { ...state, status: 'ready' }
    case 'START':
      return {
        ...initialState,
        mode: action.mode,
        status: action.mode === 'exam' ? 'intro' : 'ready',
      }
    case 'ASK':
      return { ...state, status: 'asking-question' }
    case 'RECORD':
      return {
        ...state,
        endAt: Date.now() + speakingTask2Config.answerTimeSeconds * 1000,
        status: 'recording-answer',
      }
    case 'BETWEEN':
      return { ...state, endAt: null, status: 'between-questions' }
    case 'NEXT':
      return {
        ...state,
        currentQuestionIndex: state.currentQuestionIndex + 1,
        endAt: null,
        status: action.autoAsk ? 'asking-question' : 'ready',
      }
    case 'COMPLETED':
      return { ...state, endAt: null, status: 'completed' }
    case 'REVIEW':
      return { ...state, status: 'review' }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

export function SpeakingTask2Trainer({
  material,
  onAddError,
  onAddRevision,
  onSaveResult,
}) {
  const [state, dispatch] = useReducer(speakingReducer, initialState)
  const [error, setError] = useState('')
  const [isVoiceReady, setIsVoiceReady] = useState(false)
  const [selectedVoiceURI, setSelectedVoiceURI] = useState(() =>
    localStorageService.getSpeakingVoiceURI(),
  )
  const [voices, setVoices] = useState([])
  const [recordings, setRecordings] = useState({})
  const [isRecording, setIsRecording] = useState(false)
  const chunksRef = useRef([])
  const recordingStartedAtRef = useRef(null)
  const recorderRef = useRef(null)
  const recordingsRef = useRef({})
  const streamRef = useRef(null)

  const localEnglishVoices = useMemo(
    () =>
      voices.filter(
        (voice) =>
          voice.lang.toLowerCase().startsWith('en') &&
          (voice.localService || voice.localService === undefined),
      ),
    [voices],
  )
  const selectedVoice =
    localEnglishVoices.find((voice) => voice.voiceURI === selectedVoiceURI) ??
    localEnglishVoices[0]
  const currentQuestion = material.questions[state.currentQuestionIndex]
  const isLastQuestion =
    state.currentQuestionIndex === speakingTask2Config.questionCount - 1

  useEffect(() => {
    const loadVoices = () => {
      const nextVoices = window.speechSynthesis?.getVoices?.() ?? []
      setVoices(nextVoices)
      setIsVoiceReady(nextVoices.length > 0)
    }

    loadVoices()
    window.speechSynthesis?.addEventListener?.('voiceschanged', loadVoices)

    return () =>
      window.speechSynthesis?.removeEventListener?.('voiceschanged', loadVoices)
  }, [])

  useEffect(() => {
    if (selectedVoice?.voiceURI) {
      setSelectedVoiceURI(selectedVoice.voiceURI)
      localStorageService.saveSpeakingVoiceURI(selectedVoice.voiceURI)
    }
  }, [selectedVoice?.voiceURI])

  const cleanup = useCallback(() => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop()
    }
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    window.speechSynthesis?.cancel()
    setIsRecording(false)
  }, [])

  useEffect(() => {
    recordingsRef.current = recordings
  }, [recordings])

  useEffect(
    () => () => {
      cleanup()
      Object.values(recordingsRef.current).forEach((recording) =>
        URL.revokeObjectURL(recording.url),
      )
    },
    [cleanup],
  )

  const speak = useCallback(
    (text, onEnd) => {
      if (!window.speechSynthesis || !selectedVoice) {
        setError(
          'На этом устройстве не найден локальный английский голос. Practice Mode доступен с текстом вопроса. Для Exam Mode нужен локальный английский голос в системе.',
        )
        onEnd?.()
        return
      }

      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.voice = selectedVoice
      utterance.lang = selectedVoice.lang
      utterance.onend = () => onEnd?.()
      utterance.onerror = () => {
        setError('Не удалось воспроизвести вопрос системным голосом.')
        onEnd?.()
      }
      window.speechSynthesis.speak(utterance)
    },
    [selectedVoice],
  )

  const startRecording = async (questionId) => {
    setError('')

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError(
        'В этом браузере запись аудио недоступна. Вы всё равно можете использовать Practice Mode без записи.',
      )
      dispatch({ type: 'RECORD' })
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      streamRef.current = stream
      recorderRef.current = recorder
      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      })
      recorder.addEventListener('stop', () => {
        const mimeType = recorder.mimeType || 'audio/webm'
        const audioBlob = new Blob(chunksRef.current, { type: mimeType })
        const duration = recordingStartedAtRef.current
          ? Math.max(1, Math.round((Date.now() - recordingStartedAtRef.current) / 1000))
          : 0
        setRecordings((current) => {
          if (current[questionId]?.url) {
            URL.revokeObjectURL(current[questionId].url)
          }
          return {
            ...current,
            [questionId]: {
              audioBlob,
              duration,
              mimeType,
              questionId,
              url: URL.createObjectURL(audioBlob),
            },
          }
        })
        stream.getTracks().forEach((track) => track.stop())
        setIsRecording(false)
      })
      recorder.start()
      recordingStartedAtRef.current = Date.now()
      setIsRecording(true)
      dispatch({ type: 'RECORD' })
    } catch {
      setError(
        'Не удалось получить доступ к микрофону. Проверьте разрешение в браузере и попробуйте ещё раз.',
      )
    }
  }

  const stopRecording = useCallback(() => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop()
    }
    streamRef.current?.getTracks().forEach((track) => track.stop())
    setIsRecording(false)
  }, [])

  const finishQuestion = useCallback(() => {
    stopRecording()

    if (isLastQuestion) {
      dispatch({ type: 'COMPLETED' })
      speak(speakingTask2Config.outroText)
      return
    }

    dispatch({ type: 'BETWEEN' })
  }, [isLastQuestion, speak, stopRecording])

  const askCurrentQuestion = useCallback(() => {
    if (!currentQuestion) {
      dispatch({ type: 'COMPLETED' })
      return
    }

    dispatch({ type: 'ASK' })
  }, [currentQuestion])

  useEffect(() => {
    if (state.status === 'intro') {
      speak(speakingTask2Config.introText, () => askCurrentQuestion())
    }
  }, [askCurrentQuestion, speak, state.status])

  useEffect(() => {
    if (state.status !== 'asking-question' || !currentQuestion) {
      return
    }

    speak(currentQuestion.text, () => {
      if (state.mode === 'exam') {
        startRecording(currentQuestion.id)
      }
    })
  }, [currentQuestion, speak, state.mode, state.status])

  const cancelTraining = () => {
    if (
      window.confirm('Текущие несохранённые записи будут потеряны.')
    ) {
      cleanup()
      Object.values(recordings).forEach((recording) => URL.revokeObjectURL(recording.url))
      setRecordings({})
      dispatch({ type: 'RESET' })
    }
  }

  if (state.status === 'review') {
    return (
      <TeacherReview
        material={material}
        mode={state.mode}
        onAddError={onAddError}
        onAddRevision={onAddRevision}
        onSaveResult={(attempt) => {
          onSaveResult(attempt)
          Object.values(recordings).forEach((recording) => URL.revokeObjectURL(recording.url))
          setRecordings({})
          dispatch({ type: 'RESET' })
        }}
        recordings={recordings}
      />
    )
  }

  return (
    <section className="speaking-trainer">
      <article className="panel">
        <div className="panel-heading">
          <p className="eyebrow">Speaking Task 2</p>
          <h1>{material.title}</h1>
          <p className="welcome-text">{material.description}</p>
        </div>
        <div className="source-row">
          <span className="source-badge is-extra">Extra Practice</span>
          <span className="section-chip">Exam-style</span>
          <span className="section-chip">{speakingTask2Config.examModel}</span>
        </div>
        <p className="empty-state">
          Запись не отправляется на сервер. Аудио существует только в текущей
          сессии и может быть сохранено вручную на устройство.
        </p>
      </article>

      <article className="panel">
        <div className="panel-heading">
          <p className="eyebrow">Voice</p>
          <h2>Системный голос</h2>
        </div>
        {localEnglishVoices.length > 0 ? (
          <label className="compact-field">
            English local voice
            <select
              onChange={(event) => setSelectedVoiceURI(event.target.value)}
              value={selectedVoice?.voiceURI ?? ''}
            >
              {localEnglishVoices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="form-error">
            На этом устройстве не найден локальный английский голос. Practice Mode
            доступен с текстом вопроса. Для Exam Mode нужен локальный английский
            голос в системе.
          </p>
        )}
      </article>

      {state.status === 'idle' && (
        <div className="material-grid">
          <button
            className="mode-card"
            onClick={() => dispatch({ type: 'START', mode: 'practice' })}
            type="button"
          >
            <span>Practice Mode</span>
            <strong>Text, chunks, retry and manual next question</strong>
          </button>
          <button
            className="mode-card"
            disabled={!isVoiceReady || localEnglishVoices.length === 0}
            onClick={() => dispatch({ type: 'START', mode: 'exam' })}
            type="button"
          >
            <span>Exam Mode</span>
            <strong>
              {speakingTask2Config.questionCount} questions ·{' '}
              {speakingTask2Config.answerTimeSeconds} sec · no hints
            </strong>
          </button>
          <button className="mode-card" onClick={() => dispatch({ type: 'MIC_CHECK' })} type="button">
            <span>Microphone Check</span>
            <strong>Record a short local test</strong>
          </button>
        </div>
      )}

      {state.status === 'mic-check' && (
        <MicrophoneCheck onReady={() => dispatch({ type: 'READY' })} />
      )}

      {error && <p className="form-error">{error}</p>}

      {['ready', 'asking-question', 'recording-answer', 'between-questions', 'completed'].includes(
        state.status,
      ) && (
        <article className="question-stage">
          <div className="question-stage__top">
            <span className="status-pill status-started">
              Question {state.currentQuestionIndex + 1}/
              {speakingTask2Config.questionCount}
            </span>
            {state.status === 'recording-answer' && (
              <SpeakingTimer endAt={state.endAt} onComplete={finishQuestion} />
            )}
          </div>

          {state.mode === 'practice' && currentQuestion && (
            <>
              <h2>{currentQuestion.text}</h2>
              <div className="useful-language">
                <strong>Useful language</strong>
                <div className="section-chip-row">
                  {material.targetChunks.map((chunk) => (
                    <span className="section-chip" key={chunk}>
                      {chunk}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {state.mode === 'exam' && currentQuestion && state.status !== 'completed' && (
            <h2 className="hidden-question">Listen to the electronic assistant.</h2>
          )}

          <div className="material-actions">
            {state.mode === 'practice' && currentQuestion && (
              <button className="text-button" onClick={() => speak(currentQuestion.text)} type="button">
                Прослушать вопрос
              </button>
            )}
            {state.status === 'ready' && currentQuestion && (
              <button
                className="primary-button"
                onClick={() => {
                  if (state.mode === 'practice') {
                    startRecording(currentQuestion.id)
                  } else {
                    askCurrentQuestion()
                  }
                }}
                type="button"
              >
                {state.mode === 'practice' ? 'Начать ответ' : 'Слушать вопрос'}
              </button>
            )}
            {state.status === 'recording-answer' && (
              <button className="primary-button big-done-button" onClick={finishQuestion} type="button">
                Готово
              </button>
            )}
            {state.status === 'between-questions' && (
              <button
                className="primary-button"
                onClick={() => dispatch({ type: 'NEXT', autoAsk: state.mode === 'exam' })}
                type="button"
              >
                Следующий вопрос
              </button>
            )}
            {state.status === 'completed' && (
              <button className="primary-button" onClick={() => dispatch({ type: 'REVIEW' })} type="button">
                Перейти к проверке
              </button>
            )}
            {state.status !== 'completed' && state.status !== 'idle' && (
              <button className="text-button danger-button" onClick={cancelTraining} type="button">
                Завершить тренировку
              </button>
            )}
          </div>

          {isRecording && <p className="status-message">Идёт локальная запись...</p>}

          {currentQuestion && recordings[currentQuestion.id]?.url && state.mode === 'practice' && (
            <div className="audio-review-row">
              <audio controls src={recordings[currentQuestion.id].url}>
                <track kind="captions" />
              </audio>
              <button className="text-button" onClick={() => startRecording(currentQuestion.id)} type="button">
                Перезаписать
              </button>
            </div>
          )}
        </article>
      )}
    </section>
  )
}
