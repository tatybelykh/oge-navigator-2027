const STORAGE_VERSION = 1
const legacyThemeKey = 'oge-navigator-theme'

export const storageKeys = {
  settings: 'ogeNavigator.settings',
  students: 'ogeNavigator.students',
  activeStudentId: 'ogeNavigator.activeStudentId',
  studentData: 'ogeNavigator.studentData',
}

function readJson(key, fallback) {
  try {
    const rawValue = localStorage.getItem(key)

    if (!rawValue) {
      return fallback
    }

    return JSON.parse(rawValue)
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export const localStorageService = {
  version: STORAGE_VERSION,

  getSettings() {
    return readJson(storageKeys.settings, { version: STORAGE_VERSION })
  },

  saveSettings(settings) {
    writeJson(storageKeys.settings, {
      version: STORAGE_VERSION,
      ...settings,
    })
  },

  getTheme() {
    return this.getSettings().theme ?? localStorage.getItem(legacyThemeKey)
  },

  saveTheme(theme) {
    this.saveSettings({
      ...this.getSettings(),
      theme,
    })
  },

  getStudents(defaultStudents) {
    const stored = readJson(storageKeys.students, null)

    if (!stored || stored.version !== STORAGE_VERSION) {
      return defaultStudents
    }

    return Array.isArray(stored.items) ? stored.items : defaultStudents
  },

  saveStudents(students) {
    writeJson(storageKeys.students, {
      version: STORAGE_VERSION,
      items: students,
    })
  },

  getActiveStudentId(defaultStudentId) {
    return localStorage.getItem(storageKeys.activeStudentId) ?? defaultStudentId
  },

  saveActiveStudentId(studentId) {
    localStorage.setItem(storageKeys.activeStudentId, studentId)
  },

  removeStudentData(studentId) {
    const studentData = readJson(storageKeys.studentData, {
      version: STORAGE_VERSION,
      byStudentId: {},
    })

    if (!studentData.byStudentId) {
      return
    }

    const nextData = { ...studentData.byStudentId }
    delete nextData[studentId]

    writeJson(storageKeys.studentData, {
      version: STORAGE_VERSION,
      byStudentId: nextData,
    })
  },

  exportStudentData(studentId) {
    // TODO: implement single-student export when real local progress exists.
    return {
      version: STORAGE_VERSION,
      studentId,
      data: null,
    }
  },
}
