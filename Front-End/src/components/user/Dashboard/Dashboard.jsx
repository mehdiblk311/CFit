import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { uiStore } from '../../../stores/uiStore';
import {
  useDashboardCoachSummary,
  useDashboardRecommendations,
  useDashboardStreaks,
  useDashboardSummary,
  useDashboardWeeklySummary,
  useUnreadCount,
} from '../../../hooks/queries/useDashboard';
import './Dashboard.css';

/* ── Helpers ─────────────────────────────────────────────────────── */

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampPercent(value) {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 100) return 100;
  return value;
}

function formatWholeNumber(value) {
  return Math.round(toNumber(value)).toLocaleString('en-US');
}

function formatMetric(value, unit = '') {
  return `${formatWholeNumber(value)}${unit}`;
}

function formatTarget(value, unit = '') {
  if (toNumber(value) <= 0) return '0';
  return `${formatWholeNumber(value)}${unit}`;
}

function normalizeSummary(summary, coachSummary) {
  const fallbackDaily = coachSummary?.daily_summary || {};
  const hasPrimarySummary =
    summary &&
    (toNumber(summary?.total_calories) > 0 ||
      toNumber(summary?.total_protein) > 0 ||
      toArray(summary?.meals).length > 0 ||
      toArray(summary?.workouts).length > 0);
  const source = hasPrimarySummary ? summary : fallbackDaily;
  const meals = toArray(source?.meals);
  const workouts = toArray(source?.workouts);
  const flaggedDeficiencies = toArray(source?.flagged_deficiencies).filter(Boolean);
  const completedWorkout = workouts.find(
    (w) => w?.completed_at || w?.status === 'completed'
  );
  const anyWorkout = completedWorkout || workouts[0] || null;
  const workoutName =
    anyWorkout?.name ||
    anyWorkout?.title ||
    anyWorkout?.workout_type ||
    anyWorkout?.type ||
    'Workout ready';

  return {
    totalCalories: toNumber(source?.total_calories),
    targetCalories: toNumber(source?.target_calories),
    totalProtein: toNumber(source?.total_protein),
    targetProtein: toNumber(source?.target_protein),
    totalCarbs: toNumber(source?.total_carbs),
    targetCarbs: toNumber(source?.target_carbs),
    totalFat: toNumber(source?.total_fat),
    targetFat: toNumber(source?.target_fat),
    mealCount: Math.max(meals.length, toNumber(source?.meal_count)),
    workoutsCount: workouts.length,
    flaggedDeficiencies,
    workoutDone: workouts.length > 0,
    workoutName,
    hasActivity:
      workouts.length > 0 ||
      meals.length > 0 ||
      toNumber(source?.total_calories) > 0 ||
      toNumber(source?.total_protein) > 0,
  };
}

function normalizeWeeklySummary(summary) {
  const source = summary || {};
  const totalCalories = toNumber(source?.total_calories);
  const targetCalories = toNumber(source?.target_calories);
  return {
    workoutCount: toNumber(source?.workout_count),
    mealCount: toNumber(source?.meal_count),
    totalCalories,
    targetCalories,
    flaggedDeficiencies: toArray(source?.flagged_deficiencies).filter(Boolean),
  };
}

function normalizeStreaks(streaks, coachSummary) {
  const primaryValues = streaks?.streaks || streaks || {};
  const hasPrimaryStreaks =
    toNumber(primaryValues?.workout_streak) > 0 ||
    toNumber(primaryValues?.meal_streak) > 0 ||
    toNumber(primaryValues?.weigh_in_streak) > 0 ||
    toNumber(streaks?.adherence_summary?.days_7) > 0;
  const source = hasPrimaryStreaks ? streaks || {} : coachSummary?.streaks || {};
  const streakValues = source?.streaks || source;
  const adherence = source?.adherence_summary || {};
  return {
    workoutStreak: toNumber(streakValues?.workout_streak),
    mealStreak: toNumber(streakValues?.meal_streak),
    weighInStreak: toNumber(streakValues?.weigh_in_streak),
    adherence7: toNumber(adherence?.days_7),
  };
}

function normalizeRecommendations(recommendations, coachSummary) {
  const primaryRules = toArray(recommendations?.rules || recommendations);
  const source =
    primaryRules.length > 0 ? recommendations || {} : coachSummary?.recommendations || {};
  const rules = toArray(source?.rules || source);
  return rules
    .filter((rule) => rule && rule.applies !== false)
    .map((rule, index) => ({
      id: rule.id || `rec-${index}`,
      name: rule.name || 'Today recommendation',
      description: rule.description || '',
      adjustment: rule.adjustment || '',
    }));
}

