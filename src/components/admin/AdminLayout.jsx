import { useState } from 'react';
import './Admin.css';

const NAV_ITEMS = [
  { id: 'dashboard', icon: 'dashboard',      label: 'Dashboard'  },
  { id: 'users',     icon: 'group',           label: 'Users'      },
  { id: 'exercises', icon: 'fitness_center',  label: 'Exercises'  },
  { id: 'programs',  icon: 'event_note',      label: 'Programs'   },
  { id: 'nutrition', icon: 'restaurant',      label: 'Nutrition'  },
];

export default function AdminLayout({ activeTab, onTabChange, onLogout, children }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="adm-shell">
      {/* ── Side Nav ─────────────────────────────────────────── */}
      <aside
        className={`adm-sidenav${expanded ? ' adm-sidenav--open' : ''}`}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        <div className="adm-sidenav-logo">
          <div className="adm-sidenav-logo-icon">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>fitness_center</span>
          </div>
          <div className="adm-sidenav-logo-text">
            <span className="adm-sidenav-wordmark">UM6P_FIT</span>
            <span className="adm-sidenav-subtitle">Admin Terminal</span>
          </div>
        </div>

        <nav className="adm-sidenav-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`adm-nav-btn${activeTab === item.id ? ' adm-nav-btn--active' : ''}`}
              onClick={() => onTabChange(item.id)}
              title={item.label}
            >
              <span className="material-symbols-outlined adm-nav-btn-icon"
                style={activeTab === item.id ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {item.icon}
              </span>
              <span className="adm-nav-btn-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="adm-sidenav-footer">
          <div className="adm-sidenav-avatar">A</div>
          <div className="adm-sidenav-user-info">
            <span className="adm-sidenav-user-role">Root Admin</span>
            <span className="adm-sidenav-user-name">admin@um6p.ma</span>
          </div>
        </div>
      </aside>

      {/* ── Main Area ─────────────────────────────────────────── */}
      <div className="adm-main">
        {/* Top Bar */}
        <header className="adm-topbar">
          <div className="adm-topbar-left">
            <span className="adm-topbar-title">
              {NAV_ITEMS.find(n => n.id === activeTab)?.label ?? 'Admin'}
            </span>
            <div className="adm-topbar-search-wrap">
              <span className="material-symbols-outlined adm-topbar-search-icon">search</span>
              <input
                className="adm-topbar-search"
                type="text"
                placeholder="GLOBAL SEARCH..."
                aria-label="Search"
              />
            </div>
          </div>
          <div className="adm-topbar-right">
            <div className="adm-topbar-status">
              <span className="adm-topbar-status-dot" />
              <span className="adm-topbar-status-label">SYSTEM ONLINE</span>
            </div>
            <button className="adm-topbar-notif">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="adm-topbar-logout" onClick={onLogout} title="Back to app">
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="adm-content">
          {children}
        </div>
      </div>
    </div>
  );
}
