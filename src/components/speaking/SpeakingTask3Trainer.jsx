import { useCallback, useEffect, useRef, useState } from 'react'
import { speakingTask3Config } from '../../data/speaking/task3Config'
import { MicrophoneCheck } from './MicrophoneCheck'

const supportBlocks = [
  {
    title: 'Introduction',
    items: ["I'd like to give a talk about..."],
  },
  {
    title: 'Moving to the next point',
    items: ['As for...', 'Speaking about...', "Another thing I'd like to mention is..."],
  },
  {
    title: 'Opinion',
    items: ['Personally, I think...', 'In my opinion...'],
  },
  {
    title: 'Conclusion',
    items: ["That's all I wanted to say about..."],
  },
]

const selfReviewItems = [
  'I covered all 4 points.',
  'I gave reasons/examples where necessary.',
  'I used an introduction.',
  'I used linking words.',
  'I gave my opinion.',
  'I used a conclusion.',
  'I spoke continuously.',
]

const aspectOptions = ['fully covered', 'partly covered', 'not covered']
const organisationItems = [
  'introduction present',
  'conclusion present',
  'ideas are logically organised',
  'linking devices are used',
  'response sounds like one connected monologue',
]
const chunkUsageOptions = ['used independently', 'used with help', 'not used']

export function SpeakingTask3Trainer({
  material,
  onAddError,
  onAddRevision,
  onBackToSets,
  onSaveResult,
}) {
  const [mode, setMode] = useState(null)
  const [status, setStatus] = useState('idle')
  const [endAt, setEndAt] = useState(null)
  const [error, setError] = useState('')
  const [showSupport, setShowSupport] = useState(true)
  const [showUsefulLanguage, setShowUsefulLanguage] = useState(true)
  const [recording, setRecording] = useState(null)
  const [selfReview, setSelfReview] = useState({})
  const [selfSentenceCount, setSelfSentenceCount] = useState('')
  const [chunkUsage, setChunkUsage] = useState(() =>
    Object.fromEntries(material.targetChunks.map((chunk) => [chunk, 'not used'])),
  )
  const chunksRef = useRef([])
  const discardRecordingRef = useRef(false)
  const recorderRef = useRef(null)
  const recordingRef = useRef(null)
  const recordingStartedAtRef = useRef(null)
  const streamRef = useRef(null)

  const hasActiveWork = ['preparation', 'recording', 'completed', 'review'].includes(status)

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
    setStatus('preparation')
    setError('')
    setEndAt(Date.now() + speakingTask3Config.prepTimeSeconds * 1000)
  }

  const startRecording = async () => {
    setError('')
    clearRecording()

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError(
        'В этом браузере запись недоступна. Вы всё равно можете использовать план и Training Mode без записи.',
      )
      setStatus('recording')
      setEndAt(Date.now() + speakingTask3Config.answerTimeSeconds * 1000)
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
      setStatus('recording')
      setEndAt(Date.now() + speakingTask3Config.answerTimeSeconds * 1000)
    } catch {
      setError('Не удалось получить доступ к микрофону. Проверьте разрешение в браузере и попробуйте ещё раз.')
    }
  }

  const finishRecording = useCallback(() => {
    stopRecording()
    setEndAt(null)
    setStatus('completed')
  }, [stopRecording])

  const restartAttempt = () => {
    cleanup({ discard: true })
    setSelfReview({})
    setSelfSentenceCount('')
    setChunkUsage(Object.fromEntries(material.targetChunks.map((chunk) => [chunk, 'not used'])))
    setStatus('idle')
    setMode(null)
  }

  const cancelToSets = () => {
    if (
      hasActiveWork &&
      !window.confirm(
        'Завершить тренировку? Текущая несохранённая запись будет потеряна.',
      )
    ) {
      return
    }

    cleanup({ discard: hasActiveWork })
    onBackToSets()
  }

  return (
    <section className="speaking-trainer">
      <button className="text-button" onClick={cancelToSets} type="button">
        ← К наборам Speaking Task 3
      </button>

      <article className="panel">
        <div className="panel-heading">
          <p className="eyebrow">Speaking Task 3</p>
          <h1>{material.title}</h1>
          <p className="welcome-text">{material.description}</p>
        </div>
        <div className="source-row">
          <span className="source-badge is-extra">Extra Practice</span>
          <span className="section-chip">Monologue</span>
          <span className="section-chip">{speakingTask3Config.examModel}</span>
        </div>
        <p className="empty-state">
          Запись не отправляется на сервер. Аудио можно сохранить на устройство после завершения.
        </p>
      </article>

      {status === 'idle' && (
        <>
          <div className="material-grid">
            <button className="mode-card" onClick={() => chooseMode('training')} type="button">
              <span>Training Mode</span>
              <strong>Preparation with useful language and support</strong>
            </button>
            <button className="mode-card" onClick={() => chooseMode('exam')} type="button">
              <span>Exam Mode</span>
              <strong>Preparation, one answer, teacher scoring</strong>
            </button>
            <button className="mode-card" onClick={() => setStatus('mic-check')} type="button">
              <span>Microphone Check</span>
              <strong>Record a short local test</strong>
            </button>
          </div>
          <TaskPreview material={material} showSupport showUsefulLanguage />
        </>
      )}

      {status === 'mic-check' && (
        <MicrophoneCheck onReady={() => setStatus('idle')} />
      )}

      {error && <p className="form-error">{error}</p>}

      {status === 'ready' && (
        <article className="question-stage">
          <div className="question-stage__top">
            <span className="status-pill status-started">
              {mode === 'training' ? 'Training Mode' : 'Exam Mode'}
            </span>
          </div>
          <TaskPreview
            material={material}
            showSupport={mode === 'training' && showSupport}
            showUsefulLanguage={mode === 'training' && showUsefulLanguage}
          />
          {mode === 'training' ? (
            <div className="review-actions">
              <label className="checkbox-row">
                <input
                  checked={showUsefulLanguage}
                  onChange={(event) => setShowUsefulLanguage(event.target.checked)}
                  type="checkbox"
                />
                Показывать Useful language
              </label>
              <label className="checkbox-row">
                <input
                  checked={showSupport}
                  onChange={(event) => setShowSupport(event.target.checked)}
                  type="checkbox"
                />
                Показывать speaking support
              </label>
            </div>
          ) : (
            <div className="source-row">
              <span className="section-chip">Preparation: 1 min 30 sec</span>
              <span className="section-chip">Speaking: up to 2 min</span>
              <span className="section-chip">
                {speakingTask3Config.recommendedSentencesMin}–
                {speakingTask3Config.recommendedSentencesMax} sentences
              </span>
              <span className="section-chip">{speakingTask3Config.planPoints} points</span>
              <span className="section-chip">One attempt</span>
            </div>
          )}
          <div className="material-actions">
            <button className="primary-button" onClick={startPreparation} type="button">
              {mode === 'training' ? 'Начать тренировку' : 'Начать попытку'}
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
            <CountdownTimer endAt={endAt} isLowAt={15} onComplete={startRecording} />
          </div>
          <TaskPreview
            material={material}
            showSupport={mode === 'training' && showSupport}
            showUsefulLanguage={mode === 'training' && showUsefulLanguage}
          />
          {mode === 'training' && (
            <div className="review-actions">
              <label className="checkbox-row">
                <input
                  checked={showUsefulLanguage}
                  onChange={(event) => setShowUsefulLanguage(event.target.checked)}
                  type="checkbox"
                />
                Показывать Useful language
              </label>
              <label className="checkbox-row">
                <input
                  checked={showSupport}
                  onChange={(event) => setShowSupport(event.target.checked)}
                  type="checkbox"
                />
                Показывать speaking support
              </label>
            </div>
          )}
          <div className="material-actions">
            <button className="primary-button big-done-button" onClick={startRecording} type="button">
              Начать ответ раньше →
            </button>
            <button className="text-button danger-button" onClick={cancelToSets} type="button">
              Завершить тренировку
            </button>
          </div>
        </article>
      )}

      {status === 'recording' && (
        <article className="question-stage">
          <div className="question-stage__top">
            <span className="status-pill status-started">Recording</span>
            <CountdownTimer endAt={endAt} isLowAt={15} onComplete={finishRecording} />
          </div>
          <TaskPreview
            material={material}
            showSupport={mode === 'training' && showSupport}
            showUsefulLanguage={mode === 'training' && showUsefulLanguage}
          />
          <div className="material-actions">
            <button className="primary-button big-done-button" onClick={finishRecording} type="button">
              Завершить ответ
            </button>
          </div>
        </article>
      )}

      {status === 'completed' && (
        <Task3Completed
          chunkUsage={chunkUsage}
          material={material}
          mode={mode}
          onChunkUsageChange={(chunk, value) =>
            setChunkUsage((current) => ({ ...current, [chunk]: value }))
          }
          onRestart={restartAttempt}
          onReview={() => setStatus('review')}
          recording={recording}
          selfReview={selfReview}
          selfSentenceCount={selfSentenceCount}
          setSelfReview={setSelfReview}
          setSelfSentenceCount={setSelfSentenceCount}
        />
      )}

      {status === 'review' && (
        <Task3TeacherReview
          chunkUsage={chunkUsage}
          material={material}
          mode={mode}
          onAddError={onAddError}
          onAddRevision={onAddRevision}
          onSaveResult={(attempt) => {
            onSaveResult(attempt)
            clearRecording()
            setStatus('idle')
            setMode(null)
          }}
          recording={recording}
          selfReview={{ checklist: selfReview, sentenceCount: selfSentenceCount }}
        />
      )}
    </section>
  )
}

