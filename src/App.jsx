import { useState } from 'react'
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
import './styles/app.css'

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  return (
    <AppShell
      isMenuOpen={isMenuOpen}
      navItems={navItems}
      onCloseMenu={() => setIsMenuOpen(false)}
      onToggleMenu={() => setIsMenuOpen((isOpen) => !isOpen)}
      onToggleTheme={toggleTheme}
      theme={theme}
    >
      <Dashboard
        activeChunks={activeChunks}
        featureCards={featureCards}
        progressSummary={progressSummary}
        recentTasks={recentTasks}
        revisionCard={revisionCard}
      />
    </AppShell>
  )
}

export default App
