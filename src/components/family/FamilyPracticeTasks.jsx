import { useMemo, useState } from 'react'

const chunkUsageOptions = ['Used independently', 'Used with help', 'Not used']
const tfnsOptions = ['True', 'False', 'Not stated']
const writingFields = [
  'Task achievement',
  'Organisation',
  'Vocabulary',
  'Grammar',
  'Spelling/Punctuation',
  'Teacher note',
]

export function FamilyPracticeTask({
  draft,
  material,
  onAddAttempt,
  onAddError,
  onCancel,
  onSaveDraft,
}) {
  if (material.taskType === 'chunk-recall') {
    return <ChunkRecallTask material={material} onAddAttempt={onAddAttempt} onAddError={onAddError} />
  }

  if (material.taskType === 'personalise-chunks') {
    return <PersonaliseChunksTask material={material} onAddAttempt={onAddAttempt} />
  }

  if (material.taskType === 'reading-match-headings') {
    return <ReadingMatchTask material={material} onAddAttempt={onAddAttempt} onAddError={onAddError} />
  }

  if (material.taskType === 'reading-true-false-not-stated') {
    return <TrueFalseNotStatedTask material={material} onAddAttempt={onAddAttempt} onAddError={onAddError} />
  }

  if (['grammar-transform', 'word-formation'].includes(material.taskType)) {
    return <GapFillTask material={material} onAddAttempt={onAddAttempt} onAddError={onAddError} />
  }

  if (material.taskType === 'writing-email') {
    return (
      <WritingTask
        draft={draft}
        material={material}
        onAddAttempt={onAddAttempt}
        onCancel={onCancel}
        onSaveDraft={onSaveDraft}
      />
    )
  }

  return null
}

function TaskShell({ children, material }) {
  return (
    <article className="practice-task">
      <div className="panel-heading">
        <p className="eyebrow">{material.section}</p>
        <h2>{material.title}</h2>
        <p className="welcome-text">{material.instructions}</p>
      </div>
      {children}
    </article>
  )
}

function ChunkRecallTask({ material, onAddAttempt, onAddError }) {
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [showAnswers, setShowAnswers] = useState(false)
  const items = material.content.items

  const check = () => {
    const details = items.map((item) => {
      const answer = normalize(answers[item.id])
      const isCorrect = item.answers.some((expected) => answer.includes(normalize(expected)))

      return { ...item, answer: answers[item.id] ?? '', isCorrect }
    })
    const score = details.filter((item) => item.isCorrect).length
    setResult({ details, score })
    onAddAttempt({
      answers,
      material,
      maxScore: material.maxScore,
      metadata: { details },
      score,
      status: score === material.maxScore ? 'completed' : 'retry',
    })
  }

  return (
    <TaskShell material={material}>
      <div className="task-list">
        {items.map((item, index) => (
          <label className="compact-field" key={item.id}>
            {index + 1}. {item.prompt}
            <input
              onChange={(event) => setAnswers((current) => ({ ...current, [item.id]: event.target.value }))}
              value={answers[item.id] ?? ''}
            />
          </label>
        ))}
      </div>
      <TaskActions onCheck={check} onReset={() => { setAnswers({}); setResult(null) }} onShowAnswers={() => setShowAnswers(true)} />
      {result && <AutoCheckResult material={material} onAddError={onAddError} result={result} />}
      {showAnswers && <AnswerList items={items.map((item) => ({ id: item.id, label: item.prompt, answer: item.answers[0] }))} />}
    </TaskShell>
  )
}

