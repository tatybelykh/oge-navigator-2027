const chunkStatusValue = {
  New: 0,
  Learning: 35,
  Active: 100,
}

const skillSections = [
  'Listening',
  'Reading',
  'Grammar & Vocabulary',
  'Writing',
  'Speaking',
]

export function calculateFamilyProgress({ chunks, studentData }) {
  const chunkProgress = calculateChunkProgress({
    chunks,
    chunkProgress: studentData.chunkProgress,
  })
  const skills = skillSections.map((section) => ({
    label: section,
    value: calculateSectionProgress(studentData.attempts, section),
  }))

  const examPractice = average(
    latestAttempts(studentData.attempts.filter((attempt) => attempt.materialSourceType === 'fipi')).map(
      (attempt) => attempt.percentage,
    ),
  )
  const extraPractice = average(
    latestAttempts(studentData.attempts.filter((attempt) => attempt.materialSourceType === 'extra')).map(
      (attempt) => attempt.percentage,
    ),
  )
  const speaking = calculateSectionProgress(studentData.attempts, 'Speaking')
  const errorsRevision = calculateRevisionProgress(studentData)

  const categories = [
    chunkProgress,
    examPractice,
    extraPractice,
    speaking,
    errorsRevision,
  ]

  return {
    categories: [
      { label: 'Chunks', value: chunkProgress },
      { label: 'Exam Practice', value: examPractice },
      { label: 'Extra Practice', value: extraPractice },
      { label: 'Speaking', value: speaking },
      { label: 'Errors / Revision', value: errorsRevision },
    ],
    overall: average(categories),
    skills,
  }
}

export function calculateChunkProgress({ chunkProgress, chunks }) {
  if (chunks.length === 0) {
    return 0
  }

  return average(
    chunks.map((chunk) => {
      const status = chunkProgress[chunk.id] === 'With help'
        ? 'Learning'
        : chunkProgress[chunk.id] ?? 'New'

      return chunkStatusValue[status] ?? chunkStatusValue.New
    }),
  )
}

export function getLatestAttemptByMaterial(attempts, materialId) {
  return latestAttempts(attempts).find((attempt) => attempt.materialId === materialId)
}

export function getAttemptsForMaterial(attempts, materialId) {
  return attempts
    .filter((attempt) => attempt.materialId === materialId)
    .toSorted((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
}

export function getRecentAttempts(attempts, limit = 3) {
  return attempts
    .toSorted((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .slice(0, limit)
}

function calculateSectionProgress(attempts, section) {
  const values = latestAttempts(
    attempts.filter((attempt) => attempt.section === section),
  ).map((attempt) => attempt.percentage)

  return average(values)
}

function calculateRevisionProgress(studentData) {
  const doneCount = studentData.revision.filter(
    (item) => item.status === 'Done today',
  ).length
  const errorPenalty = Math.min(studentData.errors.length * 8, 40)
  const revisionBase =
    studentData.revision.length === 0
      ? 0
      : Math.round((doneCount / studentData.revision.length) * 100)

  return Math.max(0, revisionBase - errorPenalty)
}

function latestAttempts(attempts) {
  const byMaterial = new Map()

  attempts.forEach((attempt) => {
    const currentAttempt = byMaterial.get(attempt.materialId)

    if (
      !currentAttempt ||
      new Date(attempt.completedAt) > new Date(currentAttempt.completedAt)
    ) {
      byMaterial.set(attempt.materialId, attempt)
    }
  })

  return [...byMaterial.values()]
}

function average(values) {
  const availableValues = values.filter((value) => Number.isFinite(value))

  if (availableValues.length === 0) {
    return 0
  }

  return Math.round(
    availableValues.reduce((sum, value) => sum + value, 0) /
      availableValues.length,
  )
}
