export const defaultStudents = [
  {
    id: 'student-001',
    displayName: 'Ученица 1',
    createdAt: '2026-08-14T00:00:00.000Z',
    examYear: 2027,
    isActive: true,
  },
  {
    id: 'student-002',
    displayName: 'Ученица 2',
    createdAt: '2026-08-14T00:00:00.000Z',
    examYear: 2027,
    isActive: false,
  },
]

export const defaultActiveStudentId = 'student-001'

export function createStudentProfile({ displayName, examYear }) {
  return {
    id: `student-${crypto.randomUUID()}`,
    displayName,
    createdAt: new Date().toISOString(),
    examYear: Number(examYear),
    isActive: true,
  }
}
