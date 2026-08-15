import { useCallback, useEffect, useRef, useState } from 'react'
import { speakingTask1Config } from '../../data/speaking/task1Config'
import { MarkedReadingText } from './MarkedReadingText'
import { MicrophoneCheck } from './MicrophoneCheck'
import { TeacherFeedbackCard } from './TeacherFeedbackCard'
import {
  createMarkedError,
  formatMarkTime,
  getCleanMarkedErrors,
  task1ErrorTypes,
} from './task1Marking'

const focusHints = [
  'word stress',
  'sentence stress',
  'pauses',
  'intonation',
  'clear endings',
  'difficult sounds',
]

const selfReviewItems = [
  'I read the whole text.',
  'I avoided long pauses.',
  'I paid attention to word stress.',
  'I used natural sentence stress.',
  'My intonation matched the meaning.',
  'I pronounced word endings clearly.',
]

export function SpeakingTask1Trainer({
  attempts = [],
  interfaceMode,
  material,
  onBackToSets,
  onImportFeedback,
  onSaveResult,
}) {
  const [mode, setMode] = useState(null)
  const [status, setStatus] = useState('idle')
  const [endAt, setEndAt] = useState(null)
  const [error, setError] = useState('')
  const [showHints, setShowHints] = useState(true)
  const [recording, setRecording] = useState(null)
  const [markedErrors, setMarkedErrors] = useState([])
  const [selfReview, setSelfReview] = useState({})
  const chunksRef = useRef([])
  const discardRecordingRef = useRef(false)
  const recorderRef = useRef(null)
  const recordingRef = useRef(null)
  const recordingStartedAtRef = useRef(null)
  const streamRef = useRef(null)

  const isRecording = status === 'reading'
  const isTeacherMode = interfaceMode === 'teacher'
  const feedbackAttempt = attempts.find((attempt) => attempt.teacherFeedback)

  useEffect(() => {
    recordingRef.current = recording
  }, [recording])

  const clearRecording = useCallback(() => {
    if (recordingRef.current?.url) {
      URL.revokeObjectURL(recordingRef.current.url)
    }
    recordingRef.current = null
    setRecording(null)
  }, [])

  const stopRecording = useCallback(({ discard = false } = {}) => {
    discardRecordingRef.current = discard

    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop()
    }

    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const cleanup = useCallback(
    ({ discard = false } = {}) => {
      stopRecording({ discard })

      if (discard) {
        chunksRef.current = []
        clearRecording()
      }
    },
    [clearRecording, stopRecording],
  )

  useEffect(
    () => () => {
      cleanup({ discard: true })
    },
    [cleanup],
  )

  const startPreparation = (nextMode = mode) => {
    setMode(nextMode)
    setError('')
    setStatus('preparation')
    setEndAt(Date.now() + speakingTask1Config.prepTimeSeconds * 1000)
  }

  const startReading = useCallback(async () => {
    setError('')
    clearRecording()

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError(
        'В этом браузере запись недоступна. Можно использовать текст и Teacher Review без аудиозаписи.',
      )
      setStatus('reading')
      setEndAt(Date.now() + speakingTask1Config.readingTimeSeconds * 1000)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      discardRecordingRef.current = false
      recordingStartedAtRef.current = Date.now()
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
        const durationSeconds = recordingStartedAtRef.current
          ? Math.max(1, Math.round((Date.now() - recordingStartedAtRef.current) / 1000))
          : 0
        const nextRecording = {
          audioBlob,
          durationSeconds,
          mimeType,
          url: URL.createObjectURL(audioBlob),
        }

        recordingRef.current = nextRecording
        setRecording(nextRecording)
      })
      recorder.start()
      setStatus('reading')
      setEndAt(Date.now() + speakingTask1Config.readingTimeSeconds * 1000)
    } catch {
      setError('Не удалось получить доступ к микрофону. Проверьте разрешение в браузере и попробуйте ещё раз.')
    }
  }, [clearRecording])

  const finishReading = useCallback(() => {
    stopRecording()
    setEndAt(null)
    setStatus('completed')
  }, [stopRecording])

  const restartAttempt = () => {
    cleanup({ discard: true })
    setMarkedErrors([])
    setSelfReview({})
    setStatus('idle')
    setMode(null)
  }

  const getCurrentTimestamp = useCallback(() => {
    if (status === 'reading' && recordingStartedAtRef.current) {
      return Math.max(0, Math.round((Date.now() - recordingStartedAtRef.current) / 1000))
    }

    return null
  }, [status])

  const toggleMark = useCallback(
    (token) => {
      if (!isTeacherMode) {
        return
      }

      setMarkedErrors((currentMarks) => {
        if (currentMarks.some((mark) => mark.tokenIndex === token.tokenIndex)) {
          return currentMarks.filter((mark) => mark.tokenIndex !== token.tokenIndex)
        }

        return [
          ...currentMarks,
          createMarkedError({
            materialId: material.id,
            paragraphIndex: token.paragraphIndex,
            timestampSeconds: getCurrentTimestamp(),
            tokenIndex: token.tokenIndex,
            tokenText: token.text,
          }),
        ]
      })
    },
    [getCurrentTimestamp, isTeacherMode, material.id],
  )

  const clearMarks = () => {
    if (markedErrors.length === 0) {
      return
    }

    if (window.confirm('Очистить все отметки ошибок для этого чтения?')) {
      setMarkedErrors([])
    }
  }

  const backToSets = () => {
    if (
      isRecording &&
      !window.confirm(
        'Завершить тренировку? Несохранённая запись будет потеряна.',
      )
    ) {
      return
    }

    cleanup({ discard: true })
    onBackToSets()
  }

  return (
    <section className="speaking-trainer">
      <button className="text-button" onClick={backToSets} type="button">
        ← К заданиям Speaking Task 1
      </button>

      <article className="panel task1-start-header">
        <div className="panel-heading">
          <p className="eyebrow">Speaking Task 1</p>
          <h1>{material.title}</h1>
          <p className="welcome-text">Reading aloud practice</p>
        </div>
        <div className="source-row">
          <span className="source-badge is-extra">Extra Practice</span>
          <span className="section-chip">Reading Aloud</span>
          <span className="section-chip">{speakingTask1Config.examModel}</span>
        </div>
      </article>

      {status === 'idle' && (
        <>
          <div className="task1-mode-grid">
            <article className="task1-mode-card">
              <div>
                <span>Training Mode</span>
                <h2>Тренировка с подсказками</h2>
                <p>Practice with optional hints and teacher notes</p>
              </div>
              <ul>
                <li>90 sec preparation</li>
                <li>up to 2 min reading</li>
                <li>pronunciation support available</li>
              </ul>
              <button className="primary-button" onClick={() => startPreparation('training')} type="button">
                Начать тренировку
              </button>
            </article>
            <article className="task1-mode-card">
              <div>
                <span>Exam Mode</span>
                <h2>Экзаменационный режим</h2>
                <p>Exam-style reading aloud</p>
              </div>
              <ul>
                <li>90 sec preparation</li>
                <li>up to 2 min reading</li>
                <li>no hints</li>
              </ul>
              <button className="primary-button" onClick={() => startPreparation('exam')} type="button">
                Начать экзаменационный режим
              </button>
            </article>
          </div>

          <article className="task1-mic-check">
            <div>
              <span aria-hidden="true">🎙</span>
              <div>
                <h2>Microphone Check</h2>
                <p>Запишите короткий тест перед началом задания.</p>
              </div>
            </div>
            <button className="text-button" onClick={() => setStatus('mic-check')} type="button">
              Проверить микрофон
            </button>
          </article>

          <p className="task1-privacy-note">
            Аудиозапись не отправляется на сервер и сохраняется только вручную на устройство.
          </p>
        </>
      )}

      {status === 'mic-check' && <MicrophoneCheck onReady={() => setStatus('idle')} />}

      {error && <p className="form-error">{error}</p>}

      {status === 'preparation' && (
        <article className="question-stage">
          <div className="question-stage__top">
            <span className="status-pill status-started">Preparation</span>
            <CountdownTimer endAt={endAt} isLowAt={15} onComplete={startReading} />
          </div>
          {mode === 'training' && (
            <>
              <label className="checkbox-row">
                <input
                  checked={showHints}
                  onChange={(event) => setShowHints(event.target.checked)}
                  type="checkbox"
                />
                Показывать подсказки
              </label>
            </>
          )}
          <ReadingTextCard
            canMark={false}
            markedErrors={markedErrors}
            material={material}
            showHints={mode === 'training' && showHints}
          />
          <div className="material-actions">
            <button className="primary-button big-done-button" onClick={startReading} type="button">
              Начать читать раньше →
            </button>
            <button className="text-button danger-button" onClick={backToSets} type="button">
              Завершить тренировку
            </button>
          </div>
        </article>
      )}

      {status === 'reading' && (
        <article className="question-stage">
          <div className="question-stage__top">
            <span className="status-pill status-started">Reading aloud</span>
            <CountdownTimer endAt={endAt} isLowAt={15} onComplete={finishReading} />
          </div>
          <ReadingTextCard
            canMark={isTeacherMode}
            markedErrors={markedErrors}
            material={material}
            onClearMarks={clearMarks}
            onToggleMark={toggleMark}
            showHints={mode === 'training' && showHints}
          />
          <div className="material-actions">
            <button className="primary-button big-done-button" onClick={finishReading} type="button">
              Завершить чтение
            </button>
          </div>
        </article>
      )}

      {status === 'completed' && (
        <Task1Completed
          material={material}
          feedbackAttempt={feedbackAttempt}
          interfaceMode={interfaceMode}
          markedErrors={markedErrors}
          onImportFeedback={onImportFeedback}
          onRestart={restartAttempt}
          onReview={isTeacherMode ? () => setStatus('review') : undefined}
          recording={recording}
          selfReview={selfReview}
          setSelfReview={setSelfReview}
        />
      )}

      {status === 'review' && (
        <Task1TeacherReview
          material={material}
          markedErrors={markedErrors}
          mode={mode}
          onSetMarkedErrors={setMarkedErrors}
          onSaveResult={(attempt) => {
            onSaveResult(attempt)
          }}
          recording={recording}
          selfReview={selfReview}
        />
      )}
    </section>
  )
}

