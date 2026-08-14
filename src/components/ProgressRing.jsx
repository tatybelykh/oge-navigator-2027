export function ProgressRing({ value }) {
  return (
    <div
      aria-label={`Общий прогресс ${value} процентов`}
      className="progress-ring"
      role="img"
      style={{ '--progress': `${value}%` }}
    >
      <div className="progress-ring__inner">
        <strong>{value}%</strong>
        <span>общий прогресс</span>
      </div>
    </div>
  )
}
