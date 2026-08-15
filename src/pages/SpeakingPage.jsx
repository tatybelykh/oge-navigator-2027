import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SpeakingTask1Trainer } from '../components/speaking/SpeakingTask1Trainer'
import { SpeakingTask2Trainer } from '../components/speaking/SpeakingTask2Trainer'
import { SpeakingTask3Trainer } from '../components/speaking/SpeakingTask3Trainer'
import { familyTask1Texts, getSpeakingTask1Text } from '../data/speaking/familyTask1Texts'
import { familyTask2Sets, getSpeakingTask2Set } from '../data/speaking/familyTask2Sets'
import { familyTask3Sets, getSpeakingTask3Set } from '../data/speaking/familyTask3Sets'
import { getAttemptsForMaterial } from '../utils/progressCalculator'

export function SpeakingPage({ interfaceMode, progressActions }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchTask = searchParams.get('task')
  const initialSetId = searchParams.get('set')
  const initialTask = getInitialTask(searchTask, initialSetId)
  const [activeTask, setActiveTask] = useState(initialTask)
  const [selectedSetId, setSelectedSetId] = useState(initialSetId)
  const selectedTask1Set = useMemo(
    () => (activeTask === '1' && selectedSetId ? getSpeakingTask1Text(selectedSetId) : null),
    [activeTask, selectedSetId],
  )
  const selectedTask2Set = useMemo(
    () => (activeTask === '2' && selectedSetId ? getSpeakingTask2Set(selectedSetId) : null),
    [activeTask, selectedSetId],
  )
  const selectedTask3Set = useMemo(
    () => (activeTask === '3' && selectedSetId ? getSpeakingTask3Set(selectedSetId) : null),
    [activeTask, selectedSetId],
  )

  const openSet = (task, setId) => {
    setActiveTask(task)
    setSelectedSetId(setId)
    setSearchParams({ set: setId, task })
  }

  const closeSet = () => {
    setSelectedSetId(null)
    setSearchParams({})
  }

  if (selectedTask1Set) {
    return (
      <SpeakingTask1Trainer
        attempts={getAttemptsForMaterial(progressActions.studentData.attempts, selectedTask1Set.id)}
        interfaceMode={interfaceMode}
        material={selectedTask1Set}
        onBackToSets={closeSet}
        onImportFeedback={progressActions.importSpeakingTask1Feedback}
        onSaveResult={progressActions.addSpeakingTask1Attempt}
      />
    )
  }

  if (selectedTask2Set) {
    return (
      <SpeakingTask2Trainer
        material={selectedTask2Set}
        onAddError={progressActions.addError}
        onAddRevision={progressActions.addRevisionItem}
        onBackToSets={closeSet}
        onSaveResult={progressActions.addSpeakingTask2Attempt}
      />
    )
  }

  if (selectedTask3Set) {
    return (
      <SpeakingTask3Trainer
        material={selectedTask3Set}
        onAddError={progressActions.addError}
        onAddRevision={progressActions.addRevisionItem}
        onBackToSets={closeSet}
        onSaveResult={progressActions.addSpeakingTask3Attempt}
      />
    )
  }

  return (
    <section className="page-stack">
      <header className="page-header">
        <p className="eyebrow">Speaking</p>
        <h1>Speaking Practice</h1>
        <p className="welcome-text">
          Тренировка устной части внутри OGE Navigator.
        </p>
      </header>

      <div className="feature-grid">
        <button
          className={`feature-card tone-blue ${activeTask === '1' ? 'is-selected-card' : ''}`}
          onClick={() => setActiveTask('1')}
          type="button"
        >
          <div>
            <h2>Task 1</h2>
            <p>Reading Aloud · Available</p>
          </div>
        </button>
        <button
          className={`feature-card tone-violet ${activeTask === '2' ? 'is-selected-card' : ''}`}
          onClick={() => setActiveTask('2')}
          type="button"
        >
          <div>
            <h2>Task 2</h2>
            <p>Electronic Assistant · Available</p>
          </div>
        </button>
        <button
          className={`feature-card tone-mint ${activeTask === '3' ? 'is-selected-card' : ''}`}
          onClick={() => setActiveTask('3')}
          type="button"
        >
          <div>
            <h2>Task 3</h2>
            <p>Monologue · Available</p>
          </div>
        </button>
      </div>

      {activeTask === '1' ? (
        <SpeakingSetList
          attempts={progressActions.studentData.attempts}
          eyebrow="Task 1"
          interfaceMode={interfaceMode}
          modeLabel="Reading Aloud"
          onImportFeedback={progressActions.importSpeakingTask1Feedback}
          onOpen={(setId) => openSet('1', setId)}
          sets={familyTask1Texts}
          typeLabel="Speaking Task 1"
        />
      ) : activeTask === '2' ? (
        <SpeakingSetList
          attempts={progressActions.studentData.attempts}
          eyebrow="Task 2"
          modeLabel="Electronic Assistant"
          onOpen={(setId) => openSet('2', setId)}
          sets={familyTask2Sets}
          typeLabel="Speaking Task 2"
        />
      ) : (
        <SpeakingSetList
          attempts={progressActions.studentData.attempts}
          eyebrow="Task 3"
          modeLabel="Monologue"
          onOpen={(setId) => openSet('3', setId)}
          sets={familyTask3Sets}
          typeLabel="Speaking Task 3"
        />
      )}
    </section>
  )
}