function ReadingTextCard({
  canMark,
  markedErrors,
  material,
  onClearMarks,
  onToggleMark,
  showHints,
}) {
  return (
    <article className="review-card reading-text-card">
      <div className="panel-heading">
        <p className="eyebrow">Text for reading aloud</p>
        <h2>{material.title}</h2>
      </div>
      {canMark && (
        <div className="marked-errors-toolbar">
          <strong>Marked errors: {markedErrors.length}</strong>
          <button className="text-button danger-button" onClick={onClearMarks} type="button">
            Очистить отметки
          </button>
        </div>
      )}
      <MarkedReadingText
        canMark={canMark}
        markedErrors={markedErrors}
        material={material}
        onToggleMark={onToggleMark}
      />
      {showHints && (
        <div className="useful-language">
          <strong>Focus on:</strong>
          <div className="section-chip-row">
            {focusHints.map((hint) => (
              <span className="section-chip" key={hint}>
                {hint}
              </span>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}

function Task1Completed({
  feedbackAttempt,
  interfaceMode,
  markedErrors,
  material,
  onImportFeedback,
  onRestart,
  onReview,
  recording,
  selfReview,
  setSelfReview,
}) {
  const audioRef = useRef(null)
  const [importMessage, setImportMessage] = useState('')
  const isTeacherMode = interfaceMode === 'teacher'

  const handleImport = async (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      const feedback = JSON.parse(await file.text())

      if (feedback.materialId !== material.id) {
        setImportMessage('Этот feedback относится к другому тексту.')
        event.target.value = ''
        return
      }

      const result = onImportFeedback(feedback)
      setImportMessage(result.message)
    } catch {
      setImportMessage('Не удалось прочитать JSON feedback.')
    }

    event.target.value = ''
  }

  return (
    <article className="question-stage">
      <div className="panel-heading">
        <p className="eyebrow">Task completed</p>
        <h2>Speaking Task 1</h2>
        <p className="welcome-text">{material.title}</p>
      </div>
      <p className="empty-state">
        Reading time: {formatTimer(recording?.durationSeconds ?? 0)}
      </p>
      {recording?.url ? (
        <div className="audio-review-row">
          <audio controls ref={audioRef} src={recording.url}>
            <track kind="captions" />
          </audio>
          <button className="text-button" onClick={() => audioRef.current?.play()} type="button">
            ▶ Прослушать
          </button>
          <a
            className="text-button"
            download={makeTask1FileName(material, recording.mimeType)}
            href={recording.url}
          >
            ⬇ Скачать аудио
          </a>
        </div>
      ) : (
        <p className="empty-state">Аудиозапись недоступна для этой попытки.</p>
      )}
      {isTeacherMode && markedErrors.length > 0 && (
        <p className="empty-state">Marked errors: {markedErrors.length}</p>
      )}
      {feedbackAttempt && (
        <>
          <button
            className="text-button"
            onClick={() => {
              document
                .querySelector(`[data-feedback-attempt="${feedbackAttempt.id}"]`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
            type="button"
          >
            Посмотреть комментарий преподавателя
          </button>
          <div data-feedback-attempt={feedbackAttempt.id}>
            <TeacherFeedbackCard attempt={feedbackAttempt} material={material} />
          </div>
        </>
      )}
      {!isTeacherMode && (
        <label className="text-button import-feedback-button">
          Импортировать комментарий преподавателя
          <input accept="application/json" onChange={handleImport} type="file" />
          {importMessage && <small>{importMessage}</small>}
        </label>
      )}
      {isTeacherMode && <SelfReviewPanel selfReview={selfReview} setSelfReview={setSelfReview} />}
      <div className="material-actions">
        <button className="text-button" onClick={onRestart} type="button">
          Попробовать ещё раз
        </button>
        {isTeacherMode && (
          <button className="primary-button" onClick={onReview} type="button">
            Перейти к проверке
          </button>
        )}
      </div>
    </article>
  )
}

function SelfReviewPanel({ selfReview, setSelfReview }) {
  return (
    <article className="review-card">
      <div className="panel-heading">
        <p className="eyebrow">Self-review</p>
        <h2>Self-review</h2>
      </div>
      <div className="self-review-grid">
        {selfReviewItems.map((item) => (
          <label className="checkbox-row" key={item}>
            <input
              checked={Boolean(selfReview[item])}
              onChange={(event) =>
                setSelfReview((current) => ({
                  ...current,
                  [item]: event.target.checked,
                }))
              }
              type="checkbox"
            />
            {item}
          </label>
        ))}
      </div>
    </article>
  )
}

function Task1TeacherReview({
  markedErrors,
  material,
  mode,
  onSetMarkedErrors,
  onSaveResult,
  recording,
  selfReview,
}) {
  const [score, setScore] = useState(0)
  const [phoneticErrorCount, setPhoneticErrorCount] = useState(String(markedErrors.length))
  const [meaningDistortingErrorCount, setMeaningDistortingErrorCount] = useState(
    String(markedErrors.filter((error) => error.meaningDistorting).length),
  )
  const [omittedWords, setOmittedWords] = useState('0')
  const [addedWords, setAddedWords] = useState('0')
  const [lineSkipped, setLineSkipped] = useState(false)
  const [textCompleted, setTextCompleted] = useState(true)
  const [teacherNotes, setTeacherNotes] = useState({
    intonation: '',
    other: '',
    pauses: '',
    pronunciation: '',
    sentenceStress: '',
    wordStress: '',
  })
  const [teacherFeedback, setTeacherFeedback] = useState({
    overallComment: '',
    whatWentWell: '',
    workOn: '',
  })
  const [savedFeedbackExport, setSavedFeedbackExport] = useState(null)
  const audioRef = useRef(null)
  const suggestedPhoneticErrors = markedErrors.length
  const suggestedMeaningErrors = markedErrors.filter((error) => error.meaningDistorting).length
  const recommendedScore = getRecommendedScore({
    addedWords,
    lineSkipped,
    meaningDistortingErrorCount,
    omittedWords,
    phoneticErrorCount,
    textCompleted,
  })

  useEffect(() => {
    setMeaningDistortingErrorCount(String(suggestedMeaningErrors))
  }, [suggestedMeaningErrors])

  const updateMarkedError = (tokenIndex, updates) => {
    onSetMarkedErrors((currentMarks) =>
      currentMarks.map((error) =>
        error.tokenIndex === tokenIndex ? { ...error, ...updates } : error,
      ),
    )
  }

  const toggleReviewMark = (token) => {
    onSetMarkedErrors((currentMarks) => {
      if (currentMarks.some((mark) => mark.tokenIndex === token.tokenIndex)) {
        return currentMarks.filter((mark) => mark.tokenIndex !== token.tokenIndex)
      }

      return [
        ...currentMarks,
        createMarkedError({
          materialId: material.id,
          paragraphIndex: token.paragraphIndex,
          timestampSeconds: audioRef.current ? Math.round(audioRef.current.currentTime) : null,
          tokenIndex: token.tokenIndex,
          tokenText: token.text,
        }),
      ]
    })
  }

  const playFromMark = (timestampSeconds) => {
    if (!audioRef.current || timestampSeconds === null || timestampSeconds === undefined) {
      return
    }

    audioRef.current.currentTime = Math.max(0, timestampSeconds - 1)
    audioRef.current.play()
  }

  const buildAttempt = () => ({
    addedWords,
    completedAt: new Date().toISOString(),
    durationSeconds: recording?.durationSeconds ?? 0,
    lineSkipped,
    markedErrors,
    material,
    meaningDistortingErrorCount,
    mode,
    omittedWords,
    phoneticErrorCount,
    score,
    selfReview,
    teacherFeedback,
    teacherNotes,
    textCompleted,
  })

  const buildFeedbackExport = (attempt) => ({
    schemaVersion: 1,
    materialId: material.id,
    materialTitle: material.title,
    taskType: 'speaking-task-1',
    completedAt: attempt.completedAt,
    score: Number(attempt.score),
    maxScore: speakingTask1Config.maxScore,
    markedErrors: getCleanMarkedErrors(attempt.markedErrors),
    teacherFeedback: attempt.teacherFeedback,
  })

  const saveAttempt = () => {
    const attempt = buildAttempt()
    onSaveResult(attempt)
    setSavedFeedbackExport(buildFeedbackExport(attempt))
  }

  return (
    <section className="page-stack">
      <article className="panel">
        <div className="panel-heading">
          <p className="eyebrow">Teacher Review</p>
          <h2>
            Score: {score}/{speakingTask1Config.maxScore}
          </h2>
        </div>
        {recording?.url && (
          <div className="audio-review-row">
            <audio controls ref={audioRef} src={recording.url}>
              <track kind="captions" />
            </audio>
            <a
              className="text-button"
              download={makeTask1FileName(material, recording.mimeType)}
              href={recording.url}
            >
              Скачать аудио
            </a>
          </div>
        )}
        <details className="criteria-help">
          <summary>Как оценивать Speaking Task 1</summary>
          <p>
            Смотрим не на акцент сам по себе, а на то, насколько легко воспринимается чтение.
            Важны произношение слов, словесное ударение, смысловые паузы, фразовое ударение,
            интонация и грубые ошибки, которые меняют смысл.
          </p>
          <p>
            Подсказка ниже предлагает ориентир, но итоговый балл всегда выбирает преподаватель вручную.
          </p>
          <small>
            Рабочая памятка на основе модели ОГЭ-2026. После публикации ФИПИ-2027 критерии будут сверены.
          </small>
        </details>
      </article>

      <article className="review-card">
        <div className="review-card__header">
          <h2>Подсказка по оцениванию</h2>
          <span>Recommended: {recommendedScore}/2</span>
        </div>
        <p className="empty-state">
          Suggested 2: не более 5 фонетических ошибок и не более 1-2 смыслоискажающих.
          Suggested 1: до 7 фонетических ошибок и до 3 смыслоискажающих.
          Suggested 0: больше 7 фонетических, 4+ смыслоискажающих, 4+ пропущенных/добавленных слов,
          пропущена строка или текст не завершён.
        </p>
      </article>

      <article className="review-card reading-text-card">
        <div className="review-card__header">
          <h2>Interactive reading text</h2>
          <span>Marked errors: {markedErrors.length}</span>
        </div>
        <MarkedReadingText
          canMark
          markedErrors={markedErrors}
          material={material}
          onToggleMark={toggleReviewMark}
        />
      </article>

      <article className="review-card">
        <div className="review-card__header">
          <h2>Correction Work</h2>
          <span>{markedErrors.length} marked</span>
        </div>
        {markedErrors.length === 0 ? (
          <p className="empty-state">Click words in the reading text to mark errors.</p>
        ) : (
          <div className="correction-work-list">
            {markedErrors
              .slice()
              .sort((left, right) => left.tokenIndex - right.tokenIndex)
              .map((error, index) => (
                <article className="correction-work-item" key={error.id ?? error.tokenIndex}>
                  <div className="correction-word-row">
                    <strong>
                      {index + 1}. {error.tokenText}
                    </strong>
                    {error.timestampSeconds !== null && error.timestampSeconds !== undefined && (
                      <button
                        className="text-button"
                        onClick={() => playFromMark(error.timestampSeconds)}
                        type="button"
                      >
                        ▶ {formatMarkTime(error.timestampSeconds)}
                      </button>
                    )}
                  </div>
                  <div className="correction-fields">
                    <label className="compact-field">
                      Error type
                      <select
                        onChange={(event) =>
                          updateMarkedError(error.tokenIndex, { errorType: event.target.value })
                        }
                        value={error.errorType}
                      >
                        {task1ErrorTypes.map((errorType) => (
                          <option key={errorType} value={errorType}>
                            {errorType}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="checkbox-row">
                      <input
                        checked={Boolean(error.meaningDistorting)}
                        onChange={(event) =>
                          updateMarkedError(error.tokenIndex, {
                            meaningDistorting: event.target.checked,
                          })
                        }
                        type="checkbox"
                      />
                      Meaning-distorting
                    </label>
                    <label className="compact-field">
                      Correction / model
                      <input
                        onChange={(event) =>
                          updateMarkedError(error.tokenIndex, { correction: event.target.value })
                        }
                        placeholder="PHOtographs"
                        value={error.correction}
                      />
                    </label>
                    <label className="compact-field">
                      Teacher note
                      <input
                        onChange={(event) =>
                          updateMarkedError(error.tokenIndex, { note: event.target.value })
                        }
                        placeholder="stress on the first syllable"
                        value={error.note}
                      />
                    </label>
                    <label className="checkbox-row">
                      <input
                        checked={Boolean(error.addToErrorBank)}
                        onChange={(event) =>
                          updateMarkedError(error.tokenIndex, {
                            addToErrorBank: event.target.checked,
                          })
                        }
                        type="checkbox"
                      />
                      + Добавить в Error Bank
                    </label>
                    <label className="checkbox-row">
                      <input
                        checked={Boolean(error.addToRevision)}
                        onChange={(event) =>
                          updateMarkedError(error.tokenIndex, {
                            addToRevision: event.target.checked,
                          })
                        }
                        type="checkbox"
                      />
                      Добавить в Revision
                    </label>
                  </div>
                </article>
              ))}
          </div>
        )}
      </article>

      <article className="review-card">
        <div className="review-card__header">
          <h2>Teacher score</h2>
          <span>Manual score</span>
        </div>
        <ScoreSelector max={speakingTask1Config.maxScore} onChange={setScore} value={score} />
        <p className="empty-state">
          Suggested phonetic errors: {suggestedPhoneticErrors}. Suggested meaning-distorting:
          {' '}
          {suggestedMeaningErrors}.
        </p>
        <div className="score-row reading-score-grid">
          <NumberField
            label="Phonetic errors"
            onChange={setPhoneticErrorCount}
            value={phoneticErrorCount}
          />
          <NumberField
            label="Meaning-distorting phonetic errors"
            onChange={setMeaningDistortingErrorCount}
            value={meaningDistortingErrorCount}
          />
          <NumberField label="Words omitted" onChange={setOmittedWords} value={omittedWords} />
          <NumberField label="Words added" onChange={setAddedWords} value={addedWords} />
        </div>
        <div className="self-review-grid">
          <label className="checkbox-row">
            <input
              checked={lineSkipped}
              onChange={(event) => setLineSkipped(event.target.checked)}
              type="checkbox"
            />
            line skipped
          </label>
          <label className="checkbox-row">
            <input
              checked={!textCompleted}
              onChange={(event) => setTextCompleted(!event.target.checked)}
              type="checkbox"
            />
            text not completed
          </label>
        </div>
      </article>

      <article className="review-card">
        <div className="review-card__header">
          <h2>Assessment fields</h2>
          <span>Internal teacher notes</span>
        </div>
        {[
          ['pronunciation', 'Pronunciation'],
          ['wordStress', 'Word stress'],
          ['sentenceStress', 'Sentence stress / rhythm'],
          ['pauses', 'Pauses'],
          ['intonation', 'Intonation'],
          ['other', 'Other'],
        ].map(([field, label]) => (
          <NoteField
            key={field}
            label={label}
            onChange={(value) => setTeacherNotes((current) => ({ ...current, [field]: value }))}
            value={teacherNotes[field]}
          />
        ))}
      </article>

      <article className="review-card">
        <div className="review-card__header">
          <h2>Teacher Feedback</h2>
          <span>Visible to student</span>
        </div>
        <NoteField
          label="What went well"
          onChange={(value) => setTeacherFeedback((current) => ({ ...current, whatWentWell: value }))}
          value={teacherFeedback.whatWentWell}
        />
        <NoteField
          label="Work on"
          onChange={(value) => setTeacherFeedback((current) => ({ ...current, workOn: value }))}
          value={teacherFeedback.workOn}
        />
        <NoteField
          label="Overall comment"
          onChange={(value) => setTeacherFeedback((current) => ({ ...current, overallComment: value }))}
          value={teacherFeedback.overallComment}
        />
      </article>

      <button
        className="primary-button"
        onClick={saveAttempt}
        type="button"
      >
        Сохранить результат
      </button>

      {savedFeedbackExport && (
        <a
          className="text-button"
          download={makeFeedbackFileName(material)}
          href={createJsonDownloadHref(savedFeedbackExport)}
        >
          Экспортировать feedback
        </a>
      )}
    </section>
  )
}

function ScoreSelector({ max, onChange, value }) {
  return (
    <div className="score-toggle">
      {Array.from({ length: max + 1 }, (_, score) => (
        <button
          className={`filter-button ${value === score ? 'is-active' : ''}`}
          key={score}
          onClick={() => onChange(score)}
          type="button"
        >
          {score}
        </button>
      ))}
    </div>
  )
}

function NumberField({ label, onChange, value }) {
  return (
    <label className="compact-field">
      {label}
      <input
        min="0"
        onChange={(event) => onChange(event.target.value)}
        type="number"
        value={value}
      />
    </label>
  )
}

function NoteField({ label, onChange, value }) {
  return (
    <label className="compact-field">
      {label}
      <textarea onChange={(event) => onChange(event.target.value)} value={value} />
    </label>
  )
}

function CountdownTimer({ endAt, isLowAt, onComplete }) {
  const [remaining, setRemaining] = useState(() => getRemainingSeconds(endAt))

  useEffect(() => {
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
      className={`speaking-timer ${remaining <= isLowAt ? 'is-low' : ''}`}
      role="timer"
    >
      {formatTimer(remaining)}
    </div>
  )
}

function getRecommendedScore({
  addedWords,
  lineSkipped,
  meaningDistortingErrorCount,
  omittedWords,
  phoneticErrorCount,
  textCompleted,
}) {
  const phoneticErrors = Number(phoneticErrorCount)
  const meaningErrors = Number(meaningDistortingErrorCount)
  const omitted = Number(omittedWords)
  const added = Number(addedWords)

  if (
    lineSkipped ||
    !textCompleted ||
    phoneticErrors > 7 ||
    meaningErrors >= 4 ||
    omitted >= 4 ||
    added >= 4
  ) {
    return 0
  }

  if (phoneticErrors <= 5 && meaningErrors <= 2) {
    return 2
  }

  if (phoneticErrors <= 7 && meaningErrors <= 3) {
    return 1
  }

  return 0
}

function getRemainingSeconds(endAt) {
  if (!endAt) {
    return 0
  }

  return Math.max(0, Math.ceil((endAt - Date.now()) / 1000))
}

function formatTimer(totalSeconds) {
  const safeSeconds = Math.max(0, totalSeconds)
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function makeTask1FileName(material, mimeType) {
  const date = new Date().toISOString().slice(0, 10)
  const extension = mimeType?.includes('mp4') ? 'mp4' : 'webm'
  const safeTitle = material.title.replaceAll(' ', '-')

  return `OGE_Task1_${safeTitle}_${date}.${extension}`
}

function makeFeedbackFileName(material) {
  const date = new Date().toISOString().slice(0, 10)
  const safeTitle = material.title.replaceAll(' ', '-')

  return `OGE_Task1_feedback_${safeTitle}_${date}.json`
}

function createJsonDownloadHref(value) {
  return `data:application/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(value, null, 2),
  )}`
}
