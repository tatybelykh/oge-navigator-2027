export const task1ErrorTypes = [
  'Pronunciation',
  'Word stress',
  'Sentence stress',
  'Intonation',
  'Reading rule',
  'Other',
]

const wordPattern = /[A-Za-z0-9]+(?:[’'][A-Za-z0-9]+)?/g

export function tokenizeReadingText(text) {
  let tokenIndex = 0

  return text.split('\n').map((paragraph, paragraphIndex) => {
    const parts = []
    let lastIndex = 0

    for (const match of paragraph.matchAll(wordPattern)) {
      if (match.index > lastIndex) {
        parts.push({
          id: `p${paragraphIndex}-text-${lastIndex}`,
          kind: 'text',
          text: paragraph.slice(lastIndex, match.index),
        })
      }

      parts.push({
        id: `token-${tokenIndex}`,
        kind: 'word',
        paragraphIndex,
        text: match[0],
        tokenIndex,
      })
      tokenIndex += 1
      lastIndex = match.index + match[0].length
    }

    if (lastIndex < paragraph.length) {
      parts.push({
        id: `p${paragraphIndex}-text-${lastIndex}`,
        kind: 'text',
        text: paragraph.slice(lastIndex),
      })
    }

    return {
      id: `paragraph-${paragraphIndex}`,
      paragraphIndex,
      parts,
    }
  })
}

export function createMarkedError({
  materialId,
  paragraphIndex,
  timestampSeconds,
  tokenIndex,
  tokenText,
}) {
  return {
    id: `mark-${materialId}-${tokenIndex}-${crypto.randomUUID()}`,
    materialId,
    tokenIndex,
    paragraphIndex,
    tokenText,
    timestampSeconds,
    errorType: 'Pronunciation',
    meaningDistorting: false,
    correction: '',
    note: '',
    addToErrorBank: false,
    addToRevision: false,
  }
}

export function formatMarkTime(timestampSeconds) {
  if (timestampSeconds === null || timestampSeconds === undefined) {
    return '--:--'
  }

  const safeSeconds = Math.max(0, Math.round(timestampSeconds))
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function getCleanMarkedErrors(markedErrors) {
  return markedErrors.map((error) => ({
    tokenIndex: error.tokenIndex,
    paragraphIndex: error.paragraphIndex,
    tokenText: error.tokenText,
    timestampSeconds: error.timestampSeconds ?? null,
    errorType: error.errorType,
    meaningDistorting: Boolean(error.meaningDistorting),
    correction: error.correction ?? '',
    note: error.note ?? '',
  }))
}
