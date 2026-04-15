import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import './NutritionLayout.css';

const CTX_NAV = [
  { id: 'close',   icon: 'close',        label: 'Close'   },
  { id: 'journal', path: '/nutrition',         icon: 'restaurant',  label: 'Journal' },
  { id: 'recipes', path: '/nutrition/recipe',  icon: 'menu_book',   label: 'Recipes' },
  { id: 'trends',  path: '/nutrition/history', icon: 'query_stats', label: 'Trends'  },
];

/* Sub-pages with own sticky CTAs — hide contextual nav to avoid overlap */
const HIDE_CTX_PATHS = [
  '/nutrition/food-search',
  '/nutrition/add-quantity',
  '/nutrition/custom-food',
];

export default function NutritionLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [navVisible, setNavVisible] = useState(false);

  const hideCtx = HIDE_CTX_PATHS.some(p => pathname.startsWith(p));

  useEffect(() => {
    const t = setTimeout(() => setNavVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="nut-layout">
      <div className="nut-content">
        <Outlet />
      </div>

      {/* Contextual nav — slides on top of AppLayout nav, like workouts */}
      {!hideCtx && (
        <nav className={`nut-ctx-nav${navVisible ? ' nut-ctx-nav--visible' : ''}`}>
          {CTX_NAV.map(item => {
            const isClose = item.id === 'close';
            const isActive = !isClose && (
              item.id === 'journal'
                ? pathname === '/nutrition' || pathname === '/nutrition/'
                : pathname.startsWith(item.path)
            );
            return (
              <button
                key={item.id}
                className={`nut-ctx-btn${isActive ? ' nut-ctx-btn--active' : ''}${isClose ? ' nut-ctx-btn--close' : ''}`}
                onClick={() => isClose ? navigate('/dashboard') : navigate(item.path)}
                aria-label={item.label}
              >
                <span
                  className="material-symbols-outlined nut-ctx-icon"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <span className="nut-ctx-label">{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
