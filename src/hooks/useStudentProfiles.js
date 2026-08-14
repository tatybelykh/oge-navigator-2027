import { useEffect, useMemo, useState } from 'react'
import {
  createStudentProfile,
  defaultActiveStudentId,
  defaultStudents,
} from '../data/studentProfiles'
import { localStorageService } from '../services/localStorageService'

function markActive(students, activeStudentId) {
  return students.map((student) => ({
    ...student,
    isActive: student.id === activeStudentId,
  }))
}

export function useStudentProfiles() {
  const [students, setStudents] = useState(() =>
    localStorageService.getStudents(defaultStudents),
  )
  const [activeStudentId, setActiveStudentId] = useState(() =>
    localStorageService.getActiveStudentId(defaultActiveStudentId),
  )

  const normalizedStudents = useMemo(() => {
    const hasActiveStudent = students.some(
      (student) => student.id === activeStudentId,
    )
    const nextActiveId = hasActiveStudent ? activeStudentId : students[0]?.id

    return {
      activeStudentId: nextActiveId,
      students: markActive(students, nextActiveId),
    }
  }, [activeStudentId, students])

  useEffect(() => {
    localStorageService.saveStudents(normalizedStudents.students)

    if (normalizedStudents.activeStudentId) {
      localStorageService.saveActiveStudentId(normalizedStudents.activeStudentId)
    }
  }, [normalizedStudents])

  const activeStudent = normalizedStudents.students.find(
    (student) => student.id === normalizedStudents.activeStudentId,
  )

  const selectStudent = (studentId) => {
    setActiveStudentId(studentId)
  }

  const addStudent = ({ displayName, examYear }) => {
    const student = createStudentProfile({ displayName, examYear })
    setStudents((currentStudents) => [...currentStudents, student])
    setActiveStudentId(student.id)
  }

  const deleteStudent = (studentId) => {
    setStudents((currentStudents) => {
      if (currentStudents.length <= 1) {
        return currentStudents
      }

      const nextStudents = currentStudents.filter(
        (student) => student.id !== studentId,
      )
      localStorageService.removeStudentData(studentId)

      if (studentId === activeStudentId) {
        setActiveStudentId(nextStudents[0]?.id)
      }

      return nextStudents
    })
  }

  return {
    activeStudent,
    activeStudentId: normalizedStudents.activeStudentId,
    addStudent,
    deleteStudent,
    selectStudent,
    students: normalizedStudents.students,
  }
}
