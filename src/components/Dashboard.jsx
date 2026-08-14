import { ProgressRing } from './ProgressRing'

export function Dashboard({
  activeChunks,
  featureCards,
  progressSummary,
  recentTasks,
  revisionCard,
}) {
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
            <button className="text-button" type="button">
              {card.action} <span aria-hidden="true">-&gt;</span>
            </button>
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
            <strong>{revisionCard.count}</strong>
            <span>{revisionCard.label}</span>
          </div>
          <button className="primary-button" type="button">
            Перейти
          </button>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <p className="eyebrow">Недавние задания</p>
            <h2>Последняя практика</h2>
          </div>
          <div className="task-list">
            {recentTasks.map((task) => (
              <div className="task-item" key={`${task.type}-${task.title}`}>
                <div>
                  <span>{task.type}</span>
                  <strong>{task.title}</strong>
                </div>
                <b>{task.result}</b>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <p className="eyebrow">Активные чанки</p>
            <h2>Фразы в работе</h2>
          </div>
          <div className="chunk-list">
            {activeChunks.map((chunk) => (
              <div className="chunk-item" key={chunk.phrase}>
                <span>{chunk.phrase}</span>
                <div className="mini-track" aria-label={`${chunk.progress}%`}>
                  <span style={{ width: `${chunk.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  )
}
