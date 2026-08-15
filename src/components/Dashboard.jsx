import { Link } from 'react-router-dom'
import { familyChunks } from '../data/familyChunks'
import {
  calculateFamilyProgress,
  getRecentAttempts,
} from '../utils/progressCalculator'
import { ProgressRing } from './ProgressRing'

export function Dashboard({ featureCards, studentData }) {
  const progressSummary = calculateFamilyProgress({
    chunks: familyChunks,
    studentData,
  })
  const recentAttempts = getRecentAttempts(studentData.attempts)
  const activeChunks = familyChunks
    .map((chunk) => ({
      phrase: chunk.chunk,
      status: studentData.chunkProgress[chunk.id] === 'With help'
        ? 'Learning'
        : studentData.chunkProgress[chunk.id] ?? 'New',
    }))
    .filter((chunk) =>
      ['Active', 'Learning'].includes(chunk.status),
    )
    .slice(0, 5)

  return (
    <>
      <section className="welcome">
        <div>
          <p className="eyebrow">OGE Navigator 2027</p>
          <h1>Привет! 👋</h1>
          <p className="welcome-text">
            Продолжим подготовку к ОГЭ по английскому?
          </p>
        </div>
      </section>

      <section className="feature-grid" aria-label="Основные разделы">
        {featureCards.map((card) => (
          <article className={`feature-card tone-${card.tone}`} key={card.title}>
            <div>
              <h2>{card.title}</h2>
              <p>{card.meta}</p>
            </div>
            {card.path ? (
              <Link className="text-button" to={card.path}>
                {card.action} <span aria-hidden="true">-&gt;</span>
              </Link>
            ) : (
              <button className="text-button" type="button">
                {card.action} <span aria-hidden="true">-&gt;</span>
              </button>
            )}
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="panel progress-panel">
          <div className="panel-heading">
            <p className="eyebrow">Прогресс</p>
            <h2>Общая картина</h2>
          </div>

          <div className="progress-layout">
            <ProgressRing value={progressSummary.overall} />
            <div className="skill-list">
              {progressSummary.skills.map((skill) => (
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
          </div>
        </article>

        <article className="panel revision-panel">
          <div className="panel-heading">
            <p className="eyebrow">Revision</p>
            <h2>На повторение</h2>
          </div>
          <div className="revision-count">
            <strong>{studentData.revision.length}</strong>
            <span>элементов</span>
          </div>
          <Link className="primary-link" to="/topics/family-relationships">
            Перейти
          </Link>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <p className="eyebrow">Недавние задания</p>
            <h2>Последняя практика</h2>
          </div>
          {recentAttempts.length > 0 ? (
            <div className="task-list">
              {recentAttempts.map((attempt) => (
                <div className="task-item" key={attempt.id}>
                  <div>
                    <span>{attempt.section}</span>
                    <strong>{attempt.materialTitle}</strong>
                  </div>
                  <b>
                    {attempt.score}/{attempt.maxScore}
                  </b>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">
              Это задание ещё не выполнялось. Здесь появится прогресс после первых заданий.
            </p>
          )}
        </article>

        <article className="panel">
          <div className="panel-heading">
            <p className="eyebrow">Активные чанки</p>
            <h2>Фразы в работе</h2>
          </div>
          {activeChunks.length > 0 ? (
            <div className="chunk-list">
              {activeChunks.map((chunk) => (
                <div className="chunk-item" key={chunk.phrase}>
                  <span>{chunk.phrase}</span>
                  <small>{chunk.status}</small>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">
              Здесь появится прогресс после первых заданий.
            </p>
          )}
        </article>
      </section>
    </>
  )
}
