import { useMemo } from 'react'
import { formatMarkTime, tokenizeReadingText } from './task1Marking'

export function MarkedReadingText({
  canMark = false,
  markedErrors,
  material,
  onToggleMark,
  showTooltips = false,
}) {
  const paragraphs = useMemo(() => tokenizeReadingText(material.text), [material.text])
  const marksByToken = useMemo(
    () => new Map(markedErrors.map((error) => [error.tokenIndex, error])),
    [markedErrors],
  )

  return (
    <div className={`reading-text interactive-reading-text ${canMark ? 'can-mark' : ''}`}>
      {paragraphs.map((paragraph) => (
        <p key={paragraph.id}>
          {paragraph.parts.map((part) => {
            if (part.kind !== 'word') {
              return <span key={part.id}>{part.text}</span>
            }

            const mark = marksByToken.get(part.tokenIndex)
            const title = mark && showTooltips
              ? [
                  mark.tokenText,
                  mark.errorType,
                  mark.correction,
                  mark.timestampSeconds === null ? '' : formatMarkTime(mark.timestampSeconds),
                ]
                  .filter(Boolean)
                  .join(' · ')
              : undefined

            return (
              <button
                className={`reading-token ${mark ? 'is-marked' : ''}`}
                disabled={!canMark}
                key={part.id}
                onClick={() => onToggleMark?.(part)}
                title={title}
                type="button"
              >
                {part.text}
              </button>
            )
          })}
        </p>
      ))}
    </div>
  )
}
