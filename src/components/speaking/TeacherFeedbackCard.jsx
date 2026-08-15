import { useState } from 'react'
import { MarkedReadingText } from './MarkedReadingText'

export function TeacherFeedbackCard({ attempt, material }) {
  const [showMarkedText, setShowMarkedText] = useState(false)
  const markedErrors = attempt.markedErrors ?? []
  const wordsToPractise = markedErrors.filter(
    (error) => error.correction || error.errorType,
  )

  return (
    <article className="review-card teacher-feedback-card">
      <div className="review-card__header">
        <div>
          <p className="eyebrow">Teacher feedback</p>
          <h2>Speaking Task 1</h2>
          <p className="welcome-text">{attempt.materialTitle}</p>
        </div>
        <span>Score: {attempt.score} / {attempt.maxScore}</span>
      </div>

      {attempt.teacherFeedback?.whatWentWell && (
        <FeedbackBlock label="What went well" value={attempt.teacherFeedback.whatWentWell} />
      )}
      {attempt.teacherFeedback?.workOn && (
        <FeedbackBlock label="Work on" value={attempt.teacherFeedback.workOn} />
      )}

      {wordsToPractise.length > 0 && (
        <div className="feedback-section">
          <strong>Words to practise:</strong>
          <div className="feedback-word-list">
            {wordsToPractise.map((error) => (
              <div className="feedback-word-item" key={`${error.tokenIndex}-${error.tokenText}`}>
                <strong>{error.tokenText}</strong>
                {error.correction && <span>→ {error.correction}</span>}
                <small>{error.errorType}</small>
              </div>
            ))}
          </div>
        </div>
      )}

      {attempt.teacherFeedback?.overallComment && (
        <FeedbackBlock label="Teacher comment" value={attempt.teacherFeedback.overallComment} />
      )}

      {markedErrors.length > 0 && (
        <button
          className="text-button"
          onClick={() => setShowMarkedText((current) => !current)}
          type="button"
        >
          Посмотреть текст с отметками
        </button>
      )}

      {showMarkedText && (
        <MarkedReadingText
          markedErrors={markedErrors}
          material={material}
          showTooltips
        />
      )}
    </article>
  )
}

function FeedbackBlock({ label, value }) {
  return (
    <div className="feedback-section">
      <strong>{label}:</strong>
      <p>{value}</p>
    </div>
  )
}
