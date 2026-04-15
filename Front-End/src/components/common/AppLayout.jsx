import { useNavigate, useLocation } from 'react-router-dom';
import './AppLayout.css';

const NAV_ITEMS = [
  { id: 'dashboard', path: '/dashboard', icon: 'dashboard',      label: 'Home'      },
  { id: 'workouts',  path: '/workouts',  icon: 'fitness_center',  label: 'Workout'   },
  { id: 'nutrition', path: '/nutrition', icon: 'restaurant',      label: 'Nutrition' },
  { id: 'progress',  path: '/progress',  icon: 'trending_up',     label: 'Progress', match: ['/progress', '/leaderboard'] },
  { id: 'ai',        path: '/ai',        icon: 'smart_toy',        label: 'Coach'     },
  { id: 'settings',  path: '/settings',  icon: 'settings',         label: 'Settings'  },
];

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const hideNav = false;

  return (
    <div className="app-layout">
      <div className={`app-content${hideNav ? ' app-content--no-pad' : ''}`}>
        {children}
      </div>

      {!hideNav && (
        <nav className="app-nav">
          {NAV_ITEMS.map(item => {
            const paths = item.match || [item.path];
            const isActive = paths.some((path) => pathname === path || pathname.startsWith(path + '/'));
            return (
              <button
                key={item.id}
                className={`app-nav-item${isActive ? ' app-nav-item--active' : ''}`}
                onClick={() => navigate(item.path)}
                aria-label={item.label}
              >
                <span
                  className="material-symbols-outlined app-nav-icon"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <span className="app-nav-label">{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
