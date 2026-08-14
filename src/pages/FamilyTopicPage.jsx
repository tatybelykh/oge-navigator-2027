import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { familyChunks } from '../data/familyChunks'
import {
  examSkillSections,
  familyExamPractice,
} from '../data/familyExamPractice'
import { familyExtraPractice } from '../data/familyExtraPractice'
import { getFamilyStudentData } from '../data/familyStudentData'
import { getTopicBySlug } from '../data/topics'

const tabs = [
  'Обзор',
  'Chunks',
  'Exam Practice',
  'Extra Practice',
  'Ошибки',
  'Revision',
]

const chunkFilters = ['All', 'New', 'Learning', 'Active']

export function FamilyTopicPage({ activeStudentId }) {
  const topic = getTopicBySlug('family-relationships')
  const studentData = getFamilyStudentData(activeStudentId)
  const [activeTab, setActiveTab] = useState('Обзор')
  const [chunkFilter, setChunkFilter] = useState('All')

  const chunksWithStatus = useMemo(
    () =>
      familyChunks.map((chunk) => {
        const progress = studentData.chunkProgress.find(
          (item) => item.chunkId === chunk.id,
        )

        return {
          ...chunk,
          status: progress?.status ?? 'New',
          studentId: progress?.studentId ?? activeStudentId,
        }
      }),
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
          <strong>{studentData.topicProgress.value}%</strong>
          <span>общий прогресс</span>
        </div>
      </header>

      <div className="stats-grid">
        <StatCard label="Chunks" value={studentData.stats.chunks} />
        <StatCard label="Exam Practice" value={studentData.stats.examPractice} />
        <StatCard label="Extra Practice" value={studentData.stats.extraPractice} />
        <StatCard label="Errors" value={studentData.stats.errors} />
        <StatCard label="Revision" value={studentData.stats.revision} />
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

      {activeTab === 'Обзор' && <OverviewTab studentData={studentData} />}
      {activeTab === 'Chunks' && (
        <ChunksTab
          chunkFilter={chunkFilter}
          chunks={filteredChunks}
          onFilterChange={setChunkFilter}
        />
      )}
      {activeTab === 'Exam Practice' && <ExamPracticeTab />}
      {activeTab === 'Extra Practice' && <ExtraPracticeTab />}
      {activeTab === 'Ошибки' && <ErrorsTab errors={studentData.errors} />}
      {activeTab === 'Revision' && (
        <RevisionTab revision={studentData.revision} />
      )}
    </section>
  )
}

function StatCard({ label, value }) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

function OverviewTab({ studentData }) {
  return (
    <div className="topic-content-grid">
      <article className="panel progress-panel">
        <div className="panel-heading">
          <p className="eyebrow">Прогресс по теме</p>
          <h2>Общий: {studentData.topicProgress.value}%</h2>
        </div>
        <div className="skill-list">
          {studentData.skillProgress.map((skill) => (
            <div className="skill-row" key={skill.label}>
              <div>
                <span>{skill.label}</span>
                <strong>{skill.value}%</strong>
              </div>
              <div className="track" aria-hidden="true">
                <span style={{ width: `${skill.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </article>

      <ListPanel
        emptyText="Пока нет следующих шагов для этого профиля."
        eyebrow="Что дальше"
        items={studentData.nextSteps}
        title="Следующие шаги"
      />
      <ListPanel
        emptyText="Пока нет активности для этого профиля."
        eyebrow="Последняя активность"
        items={studentData.activity}
        title="Недавняя работа"
      />
    </div>
  )
}

function ListPanel({ emptyText, eyebrow, items, title }) {
  return (
    <article className="panel">
      <div className="panel-heading">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {items.length > 0 ? (
        <div className="task-list">
          {items.map((item) => (
            <div className="task-item" key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <span>{item.description ?? item.result}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-state">{emptyText}</p>
      )}
    </article>
  )
}

function ChunksTab({ chunkFilter, chunks, onFilterChange }) {
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
          </article>
        ))}
      </div>
    </article>
  )
}

function ExamPracticeTab() {
  return (
    <div className="page-stack">
      <article className="panel">
        <div className="panel-heading">
          <p className="eyebrow">Exam Practice</p>
          <h2>Экзаменационные навыки</h2>
        </div>
        <div className="section-chip-row">
          {examSkillSections.map((section) => (
            <span className="section-chip" key={section}>
              {section}
            </span>
          ))}
        </div>
      </article>

      <div className="material-grid">
        {familyExamPractice.map((task) => (
          <PracticeCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  )
}

function ExtraPracticeTab() {
  return (
    <div className="material-grid">
      {familyExtraPractice.map((task) => (
        <PracticeCard key={task.id} task={task} />
      ))}
    </div>
  )
}

function PracticeCard({ task }) {
  const isFipi = task.sourceType === 'fipi'

  return (
    <article className="material-card">
      <span className={`source-badge ${isFipi ? 'is-fipi' : 'is-extra'}`}>
        {isFipi ? 'FIPI' : 'Extra Practice'}
      </span>
      <h2>{task.title}</h2>
      <dl className="material-meta">
        <div>
          <dt>Section</dt>
          <dd>{task.section}</dd>
        </div>
        <div>
          <dt>Type</dt>
          <dd>{task.taskType}</dd>
        </div>
        <div>
          <dt>Target chunks</dt>
          <dd>{task.targetChunks.join(', ')}</dd>
        </div>
        <div>
          <dt>Difficulty</dt>
          <dd>{task.difficulty}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{task.status}</dd>
        </div>
        {task.score && (
          <div>
            <dt>Score</dt>
            <dd>{task.score}</dd>
          </div>
        )}
      </dl>
      <button className="primary-button" disabled={isFipi} type="button">
        {isFipi ? 'Открыть источник ↗' : 'Начать'}
      </button>
    </article>
  )
}

function ErrorsTab({ errors }) {
  if (errors.length === 0) {
    return (
      <article className="panel">
        <p className="empty-state">Для этого профиля пока нет ошибок.</p>
      </article>
    )
  }

  return (
    <div className="material-grid">
      {errors.map((error) => (
        <article className="error-card" key={error.id}>
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
              <dd>{error.target}</dd>
            </div>
            <div>
              <dt>Date</dt>
              <dd>{error.date}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{error.status}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  )
}

function RevisionTab({ revision }) {
  return (
    <article className="panel">
      <div className="panel-heading">
        <p className="eyebrow">Revision</p>
        <h2>Due today — {revision.dueToday}</h2>
      </div>
      {revision.items.length > 0 ? (
        <div className="task-list">
          {revision.items.map((item) => (
            <div className="task-item revision-task" key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <span>
                  {item.source} · last practised: {item.lastPractised} ·{' '}
                  {item.status}
                </span>
              </div>
              <button className="primary-button" type="button">
                Повторить
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-state">Для этого профиля пока нет повторения.</p>
      )}
    </article>
  )
}
