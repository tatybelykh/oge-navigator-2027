import { useState } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { Dashboard } from './components/Dashboard'
import {
  activeChunks,
  featureCards,
  navItems,
  progressSummary,
  recentTasks,
  revisionCard,
} from './data/dashboardData'
import { useTheme } from './hooks/useTheme'
import { useStudentProfiles } from './hooks/useStudentProfiles'
import { FamilyTopicPage } from './pages/FamilyTopicPage'
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

  return (
    <HashRouter>
      <AppShell
        activeStudent={activeStudent}
        isMenuOpen={isMenuOpen}
        navItems={navItems}
        onAddStudent={addStudent}
        onCloseMenu={() => setIsMenuOpen(false)}
        onDeleteStudent={deleteStudent}
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
                activeChunks={activeChunks}
                featureCards={featureCards}
                progressSummary={progressSummary}
                recentTasks={recentTasks}
                revisionCard={revisionCard}
              />
            }
            path="/"
          />
          <Route
            element={<TopicsPage activeStudentId={activeStudentId} />}
            path="/topics"
          />
          <Route
            element={<FamilyTopicPage activeStudentId={activeStudentId} />}
            path="/topics/family-relationships"
          />
          <Route element={<Navigate replace to="/" />} path="*" />
        </Routes>
      </AppShell>
    </HashRouter>
  )
}

export default App
