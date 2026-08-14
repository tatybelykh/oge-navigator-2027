export const topicStudentProgress = [
  {
    studentId: 'student-001',
    topicId: 'family',
    progress: 70,
    status: 'В работе',
    statusType: 'in-progress',
  },
  {
    studentId: 'student-001',
    topicId: 'school',
    progress: 35,
    status: 'В работе',
    statusType: 'in-progress',
  },
  {
    studentId: 'student-001',
    topicId: 'travel',
    progress: 20,
    status: 'Начато',
    statusType: 'started',
  },
  {
    studentId: 'student-002',
    topicId: 'family',
    progress: 0,
    status: 'Не начато',
    statusType: 'not-started',
  },
]

export function getTopicStudentProgress(studentId, topicId) {
  return (
    topicStudentProgress.find(
      (item) => item.studentId === studentId && item.topicId === topicId,
    ) ?? {
      studentId,
      topicId,
      progress: 0,
      status: 'Не начато',
      statusType: 'not-started',
    }
  )
}
