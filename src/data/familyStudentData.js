import { createEmptyStudentData } from '../services/localStorageService'

const studentOneId = 'student-001'

export const studentOneSeedData = {
  ...createEmptyStudentData(studentOneId),
  chunkProgress: {
    'chunk-get-on-well': 'Active',
    'chunk-common': 'Active',
    'chunk-close': 'Learning',
    'chunk-time': 'Active',
    'chunk-fall-out': 'With help',
    'chunk-argue': 'Learning',
    'chunk-support': 'Active',
    'chunk-get-along': 'Learning',
    'chunk-good-relationship': 'New',
    'chunk-advice': 'New',
    'chunk-care': 'New',
    'chunk-touch': 'New',
  },
  attempts: [
    {
      id: 'attempt-seed-speaking-3',
      studentId: studentOneId,
      materialId: 'exam-fipi-speaking-3-family',
      materialTitle: 'Family relationships',
      materialSourceType: 'fipi',
      topicId: 'family',
      section: 'Speaking',
      completedAt: '2026-08-14T00:00:00.000Z',
      score: 6,
      maxScore: 7,
      percentage: 86,
      status: 'completed',
    },
    {
      id: 'attempt-seed-reading',
      studentId: studentOneId,
      materialId: 'exam-fipi-reading-teenagers',
      materialTitle: 'Family and teenagers',
      materialSourceType: 'fipi',
      topicId: 'family',
      section: 'Reading',
      completedAt: '2026-08-14T00:00:00.000Z',
      score: 5,
      maxScore: 7,
      percentage: 71,
      status: 'retry',
    },
  ],
  errors: [
    {
      id: 'error-seed-agree-with',
      studentId: studentOneId,
      topicId: 'family',
      original: 'I am agree with my parents.',
      correction: 'I agree with my parents.',
      type: 'Grammar',
      target: 'agree with somebody',
      createdAt: '2026-08-14T00:00:00.000Z',
      status: 'Revision',
      inRevision: true,
    },
    {
      id: 'error-seed-spend-time',
      studentId: studentOneId,
      topicId: 'family',
      original: 'We spend time to watch films.',
      correction: 'We spend time watching films.',
      type: 'Chunk',
      target: 'spend time doing something',
      createdAt: '2026-08-14T00:00:00.000Z',
      status: 'Revision',
      inRevision: true,
    },
    {
      id: 'error-seed-friendly',
      studentId: studentOneId,
      topicId: 'family',
      original: 'My brother very friendly.',
      correction: 'My brother is very friendly.',
      type: 'Grammar',
      target: 'to be + adjective',
      createdAt: '2026-08-14T00:00:00.000Z',
      status: 'Learning',
      inRevision: false,
    },
  ],
  revision: [
    {
      id: 'revision-seed-common',
      studentId: studentOneId,
      sourceType: 'Chunk',
      sourceId: 'chunk-common',
      topicId: 'family',
      title: 'have a lot in common',
      addedAt: '2026-08-14T00:00:00.000Z',
      lastPractisedAt: null,
      status: 'Due',
    },
    {
      id: 'revision-seed-agree-with',
      studentId: studentOneId,
      sourceType: 'Error',
      sourceId: 'error-seed-agree-with',
      topicId: 'family',
      title: 'agree with somebody',
      addedAt: '2026-08-14T00:00:00.000Z',
      lastPractisedAt: null,
      status: 'Due',
    },
  ],
}

export function getStudentSeedData(studentId) {
  if (studentId === studentOneId) {
    return studentOneSeedData
  }

  return createEmptyStudentData(studentId)
}
