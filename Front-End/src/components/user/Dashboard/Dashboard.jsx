import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import {
  useDashboardSummary,
  useDashboardStreaks,
  useDashboardRecommendations,
  useDashboardWeeklySummary,
  useUnreadCount,
} from '../../../hooks/queries/useDashboard';
import './Dashboard.css';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function MacroRing({ value, total, color, label }) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const safeTotal = total > 0 ? total : 1;
  const offset = circ - Math.min(value / safeTotal, 1) * circ;
  return (
    <div className="dash-ring-wrap">
      <svg className="dash-ring-svg" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="transparent"
          stroke="#e2e3e0" strokeWidth="8" />
        <circle cx="40" cy="40" r={r} fill="transparent"
          stroke={color} strokeWidth="8"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>
      <div className="dash-ring-center">
        <span className="dash-ring-val">{Math.round(value)}g</span>
      </div>
      <span className="dash-ring-label">{label}</span>
    </div>
  );
}

function SkeletonBox({ width = '100%', height = 20, radius = 8 }) {
  return (
    <div className="dash-skeleton" style={{ width, height, borderRadius: radius }} />
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: streaksData, isLoading: streaksLoading } = useDashboardStreaks();
  const { data: recommendations, isLoading: recsLoading } = useDashboardRecommendations();
  const { data: weekly, isLoading: weeklyLoading } = useDashboardWeeklySummary();
  const { data: unreadData } = useUnreadCount();

  const name = user?.name ?? 'Athlete';
  const firstName = name.charAt(0).toUpperCase() + name.slice(1);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const todayDayIndex = new Date().getDay(); // 0=Sun

  const unreadCount = unreadData?.count ?? unreadData?.unread_count ?? 0;

  // Summary fields
  const calories = Math.round(summary?.total_calories ?? 0);
  const targetCal = summary?.target_calories ?? 0;
  const protein = Math.round(summary?.total_protein ?? 0);
  const targetProtein = summary?.target_protein ?? 0;
  const carbs = Math.round(summary?.total_carbs ?? 0);
  const targetCarbs = summary?.target_carbs ?? 0;
  const fat = Math.round(summary?.total_fat ?? 0);
  const targetFat = summary?.target_fat ?? 0;
  const workouts = summary?.workouts ?? [];
  const todayWorkout = workouts[0];

  // Streaks
  const streaks = streaksData?.streaks;
  const workoutStreak = streaks?.workout_streak ?? 0;
  const mealStreak = streaks?.meal_streak ?? 0;

  // Weekly
  const weeklyWorkoutCount = weekly?.workout_count ?? 0;
  const weeklyCalories = Math.round(weekly?.total_calories ?? 0);
  const weeklyTargetCal = weekly?.target_calories ?? 0;

  // New user = no meals + no workouts + no targets
  const isNewUser = !summaryLoading && calories === 0 && workouts.length === 0 && targetCal === 0;

  // Active rules from recommendations
  const activeRules = recommendations?.rules?.filter(r => r.applies) ?? [];

  return (
    <div className="dash-root">
      {/* ── Top Bar ── */}
      <header className="dash-header">
        <div className="dash-header-left">
          <h1 className="dash-greeting">Hey, {firstName}</h1>
          <p className="dash-tagline">The Kinetic Craft is a journey.</p>
        </div>
        <div className="dash-header-right">
          <button className="dash-notif-btn" aria-label="Notifications" onClick={() => navigate('/notifications')}>
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && (
              <span className="dash-notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>
          <div className="dash-avatar">
            <span>{firstName.charAt(0).toUpperCase()}</span>
          </div>
        </div>
      </header>

      <main className="dash-main">

        {/* ── Empty State ── */}
        {isNewUser && (
          <section className="dash-card dash-card--empty">
            <span className="material-symbols-outlined dash-empty-icon" style={{ fontVariationSettings: "'FILL' 1" }}>
              waving_hand
            </span>
            <h2 className="dash-empty-title">Welcome to CFit</h2>
            <p className="dash-empty-sub">Start by logging your first workout or meal to see your progress here.</p>
            <div className="dash-empty-actions">
              <button className="dash-action-btn dash-action-btn--primary" onClick={() => navigate('/workouts')}>
                <span className="material-symbols-outlined">fitness_center</span>
                <span>Start Workout</span>
              </button>
              <button className="dash-action-btn dash-action-btn--secondary" onClick={() => navigate('/nutrition')}>
                <span className="material-symbols-outlined">nutrition</span>
                <span>Log Meal</span>
              </button>
            </div>
          </section>
        )}

        {/* ── Card 1: Today's Summary ── */}
        {!isNewUser && (
          <section className="dash-card dash-card--summary">
            <div className="dash-card-bg-icon">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                calendar_today
              </span>
            </div>
            <div className="dash-summary-top">
              <div>
                <span className="dash-section-label">Today's Summary</span>
                <h2 className="dash-date">{today}</h2>
              </div>
            </div>
            <div className="dash-summary-grid">
              <div className="dash-stat-box">
                <span className="dash-stat-label">Calories</span>
                <div className="dash-stat-row">
                  {summaryLoading ? (
                    <SkeletonBox width={80} height={24} />
                  ) : (
                    <>
                      <span className="dash-stat-val">{calories.toLocaleString()}</span>
                      {targetCal > 0 && <span className="dash-stat-sub">/ {targetCal.toLocaleString()} kcal</span>}
                    </>
                  )}
                </div>
              </div>
              <div className={`dash-stat-box${todayWorkout ? ' dash-stat-box--green' : ''}`}>
                <span className="dash-stat-label" style={todayWorkout ? { color: '#2c5a0d' } : {}}>Workout</span>
                <div className="dash-stat-row">
                  {summaryLoading ? (
                    <SkeletonBox width={80} height={20} />
                  ) : todayWorkout ? (
                    <>
                      <span className="dash-stat-val" style={{ fontSize: 14, color: '#2c5a0d' }}>
                        {todayWorkout.type ?? 'Done'}
                      </span>
                      <span className="material-symbols-outlined" style={{ color: '#38671a', fontSize: 18, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    </>
                  ) : (
                    <span className="dash-stat-sub" style={{ fontSize: 12 }}>Not logged yet</span>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Card 2: Macro Rings ── */}
        {!isNewUser && (
          <section className="dash-card dash-card--macros">
            <span className="dash-section-label" style={{ color: '#5d3fd3' }}>Macro Progress</span>
            {summaryLoading ? (
              <div className="dash-rings">
                <SkeletonBox width={72} height={72} radius={999} />
                <SkeletonBox width={72} height={72} radius={999} />
                <SkeletonBox width={72} height={72} radius={999} />
              </div>
            ) : (
              <div className="dash-rings">
                <MacroRing value={protein} total={targetProtein} color="#38671a" label="Protein" />
                <MacroRing value={carbs}   total={targetCarbs}   color="#5d3fd3" label="Carbs"   />
                <MacroRing value={fat}     total={targetFat}     color="#f95630" label="Fats"    />
              </div>
            )}
          </section>
        )}

        {/* ── Card 3: Quick Actions ── */}
        <div className="dash-actions">
          <button className="dash-action-btn dash-action-btn--primary" onClick={() => navigate('/nutrition')}>
            <span className="material-symbols-outlined">nutrition</span>
            <span>Log Meal</span>
          </button>
          <button className="dash-action-btn dash-action-btn--secondary" onClick={() => navigate('/workouts')}>
            <span className="material-symbols-outlined">fitness_center</span>
            <span>Start Workout</span>
          </button>
          <button className="dash-action-btn dash-action-btn--tertiary" onClick={() => navigate('/nutrition')}>
            <span className="material-symbols-outlined">monitor_weight</span>
            <span>Add Weight</span>
          </button>
        </div>

        {/* ── Card 4: Streak Badges ── */}
        <section className="dash-card dash-card--streak">
          <div className="dash-streak-top">
            <span className="dash-section-label" style={{ color: '#38671a' }}>Streaks</span>
          </div>
          {streaksLoading ? (
            <div style={{ display: 'flex', gap: 12 }}>
              <SkeletonBox width={100} height={32} radius={999} />
              <SkeletonBox width={100} height={32} radius={999} />
            </div>
          ) : (
            <div className="dash-streak-badges">
              <div className={`dash-streak-badge-item${workoutStreak > 0 ? ' dash-streak-badge-item--active' : ''}`}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: 16 }}>
                  fitness_center
                </span>
                <span>{workoutStreak} wk workout</span>
              </div>
              <div className={`dash-streak-badge-item${mealStreak > 0 ? ' dash-streak-badge-item--active' : ''}`}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: 16 }}>
                  local_fire_department
                </span>
                <span>{mealStreak} day meal</span>
              </div>
            </div>
          )}

          {/* Week calendar — day dots based on workouts in summary */}
          <div className="dash-calendar" style={{ marginTop: 20 }}>
            {DAYS.map((day, i) => {
              const isToday = i === todayDayIndex;
              return (
                <div key={day} className="dash-day-col">
                  <span className={`dash-day-name${isToday ? ' dash-day-name--today' : ''}`}>{day}</span>
                  <div className={`dash-day-dot${isToday ? ' dash-day-dot--today' : ''}`} />
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Card 5: Mini Weekly Summary ── */}
        <section className="dash-card dash-card--weekly">
          <span className="dash-section-label">This Week</span>
          {weeklyLoading ? (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SkeletonBox height={20} />
              <SkeletonBox height={8} radius={999} />
            </div>
          ) : (
            <>
              <div className="dash-counter-top" style={{ marginTop: 12 }}>
                <div>
                  <h3 className="dash-counter-num">{weeklyWorkoutCount} workout{weeklyWorkoutCount !== 1 ? 's' : ''}</h3>
                  <p className="dash-section-label" style={{ marginTop: 2 }}>
                    {weeklyCalories.toLocaleString()} / {weeklyTargetCal.toLocaleString()} kcal
                  </p>
                </div>
              </div>
              {weeklyTargetCal > 0 && (
                <div className="dash-progress-track" style={{ marginTop: 10 }}>
                  <div
                    className="dash-progress-fill"
                    style={{ width: `${Math.min((weeklyCalories / weeklyTargetCal) * 100, 100)}%` }}
                  />
                </div>
              )}
            </>
          )}
        </section>

        {/* ── Card 6: Recommendation Card ── */}
        {!recsLoading && activeRules.length > 0 && (
          <section className="dash-card dash-card--recs">
            <span className="dash-section-label" style={{ color: '#b36200' }}>Today's Tips</span>
            <ul className="dash-recs-list">
              {activeRules.slice(0, 3).map((rule) => (
                <li key={rule.id} className="dash-rec-item">
                  <span className="material-symbols-outlined dash-rec-icon" style={{ fontVariationSettings: "'FILL' 1" }}>
                    lightbulb
                  </span>
                  <div>
                    <p className="dash-rec-name">{rule.name}</p>
                    {rule.adjustment && (
                      <p className="dash-rec-adj">{rule.adjustment}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

      </main>
    </div>
  );
}
