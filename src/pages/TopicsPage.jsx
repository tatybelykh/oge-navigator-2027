import { Link } from 'react-router-dom'
import { getTopicStudentProgress } from '../data/topicStudentProgress'
import { topics } from '../data/topics'

export function TopicsPage({ activeStudentId }) {
  return (
    <section className="page-stack">
      <header className="page-header">
        <p className="eyebrow">OGE Navigator 2027</p>
        <h1>Темы</h1>
        <p className="welcome-text">
          Готовимся к экзамену через язык и реальные темы
        </p>
      </header>

      <div className="topics-grid" aria-label="Список тем">
        {topics.map((topic) => {
          const isFamily = topic.slug === 'family-relationships'
          const topicState = getTopicStudentProgress(activeStudentId, topic.id)

          return (
            <article
              className={`topic-card ${isFamily ? 'is-featured' : ''}`}
              key={topic.id}
            >
              <div className="topic-card__top">
                <span className="topic-icon" aria-hidden="true">
                  {topic.icon}
                </span>
                <span className={`status-pill status-${topicState.statusType}`}>
                  {topicState.status}
                </span>
              </div>

              <div>
                <h2>{topic.title}</h2>
                <p>{topic.description}</p>
              </div>

              <div>
                <div className="topic-progress">
                  <span>Progress</span>
                  <strong>{topicState.progress}%</strong>
                </div>
                <div className="track" aria-hidden="true">
                  <span style={{ width: `${topicState.progress}%` }} />
                </div>
              </div>

              {isFamily ? (
                <Link className="text-button" to={`/topics/${topic.slug}`}>
                  Открыть <span aria-hidden="true">-&gt;</span>
                </Link>
              ) : (
                <button className="text-button is-disabled" disabled type="button">
                  Открыть <span aria-hidden="true">-&gt;</span>
                </button>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
