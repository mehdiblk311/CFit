import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Admin.css';

const NAV_ITEMS = [
  { id: 'dashboard', path: '/admin',          icon: 'dashboard',      label: 'Dashboard'  },
  { id: 'users',     path: '/admin/users',     icon: 'group',           label: 'Users'      },
  { id: 'exercises', path: '/admin/exercises', icon: 'fitness_center',  label: 'Exercises'  },
  { id: 'programs',  path: '/admin/programs',  icon: 'event_note',      label: 'Programs'   },
  { id: 'nutrition', path: '/admin/nutrition', icon: 'restaurant',      label: 'Nutrition'  },
];

function isActive(item, pathname) {
  if (item.path === '/admin') return pathname === '/admin' || pathname === '/admin/';
  return pathname.startsWith(item.path);
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [expanded, setExpanded] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const activeItem = NAV_ITEMS.find(n => isActive(n, location.pathname));

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
          {NAV_ITEMS.map(item => {
            const active = isActive(item, location.pathname);
            return (
              <button
                key={item.id}
                className={`adm-nav-btn${active ? ' adm-nav-btn--active' : ''}`}
                onClick={() => navigate(item.path)}
                title={item.label}
              >
                <span
                  className="material-symbols-outlined adm-nav-btn-icon"
                  style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {item.icon}
                </span>
                <span className="adm-nav-btn-label">{item.label}</span>
              </button>
            );
          })}
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
              {activeItem?.label ?? 'Admin'}
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
            <button className="adm-topbar-logout" onClick={handleLogout} title="Back to app">
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="adm-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
