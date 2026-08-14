import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SpeakingTask2Trainer } from '../components/speaking/SpeakingTask2Trainer'
import { SpeakingTask3Trainer } from '../components/speaking/SpeakingTask3Trainer'
import { familyTask2Sets, getSpeakingTask2Set } from '../data/speaking/familyTask2Sets'
import { familyTask3Sets, getSpeakingTask3Set } from '../data/speaking/familyTask3Sets'

export function SpeakingPage({ progressActions }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTask = searchParams.get('task') === '3' ? '3' : '2'
  const initialSetId = searchParams.get('set')
  const [activeTask, setActiveTask] = useState(initialTask)
  const [selectedSetId, setSelectedSetId] = useState(initialSetId)
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
        <article className="feature-card tone-blue">
          <div>
            <h2>Task 1</h2>
            <p>Coming later</p>
          </div>
        </article>
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

      {activeTask === '2' ? (
        <SpeakingSetList
          eyebrow="Task 2"
          modeLabel="Electronic Assistant"
          onOpen={(setId) => openSet('2', setId)}
          sets={familyTask2Sets}
          typeLabel="Speaking Task 2"
        />
      ) : (
        <SpeakingSetList
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

function SpeakingSetList({ eyebrow, modeLabel, onOpen, sets, typeLabel }) {
  return (
    <article className="panel">
      <div className="panel-heading">
        <p className="eyebrow">{eyebrow}</p>
        <h2>Family & Relationships</h2>
      </div>
      <div className="material-grid">
        {sets.map((set) => (
          <article className="material-card" key={set.id}>
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
            <button className="primary-button" onClick={() => onOpen(set.id)} type="button">
              Начать
            </button>
          </article>
        ))}
      </div>
    </article>
  )
}
