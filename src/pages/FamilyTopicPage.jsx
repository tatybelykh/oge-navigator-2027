import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { familyChunks } from '../data/familyChunks'
import {
  examSkillSections,
  familyExamPractice,
} from '../data/familyExamPractice'
import { familyExtraPractice } from '../data/familyExtraPractice'
import { getTopicBySlug } from '../data/topics'
import {
  calculateFamilyProgress,
  getAttemptsForMaterial,
  getLatestAttemptByMaterial,
} from '../utils/progressCalculator'

const tabs = [
  'Обзор',
  'Chunks',
  'Exam Practice',
  'Extra Practice',
  'Ошибки',
  'Revision',
]

const chunkFilters = ['All', 'New', 'Learning', 'With help', 'Active']
const chunkStatuses = ['New', 'Learning', 'With help', 'Active']
const errorTypes = [
  'Grammar',
  'Vocabulary',
  'Chunk',
  'Pronunciation',
  'Task achievement',
  'Exam strategy',
  'Other',
]
const revisionActions = [
  { label: 'Повторить', status: 'Due' },
  { label: 'Готово', status: 'Done today' },
  { label: 'Позже', status: 'Later' },
]

export function FamilyTopicPage({ activeStudentId, progressActions }) {
  const topic = getTopicBySlug('family-relationships')
  const { studentData } = progressActions
  const progress = calculateFamilyProgress({
    chunks: familyChunks,
    studentData,
  })
  const [activeTab, setActiveTab] = useState('Обзор')
  const [chunkFilter, setChunkFilter] = useState('All')

  const chunksWithStatus = useMemo(
    () =>
      familyChunks.map((chunk) => ({
        ...chunk,
        status: studentData.chunkProgress[chunk.id] ?? 'New',
        studentId: activeStudentId,
      })),
    [activeStudentId, studentData.chunkProgress],
  )

  const filteredChunks = useMemo(() => {
    if (chunkFilter === 'All') {
      return chunksWithStatus
    }

    return chunksWithStatus.filter((chunk) => chunk.status === chunkFilter)
  }, [chunkFilter, chunksWithStatus])

  return (
    <section className="page-stack">
      <header className="topic-hero">
        <div>
          <Link className="back-link" to="/topics">
            <span aria-hidden="true">&lt;-</span> Все темы
          </Link>
          <p className="eyebrow">Тема</p>
          <h1>{topic.title}</h1>
          <p className="welcome-text">{topic.description}</p>
        </div>

        <div className="topic-summary">
          <strong>{progress.overall}%</strong>
          <span>общий прогресс</span>
        </div>
      </header>

      <div className="stats-grid">
        <StatCard label="Chunks" value={progress.categories[0].value} suffix="%" />
        <StatCard label="Exam Practice" value={progress.categories[1].value} suffix="%" />
        <StatCard label="Extra Practice" value={progress.categories[2].value} suffix="%" />
        <StatCard label="Errors" value={studentData.errors.length} />
        <StatCard label="Revision" value={studentData.revision.length} />
      </div>

      <div className="topic-tabs" role="tablist" aria-label="Разделы темы">
        {tabs.map((tab) => (
          <button
            aria-selected={activeTab === tab}
            className={`tab-button ${activeTab === tab ? 'is-active' : ''}`}
            key={tab}
            onClick={() => setActiveTab(tab)}
            role="tab"
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Обзор' && (
        <OverviewTab progress={progress} studentData={studentData} />
      )}
      {activeTab === 'Chunks' && (
        <ChunksTab
          chunkFilter={chunkFilter}
          chunks={filteredChunks}
          onAddRevision={progressActions.addRevisionItem}
          onFilterChange={setChunkFilter}
          onStatusChange={progressActions.updateChunkStatus}
        />
      )}
      {activeTab === 'Exam Practice' && (
        <PracticeTab
          materials={familyExamPractice}
          onAddAttempt={progressActions.addAttempt}
          onAddRevision={progressActions.addRevisionItem}
          studentData={studentData}
          title="Экзаменационные навыки"
          withSections
        />
      )}
      {activeTab === 'Extra Practice' && (
        <PracticeTab
          materials={familyExtraPractice}
          onAddAttempt={progressActions.addAttempt}
          onAddRevision={progressActions.addRevisionItem}
          studentData={studentData}
        />
      )}
      {activeTab === 'Ошибки' && (
        <ErrorsTab
          errors={studentData.errors}
          onAddError={progressActions.addError}
          onDeleteError={progressActions.deleteError}
          onUpdateError={progressActions.updateError}
        />
      )}
      {activeTab === 'Revision' && (
        <RevisionTab
          onRemove={progressActions.removeRevisionItem}
          onUpdateStatus={progressActions.updateRevisionStatus}
          revision={studentData.revision}
        />
      )}
    </section>
  )
}

function StatCard({ label, suffix = '', value }) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>
        {value}
        {suffix}
      </strong>
    </article>
  )
}

