import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LANGUAGE_OPTIONS, useI18n } from '../../i18n/useI18n';
import './Admin.css';

const NAV_ITEMS = [
  { id: 'dashboard', path: '/admin', icon: 'dashboard', labelKey: 'admin.nav.dashboard' },
  { id: 'users', path: '/admin/users', icon: 'group', labelKey: 'admin.nav.users' },
  { id: 'exercises', path: '/admin/exercises', icon: 'fitness_center', labelKey: 'admin.nav.exercises' },
  { id: 'programs', path: '/admin/programs', icon: 'event_note', labelKey: 'admin.nav.programs' },
  { id: 'nutrition', path: '/admin/nutrition', icon: 'restaurant', labelKey: 'admin.nav.nutrition' },
];

function isActive(item, pathname) {
  if (item.path === '/admin') return pathname === '/admin' || pathname === '/admin/';
  return pathname.startsWith(item.path);
}

function getInitials(value) {
  const safeValue = String(value || '').trim();
  if (!safeValue) return 'A';
  const parts = safeValue.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() || '').join('') || safeValue.slice(0, 2).toUpperCase();
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const { t, language, setLanguage } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const navItems = NAV_ITEMS.map((item) => ({ ...item, label: t(item.labelKey) }));
  const activeItem = navItems.find((item) => isActive(item, location.pathname));
  const adminIdentity = user?.name || user?.email || t('common.labels.rootAdmin');

  function handleLogout() {
    logout();
    navigate('/login');
  }

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
            <span className="adm-sidenav-subtitle">{t('common.labels.adminTerminal')}</span>
          </div>
        </div>

        <nav className="adm-sidenav-nav">
          {navItems.map(item => {
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
          <div className="adm-sidenav-avatar">{getInitials(adminIdentity)}</div>
          <div className="adm-sidenav-user-info">
            <span className="adm-sidenav-user-role">{t('common.labels.rootAdmin')}</span>
            <span className="adm-sidenav-user-name">{user?.email || adminIdentity}</span>
          </div>
        </div>
      </aside>

      {/* ── Main Area ─────────────────────────────────────────── */}
      <div className="adm-main">
        {/* Top Bar */}
        <header className="adm-topbar">
          <div className="adm-topbar-left">
            <span className="adm-topbar-title">
              {activeItem?.label ?? t('admin.shell.title')}
            </span>
            <div className="adm-topbar-search-wrap">
              <span className="material-symbols-outlined adm-topbar-search-icon">search</span>
              <input
                className="adm-topbar-search"
                type="text"
                placeholder={t('common.labels.globalSearch')}
                aria-label={t('common.labels.search')}
              />
            </div>
          </div>
          <div className="adm-topbar-right">
            <div className="adm-lang-switch" aria-label={t('common.labels.language')}>
              {LANGUAGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`adm-lang-btn${language === option.value ? ' adm-lang-btn--active' : ''}`}
                  onClick={() => setLanguage(option.value)}
                  title={t(option.titleKey)}
                  aria-label={t(option.titleKey)}
                >
                  {option.shortLabel}
                </button>
              ))}
            </div>
            <div className="adm-topbar-status">
              <span className="adm-topbar-status-dot" />
              <span className="adm-topbar-status-label">{t('common.labels.systemOnline')}</span>
            </div>
            <button className="adm-topbar-notif" type="button" aria-label={t('common.labels.notifications')}>
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button
              className="adm-topbar-logout"
              type="button"
              onClick={handleLogout}
              title={t('common.labels.backToApp')}
              aria-label={t('common.labels.backToApp')}
            >
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