function TaskPreview({ material, showSupport, showUsefulLanguage }) {
  return (
    <article className="review-card">
      <h2>{material.prompt}</h2>
      <p>You have to talk continuously.</p>
      <div className="task-list">
        {material.planPoints.map((point, index) => (
          <div className="task-item" key={point}>
            <span>{index + 1}</span>
            <strong>{point}</strong>
          </div>
        ))}
      </div>
      {showUsefulLanguage && (
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
      )}
      {showSupport && (
        <div className="useful-language">
          <strong>Speaking support</strong>
          <div className="task-list">
            {supportBlocks.map((block) => (
              <div className="task-item" key={block.title}>
                <div>
                  <span>{block.title}</span>
                  <strong>{block.items.join(' / ')}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}

function Task3Completed({
  chunkUsage,
  material,
  mode,
  onChunkUsageChange,
  onRestart,
  onReview,
  recording,
  selfReview,
  selfSentenceCount,
  setSelfReview,
  setSelfSentenceCount,
}) {
  const audioRef = useRef(null)

  return (
    <article className="question-stage">
      <div className="panel-heading">
        <p className="eyebrow">Task completed</p>
        <h2>Speaking Task 3</h2>
        <p className="welcome-text">{material.title}</p>
      </div>
      <p className="empty-state">
        Speaking time: {formatTimer(recording?.durationSeconds ?? 0)}
      </p>
      {recording?.url ? (
        <div className="audio-review-row">
          <audio controls ref={audioRef} src={recording.url}>
            <track kind="captions" />
          </audio>
          <button className="text-button" onClick={() => audioRef.current?.play()} type="button">
            ▶ Прослушать ответ
          </button>
          <a
            className="text-button"
            download={makeTask3FileName(material, recording.mimeType)}
            href={recording.url}
          >
            Скачать аудио
          </a>
        </div>
      ) : (
        <p className="empty-state">Аудиозапись недоступна для этой попытки.</p>
      )}
      <SelfReviewPanel
        selfReview={selfReview}
        selfSentenceCount={selfSentenceCount}
        setSelfReview={setSelfReview}
        setSelfSentenceCount={setSelfSentenceCount}
      />
      {mode === 'training' && (
        <ChunkUsagePanel
          chunkUsage={chunkUsage}
          material={material}
          onChunkUsageChange={onChunkUsageChange}
        />
      )}
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

function SelfReviewPanel({
  selfReview,
  selfSentenceCount,
  setSelfReview,
  setSelfSentenceCount,
}) {
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
      <label className="compact-field">
        How many sentences do you think you used?
        <input
          min="0"
          onChange={(event) => setSelfSentenceCount(event.target.value)}
          type="number"
          value={selfSentenceCount}
        />
      </label>
    </article>
  )
}

function ChunkUsagePanel({ chunkUsage, material, onChunkUsageChange }) {
  return (
    <article className="review-card">
      <div className="panel-heading">
        <p className="eyebrow">Target language used</p>
        <h2>Target language used</h2>
      </div>
      <div className="task-list">
        {material.targetChunks.map((chunk) => (
          <div className="task-item" key={chunk}>
            <strong>{chunk}</strong>
            <div className="score-toggle" aria-label={`Usage for ${chunk}`}>
              {chunkUsageOptions.map((option) => (
                <button
                  className={`filter-button ${chunkUsage[chunk] === option ? 'is-active' : ''}`}
                  key={option}
                  onClick={() => onChunkUsageChange(chunk, option)}
                  type="button"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}

function Task3TeacherReview({
  chunkUsage,
  material,
  mode,
  onAddError,
  onAddRevision,
  onSaveResult,
  recording,
  selfReview,
}) {
  const [criteriaScores, setCriteriaScores] = useState({ k1: 0, k2: 0, k3: 0 })
  const [aspectReview, setAspectReview] = useState(() =>
    Object.fromEntries(material.planPoints.map((point, index) => [`aspect-${index + 1}`, 'partly covered'])),
  )
  const [organisationReview, setOrganisationReview] = useState({})
  const [sentenceCount, setSentenceCount] = useState('')
  const [teacherNotes, setTeacherNotes] = useState({
    grammar: '',
    k1: '',
    k2: '',
    overall: '',
    pronunciation: '',
    vocabulary: '',
  })
  const [isErrorFormOpen, setIsErrorFormOpen] = useState(false)
  const score = criteriaScores.k1 + criteriaScores.k2 + criteriaScores.k3

  return (
    <section className="page-stack">
      <article className="panel">
        <div className="panel-heading">
          <p className="eyebrow">Teacher Review</p>
          <h2>
            Score: {score}/{speakingTask3Config.maxScore}
          </h2>
        </div>
        {recording?.url && (
          <div className="audio-review-row">
            <audio controls src={recording.url}>
              <track kind="captions" />
            </audio>
            <a
              className="text-button"
              download={makeTask3FileName(material, recording.mimeType)}
              href={recording.url}
            >
              Скачать аудио
            </a>
          </div>
        )}
        <details className="criteria-help">
          <summary>Как оценивать Speaking Task 3</summary>
          <p>
            K1: оцениваем, насколько полно раскрыты все 4 пункта, есть ли нужные
            пояснения и достаточно ли объёма ответа. Ориентир для сильного ответа:
            {speakingTask3Config.recommendedSentencesMin}–{speakingTask3Config.recommendedSentencesMax} фраз.
          </p>
          <p>
            K2: смотрим на вступление, завершение, логичное развитие мысли и
            средства связи.
          </p>
          <p>
            K3: оцениваем, помогает ли грамматика, лексика и произношение ясно
            выразить мысль. Maximum: {speakingTask3Config.maxScore} points.
          </p>
          <small>
            Рабочая памятка на основе модели ОГЭ-2026. После публикации материалов
            ФИПИ-2027 критерии будут сверены.
          </small>
        </details>
      </article>

      <ReviewBlock title="K1" subtitle="Решение коммуникативной задачи">
        <ScoreSelector
          max={3}
          onChange={(value) => setCriteriaScores((current) => ({ ...current, k1: value }))}
          value={criteriaScores.k1}
        />
        {material.planPoints.map((point, index) => {
          const aspectId = `aspect-${index + 1}`

          return (
            <label className="compact-field" key={point}>
              Aspect {index + 1}: {point}
              <select
                onChange={(event) =>
                  setAspectReview((current) => ({
                    ...current,
                    [aspectId]: event.target.value,
                  }))
                }
                value={aspectReview[aspectId]}
              >
                {aspectOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          )
        })}
        <label className="compact-field">
          Approx. number of sentences
          <input
            min="0"
            onChange={(event) => setSentenceCount(event.target.value)}
            type="number"
            value={sentenceCount}
          />
        </label>
        <NoteField
          label="Teacher note"
          onChange={(value) => setTeacherNotes((current) => ({ ...current, k1: value }))}
          value={teacherNotes.k1}
        />
      </ReviewBlock>

      <ReviewBlock title="K2" subtitle="Организация высказывания">
        <ScoreSelector
          max={2}
          onChange={(value) => setCriteriaScores((current) => ({ ...current, k2: value }))}
          value={criteriaScores.k2}
        />
        <div className="self-review-grid">
          {organisationItems.map((item) => (
            <label className="checkbox-row" key={item}>
              <input
                checked={Boolean(organisationReview[item])}
                onChange={(event) =>
                  setOrganisationReview((current) => ({
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
        <NoteField
          label="Teacher note"
          onChange={(value) => setTeacherNotes((current) => ({ ...current, k2: value }))}
          value={teacherNotes.k2}
        />
      </ReviewBlock>

      <ReviewBlock title="K3" subtitle="Языковое оформление">
        <ScoreSelector
          max={2}
          onChange={(value) => setCriteriaScores((current) => ({ ...current, k3: value }))}
          value={criteriaScores.k3}
        />
        {['grammar', 'vocabulary', 'pronunciation', 'overall'].map((field) => (
          <NoteField
            key={field}
            label={field === 'overall' ? 'Overall language note' : field}
            onChange={(value) => setTeacherNotes((current) => ({ ...current, [field]: value }))}
            value={teacherNotes[field]}
          />
        ))}
      </ReviewBlock>

      <div className="review-actions">
        <button className="text-button" onClick={() => setIsErrorFormOpen(true)} type="button">
          + Добавить ошибку
        </button>
        <button
          className="text-button"
          onClick={() =>
            onAddRevision({
              materialId: material.id,
              sourceId: material.id,
              sourceType: 'Speaking Task 3',
              taskType: material.taskType,
              title: material.title,
            })
          }
          type="button"
        >
          Повторить это задание позже
        </button>
      </div>

      {isErrorFormOpen && (
        <SpeakingTask3ErrorForm
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
            aspectReview: { ...aspectReview, organisation: organisationReview },
            chunkUsage,
            criteriaScores,
            durationSeconds: recording?.durationSeconds ?? 0,
            material,
            mode,
            score,
            selfReview,
            teacherNotes: {
              ...teacherNotes,
              approxSentenceCount: sentenceCount,
            },
          })
        }
        type="button"
      >
        Сохранить результат
      </button>
    </section>
  )
}

function ReviewBlock({ children, subtitle, title }) {
  return (
    <article className="review-card">
      <div className="review-card__header">
        <h2>{title}</h2>
        <span>{subtitle}</span>
      </div>
      {children}
    </article>
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

function NoteField({ label, onChange, value }) {
  return (
    <label className="compact-field">
      {label}
      <textarea onChange={(event) => onChange(event.target.value)} value={value} />
    </label>
  )
}

function SpeakingTask3ErrorForm({ materialId, onCancel, onSave }) {
  const [original, setOriginal] = useState('')
  const [correction, setCorrection] = useState('')
  const [type, setType] = useState('Grammar')
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
          source: 'Speaking Task 3',
          target,
          type,
        })
      }}
    >
      <label className="compact-field">
        Original
        <input onChange={(event) => setOriginal(event.target.value)} required value={original} />
      </label>
      <label className="compact-field">
        Correction
        <input onChange={(event) => setCorrection(event.target.value)} required value={correction} />
      </label>
      <label className="compact-field">
        Type
        <select onChange={(event) => setType(event.target.value)} value={type}>
          {['Grammar', 'Vocabulary', 'Chunk', 'Pronunciation', 'Task achievement', 'Organisation', 'Other'].map(
            (errorType) => (
              <option key={errorType} value={errorType}>
                {errorType}
              </option>
            ),
          )}
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

function makeTask3FileName(material, mimeType) {
  const date = new Date().toISOString().slice(0, 10)
  const extension = mimeType?.includes('mp4') ? 'mp4' : 'webm'
  const safeTitle = material.title.replaceAll(' ', '-')

  return `OGE_Task3_${safeTitle}_${date}.${extension}`
}
