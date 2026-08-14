import { useRef, useState } from 'react'
import { speakingTask2Config } from '../../data/speaking/task2Config'

const zeroReasons = [
  'No answer',
  'Did not answer the question',
  'Only a word / short phrase',
  'Communication breakdown',
  'Factual problem',
  'Other',
]

const selfReviewItems = [
  'I answered the question',
  'I gave a full answer',
  'My answer was clear',
  'I used useful topic vocabulary',
]

export function TeacherReview({
  material,
  mode,
  answerTimestamps = [],
  onAddError,
  onAddRevision,
  onSaveResult,
  sessionRecording,
}) {
  const audioPlayerRef = useRef(null)
  const [questionScores, setQuestionScores] = useState(() =>
    material.questions.map((question) => ({
      note: '',
      questionId: question.id,
      reason: '',
      score: 1,
    })),
  )
  const [errorQuestionId, setErrorQuestionId] = useState(null)
  const [selfReview, setSelfReview] = useState({})

  const totalScore = questionScores.reduce(
    (sum, questionScore) => sum + Number(questionScore.score),
    0,
  )

  const updateQuestionScore = (questionId, updates) => {
    setQuestionScores((currentScores) =>
      currentScores.map((questionScore) =>
        questionScore.questionId === questionId
          ? { ...questionScore, ...updates }
          : questionScore,
      ),
    )
  }

  const playAnswerSegment = (startSeconds) => {
    if (!audioPlayerRef.current) {
      return
    }

    audioPlayerRef.current.currentTime = startSeconds
    audioPlayerRef.current.play()
  }

  return (
    <section className="page-stack">
      <article className="panel">
        <div className="panel-heading">
          <p className="eyebrow">Teacher Review</p>
          <h2>
            Score: {totalScore}/{speakingTask2Config.maxScore}
          </h2>
        </div>
        {sessionRecording?.url ? (
          <div className="audio-review-row">
            <audio controls ref={audioPlayerRef} src={sessionRecording.url}>
              <track kind="captions" />
            </audio>
            <a
              className="text-button"
              download={makeSessionAudioFileName(material, sessionRecording.mimeType)}
              href={sessionRecording.url}
            >
              Скачать общий файл
            </a>
          </div>
        ) : (
          <p className="empty-state">Общий аудиофайл ещё формируется.</p>
        )}
        <details className="criteria-help">
          <summary>Как оценивать Task 2</summary>
          <p>
            1 балл: ответ полный, понятный и отвечает на вопрос. Небольшие
            языковые ошибки допустимы, если они не мешают пониманию.
          </p>
          <p>
            0 баллов: ответа нет, ответ не по вопросу, слишком короткий или
            смысл становится непонятным.
          </p>
          <p>
            Каждый из шести ответов оценивается отдельно. Максимум: 6/6.
          </p>
          <small>
            Рабочая памятка на основе модели ОГЭ-2026. После публикации ФИПИ-2027
            критерии будут сверены.
          </small>
        </details>
      </article>

      {material.questions.map((question, index) => {
        const questionScore = questionScores[index]
        const timestamp = answerTimestamps.find(
          (answerTimestamp) => answerTimestamp.questionId === question.id,
        )
        const startSeconds = timestamp?.startSeconds ?? 0
        const endSeconds = timestamp?.endSeconds ?? startSeconds

        return (
          <article className="review-card" key={question.id}>
            <div className="review-card__header">
              <h2>Question {index + 1}</h2>
              <span className="status-pill status-started">
                {questionScore.score}/1
              </span>
            </div>
            <p>{question.text}</p>
            <div className="audio-review-row">
              <span>
                Answer: {formatTimestamp(startSeconds)}–{formatTimestamp(endSeconds)}
              </span>
              <button
                className="text-button"
                onClick={() => playAnswerSegment(startSeconds)}
                type="button"
              >
                ▶ Перейти к ответу
              </button>
            </div>

            <div className="score-toggle" aria-label={`Score for question ${index + 1}`}>
              {[0, 1].map((score) => (
                <button
                  className={`filter-button ${
                    questionScore.score === score ? 'is-active' : ''
                  }`}
                  key={score}
                  onClick={() => updateQuestionScore(question.id, { score })}
                  type="button"
                >
                  {score}
                </button>
              ))}
            </div>

            {questionScore.score === 0 && (
              <label className="compact-field">
                Причина 0 баллов
                <select
                  onChange={(event) =>
                    updateQuestionScore(question.id, { reason: event.target.value })
                  }
                  value={questionScore.reason}
                >
                  <option value="">Выберите причину</option>
                  {zeroReasons.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="compact-field">
              Teacher note
              <textarea
                onChange={(event) =>
                  updateQuestionScore(question.id, { note: event.target.value })
                }
                value={questionScore.note}
              />
            </label>

            <div className="review-actions">
              <button
                className="text-button"
                onClick={() => setErrorQuestionId(question.id)}
                type="button"
              >
                + Добавить ошибку
              </button>
              <button
                className="text-button"
                onClick={() =>
                  onAddRevision({
                    sourceId: `${material.id}-${question.id}`,
                    sourceType: 'Speaking Task 2',
                    title: `${material.title}: Question ${index + 1}`,
                  })
                }
                type="button"
              >
                Повторить этот вопрос позже
              </button>
            </div>
            {errorQuestionId === question.id && (
              <SpeakingErrorForm
                materialId={material.id}
                onCancel={() => setErrorQuestionId(null)}
                onSave={(error) => {
                  onAddError(error)
                  setErrorQuestionId(null)
                }}
                questionId={question.id}
              />
            )}
          </article>
        )
      })}

      <article className="panel">
        <div className="panel-heading">
          <p className="eyebrow">Self-review</p>
          <h2>Учебная рефлексия</h2>
        </div>
        <div className="self-review-grid">
          {material.questions.map((question, index) => (
            <div className="self-review-item" key={question.id}>
              <strong>Question {index + 1}</strong>
              {selfReviewItems.map((item) => (
                <label className="checkbox-row" key={item}>
                  <input
                    checked={Boolean(selfReview[question.id]?.[item])}
                    onChange={(event) =>
                      setSelfReview((current) => ({
                        ...current,
                        [question.id]: {
                          ...current[question.id],
                          [item]: event.target.checked,
                        },
                      }))
                    }
                    type="checkbox"
                  />
                  {item}
                </label>
              ))}
            </div>
          ))}
        </div>
      </article>

      <button
        className="primary-button"
        onClick={() =>
          onSaveResult({
            material,
            mode,
            answerTimestamps,
            questionScores,
            selfReview,
            teacherNotes: questionScores.map((questionScore) => ({
              note: questionScore.note,
              questionId: questionScore.questionId,
              zeroReason: questionScore.reason,
            })),
          })
        }
        type="button"
      >
        Сохранить результат
      </button>
    </section>
  )
}

function SpeakingErrorForm({ materialId, onCancel, onSave, questionId }) {
  const [original, setOriginal] = useState('')
  const [correction, setCorrection] = useState('')
  const [type, setType] = useState('Grammar')
  const [target, setTarget] = useState('')
  const [inRevision, setInRevision] = useState(true)

  return (
    <form
      className="inline-form"
      onSubmit={(event) => {
        event.preventDefault()
        onSave({
          correction,
          inRevision,
          materialId,
          original,
          questionId,
          source: 'Speaking Task 2',
          target,
          type,
        })
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
          {['Grammar', 'Vocabulary', 'Chunk', 'Pronunciation', 'Task achievement', 'Exam strategy', 'Other'].map(
            (errorType) => (
              <option key={errorType} value={errorType}>
                {errorType}
              </option>
            ),
          )}
        </select>
      </label>
      <label className="compact-field">
        Target
        <input onChange={(event) => setTarget(event.target.value)} value={target} />
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

function makeSessionAudioFileName(material, mimeType) {
  const date = new Date().toISOString().slice(0, 10)
  const extension = mimeType?.includes('mp4') ? 'mp4' : 'webm'
  const safeTitle = material.title.replaceAll(' ', '-')

  return `OGE_Family_Task2_${safeTitle}_session_${date}.${extension}`
}

function formatTimestamp(totalSeconds) {
  const safeSeconds = Math.max(0, totalSeconds)
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
