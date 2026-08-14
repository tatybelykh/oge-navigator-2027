import { useCallback, useEffect, useState } from 'react'
import { getStudentSeedData } from '../data/familyStudentData'
import { localStorageService } from '../services/localStorageService'

export function useLocalStudentData(studentId) {
  const [studentData, setStudentData] = useState(() =>
    localStorageService.getStudentData(studentId, getStudentSeedData(studentId)),
  )

  useEffect(() => {
    setStudentData(
      localStorageService.getStudentData(studentId, getStudentSeedData(studentId)),
    )
  }, [studentId])

  const saveStudentData = useCallback(
    (nextData) => {
      setStudentData(nextData)
      localStorageService.saveStudentData(studentId, nextData)
    },
    [studentId],
  )

  const updateChunkStatus = (chunkId, status) => {
    saveStudentData({
      ...studentData,
      chunkProgress: {
        ...studentData.chunkProgress,
        [chunkId]: status,
      },
    })
  }

  const addAttempt = ({ material, maxScore, score, status }) => {
    const numericScore = Number(score)
    const numericMaxScore = Number(maxScore)
    const percentage =
      numericMaxScore > 0
        ? Math.round((numericScore / numericMaxScore) * 100)
        : 0

    const attempt = {
      id: `attempt-${crypto.randomUUID()}`,
      studentId,
      materialId: material.id,
      materialTitle: material.title,
      materialSourceType: material.sourceType,
      topicId: material.topic,
      section: material.progressSection ?? material.section,
      completedAt: new Date().toISOString(),
      score: numericScore,
      maxScore: numericMaxScore,
      percentage,
      status,
    }

    saveStudentData({
      ...studentData,
      attempts: [...studentData.attempts, attempt],
    })
  }

  const addSpeakingTask2Attempt = ({
    answerTimestamps,
    material,
    mode,
    questionScores,
    selfReview,
    teacherNotes,
  }) => {
    const score = questionScores.reduce(
      (sum, questionScore) => sum + Number(questionScore.score),
      0,
    )
    const maxScore = questionScores.length
    const attempt = {
      id: `attempt-${crypto.randomUUID()}`,
      studentId,
      materialId: material.id,
      materialTitle: material.title,
      materialSourceType: material.sourceType,
      topicId: material.topicId,
      taskType: material.taskType,
      section: 'Speaking',
      mode,
      completedAt: new Date().toISOString(),
      score,
      maxScore,
      percentage: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
      status: score === maxScore ? 'completed' : 'retry',
      answerTimestamps,
      questionScores,
      selfReview,
      teacherNotes,
    }

    saveStudentData({
      ...studentData,
      attempts: [...studentData.attempts, attempt],
    })
  }

  const addError = ({
    correction,
    inRevision,
    materialId,
    original,
    questionId,
    source,
    target,
    type,
  }) => {
    const error = {
      id: `error-${crypto.randomUUID()}`,
      studentId,
      topicId: 'family',
      original,
      correction,
      type,
      target,
      source,
      materialId,
      questionId,
      createdAt: new Date().toISOString(),
      status: inRevision ? 'Revision' : 'Learning',
      inRevision,
    }

    const revisionItem = inRevision
      ? createRevisionItem({
          sourceId: error.id,
          sourceType: 'Error',
          studentId,
          title: target || correction,
        })
      : null

    saveStudentData({
      ...studentData,
      errors: [...studentData.errors, error],
      revision: revisionItem
        ? upsertRevisionItem(studentData.revision, revisionItem)
        : studentData.revision,
    })
  }

  const updateError = (errorId, updates) => {
    const nextErrors = studentData.errors.map((error) =>
      error.id === errorId
        ? {
            ...error,
            ...updates,
            status: updates.inRevision ? 'Revision' : 'Learning',
          }
        : error,
    )
    const updatedError = nextErrors.find((error) => error.id === errorId)
    const nextRevision = updates.inRevision
      ? upsertRevisionItem(
          studentData.revision,
          createRevisionItem({
            sourceId: errorId,
            sourceType: 'Error',
            studentId,
            title: updatedError?.target || updatedError?.correction,
          }),
        )
      : studentData.revision.filter((item) => item.sourceId !== errorId)

    saveStudentData({
      ...studentData,
      errors: nextErrors,
      revision: nextRevision,
    })
  }

  const deleteError = (errorId) => {
    saveStudentData({
      ...studentData,
      errors: studentData.errors.filter((error) => error.id !== errorId),
      revision: studentData.revision.filter((item) => item.sourceId !== errorId),
    })
  }

  const addRevisionItem = ({ sourceId, sourceType, title }) => {
    saveStudentData({
      ...studentData,
      revision: upsertRevisionItem(
        studentData.revision,
        createRevisionItem({ sourceId, sourceType, studentId, title }),
      ),
    })
  }

  const updateRevisionStatus = (revisionId, status) => {
    saveStudentData({
      ...studentData,
      revision: studentData.revision.map((item) =>
        item.id === revisionId
          ? {
              ...item,
              lastPractisedAt:
                status === 'Done today' ? new Date().toISOString() : item.lastPractisedAt,
              status,
            }
          : item,
      ),
    })
  }

  const removeRevisionItem = (revisionId) => {
    saveStudentData({
      ...studentData,
      revision: studentData.revision.filter((item) => item.id !== revisionId),
    })
  }

  const resetProgress = () => {
    localStorageService.resetStudentData(studentId)
    setStudentData(localStorageService.getStudentData(studentId))
  }

  return {
    addAttempt,
    addSpeakingTask2Attempt,
    addError,
    addRevisionItem,
    deleteError,
    removeRevisionItem,
    resetProgress,
    studentData,
    updateChunkStatus,
    updateError,
    updateRevisionStatus,
  }
}

function createRevisionItem({ sourceId, sourceType, studentId, title }) {
  return {
    id: `revision-${sourceType.toLowerCase()}-${sourceId}`,
    studentId,
    sourceType,
    sourceId,
    topicId: 'family',
    title,
    addedAt: new Date().toISOString(),
    lastPractisedAt: null,
    status: 'Due',
  }
}

function upsertRevisionItem(items, item) {
  if (items.some((currentItem) => currentItem.sourceId === item.sourceId)) {
    return items
  }

  return [...items, item]
}
