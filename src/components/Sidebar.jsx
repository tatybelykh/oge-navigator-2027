import { NavLink } from 'react-router-dom'

export function Sidebar({ isMenuOpen, navItems, onClose }) {
  return (
    <aside className={`sidebar ${isMenuOpen ? 'is-open' : ''}`}>
      <div className="brand" aria-label="OGE Navigator 2027">
        <span>OGE</span>
        <span>NAVIGATOR</span>
        <span>2027</span>
      </div>

      <nav className="navigation" aria-label="Основная навигация">
        {navItems.map((item) => {
          if (item.section) {
            return (
              <div className="nav-section" key={item.label}>
                {item.label}
              </div>
            )
          }

          if (item.path) {
            return (
              <NavLink
                className={({ isActive }) =>
                  [
                    'nav-item',
                    isActive ? 'is-active' : '',
                    item.child ? 'is-child' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')
                }
                end={item.path === '/'}
                key={item.label}
                onClick={onClose}
                to={item.path}
              >
                {item.label}
              </NavLink>
            )
          }

          return (
            <button
              className={['nav-item', item.child ? 'is-child' : '']
                .filter(Boolean)
                .join(' ')}
              disabled
              key={item.label}
              type="button"
            >
              {item.label}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
