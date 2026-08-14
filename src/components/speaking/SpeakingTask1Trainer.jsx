import { useCallback, useEffect, useRef, useState } from 'react'
import { speakingTask1Config } from '../../data/speaking/task1Config'
import { MicrophoneCheck } from './MicrophoneCheck'

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

const task1ErrorTypes = [
  'Pronunciation',
  'Word stress',
  'Sentence stress',
  'Intonation',
  'Reading rule',
  'Other',
]

export function SpeakingTask1Trainer({
  focusNotes,
  material,
  onAddError,
  onBackToSets,
  onSaveFocusNotes,
  onSaveResult,
}) {
  const [mode, setMode] = useState(null)
  const [status, setStatus] = useState('idle')
  const [endAt, setEndAt] = useState(null)
  const [error, setError] = useState('')
  const [showHints, setShowHints] = useState(true)
  const [recording, setRecording] = useState(null)
  const [selfReview, setSelfReview] = useState({})
  const chunksRef = useRef([])
  const discardRecordingRef = useRef(false)
  const recorderRef = useRef(null)
  const recordingRef = useRef(null)
  const recordingStartedAtRef = useRef(null)
  const streamRef = useRef(null)

  const isRecording = status === 'reading'

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

  const chooseMode = (nextMode) => {
    setMode(nextMode)
    setStatus('ready')
  }

  const startPreparation = () => {
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
    setSelfReview({})
    setStatus('idle')
    setMode(null)
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

      <article className="panel">
        <div className="panel-heading">
          <p className="eyebrow">Speaking Task 1</p>
          <h1>{material.title}</h1>
          <p className="welcome-text">{material.description}</p>
        </div>
        <div className="source-row">
          <span className="source-badge is-extra">Extra Practice</span>
          <span className="section-chip">Reading Aloud</span>
          <span className="section-chip">{speakingTask1Config.examModel}</span>
        </div>
        <p className="empty-state">
          Запись не отправляется на сервер. После выполнения её можно сохранить на устройство.
        </p>
      </article>

      {status === 'idle' && (
        <>
          <div className="material-grid">
            <button className="mode-card" onClick={() => chooseMode('training')} type="button">
              <span>Training Mode</span>
              <strong>Reading practice with focus hints and local notes</strong>
            </button>
            <button className="mode-card" onClick={() => chooseMode('exam')} type="button">
              <span>Exam Mode</span>
              <strong>Preparation, reading aloud and teacher scoring</strong>
            </button>
            <button className="mode-card" onClick={() => setStatus('mic-check')} type="button">
              <span>Microphone Check</span>
              <strong>Record a short local test</strong>
            </button>
          </div>
          <ReadingTextCard
            focusNotes={focusNotes}
            material={material}
            showFocusNotes
            showHints
          />
        </>
      )}

      {status === 'mic-check' && <MicrophoneCheck onReady={() => setStatus('idle')} />}

      {error && <p className="form-error">{error}</p>}

      {status === 'ready' && (
        <article className="question-stage">
          <div className="question-stage__top">
            <span className="status-pill status-started">
              {mode === 'training' ? 'Training Mode' : 'Exam Mode'}
            </span>
          </div>
          {mode === 'exam' && (
            <div className="source-row">
              <span className="section-chip">Preparation: 1 min 30 sec</span>
              <span className="section-chip">Reading aloud: up to 2 min</span>
              <span className="section-chip">One attempt</span>
            </div>
          )}
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
              <TeacherFocusNotes
                focusNotes={focusNotes}
                materialId={material.id}
                onSaveFocusNotes={onSaveFocusNotes}
              />
            </>
          )}
          <ReadingTextCard
            focusNotes={focusNotes}
            material={material}
            showFocusNotes={mode === 'training'}
            showHints={mode === 'training' && showHints}
          />
          <div className="material-actions">
            <button className="primary-button" onClick={startPreparation} type="button">
              Начать
            </button>
            <button className="text-button danger-button" onClick={() => setStatus('idle')} type="button">
              Отмена
            </button>
          </div>
        </article>
      )}

      {status === 'preparation' && (
        <article className="question-stage">
          <div className="question-stage__top">
            <span className="status-pill status-started">Preparation</span>
            <CountdownTimer endAt={endAt} isLowAt={15} onComplete={startReading} />
          </div>
          {mode === 'training' && (
            <label className="checkbox-row">
              <input
                checked={showHints}
                onChange={(event) => setShowHints(event.target.checked)}
                type="checkbox"
              />
              Показывать подсказки
            </label>
          )}
          <ReadingTextCard
            focusNotes={focusNotes}
            material={material}
            showFocusNotes={mode === 'training'}
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
            focusNotes={focusNotes}
            material={material}
            showFocusNotes={mode === 'training'}
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
          onRestart={restartAttempt}
          onReview={() => setStatus('review')}
          recording={recording}
          selfReview={selfReview}
          setSelfReview={setSelfReview}
        />
      )}

      {status === 'review' && (
        <Task1TeacherReview
          material={material}
          mode={mode}
          onAddError={onAddError}
          onSaveResult={(attempt) => {
            onSaveResult(attempt)
            clearRecording()
            onBackToSets()
          }}
          recording={recording}
          selfReview={selfReview}
        />
      )}
    </section>
  )
}

