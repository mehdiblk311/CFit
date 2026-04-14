import { useNavigate, useLocation } from 'react-router-dom';
import './AppLayout.css';

const NAV_ITEMS = [
  { id: 'dashboard', path: '/dashboard', icon: 'dashboard',      label: 'Home'      },
  { id: 'workouts',  path: '/workouts',  icon: 'fitness_center',  label: 'Workout'   },
  { id: 'nutrition', path: '/nutrition', icon: 'restaurant',      label: 'Nutrition' },
  { id: 'progress',  path: '/progress',  icon: 'trending_up',     label: 'Progress'  },
  { id: 'ai',        path: '/ai',        icon: 'smart_toy',        label: 'Coach'     },
];

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Nutrition routes have their own inner nav — hide the global nav there
  const hideNav = pathname.startsWith('/nutrition');

  return (
    <div className="app-layout">
      <div className={`app-content${hideNav ? ' app-content--no-pad' : ''}`}>
        {children}
      </div>

      {!hideNav && (
        <nav className="app-nav">
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
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
