import { useState } from 'react'

const deleteMessage =
  'Удалить этот локальный профиль и связанные с ним данные на этом устройстве?'

export function ProfileSwitcher({
  activeStudent,
  onAddStudent,
  onDeleteStudent,
  onResetProgress,
  onSelectStudent,
  students,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [examYear, setExamYear] = useState('2027')

  if (!activeStudent) {
    return null
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmedName = displayName.trim()

    if (!trimmedName) {
      return
    }

    onAddStudent({
      displayName: trimmedName,
      examYear,
    })
    setDisplayName('')
    setExamYear('2027')
    setIsAdding(false)
    setIsOpen(false)
  }

  const handleDelete = (studentId) => {
    if (window.confirm(deleteMessage)) {
      onDeleteStudent(studentId)
    }
  }

  const handleResetProgress = () => {
    if (
      window.confirm(
        'Удалить весь локальный прогресс, ошибки, revision и историю попыток этого профиля? Это действие нельзя отменить.',
      )
    ) {
      onResetProgress()
      setIsOpen(false)
    }
  }

  return (
    <div className="profile-switcher">
      <button
        aria-expanded={isOpen}
        aria-label="Переключить профиль ученицы"
        className="profile-trigger"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span>
          <strong>{activeStudent.displayName}</strong>
          <small>ОГЭ {activeStudent.examYear}</small>
        </span>
        <b aria-hidden="true">v</b>
      </button>

      {isOpen && (
        <div className="profile-menu">
          <div className="profile-list">
            {students.map((student) => (
              <div className="profile-row" key={student.id}>
                <button
                  className={`profile-option ${
                    student.id === activeStudent.id ? 'is-active' : ''
                  }`}
                  onClick={() => {
                    onSelectStudent(student.id)
                    setIsOpen(false)
                  }}
                  type="button"
                >
                  <span>{student.displayName}</span>
                  <small>ОГЭ {student.examYear}</small>
                </button>
                <button
                  aria-label={`Удалить профиль ${student.displayName}`}
                  className="profile-delete"
                  disabled={students.length <= 1}
                  onClick={() => handleDelete(student.id)}
                  type="button"
                >
                  x
                </button>
              </div>
            ))}
          </div>

          {isAdding ? (
            <form className="profile-form" onSubmit={handleSubmit}>
              <label>
                Имя профиля
                <input
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Ученица 3"
                  type="text"
                  value={displayName}
                />
              </label>
              <label>
                Год экзамена
                <input
                  max="2100"
                  min="2027"
                  onChange={(event) => setExamYear(event.target.value)}
                  type="number"
                  value={examYear}
                />
              </label>
              <p>
                Профиль и учебные данные хранятся только на этом устройстве.
                Аккаунт не создается, данные не синхронизируются с сервером.
              </p>
              <div className="profile-form-actions">
                <button className="primary-button" type="submit">
                  Добавить
                </button>
                <button
                  className="text-button"
                  onClick={() => setIsAdding(false)}
                  type="button"
                >
                  Отмена
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-menu-actions">
              <button
                className="profile-add"
                onClick={() => setIsAdding(true)}
                type="button"
              >
                + Добавить профиль
              </button>
              <button
                className="profile-add danger-button"
                onClick={handleResetProgress}
                type="button"
              >
                Сбросить учебный прогресс
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
