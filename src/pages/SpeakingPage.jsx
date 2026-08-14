import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SpeakingTask2Trainer } from '../components/speaking/SpeakingTask2Trainer'
import { familyTask2Sets, getSpeakingTask2Set } from '../data/speaking/familyTask2Sets'

export function SpeakingPage({ progressActions }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialSetId = searchParams.get('set')
  const [selectedSetId, setSelectedSetId] = useState(initialSetId)
  const selectedSet = useMemo(
    () => (selectedSetId ? getSpeakingTask2Set(selectedSetId) : null),
    [selectedSetId],
  )

  const openSet = (setId) => {
    setSelectedSetId(setId)
    setSearchParams({ set: setId })
  }

  if (selectedSet) {
    return (
      <SpeakingTask2Trainer
        material={selectedSet}
        onAddError={progressActions.addError}
        onAddRevision={progressActions.addRevisionItem}
        onSaveResult={progressActions.addSpeakingTask2Attempt}
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
        <article className="feature-card tone-violet">
          <div>
            <h2>Task 2</h2>
            <p>Electronic Assistant · Available</p>
          </div>
        </article>
        <article className="feature-card tone-mint">
          <div>
            <h2>Task 3</h2>
            <p>Monologue · Coming later</p>
          </div>
        </article>
      </div>

      <article className="panel">
        <div className="panel-heading">
          <p className="eyebrow">Task 2</p>
          <h2>Family & Relationships</h2>
        </div>
        <div className="material-grid">
          {familyTask2Sets.map((set) => (
            <article className="material-card" key={set.id}>
              <span className="source-badge is-extra">Extra Practice</span>
              <h2>{set.title}</h2>
              <p>{set.description}</p>
              <dl className="material-meta">
                <div>
                  <dt>Type</dt>
                  <dd>Speaking Task 2</dd>
                </div>
                <div>
                  <dt>Mode</dt>
                  <dd>Electronic Assistant</dd>
                </div>
                <div>
                  <dt>Difficulty</dt>
                  <dd>{set.difficulty}</dd>
                </div>
              </dl>
              <button className="primary-button" onClick={() => openSet(set.id)} type="button">
                Начать
              </button>
            </article>
          ))}
        </div>
      </article>
    </section>
  )
}