function OverviewTab({ progress, studentData }) {
  const recentAttempts = studentData.attempts
    .toSorted((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .slice(0, 3)

  return (
    <div className="topic-content-grid">
      <article className="panel progress-panel">
        <div className="panel-heading">
          <p className="eyebrow">Прогресс по теме</p>
          <h2>Общий: {progress.overall}%</h2>
        </div>
        <div className="skill-list">
          {progress.categories.map((category) => (
            <ProgressRow
              key={category.label}
              label={category.label}
              value={category.value}
            />
          ))}
        </div>
      </article>

      <article className="panel">
        <div className="panel-heading">
          <p className="eyebrow">Экзаменационные навыки</p>
          <h2>Последние результаты</h2>
        </div>
        <div className="skill-list">
          {progress.skills.map((skill) => (
            <ProgressRow key={skill.label} label={skill.label} value={skill.value} />
          ))}
        </div>
      </article>

      <article className="panel">
        <div className="panel-heading">
          <p className="eyebrow">Последняя активность</p>
          <h2>Недавняя работа</h2>
        </div>
        {recentAttempts.length > 0 ? (
          <div className="task-list">
            {recentAttempts.map((attempt) => (
              <div className="task-item" key={attempt.id}>
                <div>
                  <strong>{attempt.materialTitle}</strong>
                  <span>{formatDate(attempt.completedAt)}</span>
                </div>
                <b>
                  {attempt.score}/{attempt.maxScore}
                </b>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">
            Здесь появится прогресс после первых заданий.
          </p>
        )}
      </article>
    </div>
  )
}

function ProgressRow({ label, value }) {
  return (
    <div className="skill-row">
      <div>
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <div className="track" aria-hidden="true">
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

function ChunksTab({
  chunkFilter,
  chunks,
  onAddRevision,
  onFilterChange,
  onStatusChange,
}) {
  return (
    <article className="panel">
      <div className="panel-heading">
        <p className="eyebrow">Chunks</p>
        <h2>Фразы темы</h2>
      </div>
      <div className="filter-row" aria-label="Фильтр chunks">
        {chunkFilters.map((filter) => (
          <button
            className={`filter-button ${chunkFilter === filter ? 'is-active' : ''}`}
            key={filter}
            onClick={() => onFilterChange(filter)}
            type="button"
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="material-grid">
        {chunks.map((chunk) => (
          <article className="material-card" key={chunk.id}>
            <span className="status-pill status-started">{chunk.status}</span>
            <h2>{chunk.chunk}</h2>
            <p>{chunk.definition}</p>
            <label className="compact-field">
              Статус
              <select
                onChange={(event) => onStatusChange(chunk.id, event.target.value)}
                value={chunk.status}
              >
                {chunkStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="text-button"
              onClick={() =>
                onAddRevision({
                  sourceId: chunk.id,
                  sourceType: 'Chunk',
                  title: chunk.chunk,
                })
              }
              type="button"
            >
              В Revision
            </button>
          </article>
        ))}
      </div>
    </article>
  )
}

function PracticeTab({
  materials,
  onAddAttempt,
  onAddRevision,
  studentData,
  title,
  withSections = false,
}) {
  return (
    <div className="page-stack">
      {withSections && (
        <article className="panel">
          <div className="panel-heading">
            <p className="eyebrow">Exam Practice</p>
            <h2>{title}</h2>
          </div>
          <div className="section-chip-row">
            {examSkillSections.map((section) => (
              <span className="section-chip" key={section}>
                {section}
              </span>
            ))}
          </div>
        </article>
      )}

      <div className="material-grid">
        {materials.map((material) => (
          <PracticeCard
            attempts={getAttemptsForMaterial(studentData.attempts, material.id)}
            key={material.id}
            material={material}
            onAddAttempt={onAddAttempt}
            onAddRevision={onAddRevision}
          />
        ))}
      </div>
    </div>
  )
}

function PracticeCard({ attempts, material, onAddAttempt, onAddRevision }) {
  const [isRecordingResult, setIsRecordingResult] = useState(false)
  const latestAttempt = getLatestAttemptByMaterial(attempts, material.id)
  const isFipi = material.sourceType === 'fipi'

  return (
    <article className="material-card">
      <span className={`source-badge ${isFipi ? 'is-fipi' : 'is-extra'}`}>
        {isFipi ? 'FIPI' : 'Extra Practice'}
      </span>
      <h2>{material.title}</h2>
      <dl className="material-meta">
        <div>
          <dt>Section</dt>
          <dd>{material.section}</dd>
        </div>
        <div>
          <dt>Type</dt>
          <dd>{material.taskType}</dd>
        </div>
        {material.targetChunks ? (
          <div>
            <dt>Target chunks</dt>
            <dd>{material.targetChunks.join(', ')}</dd>
          </div>
        ) : null}
        <div>
          <dt>Difficulty</dt>
          <dd>{material.difficulty}</dd>
        </div>
      </dl>

      {latestAttempt ? (
        <div className="attempt-summary">
          <strong>
            Последняя попытка: {latestAttempt.score}/{latestAttempt.maxScore}
          </strong>
          <span>
            {latestAttempt.status} · {attempts.length} попыток
          </span>
        </div>
      ) : (
        <p className="empty-state">Это задание ещё не выполнялось.</p>
      )}

      {attempts.length > 1 && (
        <details className="attempt-history">
          <summary>История попыток</summary>
          <div className="history-list">
            {attempts.map((attempt) => (
              <span key={attempt.id}>
                {formatDate(attempt.completedAt)} — {attempt.score}/
                {attempt.maxScore}
              </span>
            ))}
          </div>
        </details>
      )}

      <div className="material-actions">
        {['speaking-task-1', 'speaking-task-2', 'speaking-task-3'].includes(material.taskType) ? (
          <SpeakingPracticeLink material={material} />
        ) : (
          <button
            className="primary-button"
            onClick={() => setIsRecordingResult((current) => !current)}
            type="button"
          >
            Записать результат
          </button>
        )}
        <button
          className="text-button"
          onClick={() =>
            onAddRevision({
              sourceId: material.id,
              sourceType: isFipi ? 'Exam task' : 'Extra Practice',
              title: material.title,
            })
          }
          type="button"
        >
          Повторить позже
        </button>
      </div>

      {isRecordingResult && (
        <AttemptForm
          material={material}
          onCancel={() => setIsRecordingResult(false)}
          onSave={(attempt) => {
            onAddAttempt(attempt)
            setIsRecordingResult(false)
          }}
        />
      )}
    </article>
  )
}

function SpeakingPracticeLink({ material }) {
  const taskSearchByType = {
    'speaking-task-1': 'task=1&',
    'speaking-task-2': 'task=2&',
    'speaking-task-3': 'task=3&',
  }
  const taskSearch = taskSearchByType[material.taskType] ?? ''

  return (
    <Link className="primary-link" to={`/speaking?${taskSearch}set=${material.id}`}>
      Начать
    </Link>
  )
}

function AttemptForm({ material, onCancel, onSave }) {
  const [score, setScore] = useState('6')
  const [maxScore, setMaxScore] = useState('7')
  const [status, setStatus] = useState('completed')

  return (
    <form
      className="inline-form"
      onSubmit={(event) => {
        event.preventDefault()
        onSave({ material, maxScore, score, status })
      }}
    >
      <div className="score-row">
        <label>
          Score
          <input
            min="0"
            onChange={(event) => setScore(event.target.value)}
            type="number"
            value={score}
          />
        </label>
        <span>/</span>
        <label>
          Max
          <input
            min="1"
            onChange={(event) => setMaxScore(event.target.value)}
            type="number"
            value={maxScore}
          />
        </label>
      </div>
      <label className="compact-field">
        Status
        <select
          onChange={(event) => setStatus(event.target.value)}
          value={status}
        >
          <option value="completed">Completed</option>
          <option value="retry">Retry</option>
          <option value="in-progress">In progress</option>
        </select>
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

function ErrorsTab({ errors, onAddError, onDeleteError, onUpdateError }) {
  const [isAdding, setIsAdding] = useState(false)

  return (
    <div className="page-stack">
      <article className="panel">
        <div className="panel-heading">
          <p className="eyebrow">Error Bank</p>
          <h2>Ошибки</h2>
        </div>
        <button
          className="primary-button"
          onClick={() => setIsAdding((current) => !current)}
          type="button"
        >
          + Добавить ошибку
        </button>
        {isAdding && (
          <ErrorForm
            onCancel={() => setIsAdding(false)}
            onSave={(error) => {
              onAddError(error)
              setIsAdding(false)
            }}
          />
        )}
      </article>

      {errors.length === 0 ? (
        <article className="panel">
          <p className="empty-state">
            Пока ошибок для повторения нет.
          </p>
        </article>
      ) : (
        <div className="material-grid">
          {errors.map((error) => (
            <ErrorCard
              error={error}
              key={error.id}
              onDeleteError={onDeleteError}
              onUpdateError={onUpdateError}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ErrorCard({ error, onDeleteError, onUpdateError }) {
  const [isEditing, setIsEditing] = useState(false)

  if (isEditing) {
    return (
      <article className="error-card">
        <ErrorForm
          error={error}
          onCancel={() => setIsEditing(false)}
          onSave={(updates) => {
            onUpdateError(error.id, updates)
            setIsEditing(false)
          }}
        />
      </article>
    )
  }

  return (
    <article className="error-card">
      <div className="error-line is-original">
        <span aria-hidden="true">x</span>
        <p>{error.original}</p>
      </div>
      <div className="error-line is-correction">
        <span aria-hidden="true">OK</span>
        <p>{error.correction}</p>
      </div>
      <dl className="material-meta">
        <div>
          <dt>Type</dt>
          <dd>{error.type}</dd>
        </div>
        <div>
          <dt>Target</dt>
          <dd>{error.target || '—'}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{error.status}</dd>
        </div>
      </dl>
      <div className="material-actions">
        <button className="text-button" onClick={() => setIsEditing(true)} type="button">
          Редактировать
        </button>
        <button
          className="text-button"
          onClick={() => onUpdateError(error.id, { ...error, inRevision: !error.inRevision })}
          type="button"
        >
          {error.inRevision ? 'Убрать из Revision' : 'В Revision'}
        </button>
        <button
          className="text-button danger-button"
          onClick={() => {
            if (window.confirm('Удалить эту локальную ошибку?')) {
              onDeleteError(error.id)
            }
          }}
          type="button"
        >
          Удалить
        </button>
      </div>
    </article>
  )
}

function ErrorForm({ error, onCancel, onSave }) {
  const [original, setOriginal] = useState(error?.original ?? '')
  const [correction, setCorrection] = useState(error?.correction ?? '')
  const [type, setType] = useState(error?.type ?? 'Grammar')
  const [target, setTarget] = useState(error?.target ?? '')
  const [inRevision, setInRevision] = useState(error?.inRevision ?? true)

  return (
    <form
      className="inline-form"
      onSubmit={(event) => {
        event.preventDefault()
        onSave({ correction, inRevision, original, target, type })
      }}
    >
      <label className="compact-field">
        Original
        <input
          onChange={(event) => setOriginal(event.target.value)}
          required
          value={original}
        />
      </label>
      <label className="compact-field">
        Correction
        <input
          onChange={(event) => setCorrection(event.target.value)}
          required
          value={correction}
        />
      </label>
      <label className="compact-field">
        Type
        <select onChange={(event) => setType(event.target.value)} value={type}>
          {errorTypes.map((errorType) => (
            <option key={errorType} value={errorType}>
              {errorType}
            </option>
          ))}
        </select>
      </label>
      <label className="compact-field">
        Target
        <input
          onChange={(event) => setTarget(event.target.value)}
          value={target}
        />
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

function RevisionTab({ onRemove, onUpdateStatus, revision }) {
  return (
    <article className="panel">
      <div className="panel-heading">
        <p className="eyebrow">Revision</p>
        <h2>Due today — {revision.filter((item) => item.status === 'Due').length}</h2>
      </div>
      {revision.length > 0 ? (
        <div className="task-list">
          {revision.map((item) => (
            <div className="task-item revision-task" key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <span>
                  {item.sourceType} · {item.status}
                  {item.lastPractisedAt
                    ? ` · last practised: ${formatDate(item.lastPractisedAt)}`
                    : ''}
                </span>
              </div>
              <div className="revision-actions">
                {revisionActions.map((action) => (
                  <button
                    className="filter-button"
                    key={action.status}
                    onClick={() => onUpdateStatus(item.id, action.status)}
                    type="button"
                  >
                    {action.label}
                  </button>
                ))}
                <button
                  className="text-button danger-button"
                  onClick={() => onRemove(item.id)}
                  type="button"
                >
                  Удалить из Revision
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-state">Очередь на повторение пустая.</p>
      )}
    </article>
  )
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value))
}