/* Builds Mon–Sun for the current week, marking done days via streak count */
function buildWeekCalendar(workoutStreak) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayOfWeek = today.getDay();
  const mondayOffset = (dayOfWeek + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayOffset);

  const doneDates = new Set();
  for (let i = 0; i < workoutStreak; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    doneDates.add(d.toDateString());
  }

  const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return DAY_NAMES.map((name, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      name,
      isToday: d.toDateString() === today.toDateString(),
      isDone: doneDates.has(d.toDateString()),
    };
  });
}

/* ── AvatarDisplay ───────────────────────────────────────────────── */

function AvatarDisplay({ user, onClick }) {
  const [hasError, setHasError] = useState(false);
  const name = user?.name ?? user?.email?.split('@')[0] ?? 'A';
  const initial = name.charAt(0).toUpperCase();

  if (user?.avatar && !hasError) {
    return (
      <button className="dash-avatar-btn" type="button" onClick={onClick} aria-label="Profile">
        <img
          src={user.avatar}
          alt={name}
          className="dash-avatar-img"
          onError={() => setHasError(true)}
        />
      </button>
    );
  }
  return (
    <button className="dash-avatar-btn" type="button" onClick={onClick} aria-label="Profile">
      <span className="dash-avatar-initial">{initial}</span>
    </button>
  );
}

/* ── MacroRing ───────────────────────────────────────────────────── */

function MacroRing({ value, total, color, label }) {
  const safeTotal = Math.max(toNumber(total), 1);
  const safeValue = Math.max(toNumber(value), 0);
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (clampPercent((safeValue / safeTotal) * 100) / 100) * circ;

  return (
    <div className="dash-ring-wrap">
      <div className="dash-ring-svg-wrap">
        <svg className="dash-ring-svg" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} fill="transparent" stroke="#e2e3e0" strokeWidth="8" />
          <circle
            cx="40"
            cy="40"
            r={r}
            fill="transparent"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%',
              transition: 'stroke-dashoffset 0.8s ease-out',
            }}
          />
        </svg>
        <div className="dash-ring-center">
          <span className="dash-ring-val">{formatMetric(value, 'g')}</span>
        </div>
      </div>
      <span className="dash-ring-label">{label}</span>
    </div>
  );
}

/* ── DashboardSkeleton ───────────────────────────────────────────── */

