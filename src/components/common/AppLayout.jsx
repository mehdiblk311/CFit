import './AppLayout.css';

const NAV_ITEMS = [
  { id: 'dashboard', icon: 'dashboard',     label: 'Home'     },
  { id: 'workouts',  icon: 'fitness_center', label: 'Workout'  },
  { id: 'nutrition', icon: 'restaurant',     label: 'Nutrition'},
  { id: 'ai',        icon: 'smart_toy',      label: 'Coach'    },
  { id: 'settings',  icon: 'settings',       label: 'Settings' },
];

export default function AppLayout({ activeTab, onTabChange, children }) {
  return (
    <div className="app-layout">
      <div className="app-content">
        {children}
      </div>

      <nav className="app-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`app-nav-item${activeTab === item.id ? ' app-nav-item--active' : ''}`}
            onClick={() => onTabChange(item.id)}
            aria-label={item.label}
          >
            <span className="material-symbols-outlined app-nav-icon"
              style={activeTab === item.id
                ? { fontVariationSettings: "'FILL' 1" }
                : undefined}
            >
              {item.icon}
            </span>
            <span className="app-nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
