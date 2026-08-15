import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FamilyPracticeTask } from '../components/family/FamilyPracticeTasks'
import {
  familyChunks,
  familySubtopics,
} from '../data/familyChunks'
import {
  familySectionFilters,
} from '../data/familyContentPack'
import {
  fipiSectionFilters,
  officialFipiResources,
} from '../data/fipiResources'
import {
  examSkillSections,
  familyExamPractice,
} from '../data/familyExamPractice'
import { familyExtraPractice } from '../data/familyExtraPractice'
import { getTopicBySlug } from '../data/topics'
import { localStorageService } from '../services/localStorageService'
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
  'FIPI Practice',
  'Ошибки',
  'Revision',
]

const chunkFilters = ['All', 'New', 'Learning', 'Active']
const subtopicFilters = [
  { id: 'all', label: 'All' },
  ...familySubtopics.map((subtopic) => ({ id: subtopic.id, label: subtopic.label })),
]
const chunkStatuses = ['New', 'Learning', 'Active']
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
  const [subtopicFilter, setSubtopicFilter] = useState('all')
  const [extraPracticeFilter, setExtraPracticeFilter] = useState('All')
  const [fipiFilter, setFipiFilter] = useState('All')
  const [fipiCatalog, setFipiCatalog] = useState(() => localStorageService.getFipiCatalog())

  const chunksWithStatus = useMemo(
    () =>
      familyChunks.map((chunk) => ({
        ...chunk,
        status: studentData.chunkProgress[chunk.id] === 'With help'
          ? 'Learning'
          : studentData.chunkProgress[chunk.id] ?? 'New',
        studentId: activeStudentId,
      })),
    [activeStudentId, studentData.chunkProgress],
  )

  const filteredChunks = useMemo(() => {
    return chunksWithStatus.filter((chunk) => {
      const matchesStatus = chunkFilter === 'All' || chunk.status === chunkFilter
      const matchesSubtopic =
        subtopicFilter === 'all' || chunk.subtopics.includes(subtopicFilter)

      return matchesStatus && matchesSubtopic
    })
  }, [chunkFilter, chunksWithStatus, subtopicFilter])

  const saveFipiCatalog = (items) => {
    setFipiCatalog(items)
    localStorageService.saveFipiCatalog(items)
  }

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
          onSubtopicFilterChange={setSubtopicFilter}
          revision={studentData.revision}
          subtopicFilter={subtopicFilter}
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
          onAddError={progressActions.addError}
          onAddAttempt={progressActions.addAttempt}
          onAddPracticeAttempt={progressActions.addPracticeAttempt}
          onAddRevision={progressActions.addRevisionItem}
          onFilterChange={setExtraPracticeFilter}
          onSaveWritingDraft={progressActions.saveWritingDraft}
          sectionFilter={extraPracticeFilter}
          studentData={studentData}
        />
      )}
      {activeTab === 'FIPI Practice' && (
        <FipiPracticeTab
          catalog={fipiCatalog}
          filter={fipiFilter}
          onAddAttempt={progressActions.addAttempt}
          onAddRevision={progressActions.addRevisionItem}
          onFilterChange={setFipiFilter}
          onSaveCatalog={saveFipiCatalog}
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

      <article className="panel learning-path-panel">
        <div className="panel-heading">
          <p className="eyebrow">Путь по теме</p>
          <h2>Family learning path</h2>
        </div>
        <div className="learning-path">
          {[
            ['Шаг 1', 'Chunks', progress.categories[0].value],
            ['Шаг 2', 'Reading', progress.skills.find((skill) => skill.label === 'Reading')?.value ?? 0],
            ['Шаг 3', 'Grammar & Vocabulary', progress.skills.find((skill) => skill.label === 'Grammar & Vocabulary')?.value ?? 0],
            ['Шаг 4', 'Writing', progress.skills.find((skill) => skill.label === 'Writing')?.value ?? 0],
            ['Шаг 5', 'Speaking', progress.skills.find((skill) => skill.label === 'Speaking')?.value ?? 0],
            ['Шаг 6', 'Revision', progress.categories[4].value],
          ].map(([step, label, value]) => (
            <div className="learning-step" key={label}>
              <span>{step}</span>
              <strong>{label}</strong>
              <ProgressRow label="Progress" value={value} />
            </div>
          ))}
        </div>
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
  onSubtopicFilterChange,
  revision,
  subtopicFilter,
}) {
  const [showExamples, setShowExamples] = useState(true)

  return (
    <article className="panel chunks-panel">
      <div className="panel-heading">
        <p className="eyebrow">Chunks</p>
        <h2>Фразы темы</h2>
      </div>
      <div className="chunk-filter-group">
        <span className="chunk-filter-label">Статус</span>
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
      </div>
      <div className="chunk-filter-group">
        <span className="chunk-filter-label">Подтема</span>
        <div className="filter-row" aria-label="Фильтр subtopic">
          {subtopicFilters.map((filter) => (
            <button
              className={`filter-button ${subtopicFilter === filter.id ? 'is-active' : ''}`}
              key={filter.id}
              onClick={() => onSubtopicFilterChange(filter.id)}
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
      <label className="checkbox-row">
        <input
          checked={showExamples}
          onChange={(event) => setShowExamples(event.target.checked)}
          type="checkbox"
        />
        Show examples
      </label>

      <div className="material-grid chunk-card-grid">
        {chunks.map((chunk) => {
          const isInRevision = revision.some(
            (item) =>
              item.chunkId === chunk.id ||
              (item.sourceId === chunk.id && item.sourceType?.toLowerCase() === 'chunk'),
          )

          return (
            <article className="material-card chunk-card" key={chunk.id}>
              <div className="chunk-card__top">
                <h2>{chunk.text}</h2>
                <span className="status-pill status-started chunk-status-badge">{chunk.status}</span>
              </div>
              <p className="chunk-meaning">{chunk.meaning}</p>
              {showExamples && <p className="chunk-example">{chunk.example}</p>}
              <div className="section-chip-row">
                {chunk.subtopics.map((subtopic) => (
                  <span className="section-chip chunk-subtopic-chip" key={subtopic}>
                    {familySubtopics.find((item) => item.id === subtopic)?.label ?? subtopic}
                  </span>
                ))}
              </div>
              <label className="chunk-status-control">
                <span>Статус:</span>
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
                className={`text-button chunk-revision-action ${isInRevision ? 'is-added' : ''}`}
                disabled={isInRevision}
                onClick={() =>
                  onAddRevision({
                    chunkId: chunk.id,
                    example: chunk.example,
                    meaning: chunk.meaning,
                    sourceId: chunk.id,
                    sourceType: 'chunk',
                    text: chunk.text,
                    title: chunk.text,
                  })
                }
                type="button"
              >
                {isInRevision ? '✓ В Revision' : '+ В Revision'}
              </button>
            </article>
          )
        })}
      </div>
    </article>
  )
}

function PracticeTab({
  materials,
  onAddError,
  onAddAttempt,
  onAddPracticeAttempt,
  onAddRevision,
  onFilterChange,
  onSaveWritingDraft,
  sectionFilter = 'All',
  studentData,
  title,
  withSections = false,
}) {
  const filteredMaterials = materials.filter((material) => {
    if (sectionFilter === 'All') {
      return true
    }

    if (sectionFilter === 'Speaking') {
      return String(material.taskType).startsWith('speaking-') || material.section === 'Speaking'
    }

    if (sectionFilter === 'Chunks') {
      return material.section === 'Chunks'
    }

    return material.section === sectionFilter || material.progressSection === sectionFilter
  })

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

      {onFilterChange && (
        <div className="filter-row" aria-label="Extra Practice filters">
          {familySectionFilters.map((filter) => (
            <button
              className={`filter-button ${sectionFilter === filter ? 'is-active' : ''}`}
              key={filter}
              onClick={() => onFilterChange(filter)}
              type="button"
            >
              {filter}
            </button>
          ))}
        </div>
      )}

      <div className="material-grid">
        {filteredMaterials.map((material) => (
          <PracticeCard
            attempts={getAttemptsForMaterial(studentData.attempts, material.id)}
            draft={studentData.writingDrafts?.[material.id]}
            key={material.id}
            material={material}
            onAddError={onAddError}
            onAddAttempt={onAddAttempt}
            onAddPracticeAttempt={onAddPracticeAttempt}
            onAddRevision={onAddRevision}
            onSaveWritingDraft={onSaveWritingDraft}
          />
        ))}
      </div>
    </div>
  )
}

function PracticeCard({
  attempts,
  draft,
  material,
  onAddError,
  onAddAttempt,
  onAddPracticeAttempt,
  onAddRevision,
  onSaveWritingDraft,
}) {
  const [isRecordingResult, setIsRecordingResult] = useState(false)
  const [isTaskOpen, setIsTaskOpen] = useState(false)
  const latestAttempt = getLatestAttemptByMaterial(attempts, material.id)
  const isFipi = material.sourceType === 'fipi'
  const isSpeakingTask = ['speaking-task-1', 'speaking-task-2', 'speaking-task-3'].includes(material.taskType)
  const isInteractiveTask = Boolean(onAddPracticeAttempt) && !isSpeakingTask

  return (
    <article className="material-card">
      <span className={`source-badge ${isFipi ? 'is-fipi' : 'is-extra'}`}>
        {isFipi ? 'FIPI' : 'Extra Practice'}
      </span>
      {!isFipi && <span className="section-chip">Original practice / OGE Navigator</span>}
      <h2>{material.title}</h2>
      {material.instructions && <p>{material.instructions}</p>}
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
        {isSpeakingTask ? (
          <SpeakingPracticeLink material={material} />
        ) : isInteractiveTask ? (
          <button className="primary-button" onClick={() => setIsTaskOpen((current) => !current)} type="button">
            {isTaskOpen ? 'Close task' : 'Start'}
          </button>
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

      {isTaskOpen && (
        <FamilyPracticeTask
          draft={draft}
          material={material}
          onAddAttempt={onAddPracticeAttempt}
          onAddError={onAddError}
          onCancel={() => setIsTaskOpen(false)}
          onSaveDraft={onSaveWritingDraft}
        />
      )}

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

function FipiPracticeTab({
  catalog,
  filter,
  onAddAttempt,
  onAddRevision,
  onFilterChange,
  onSaveCatalog,
  studentData,
}) {
  const [isAdding, setIsAdding] = useState(false)
  const filteredCatalog = catalog.filter((task) => {
    if (filter === 'All') {
      return true
    }

    if (filter === 'Speaking') {
      return task.section.startsWith('Speaking')
    }

    return task.section === filter
  })

  const saveTask = (task) => {
    const nextTask = {
      ...task,
      id: task.id ?? `fipi-local-${crypto.randomUUID()}`,
      sourceType: 'fipi',
      topicId: 'family',
    }
    const nextCatalog = catalog.some((item) => item.id === nextTask.id)
      ? catalog.map((item) => (item.id === nextTask.id ? nextTask : item))
      : [...catalog, nextTask]
    onSaveCatalog(nextCatalog)
  }

  const deleteTask = (taskId) => {
    if (window.confirm('Удалить локальную ссылку ФИПИ?')) {
      onSaveCatalog(catalog.filter((task) => task.id !== taskId))
    }
  }

  return (
    <div className="page-stack">
      <article className="panel">
        <div className="panel-heading">
          <p className="eyebrow">FIPI Practice</p>
          <h2>Official OGE 2026 section resources</h2>
        </div>
        <div className="material-grid">
          {officialFipiResources.map((resource) => (
            <article className="material-card" key={resource.id}>
              <span className="source-badge is-fipi">Official FIPI</span>
              <span className="section-chip">{resource.year}</span>
              <h2>{resource.section}</h2>
              <p>Official external source</p>
              <a className="text-button" href={resource.url} rel="noopener noreferrer" target="_blank">
                Open source ↗
              </a>
            </article>
          ))}
        </div>
      </article>

      <article className="panel">
        <div className="panel-heading">
          <p className="eyebrow">Family-tagged FIPI tasks</p>
          <h2>Local teacher catalog</h2>
        </div>
        <div className="filter-row" aria-label="FIPI Practice filters">
          {fipiSectionFilters.map((item) => (
            <button
              className={`filter-button ${filter === item ? 'is-active' : ''}`}
              key={item}
              onClick={() => onFilterChange(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
        <button className="primary-button" onClick={() => setIsAdding(true)} type="button">
          + Добавить задание ФИПИ
        </button>
        {isAdding && (
          <FipiTaskForm
            onCancel={() => setIsAdding(false)}
            onSave={(task) => {
              saveTask(task)
              setIsAdding(false)
            }}
          />
        )}
      </article>

      {filteredCatalog.length === 0 ? (
        <article className="panel">
          <p className="empty-state">
            Пока здесь нет отобранных заданий ФИПИ по этой теме. Добавьте ссылку, когда найдёте подходящее задание в открытом банке.
          </p>
          <button className="primary-button" onClick={() => setIsAdding(true)} type="button">
            + Добавить задание ФИПИ
          </button>
        </article>
      ) : (
        <div className="material-grid">
          {filteredCatalog.map((task) => (
            <FipiTaskCard
              attempts={getAttemptsForMaterial(studentData.attempts, task.id)}
              key={task.id}
              onAddAttempt={onAddAttempt}
              onAddRevision={onAddRevision}
              onDelete={() => deleteTask(task.id)}
              onSave={saveTask}
              task={task}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function FipiTaskCard({ attempts, onAddAttempt, onAddRevision, onDelete, onSave, task }) {
  const [isEditing, setIsEditing] = useState(false)
  const [isRecordingResult, setIsRecordingResult] = useState(false)
  const latestAttempt = attempts[0]
  const material = {
    ...task,
    difficulty: 'Official external source',
    progressSection: task.section.startsWith('Speaking') ? 'Speaking' : task.section,
    sourceType: 'fipi',
    title: task.title,
    topic: 'family',
  }

  if (isEditing) {
    return (
      <article className="material-card">
        <FipiTaskForm
          task={task}
          onCancel={() => setIsEditing(false)}
          onSave={(nextTask) => {
            onSave(nextTask)
            setIsEditing(false)
          }}
        />
      </article>
    )
  }

  return (
    <article className="material-card">
      <span className="source-badge is-fipi">FIPI</span>
      <span className="section-chip">Official external source</span>
      <h2>{task.title}</h2>
      <dl className="material-meta">
        <div><dt>Task ID</dt><dd>{task.taskNumber}</dd></div>
        <div><dt>Section</dt><dd>{task.section}</dd></div>
        <div><dt>Subtopic</dt><dd>{task.subtopic}</dd></div>
        <div><dt>Teacher note</dt><dd>{task.teacherNote || '—'}</dd></div>
      </dl>
      {latestAttempt && (
        <div className="attempt-summary">
          <strong>Последняя попытка: {latestAttempt.score}/{latestAttempt.maxScore}</strong>
          <span>{latestAttempt.status} · {attempts.length} попыток</span>
        </div>
      )}
      <div className="material-actions">
        <a className="text-button" href={task.url} rel="noopener noreferrer" target="_blank">Открыть на ФИПИ ↗</a>
        <button className="primary-button" onClick={() => setIsRecordingResult((current) => !current)} type="button">Записать результат</button>
        <button className="text-button" onClick={() => onAddRevision({ sourceId: task.id, sourceType: 'FIPI', title: task.title })} type="button">Повторить позже</button>
        <button className="text-button" onClick={() => setIsEditing(true)} type="button">Редактировать</button>
        <button className="text-button danger-button" onClick={onDelete} type="button">Удалить</button>
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

function FipiTaskForm({ onCancel, onSave, task }) {
  const [taskNumber, setTaskNumber] = useState(task?.taskNumber ?? '')
  const [title, setTitle] = useState(task?.title ?? '')
  const [section, setSection] = useState(task?.section ?? 'Reading')
  const [taskType, setTaskType] = useState(task?.taskType ?? 'Reading')
  const [url, setUrl] = useState(task?.url ?? '')
  const [subtopic, setSubtopic] = useState(task?.subtopic ?? 'Relationships')
  const [teacherNote, setTeacherNote] = useState(task?.teacherNote ?? '')

  return (
    <form
      className="inline-form"
      onSubmit={(event) => {
        event.preventDefault()
        onSave({
          id: task?.id,
          section,
          subtopic,
          taskNumber,
          taskType,
          teacherNote,
          title,
          url,
        })
      }}
    >
      <label className="compact-field">Task number / ID<input onChange={(event) => setTaskNumber(event.target.value)} required value={taskNumber} /></label>
      <label className="compact-field">Title<input onChange={(event) => setTitle(event.target.value)} required value={title} /></label>
      <label className="compact-field">
        Section
        <select onChange={(event) => setSection(event.target.value)} value={section}>
          {['Listening', 'Reading', 'Grammar & Vocabulary', 'Writing', 'Speaking Task 1', 'Speaking Task 2', 'Speaking Task 3'].map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>
      <label className="compact-field">Task type<input onChange={(event) => setTaskType(event.target.value)} value={taskType} /></label>
      <label className="compact-field">URL<input onChange={(event) => setUrl(event.target.value)} required type="url" value={url} /></label>
      <label className="compact-field">
        Subtopic
        <select onChange={(event) => setSubtopic(event.target.value)} value={subtopic}>
          {subtopicFilters.filter((item) => item.id !== 'all').map((item) => <option key={item.id}>{item.label}</option>)}
        </select>
      </label>
      <label className="compact-field">Teacher note<textarea onChange={(event) => setTeacherNote(event.target.value)} value={teacherNote} /></label>
      <div className="profile-form-actions">
        <button className="primary-button" type="submit">Сохранить</button>
        <button className="text-button" onClick={onCancel} type="button">Отмена</button>
      </div>
    </form>
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