function PersonaliseChunksTask({ material, onAddAttempt }) {
  const [status, setStatus] = useState('completed')
  const [chunkUsage, setChunkUsage] = useState(() =>
    Object.fromEntries(material.targetChunks.map((chunk) => [chunk, 'Not used'])),
  )

  const save = () => {
    onAddAttempt({
      answers: {},
      material,
      maxScore: material.maxScore,
      metadata: { chunkUsage },
      score: status === 'completed' ? 1 : 0,
      status,
    })
  }

  return (
    <TaskShell material={material}>
      <div className="task-list">
        {material.content.prompts.map((prompt) => (
          <div className="task-item" key={prompt}>
            <strong>{prompt}</strong>
          </div>
        ))}
      </div>
      <div className="score-toggle">
        {['completed', 'retry'].map((option) => (
          <button className={`filter-button ${status === option ? 'is-active' : ''}`} key={option} onClick={() => setStatus(option)} type="button">
            {option === 'completed' ? 'Completed' : 'Needs more practice'}
          </button>
        ))}
      </div>
      <div className="task-list">
        {material.targetChunks.map((chunk) => (
          <div className="task-item" key={chunk}>
            <strong>{chunk}</strong>
            <select onChange={(event) => setChunkUsage((current) => ({ ...current, [chunk]: event.target.value }))} value={chunkUsage[chunk]}>
              {chunkUsageOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </div>
        ))}
      </div>
      <button className="primary-button" onClick={save} type="button">Save speaking practice</button>
    </TaskShell>
  )
}

function ReadingMatchTask({ material, onAddAttempt, onAddError }) {
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const letters = material.content.texts.map(([letter]) => letter)

  const check = () => {
    const details = Object.entries(material.answerKey).map(([questionNumber, expected]) => {
      const item = material.content.questions[Number(questionNumber) - 1]
      const answer = answers[questionNumber] ?? ''
      return { id: `reading12-${questionNumber}`, label: item, answer, correctAnswer: expected, isCorrect: answer === expected }
    })
    const score = details.filter((item) => item.isCorrect).length
    setResult({ details, score })
    onAddAttempt({ answers, material, maxScore: material.maxScore, metadata: { details }, score, status: score === material.maxScore ? 'completed' : 'retry' })
  }

  return (
    <TaskShell material={material}>
      <div className="reading-passages">
        {material.content.texts.map(([letter, text]) => (
          <article className="useful-language" key={letter}>
            <strong>{letter}</strong>
            <p>{text}</p>
          </article>
        ))}
      </div>
      <div className="task-list">
        {material.content.questions.map((question, index) => (
          <label className="compact-field" key={question}>
            {index + 1}. {question}
            <select onChange={(event) => setAnswers((current) => ({ ...current, [index + 1]: event.target.value }))} value={answers[index + 1] ?? ''}>
              <option value="">Choose</option>
              {letters.map((letter) => <option key={letter}>{letter}</option>)}
            </select>
          </label>
        ))}
      </div>
      <button className="primary-button" onClick={check} type="button">Check</button>
      {result && <AutoCheckResult material={material} onAddError={onAddError} result={result} />}
    </TaskShell>
  )
}

function TrueFalseNotStatedTask({ material, onAddAttempt, onAddError }) {
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)

  const check = () => {
    const details = material.content.statements.map((item) => {
      const answer = answers[item.id] ?? ''
      return { ...item, answer, correctAnswer: item.answer, isCorrect: answer === item.answer }
    })
    const score = details.filter((item) => item.isCorrect).length
    setResult({ details, score })
    onAddAttempt({ answers, material, maxScore: material.maxScore, metadata: { details }, score, status: score === material.maxScore ? 'completed' : 'retry' })
  }

  return (
    <TaskShell material={material}>
      <div className="reading-text"><p>{material.content.text}</p></div>
      <div className="task-list">
        {material.content.statements.map((item, index) => (
          <label className="compact-field" key={item.id}>
            {index + 1}. {item.statement}
            <select onChange={(event) => setAnswers((current) => ({ ...current, [item.id]: event.target.value }))} value={answers[item.id] ?? ''}>
              <option value="">Choose</option>
              {tfnsOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
        ))}
      </div>
      <button className="primary-button" onClick={check} type="button">Check</button>
      {result && <AutoCheckResult material={material} onAddError={onAddError} result={result} showExplanations />}
    </TaskShell>
  )
}

function GapFillTask({ material, onAddAttempt, onAddError }) {
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)

  const check = () => {
    const details = material.content.items.map((item) => {
      const answer = normalize(answers[item.id])
      const correctAnswer = normalize(item.answer)
      return { ...item, answer: answers[item.id] ?? '', correctAnswer: item.answer, isCorrect: answer === correctAnswer }
    })
    const score = details.filter((item) => item.isCorrect).length
    setResult({ details, score })
    onAddAttempt({ answers, material, maxScore: material.maxScore, metadata: { details }, score, status: score === material.maxScore ? 'completed' : 'retry' })
  }

  return (
    <TaskShell material={material}>
      <p className="empty-state">{material.content.textBefore}</p>
      <div className="task-list">
        {material.content.items.map((item, index) => (
          <label className="compact-field" key={item.id}>
            {index + 1}. {item.baseWord}
            <input onChange={(event) => setAnswers((current) => ({ ...current, [item.id]: event.target.value }))} value={answers[item.id] ?? ''} />
          </label>
        ))}
      </div>
      <button className="primary-button" onClick={check} type="button">Check</button>
      {result && <AutoCheckResult material={material} onAddError={onAddError} result={result} />}
    </TaskShell>
  )
}

