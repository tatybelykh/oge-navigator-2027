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
    case 'START':
      return { ...initialState, mode: action.mode, status: 'ready' }
    case 'QUESTION':
      return {
        ...state,
        currentQuestionIndex: action.index,
        endAt: Date.now() + speakingTask2Config.answerTimeSeconds * 1000,
        status: 'recording-answer',
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
  onBackToSets,
  onSaveResult,
}) {
  const [state, dispatch] = useReducer(speakingReducer, initialState)
  const [error, setError] = useState('')
  const [isStarting, setIsStarting] = useState(false)
  const [isVoiceReady, setIsVoiceReady] = useState(false)
  const [isQuestionPlaybackComplete, setIsQuestionPlaybackComplete] = useState(false)
  const [selectedVoiceURI, setSelectedVoiceURI] = useState(() =>
    localStorageService.getSpeakingVoiceURI(),
  )
  const [voices, setVoices] = useState([])
  const [sessionRecording, setSessionRecording] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const chunksRef = useRef([])
  const discardRecordingRef = useRef(false)
  const recorderRef = useRef(null)
  const recordingStartedAtRef = useRef(null)
  const sessionRecordingRef = useRef(null)
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
  const canStartAttempt = isVoiceReady && localEnglishVoices.length > 0
  const hasStartedAttempt =
    ['recording-answer', 'completed', 'review'].includes(state.status) ||
    isRecording ||
    Boolean(sessionRecording)

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

  useEffect(() => {
    sessionRecordingRef.current = sessionRecording
  }, [sessionRecording])

  const clearSessionRecording = useCallback(() => {
    if (sessionRecordingRef.current?.url) {
      URL.revokeObjectURL(sessionRecordingRef.current.url)
    }
    sessionRecordingRef.current = null
    setSessionRecording(null)
  }, [])

  const stopSessionRecording = useCallback(({ discard = false } = {}) => {
    discardRecordingRef.current = discard

    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop()
    }

    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setIsRecording(false)
  }, [])

  const cleanup = useCallback(
    ({ discard = false } = {}) => {
      window.speechSynthesis?.cancel()
      stopSessionRecording({ discard })

      if (discard) {
        chunksRef.current = []
        clearSessionRecording()
      }
    },
    [clearSessionRecording, stopSessionRecording],
  )

  useEffect(
    () => () => {
      cleanup({ discard: true })
    },
    [cleanup],
  )

  const speak = useCallback(
    (text, onEnd) => {
      if (!window.speechSynthesis || !selectedVoice) {
        setError(
          'На этом устройстве не найден локальный английский голос. Для попытки нужен локальный английский голос в системе.',
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

  const startSessionRecording = async () => {
    setError('')
    clearSessionRecording()

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      throw new Error(
        'В этом браузере запись аудио недоступна. Попробуйте другой современный браузер.',
      )
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    chunksRef.current = []
    discardRecordingRef.current = false
    streamRef.current = stream
    recorderRef.current = recorder
    recorder.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data)
      }
    })
    recorder.addEventListener('stop', () => {
      if (discardRecordingRef.current) {
        chunksRef.current = []
        return
      }

      const mimeType = recorder.mimeType || 'audio/webm'
      const audioBlob = new Blob(chunksRef.current, { type: mimeType })
      const duration = recordingStartedAtRef.current
        ? Math.max(1, Math.round((Date.now() - recordingStartedAtRef.current) / 1000))
        : 0
      const nextRecording = {
        audioBlob,
        duration,
        mimeType,
        questionId: 'speaking-task-2-session',
        url: URL.createObjectURL(audioBlob),
      }

      sessionRecordingRef.current = nextRecording
      setSessionRecording(nextRecording)
    })
    recorder.start()
    recordingStartedAtRef.current = Date.now()
    setIsRecording(true)
  }

  const startQuestion = useCallback(
    (questionIndex) => {
      const question = material.questions[questionIndex]

      if (!question) {
        stopSessionRecording()
        dispatch({ type: 'COMPLETED' })
        return
      }

      setIsQuestionPlaybackComplete(false)
      dispatch({ type: 'QUESTION', index: questionIndex })
      speak(question.text, () => setIsQuestionPlaybackComplete(true))
    },
    [material.questions, speak, stopSessionRecording],
  )

  const startAttempt = async () => {
    setIsStarting(true)
    setError('')

    try {
      await startSessionRecording()
      startQuestion(0)
    } catch (startError) {
      setError(startError.message)
    } finally {
      setIsStarting(false)
    }
  }

  const finishAttempt = useCallback(() => {
    window.speechSynthesis?.cancel()
    stopSessionRecording()
    dispatch({ type: 'COMPLETED' })
    speak(speakingTask2Config.outroText)
  }, [speak, stopSessionRecording])

  const goToNextQuestion = useCallback(() => {
    if (isLastQuestion) {
      finishAttempt()
      return
    }

    startQuestion(state.currentQuestionIndex + 1)
  }, [finishAttempt, isLastQuestion, startQuestion, state.currentQuestionIndex])

  const replayQuestion = () => {
    if (currentQuestion) {
      speak(currentQuestion.text)
    }
  }

  const cancelTraining = () => {
    if (
      window.confirm(
        'Завершить тренировку? Текущая несохранённая запись будет потеряна.',
      )
    ) {
      cleanup({ discard: true })
      dispatch({ type: 'RESET' })
    }
  }

  const handleBackToSets = () => {
    if (
      hasStartedAttempt &&
      !window.confirm(
        'Завершить тренировку? Текущая несохранённая запись будет потеряна.',
      )
    ) {
      return
    }

    cleanup({ discard: hasStartedAttempt })
    dispatch({ type: 'RESET' })
    onBackToSets()
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
          clearSessionRecording()
          dispatch({ type: 'RESET' })
        }}
        sessionRecording={sessionRecording}
      />
    )
  }

  return (
    <section className="speaking-trainer">
      <button className="text-button" onClick={handleBackToSets} type="button">
        ← К наборам Speaking Task 2
      </button>

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
          Запись не отправляется на сервер. Аудио можно сохранить на устройство
          после завершения попытки.
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
            На этом устройстве не найден локальный английский голос. Для попытки
            нужен локальный английский голос в системе.
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
            <span>Training Mode</span>
            <strong>Text, chunks, replay and next question</strong>
          </button>
          <button
            className="mode-card"
            disabled={!canStartAttempt}
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
        <MicrophoneCheck onReady={() => dispatch({ type: 'RESET' })} />
      )}

      {error && <p className="form-error">{error}</p>}

      {state.status === 'ready' && (
        <article className="question-stage">
          <div className="question-stage__top">
            <span className="status-pill status-started">
              {state.mode === 'practice' ? 'Training Mode' : 'Exam Mode'}
            </span>
          </div>
          <h2>Готово к попытке</h2>
          <p className="empty-state">
            После старта сразу начнутся запись, Question 1 и таймер.
          </p>
          <div className="material-actions">
            <button
              className="primary-button"
              disabled={isStarting || !canStartAttempt}
              onClick={startAttempt}
              type="button"
            >
              Начать попытку
            </button>
            <button className="text-button danger-button" onClick={() => dispatch({ type: 'RESET' })} type="button">
              Отмена
            </button>
          </div>
        </article>
      )}

      {['recording-answer', 'completed'].includes(state.status) && (
        <article className="question-stage">
          <div className="question-stage__top">
            <span className="status-pill status-started">
              Question {state.currentQuestionIndex + 1}/
              {speakingTask2Config.questionCount}
            </span>
            {state.status === 'recording-answer' && (
              <SpeakingTimer endAt={state.endAt} onComplete={goToNextQuestion} />
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
            {state.mode === 'practice' && currentQuestion && state.status === 'recording-answer' && (
              <button className="text-button" onClick={replayQuestion} type="button">
                ↻ Прослушать ещё раз
              </button>
            )}
            {state.status === 'recording-answer' && (
              <button
                className="primary-button big-done-button"
                disabled={!isQuestionPlaybackComplete}
                onClick={goToNextQuestion}
                type="button"
              >
                {isLastQuestion ? 'Завершить попытку' : 'Следующий вопрос →'}
              </button>
            )}
            {state.status === 'completed' && (
              <button className="primary-button" onClick={() => dispatch({ type: 'REVIEW' })} type="button">
                Перейти к проверке
              </button>
            )}
            {state.status !== 'completed' && (
              <button className="text-button danger-button" onClick={cancelTraining} type="button">
                Завершить тренировку
              </button>
            )}
          </div>

          {isRecording && state.status !== 'completed' && (
            <p className="status-message">Идёт непрерывная локальная запись...</p>
          )}

          {sessionRecording?.url && state.status === 'completed' && (
            <div className="audio-review-row">
              <audio controls src={sessionRecording.url}>
                <track kind="captions" />
              </audio>
              <a
                className="text-button"
                download={makeSessionAudioFileName(material, sessionRecording.mimeType)}
                href={sessionRecording.url}
              >
                Скачать общий файл
              </a>
            </div>
          )}
        </article>
      )}
    </section>
  )
}

function makeSessionAudioFileName(material, mimeType) {
  const date = new Date().toISOString().slice(0, 10)
  const extension = mimeType?.includes('mp4') ? 'mp4' : 'webm'
  const safeTitle = material.title.replaceAll(' ', '-')

  return `OGE_Family_Task2_${safeTitle}_session_${date}.${extension}`
}