function SpeakingSetList({
  attempts,
  eyebrow,
  interfaceMode,
  modeLabel,
  onImportFeedback,
  onOpen,
  sets,
  typeLabel,
}) {
  return (
    <article className="panel">
      <div className="panel-heading">
        <p className="eyebrow">{eyebrow}</p>
        <h2>Family & Relationships</h2>
      </div>
      <div className="material-grid">
        {sets.map((set) => (
          <SpeakingSetCard
            attempts={getAttemptsForMaterial(attempts, set.id)}
            interfaceMode={interfaceMode}
            key={set.id}
            modeLabel={modeLabel}
            onImportFeedback={onImportFeedback}
            onOpen={() => onOpen(set.id)}
            set={set}
            typeLabel={typeLabel}
          />
        ))}
      </div>
    </article>
  )
}

function SpeakingSetCard({ attempts, interfaceMode, modeLabel, onImportFeedback, onOpen, set, typeLabel }) {
  const latestAttempt = attempts[0]
  const feedbackAttempt = attempts.find((attempt) => attempt.teacherFeedback)

  return (
    <article className="material-card">
      <span className="source-badge is-extra">Extra Practice</span>
      <h2>{set.title}</h2>
      <p>{set.description}</p>
      <dl className="material-meta">
        <div>
          <dt>Type</dt>
          <dd>{typeLabel}</dd>
        </div>
        <div>
          <dt>Mode</dt>
          <dd>{modeLabel}</dd>
        </div>
        <div>
          <dt>Difficulty</dt>
          <dd>{set.difficulty}</dd>
        </div>
      </dl>
      {latestAttempt && (
        <div className="attempt-summary">
          <strong>
            Последняя попытка: {latestAttempt.score}/{latestAttempt.maxScore}
          </strong>
          <span>
            {latestAttempt.status} · {attempts.length} попыток
          </span>
          {latestAttempt.teacherFeedback && <span className="feedback-badge">Teacher feedback</span>}
        </div>
      )}
      {interfaceMode === 'student' && feedbackAttempt && (
        <div className="attempt-summary">
          <strong>Teacher feedback available</strong>
          <span>{formatAttemptDate(feedbackAttempt.completedAt)} — {feedbackAttempt.score}/{feedbackAttempt.maxScore}</span>
        </div>
      )}
      {attempts.length > 1 && (
        <details className="attempt-history">
          <summary>История попыток</summary>
          <div className="history-list">
            {attempts.map((attempt) => (
              <span key={attempt.id}>
                {formatAttemptDate(attempt.completedAt)} — {attempt.score}/{attempt.maxScore}
                {attempt.teacherFeedback ? ' · Teacher feedback' : ''}
              </span>
            ))}
          </div>
        </details>
      )}
      {interfaceMode === 'student' && onImportFeedback && (
        <FeedbackImportButton
          materialId={set.id}
          onImportFeedback={onImportFeedback}
        />
      )}
      <button className="primary-button" onClick={onOpen} type="button">
        Начать
      </button>
    </article>
  )
}

function FeedbackImportButton({ materialId, onImportFeedback }) {
  const [message, setMessage] = useState('')

  const handleImport = async (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      const feedback = JSON.parse(await file.text())

      if (feedback.materialId !== materialId) {
        setMessage('Этот feedback относится к другому тексту.')
        event.target.value = ''
        return
      }

      const result = onImportFeedback(feedback)
      setMessage(result.message)
    } catch {
      setMessage('Не удалось прочитать JSON feedback.')
    }

    event.target.value = ''
  }

  return (
    <label className="text-button import-feedback-button">
      Импортировать комментарий преподавателя
      <input accept="application/json" onChange={handleImport} type="file" />
      {message && <small>{message}</small>}
    </label>
  )
}

function formatAttemptDate(value) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value))
}

function getInitialTask(searchTask, setId) {
  if (['1', '2', '3'].includes(searchTask)) {
    return searchTask
  }

  if (familyTask1Texts.some((text) => text.id === setId)) {
    return '1'
  }

  if (familyTask2Sets.some((set) => set.id === setId)) {
    return '2'
  }

  if (familyTask3Sets.some((set) => set.id === setId)) {
    return '3'
  }

  return '1'
}
