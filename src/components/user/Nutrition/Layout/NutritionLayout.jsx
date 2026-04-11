import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import './NutritionLayout.css';

const NAV_ITEMS = [
  { id: 'journal',  path: '/nutrition',         icon: 'restaurant',  label: 'Journal'  },
  { id: 'recipes',  path: '/nutrition/recipe',   icon: 'menu_book',   label: 'Recipes'  },
  { id: 'trends',   path: '/nutrition/history',  icon: 'query_stats', label: 'Trends'   },
  { id: 'settings', path: '/settings',           icon: 'settings',    label: 'Settings' },
];

/* These sub-pages have their own sticky CTAs — hide the tab nav to avoid overlap */
const HIDE_NAV_PATHS = [
  '/nutrition/food-search',
  '/nutrition/add-quantity',
  '/nutrition/custom-food',
];

export default function NutritionLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const hideNav = HIDE_NAV_PATHS.some(p => pathname.startsWith(p));

  return (
    <div className="nut-layout">
      <div className={`nut-content${hideNav ? ' nut-content--full' : ''}`}>
        <Outlet />
      </div>

      {!hideNav && (
        <nav className="nut-nav" aria-label="Nutrition navigation">
          {/* ← Back to Dashboard */}
          <button
            id="nut-nav-dashboard"
            className="nut-nav-item nut-nav-item--home"
            onClick={() => navigate('/dashboard')}
            aria-label="Back to Dashboard"
          >
            <span className="material-symbols-outlined nut-nav-icon">home</span>
            <span className="nut-nav-label">Home</span>
          </button>

          {NAV_ITEMS.map(item => {
            const isActive =
              item.id === 'journal'
                ? pathname === '/nutrition'
                : pathname.startsWith(item.path);
            return (
              <button
                key={item.id}
                id={`nut-nav-${item.id}`}
                className={`nut-nav-item${isActive ? ' nut-nav-item--active' : ''}`}
                onClick={() => navigate(item.path)}
                aria-label={item.label}
              >
                <span
                  className="material-symbols-outlined nut-nav-icon"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <span className="nut-nav-label">{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