function ReadingTextCard({ focusNotes, material, showFocusNotes, showHints }) {
  return (
    <article className="review-card reading-text-card">
      <div className="panel-heading">
        <p className="eyebrow">Text for reading aloud</p>
        <h2>{material.title}</h2>
      </div>
      <div className="reading-text">
        {material.text.split('\n').map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
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
      {showFocusNotes && focusNotes.length > 0 && (
        <div className="useful-language">
          <strong>Teacher focus words</strong>
          <div className="task-list">
            {focusNotes.map((note) => (
              <div className="task-item reading-focus-item" key={note.id}>
                <strong>{note.phrase}</strong>
                <span>{note.note}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}

function TeacherFocusNotes({ focusNotes, materialId, onSaveFocusNotes }) {
  const [phrase, setPhrase] = useState('')
  const [note, setNote] = useState('')

  const addNote = (event) => {
    event.preventDefault()

    if (!phrase.trim() || !note.trim()) {
      return
    }

    onSaveFocusNotes(materialId, [
      ...focusNotes,
      {
        id: `focus-${crypto.randomUUID()}`,
        note: note.trim(),
        phrase: phrase.trim(),
      },
    ])
    setPhrase('')
    setNote('')
  }

  const deleteNote = (noteId) => {
    onSaveFocusNotes(
      materialId,
      focusNotes.filter((focusNote) => focusNote.id !== noteId),
    )
  }

  return (
    <article className="review-card">
      <div className="panel-heading">
        <p className="eyebrow">Режим разметки текста</p>
        <h2>Teacher focus words</h2>
      </div>
      <form className="inline-form" onSubmit={addNote}>
        <label className="compact-field">
          Слово/фраза
          <input
            onChange={(event) => setPhrase(event.target.value)}
            placeholder="photographs"
            value={phrase}
          />
        </label>
        <label className="compact-field">
          Note
          <input
            onChange={(event) => setNote(event.target.value)}
            placeholder="word stress"
            value={note}
          />
        </label>
        <button className="primary-button" type="submit">
          + Добавить слово/фразу
        </button>
      </form>
      {focusNotes.length > 0 && (
        <div className="question-review-list">
          {focusNotes.map((focusNote) => (
            <div className="question-review-item" key={focusNote.id}>
              <div>
                <strong>{focusNote.phrase}</strong>
                <p>{focusNote.note}</p>
              </div>
              <button className="text-button danger-button" onClick={() => deleteNote(focusNote.id)} type="button">
                Удалить
              </button>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}

function Task1Completed({
  material,
  onRestart,
  onReview,
  recording,
  selfReview,
  setSelfReview,
}) {
  const audioRef = useRef(null)

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
            Скачать аудио
          </a>
        </div>
      ) : (
        <p className="empty-state">Аудиозапись недоступна для этой попытки.</p>
      )}
      <SelfReviewPanel selfReview={selfReview} setSelfReview={setSelfReview} />
      <div className="material-actions">
        <button className="text-button" onClick={onRestart} type="button">
          Перезаписать
        </button>
        <button className="primary-button" onClick={onReview} type="button">
          Перейти к проверке
        </button>
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
  material,
  mode,
  onAddError,
  onSaveResult,
  recording,
  selfReview,
}) {
  const [score, setScore] = useState(0)
  const [phoneticErrorCount, setPhoneticErrorCount] = useState('0')
  const [meaningDistortingErrorCount, setMeaningDistortingErrorCount] = useState('0')
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
  const [isErrorFormOpen, setIsErrorFormOpen] = useState(false)
  const recommendedScore = getRecommendedScore({
    addedWords,
    lineSkipped,
    meaningDistortingErrorCount,
    omittedWords,
    phoneticErrorCount,
    textCompleted,
  })

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
            <audio controls src={recording.url}>
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

      <article className="review-card">
        <div className="review-card__header">
          <h2>Teacher score</h2>
          <span>Manual score</span>
        </div>
        <ScoreSelector max={speakingTask1Config.maxScore} onChange={setScore} value={score} />
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
          <h2>Teacher notes</h2>
          <span>Pronunciation details</span>
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

      <div className="review-actions">
        <button className="text-button" onClick={() => setIsErrorFormOpen(true)} type="button">
          + Добавить ошибку
        </button>
      </div>

      {isErrorFormOpen && (
        <SpeakingTask1ErrorForm
          materialId={material.id}
          onCancel={() => setIsErrorFormOpen(false)}
          onSave={(error) => {
            onAddError(error)
            setIsErrorFormOpen(false)
          }}
        />
      )}

      <button
        className="primary-button"
        onClick={() =>
          onSaveResult({
            addedWords,
            durationSeconds: recording?.durationSeconds ?? 0,
            lineSkipped,
            material,
            meaningDistortingErrorCount,
            mode,
            omittedWords,
            phoneticErrorCount,
            score,
            selfReview,
            teacherNotes,
            textCompleted,
          })
        }
        type="button"
      >
        Сохранить результат
      </button>
    </section>
  )
}

function SpeakingTask1ErrorForm({ materialId, onCancel, onSave }) {
  const [original, setOriginal] = useState('')
  const [correction, setCorrection] = useState('')
  const [type, setType] = useState('Pronunciation')
  const [target, setTarget] = useState('')
  const [inRevision, setInRevision] = useState(true)

  return (
    <form
      className="inline-form"
      onSubmit={(event) => {
        event.preventDefault()
        onSave({
          correction,
          inRevision,
          materialId,
          original,
          source: 'Speaking Task 1',
          target,
          type,
        })
      }}
    >
      <label className="compact-field">
        Word / phrase
        <input onChange={(event) => setOriginal(event.target.value)} required value={original} />
      </label>
      <label className="compact-field">
        Correction / note
        <input onChange={(event) => setCorrection(event.target.value)} required value={correction} />
      </label>
      <label className="compact-field">
        Type
        <select onChange={(event) => setType(event.target.value)} value={type}>
          {task1ErrorTypes.map((errorType) => (
            <option key={errorType} value={errorType}>
              {errorType}
            </option>
          ))}
        </select>
      </label>
      <label className="compact-field">
        Target
        <input onChange={(event) => setTarget(event.target.value)} value={target} />
      </label>
      <label className="checkbox-row">
        <input
          checked={inRevision}
          onChange={(event) => setInRevision(event.target.checked)}
          type="checkbox"
        />
        Добавить в Revision
      </label>
      <div className="profile-form-actions">
        <button className="primary-button" type="submit">
          Сохранить
        </button>
        <button className="text-button" onClick={onCancel} type="button">
          Отмена
        </button>
      </div>
    </form>
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
