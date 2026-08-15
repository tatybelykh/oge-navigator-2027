import { useEffect, useState } from 'react'
import { localStorageService } from '../services/localStorageService'

const modes = new Set(['student', 'teacher'])

function getInitialInterfaceMode() {
  const savedMode = localStorageService.getInterfaceMode()

  return modes.has(savedMode) ? savedMode : 'student'
}

export function useInterfaceMode() {
  const [interfaceMode, setInterfaceMode] = useState(getInitialInterfaceMode)

  useEffect(() => {
    // Teacher Mode is local UI separation only.
    // It is not authentication and must not be treated as secure access control.
    localStorageService.saveInterfaceMode(interfaceMode)
  }, [interfaceMode])

  const toggleInterfaceMode = () => {
    setInterfaceMode((currentMode) => (currentMode === 'teacher' ? 'student' : 'teacher'))
  }

  return { interfaceMode, toggleInterfaceMode }
}
