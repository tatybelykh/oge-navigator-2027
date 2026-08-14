const studentOneId = 'student-001'
const studentTwoId = 'student-002'

const studentOneProgress = [
  { studentId: studentOneId, topicId: 'family', label: 'Vocabulary & Chunks', value: 75 },
  { studentId: studentOneId, topicId: 'family', label: 'Listening', value: 60 },
  { studentId: studentOneId, topicId: 'family', label: 'Reading', value: 80 },
  { studentId: studentOneId, topicId: 'family', label: 'Grammar & Vocabulary', value: 55 },
  { studentId: studentOneId, topicId: 'family', label: 'Writing', value: 50 },
  { studentId: studentOneId, topicId: 'family', label: 'Speaking', value: 65 },
]

const studentTwoProgress = [
  { studentId: studentTwoId, topicId: 'family', label: 'Vocabulary & Chunks', value: 0 },
  { studentId: studentTwoId, topicId: 'family', label: 'Listening', value: 0 },
  { studentId: studentTwoId, topicId: 'family', label: 'Reading', value: 0 },
  { studentId: studentTwoId, topicId: 'family', label: 'Grammar & Vocabulary', value: 0 },
  { studentId: studentTwoId, topicId: 'family', label: 'Writing', value: 0 },
  { studentId: studentTwoId, topicId: 'family', label: 'Speaking', value: 0 },
]

export const familyStudentData = {
  [studentOneId]: {
    studentId: studentOneId,
    topicProgress: {
      studentId: studentOneId,
      topicId: 'family',
      value: 70,
    },
    stats: {
      chunks: 12,
      examPractice: 7,
      extraPractice: 6,
      errors: 3,
      revision: 4,
    },
    skillProgress: studentOneProgress,
    nextSteps: [
      { id: 'next-revision', studentId: studentOneId, title: 'Revision', description: '4 chunks due' },
      { id: 'next-speaking-2', studentId: studentOneId, title: 'Speaking Task 2', description: 'Family questions' },
      { id: 'next-reading', studentId: studentOneId, title: 'Reading', description: '1 task to retry' },
    ],
    activity: [
      { id: 'activity-speaking-3', studentId: studentOneId, title: 'Speaking Task 3', result: '6/7' },
      { id: 'activity-reading', studentId: studentOneId, title: 'Reading', result: '80%' },
      { id: 'activity-chunk', studentId: studentOneId, title: 'Chunk practice', result: 'completed' },
    ],
    chunkProgress: [
      { studentId: studentOneId, chunkId: 'chunk-get-on-well', status: 'Active' },
      { studentId: studentOneId, chunkId: 'chunk-common', status: 'Active' },
      { studentId: studentOneId, chunkId: 'chunk-close', status: 'Learning' },
      { studentId: studentOneId, chunkId: 'chunk-time', status: 'Active' },
      { studentId: studentOneId, chunkId: 'chunk-fall-out', status: 'With help' },
      { studentId: studentOneId, chunkId: 'chunk-argue', status: 'Learning' },
      { studentId: studentOneId, chunkId: 'chunk-support', status: 'Active' },
      { studentId: studentOneId, chunkId: 'chunk-get-along', status: 'Learning' },
      { studentId: studentOneId, chunkId: 'chunk-good-relationship', status: 'New' },
      { studentId: studentOneId, chunkId: 'chunk-advice', status: 'New' },
      { studentId: studentOneId, chunkId: 'chunk-care', status: 'New' },
      { studentId: studentOneId, chunkId: 'chunk-touch', status: 'New' },
    ],
    errors: [
      {
        id: 'error-agree-with',
        studentId: studentOneId,
        topicId: 'family',
        original: 'I am agree with my parents.',
        correction: 'I agree with my parents.',
        type: 'Grammar',
        target: 'agree with somebody',
        date: 'Demo date',
        status: 'Revision',
      },
      {
        id: 'error-spend-time',
        studentId: studentOneId,
        topicId: 'family',
        original: 'We spend time to watch films.',
        correction: 'We spend time watching films.',
        type: 'Grammar / Chunk',
        target: 'spend time doing something',
        date: 'Demo date',
        status: 'Revision',
      },
      {
        id: 'error-friendly',
        studentId: studentOneId,
        topicId: 'family',
        original: 'My brother very friendly.',
        correction: 'My brother is very friendly.',
        type: 'Grammar',
        target: 'to be + adjective',
        date: 'Demo date',
        status: 'Learning',
      },
    ],
    revision: {
      dueToday: 4,
      items: [
        {
          id: 'revision-agree-with',
          studentId: studentOneId,
          title: 'agree with somebody',
          source: 'Error',
          lastPractised: 'Demo date',
          status: 'Revision',
        },
        {
          id: 'revision-common',
          studentId: studentOneId,
          title: 'have a lot in common',
          source: 'Chunk',
          lastPractised: 'Demo date',
          status: 'Active',
        },
        {
          id: 'revision-spend-time',
          studentId: studentOneId,
          title: 'spend time doing something',
          source: 'Error',
          lastPractised: 'Demo date',
          status: 'Revision',
        },
        {
          id: 'revision-fall-out',
          studentId: studentOneId,
          title: 'fall out with somebody',
          source: 'Chunk',
          lastPractised: 'Demo date',
          status: 'With help',
        },
      ],
    },
  },
  [studentTwoId]: {
    studentId: studentTwoId,
    topicProgress: {
      studentId: studentTwoId,
      topicId: 'family',
      value: 0,
    },
    stats: {
      chunks: 0,
      examPractice: 0,
      extraPractice: 0,
      errors: 0,
      revision: 0,
    },
    skillProgress: studentTwoProgress,
    nextSteps: [],
    activity: [],
    chunkProgress: [],
    errors: [],
    revision: {
      dueToday: 0,
      items: [],
    },
  },
}

function createEmptyFamilyStudentData(studentId) {
  return {
    studentId,
    topicProgress: {
      studentId,
      topicId: 'family',
      value: 0,
    },
    stats: {
      chunks: 0,
      examPractice: 0,
      extraPractice: 0,
      errors: 0,
      revision: 0,
    },
    skillProgress: [
      { studentId, topicId: 'family', label: 'Vocabulary & Chunks', value: 0 },
      { studentId, topicId: 'family', label: 'Listening', value: 0 },
      { studentId, topicId: 'family', label: 'Reading', value: 0 },
      { studentId, topicId: 'family', label: 'Grammar & Vocabulary', value: 0 },
      { studentId, topicId: 'family', label: 'Writing', value: 0 },
      { studentId, topicId: 'family', label: 'Speaking', value: 0 },
    ],
    nextSteps: [],
    activity: [],
    chunkProgress: [],
    errors: [],
    revision: {
      dueToday: 0,
      items: [],
    },
  }
}

export function getFamilyStudentData(studentId) {
  return familyStudentData[studentId] ?? createEmptyFamilyStudentData(studentId)
}
