const STORAGE_VERSION = 1
const legacyThemeKey = 'oge-navigator-theme'

export const storageKeys = {
  settings: 'ogeNavigator.settings',
  students: 'ogeNavigator.students',
  activeStudentId: 'ogeNavigator.activeStudentId',
  studentData: 'ogeNavigator.studentData',
}

export function createEmptyStudentData(studentId) {
  return {
    version: STORAGE_VERSION,
    studentId,
    topicProgress: {},
    attempts: [],
    chunkProgress: {},
    errors: [],
    revision: [],
    teacherNotes: [],
    completedTasks: [],
  }
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

function readStudentDataStore() {
  const store = readJson(storageKeys.studentData, null)

  if (!store || store.version !== STORAGE_VERSION || !store.byStudentId) {
    return {
      version: STORAGE_VERSION,
      byStudentId: {},
    }
  }

  return store
}

function writeStudentDataStore(store) {
  writeJson(storageKeys.studentData, {
    version: STORAGE_VERSION,
    byStudentId: store.byStudentId,
  })
}

function normalizeStudentData(studentId, data) {
  return {
    ...createEmptyStudentData(studentId),
    ...data,
    version: STORAGE_VERSION,
    studentId,
    attempts: Array.isArray(data?.attempts) ? data.attempts : [],
    errors: Array.isArray(data?.errors) ? data.errors : [],
    revision: Array.isArray(data?.revision) ? data.revision : [],
    chunkProgress: data?.chunkProgress ?? {},
    topicProgress: data?.topicProgress ?? {},
  }
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

  getSpeakingVoiceURI() {
    return this.getSettings().speakingVoiceURI
  },

  saveSpeakingVoiceURI(speakingVoiceURI) {
    this.saveSettings({
      ...this.getSettings(),
      speakingVoiceURI,
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

  getStudentData(studentId, seedData) {
    const store = readStudentDataStore()
    const existingData = store.byStudentId[studentId]

    if (existingData) {
      return normalizeStudentData(studentId, existingData)
    }

    const initialData = normalizeStudentData(
      studentId,
      seedData ?? createEmptyStudentData(studentId),
    )
    store.byStudentId[studentId] = initialData
    writeStudentDataStore(store)

    return initialData
  },

  saveStudentData(studentId, data) {
    const store = readStudentDataStore()
    store.byStudentId[studentId] = normalizeStudentData(studentId, data)
    writeStudentDataStore(store)
  },

  resetStudentData(studentId) {
    this.saveStudentData(studentId, createEmptyStudentData(studentId))
  },

  removeStudentData(studentId) {
    const store = readStudentDataStore()
    delete store.byStudentId[studentId]
    writeStudentDataStore(store)
  },

  exportStudentData(studentId) {
    return {
      version: STORAGE_VERSION,
      studentId,
      data: this.getStudentData(studentId),
    }
  },
}
