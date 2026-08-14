import { useState } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { Dashboard } from './components/Dashboard'
import {
  featureCards,
  navItems,
} from './data/dashboardData'
import { useTheme } from './hooks/useTheme'
import { useLocalStudentData } from './hooks/useLocalStudentData'
import { useStudentProfiles } from './hooks/useStudentProfiles'
import { FamilyTopicPage } from './pages/FamilyTopicPage'
import { SpeakingPage } from './pages/SpeakingPage'
import { TopicsPage } from './pages/TopicsPage'
import './styles/app.css'

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const {
    activeStudent,
    activeStudentId,
    addStudent,
    deleteStudent,
    selectStudent,
    students,
  } = useStudentProfiles()
  const progressActions = useLocalStudentData(activeStudentId)

  return (
    <HashRouter>
      <AppShell
        activeStudent={activeStudent}
        isMenuOpen={isMenuOpen}
        navItems={navItems}
        onAddStudent={addStudent}
        onCloseMenu={() => setIsMenuOpen(false)}
        onDeleteStudent={deleteStudent}
        onResetProgress={progressActions.resetProgress}
        onSelectStudent={selectStudent}
        onToggleMenu={() => setIsMenuOpen((isOpen) => !isOpen)}
        onToggleTheme={toggleTheme}
        students={students}
        theme={theme}
      >
        <Routes>
          <Route
            element={
              <Dashboard
                featureCards={featureCards}
                studentData={progressActions.studentData}
              />
            }
            path="/"
          />
          <Route
            element={<TopicsPage studentData={progressActions.studentData} />}
            path="/topics"
          />
          <Route
            element={
              <FamilyTopicPage
                activeStudentId={activeStudentId}
                progressActions={progressActions}
              />
            }
            path="/topics/family-relationships"
          />
          <Route
            element={<SpeakingPage progressActions={progressActions} />}
            path="/speaking"
          />
          <Route element={<Navigate replace to="/" />} path="*" />
        </Routes>
      </AppShell>
    </HashRouter>
  )
}

export default App