function DashboardSkeleton() {
  return (
    <>
      <section className="dash-card dash-card--summary">
        <div className="dash-skeleton dash-skeleton--title" />
        <div className="dash-skeleton dash-skeleton--subtitle" />
        <div className="dash-summary-grid">
          <div className="dash-stat-box">
            <div className="dash-skeleton dash-skeleton--box" />
          </div>
          <div className="dash-stat-box">
            <div className="dash-skeleton dash-skeleton--box" />
          </div>
        </div>
      </section>
      <section className="dash-card dash-card--macros">
        <div className="dash-skeleton dash-skeleton--subtitle" />
        <div className="dash-rings">
          {[1, 2, 3].map((item) => (
            <div key={item} className="dash-ring-wrap">
              <div className="dash-skeleton dash-skeleton--ring" />
              <div className="dash-skeleton dash-skeleton--label" />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

/* ── Dashboard (main) ────────────────────────────────────────────── */

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const workoutFrequency = uiStore((s) => s.workoutFrequency ?? 4);

  const summaryQuery = useDashboardSummary();
  const weeklyQuery = useDashboardWeeklySummary();
  const streaksQuery = useDashboardStreaks();
  const recommendationsQuery = useDashboardRecommendations();
  const coachSummaryQuery = useDashboardCoachSummary();
  const unreadCountQuery = useUnreadCount();

  const name = user?.name ?? user?.first_name ?? user?.email?.split('@')[0] ?? 'Athlete';
  const firstName = name.charAt(0).toUpperCase() + name.slice(1);

  const now = new Date();
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
  const monthDay = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const todayCardDate = `Today, ${weekday} ${monthDay}`;

  const unreadCount = toNumber(unreadCountQuery.data?.unread_count);

  const summary = normalizeSummary(summaryQuery.data, coachSummaryQuery.data);
  const weekly = normalizeWeeklySummary(weeklyQuery.data);
  const streaks = normalizeStreaks(streaksQuery.data, coachSummaryQuery.data);
  const recommendations = normalizeRecommendations(
    recommendationsQuery.data,
    coachSummaryQuery.data
  );

  const weekDays = useMemo(
    () => buildWeekCalendar(streaks.workoutStreak),
    [streaks.workoutStreak]
  );

  const workoutDots = useMemo(
    () =>
      Array.from(
        { length: Math.min(Math.max(workoutFrequency, 1), 7) },
        (_, i) => i < weekly.workoutCount
      ),
    [workoutFrequency, weekly.workoutCount]
  );

  const showInitialLoading =
    !summaryQuery.data &&
    !coachSummaryQuery.data &&
    (summaryQuery.isLoading || coachSummaryQuery.isLoading);

  const hasAnyDashboardData =
    summary.hasActivity ||
    weekly.workoutCount > 0 ||
    weekly.mealCount > 0 ||
    streaks.workoutStreak > 0 ||
    streaks.mealStreak > 0 ||
    streaks.weighInStreak > 0;

  const showEmptyState =
    !showInitialLoading &&
    !hasAnyDashboardData &&
    !summaryQuery.isError &&
    !weeklyQuery.isError &&
    !coachSummaryQuery.isError;

  const showFallbackBanner =
    !showInitialLoading &&
    !hasAnyDashboardData &&
    (summaryQuery.isError || weeklyQuery.isError || recommendationsQuery.isError);

  return (
    <div className="dash-root">
      {/* ── Header ── */}
      <header className="dash-header">
        <div className="dash-header-left">
          <h1 className="dash-greeting">Hey, {firstName}</h1>
          <p className="dash-tagline">The Kinetic Craft is a journey, not a destination.</p>
        </div>
        <div className="dash-header-right">
          <button
            className="dash-notif-btn"
            aria-label="Notifications"
            onClick={() => navigate('/notifications')}
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && <span className="dash-notif-badge">{unreadCount}</span>}
          </button>
          <AvatarDisplay user={user} onClick={() => navigate('/settings')} />
        </div>
      </header>

      <main className="dash-main">
        {showInitialLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* ── Fallback banner ── */}
            {showFallbackBanner && (
              <section className="dash-card dash-card--notice">
                <span className="dash-section-label">Sync issue</span>
                <p className="dash-notice-copy">
                  Latest snapshot could not fully load — logging is still available.
                </p>
              </section>
            )}

            {/* ── Empty state ── */}
            {showEmptyState && (
              <section className="dash-card dash-card--empty">
                <span className="material-symbols-outlined dash-empty-icon">rocket_launch</span>
                <h2 className="dash-empty-title">Build your first day of momentum</h2>
                <p className="dash-empty-sub">
                  Start with one action so the app can generate your dashboard.
                </p>
                <div className="dash-empty-actions">
                  <button
                    className="dash-action-btn dash-action-btn--primary"
                    type="button"
                    onClick={() => navigate('/nutrition')}
                  >
                    <span className="material-symbols-outlined">restaurant</span>
                    <span>Log Meal</span>
                  </button>
                  <button
                    className="dash-action-btn dash-action-btn--secondary"
                    type="button"
                    onClick={() => navigate('/workouts')}
                  >
                    <span className="material-symbols-outlined">fitness_center</span>
                    <span>Start Workout</span>
                  </button>
                </div>
              </section>
            )}

            {/* ── Today's Summary ── */}
            <section className="dash-card dash-card--summary">
              <div className="dash-card-bg-icon">
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  calendar_today
                </span>
              </div>
              <div className="dash-summary-top">
                <div>
                  <span className="dash-section-label">Today&apos;s Summary</span>
                  <h2 className="dash-date">{todayCardDate}</h2>
                </div>
              </div>
              <div className="dash-summary-grid">
                <div className="dash-stat-box">
                  <span className="dash-stat-label">Calories</span>
                  <div className="dash-stat-row">
                    <span className="dash-stat-val">
                      {formatWholeNumber(summary.totalCalories)}
                    </span>
                    <span className="dash-stat-sub">
                      / {formatTarget(summary.targetCalories)} kcal
                    </span>
                  </div>
                </div>
                <div
                  className={`dash-stat-box ${
                    summary.workoutDone ? 'dash-stat-box--green' : 'dash-stat-box--soft'
                  }`}
                >
                  <span className="dash-stat-label">Workout</span>
                  <div className="dash-stat-row">
                    <span className="dash-stat-val dash-stat-val--compact">
                      {summary.workoutDone ? summary.workoutName : 'Not logged yet'}
                    </span>
                    <span className="material-symbols-outlined dash-stat-icon">
                      {summary.workoutDone ? 'check_circle' : 'schedule'}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Macro Rings ── */}
            <section className="dash-card dash-card--macros">
              <span className="dash-section-label" style={{ color: '#5d3fd3' }}>
                Macro Progress
              </span>
              <div className="dash-rings">
                <MacroRing
                  value={summary.totalProtein}
                  total={summary.targetProtein}
                  color="#38671a"
                  label="Protein"
                />
                <MacroRing
                  value={summary.totalCarbs}
                  total={summary.targetCarbs}
                  color="#5d3fd3"
                  label="Carbs"
                />
                <MacroRing
                  value={summary.totalFat}
                  total={summary.targetFat}
                  color="#f95630"
                  label="Fats"
                />
              </div>
            </section>

            {/* ── Quick Actions — 2 big pills ── */}
            <div className="dash-actions">
              <button
                className="dash-action-btn dash-action-btn--primary"
                type="button"
                onClick={() => navigate('/nutrition')}
              >
                <span className="material-symbols-outlined">nutrition</span>
                <span>Log Meal</span>
              </button>
              <button
                className="dash-action-btn dash-action-btn--secondary"
                type="button"
                onClick={() => navigate('/workouts')}
              >
                <span className="material-symbols-outlined">fitness_center</span>
                <span>Start Workout</span>
              </button>
            </div>

            <button
              className="dash-log-weight-link"
              type="button"
              onClick={() => navigate('/weight')}
            >
              <span className="material-symbols-outlined">monitor_weight</span>
              Log Weight
            </button>

            {/* ── Weekly Counter ── */}
            <section className="dash-card dash-card--counter">
              <div className="dash-counter-top">
                <div>
                  <h3 className="dash-counter-num">
                    {weekly.workoutCount} / {workoutFrequency} workouts
                  </h3>
                  <p className="dash-section-label">This Week&apos;s Goal</p>
                </div>
                <div className="dash-counter-dots">
                  {workoutDots.map((done, i) => (
                    <div
                      key={i}
                      className={`dash-counter-dot${done ? ' dash-counter-dot--done' : ''}`}
                    />
                  ))}
                </div>
              </div>
              <div className="dash-progress-track">
                <div
                  className="dash-progress-fill"
                  style={{
                    width: `${(weekly.workoutCount / Math.max(workoutFrequency, 1)) * 100}%`,
                  }}
                />
              </div>
            </section>

            {/* ── Training Streak — 7-day calendar ── */}
            <section className="dash-card dash-card--streak">
              <div className="dash-streak-top">
                <span className="dash-section-label" style={{ color: '#38671a' }}>
                  Training Streak
                </span>
                <div className="dash-streak-pill">
                  {streaks.workoutStreak > 0
                    ? `🔥 ${streaks.workoutStreak} Days`
                    : 'Start Today'}
                </div>
              </div>
              <div className="dash-calendar">
                {weekDays.map((day) => (
                  <div key={day.name} className="dash-day-col">
                    <span
                      className={`dash-day-name${day.isToday ? ' dash-day-name--today' : ''}`}
                    >
                      {day.name}
                    </span>
                    <div
                      className={[
                        'dash-day-dot',
                        day.isDone ? 'dash-day-dot--done' : '',
                        day.isToday ? 'dash-day-dot--today' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {day.isDone && (
                        <span className="material-symbols-outlined dash-day-check">done</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Recommendations ── */}
            {recommendations.length > 0 && (
              <section className="dash-card dash-card--recs">
                <span className="dash-section-label" style={{ color: '#b36200' }}>
                  Recommendations
                </span>
                <ul className="dash-recs-list">
                  {recommendations.slice(0, 3).map((rec) => (
                    <li key={rec.id} className="dash-rec-item">
                      <span className="material-symbols-outlined dash-rec-icon">
                        tips_and_updates
                      </span>
                      <div>
                        <p className="dash-rec-name">{rec.name}</p>
                        <p className="dash-rec-adj">{rec.adjustment || rec.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
