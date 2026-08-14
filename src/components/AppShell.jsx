import { Sidebar } from './Sidebar'

export function AppShell({
  children,
  isMenuOpen,
  navItems,
  onCloseMenu,
  onToggleMenu,
  onToggleTheme,
  theme,
}) {
  const themeLabel =
    theme === 'dark' ? 'Переключить светлую тему' : 'Переключить темную тему'

  return (
    <div className="app-shell">
      <Sidebar isMenuOpen={isMenuOpen} navItems={navItems} onClose={onCloseMenu} />

      <div className="content-shell">
        <header className="topbar">
          <button
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
            className="icon-button menu-button"
            onClick={onToggleMenu}
            type="button"
          >
            <span aria-hidden="true">{isMenuOpen ? 'x' : '='}</span>
          </button>

          <div className="topbar-title">
            <span>OGE English</span>
            <strong>Dashboard</strong>
          </div>

          <button
            aria-label={themeLabel}
            className="theme-toggle"
            onClick={onToggleTheme}
            type="button"
          >
            <span className={theme === 'light' ? 'is-selected' : ''}>Light</span>
            <span className={theme === 'dark' ? 'is-selected' : ''}>Dark</span>
          </button>
        </header>

        {isMenuOpen && (
          <button
            aria-label="Закрыть меню"
            className="menu-overlay"
            onClick={onCloseMenu}
            type="button"
          />
        )}

        <main className="main-content">{children}</main>
      </div>
    </div>
  )
}