function WritingTask({ draft = {}, material, onAddAttempt, onCancel, onSaveDraft }) {
  const [text, setText] = useState(draft.text ?? '')
  const [teacherNotes, setTeacherNotes] = useState(draft.teacherNotes ?? {})
  const wordCount = useMemo(() => text.trim().split(/\s+/).filter(Boolean).length, [text])

  const saveDraft = () => onSaveDraft(material.id, { savedAt: new Date().toISOString(), teacherNotes, text })
  const complete = () => {
    saveDraft()
    onAddAttempt({
      answers: { text },
      material,
      maxScore: material.maxScore,
      metadata: { teacherNotes, wordCount },
      score: 1,
      status: 'completed',
    })
  }

  return (
    <TaskShell material={material}>
      <div className="useful-language"><pre className="writing-prompt">{material.content.prompt}</pre></div>
      <label className="compact-field">
        Email draft
        <textarea onChange={(event) => setText(event.target.value)} value={text} />
      </label>
      <span className="section-chip">{wordCount} words</span>
      <article className="review-card">
        <div className="panel-heading"><p className="eyebrow">Teacher Review</p><h2>Writing notes</h2></div>
        {writingFields.map((field) => (
          <label className="compact-field" key={field}>
            {field}
            <textarea onChange={(event) => setTeacherNotes((current) => ({ ...current, [field]: event.target.value }))} value={teacherNotes[field] ?? ''} />
          </label>
        ))}
      </article>
      <div className="material-actions">
        <button className="text-button" onClick={saveDraft} type="button">Save draft locally</button>
        <button className="primary-button" onClick={complete} type="button">Mark as completed</button>
        <button className="text-button danger-button" onClick={onCancel} type="button">Close</button>
      </div>
    </TaskShell>
  )
}

function TaskActions({ onCheck, onReset, onShowAnswers }) {
  return (
    <div className="material-actions">
      <button className="primary-button" onClick={onCheck} type="button">Check</button>
      <button className="text-button" onClick={onReset} type="button">Try again</button>
      <button className="text-button" onClick={onShowAnswers} type="button">Show answers</button>
    </div>
  )
}

function AutoCheckResult({ material, onAddError, result, showExplanations = false }) {
  return (
    <article className="review-card">
      <div className="review-card__header">
        <h2>Score: {result.score}/{material.maxScore}</h2>
        <span>{Math.round((result.score / material.maxScore) * 100)}%</span>
      </div>
      <div className="task-list">
        {result.details.map((item, index) => (
          <div className="task-item" key={item.id}>
            <div>
              <strong>{index + 1}. {item.label ?? item.prompt ?? item.statement ?? item.baseWord}</strong>
              <span>{item.isCorrect ? 'Correct' : `Correct answer: ${item.correctAnswer ?? item.answers?.[0] ?? item.answer}`}</span>
              {showExplanations && item.explanation && <span>{item.explanation}</span>}
            </div>
            {!item.isCorrect && (
              <button
                className="text-button"
                onClick={() =>
                  onAddError({
                    correction: item.correctAnswer ?? item.answers?.[0] ?? '',
                    inRevision: true,
                    materialId: material.id,
                    original: item.answer || item.label || item.statement || item.prompt,
                    questionId: item.id,
                    source: material.title,
                    target: item.correctAnswer ?? item.answers?.[0] ?? '',
                    type: material.section === 'Reading' ? 'Exam strategy' : 'Vocabulary',
                  })
                }
                type="button"
              >
                + В Error Bank
              </button>
            )}
          </div>
        ))}
      </div>
    </article>
  )
}

function AnswerList({ items }) {
  return (
    <article className="review-card">
      <div className="panel-heading"><p className="eyebrow">Answers</p><h2>Answer key</h2></div>
      <div className="task-list">
        {items.map((item, index) => (
          <div className="task-item" key={item.id}><strong>{index + 1}</strong><span>{item.answer}</span></div>
        ))}
      </div>
    </article>
  )
}

function normalize(value = '') {
  return value.trim().toLowerCase().replace(/[.,!?']/g, '').replace(/\s+/g, ' ')
}
