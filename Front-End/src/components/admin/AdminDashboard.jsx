import { useAdminDashboard, useAdminLogs, useAdminMetrics } from '../../hooks/queries/useAdmin';

const ROLE_COLOR = { admin: 'adm-chip--green', coach: 'adm-chip--purple', user: 'adm-chip--oat' };

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function firstNumber(...values) {
  for (const value of values) {
    if (value === null || value === undefined || value === '') continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function safePercent(value, total) {
  const base = toNumber(total);
  if (base <= 0) return 0;
  return Math.max(0, Math.min(100, (toNumber(value) / base) * 100));
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(toNumber(value));
}

function formatCompact(value) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(toNumber(value));
}

function formatPercent(value, digits = 0) {
  return `${toNumber(value).toFixed(digits)}%`;
}

function formatDateLabel(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function formatTimestamp(value) {
  if (!value) return 'No sync';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No sync';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatRelativeTime(value) {
  if (!value) return 'just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'just now';
  const diffMs = date.getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60000);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
  const diffHours = Math.round(diffMin / 60);
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour');
  const diffDays = Math.round(diffHours / 24);
  return rtf.format(diffDays, 'day');
}

function formatGoal(goal) {
  if (!goal) return 'Unknown';
  return String(goal)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatAction(action) {
  if (!action) return 'Unknown action';
  return String(action)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function shortId(value) {
  if (!value) return 'system';
  return String(value).slice(0, 8);
}

function buildGrowthBars(rows) {
  const data = asArray(rows)
    .map((row) => ({
      date: row?.date || row?.stat_date,
      value: toNumber(row?.new_users || row?.count || row?.value),
    }))
    .filter((row) => row.date)
    .reverse()
    .slice(-12);

  const max = Math.max(1, ...data.map((row) => row.value));

  return data.map((row) => ({
    ...row,
    height: Math.max(10, (row.value / max) * 100),
    label: formatDateLabel(row.date),
  }));
}

function buildActivityBars(rows) {
  const data = asArray(rows)
    .map((row) => {
      const workouts = toNumber(row?.total_workouts);
      const meals = toNumber(row?.total_meals);
      const weights = toNumber(row?.total_weights);
      return {
        date: row?.stat_date || row?.date,
        workouts,
        meals,
        weights,
        total: workouts + meals + weights,
      };
    })
    .filter((row) => row.date)
    .reverse()
    .slice(-12);

  const max = Math.max(1, ...data.map((row) => row.total));

  return data.map((row) => {
    const containerHeight = Math.max(10, (row.total / max) * 100);
    const total = row.total || 1;
    return {
      ...row,
      containerHeight,
      label: formatDateLabel(row.date),
      workoutHeight: (row.workouts / total) * 100,
      mealHeight: (row.meals / total) * 100,
      weightHeight: (row.weights / total) * 100,
    };
  });
}

function buildPopularExercises(rows) {
  const data = asArray(rows)
    .map((row) => ({
      name: row?.exercise_name || row?.name || 'Unknown exercise',
      logs: toNumber(row?.usage_count || row?.count),
      uniqueUsers: toNumber(row?.unique_users),
    }))
    .slice(0, 5);
  const max = Math.max(1, ...data.map((row) => row.logs));
  return data.map((row) => ({
    ...row,
    pct: Math.max(10, (row.logs / max) * 100),
  }));
}

function buildGoalBreakdown(rows, totalUsers) {
  const total = Math.max(1, toNumber(totalUsers));
  return asArray(rows)
    .map((row) => ({
      goal: formatGoal(row?.goal),
      count: toNumber(row?.count),
      pct: safePercent(row?.count, total),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);
}

function buildRecentActivity(rows) {
  return asArray(rows).slice(0, 6).map((row) => ({
    id: row?.id || `${row?.admin_id}-${row?.created_at}`,
    actor: `Admin ${shortId(row?.admin_id)}`,
    action: formatAction(row?.action),
    entity: formatGoal(row?.entity_type),
    time: formatRelativeTime(row?.created_at),
    role: 'admin',
    createdAt: row?.created_at,
  }));
}

function MetricCard({ label, value, badge, bar, background, valueColor, labelColor, barColor }) {
  return (
    <div className="adm-metric-card" style={background ? { background } : undefined}>
      {badge ? (
        <div
          className="adm-metric-badge"
          style={background && background !== '#fff' ? { background: '#2e2f2e', color: '#faf9f7' } : undefined}
        >
          {badge}
        </div>
      ) : null}
      <p className="adm-metric-label" style={labelColor ? { color: labelColor } : undefined}>
        {label}
      </p>
      <p className="adm-metric-value" style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </p>
      {bar !== null && bar !== undefined ? (
        <div className="adm-metric-bar-wrap">
          <div className="adm-metric-bar" style={{ width: `${Math.max(0, Math.min(100, bar))}%`, background: barColor || '#38671a' }} />
        </div>
      ) : null}
    </div>
  );
}

function EmptyState({ title, body }) {
  return (
    <div className="adm-card" style={{ padding: 24 }}>
      <p style={{ fontWeight: 800, marginBottom: 8 }}>{title}</p>
      <p style={{ color: '#5b5c5a', margin: 0 }}>{body}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const dashboardQuery = useAdminDashboard();
  const metricsQuery = useAdminMetrics();
  const logsQuery = useAdminLogs({ page: 1, limit: 6 });

  const dashboard = dashboardQuery.data?.item || {};
  const summary = dashboard.summary || {};
  const trends = asArray(dashboard.trends);
  const metrics = metricsQuery.data?.item || {};
  const userStats = metrics.users || {};
  const workoutStats = metrics.workouts || {};
  const nutritionStats = metrics.nutrition || {};
  const moderationStats = metrics.moderation || {};
  const logsPayload = logsQuery.data?.item || {};
  const logs = asArray(logsPayload.data || logsPayload.items || logsPayload.logs || logsPayload);

  const totalUsers = firstNumber(userStats.total_users, summary.total_users);
  const activeToday = firstNumber(summary.dau);
  const active7d = firstNumber(userStats.active_users_7d);
  const mau = firstNumber(summary.mau, userStats.mau);
  const newUsers7d = firstNumber(summary.new_users_7d);
  const totalWorkouts = firstNumber(workoutStats.total_workouts);
  const workoutsToday = firstNumber(summary.workouts_today, workoutStats.workouts_today);

  const cards = [
    {
      label: 'Total Users',
      value: formatNumber(totalUsers),
      badge: `MAU ${formatNumber(mau)}`,
      bar: safePercent(active7d, totalUsers),
      background: '#fff',
    },
    {
      label: 'Active Today',
      value: formatNumber(activeToday),
      badge: formatPercent(firstNumber(summary.dau_mau_ratio), 1),
      bar: safePercent(activeToday, mau),
      background: '#c3fb9c',
      valueColor: '#214f01',
      labelColor: 'rgba(33,79,1,0.72)',
    },
    {
      label: 'New This Week',
      value: formatNumber(newUsers7d),
      badge: `${formatNumber(active7d)} active / 7d`,
      bar: safePercent(newUsers7d, totalUsers),
      background: '#fff',
    },
    {
      label: 'Workouts Logged',
      value: formatCompact(totalWorkouts),
      badge: `${formatNumber(workoutsToday)} today`,
      bar: safePercent(workoutsToday, totalWorkouts),
      background: '#b4a5ff',
      valueColor: '#180058',
      labelColor: 'rgba(24,0,88,0.65)',
      barColor: '#180058',
    },
  ];

  const growthBars = buildGrowthBars(asArray(userStats.growth).length ? userStats.growth : trends);
  const activityBars = buildActivityBars(trends);
  const popularExercises = buildPopularExercises(workoutStats.popular_exercises);
  const goalBreakdown = buildGoalBreakdown(userStats.goal_breakdown, firstNumber(userStats.total_users, summary.total_users));
  const recentActivity = buildRecentActivity(logs);

  const isLoading = dashboardQuery.isLoading || metricsQuery.isLoading;
  const hasCriticalData = Object.keys(summary).length > 0 || Object.keys(metrics).length > 0;
  const hasErrors = dashboardQuery.error || metricsQuery.error || logsQuery.error;

  if (isLoading && !hasCriticalData) {
    return (
      <div>
        <div className="adm-page-header">
          <div>
            <p className="adm-page-eyebrow">// OVERVIEW_TERMINAL_V1</p>
            <h1 className="adm-page-title">The Kinetic<br />Dashboard</h1>
          </div>
        </div>
        <div className="adm-grid-4" style={{ marginBottom: 28 }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="adm-metric-card" style={{ minHeight: 182, opacity: 0.72 }}>
              <p className="adm-metric-label">Loading metric...</p>
            </div>
          ))}
        </div>
        <EmptyState title="Loading admin dashboard" body="We are syncing live analytics from users, workouts, nutrition, and audit logs." />
      </div>
    );
  }

  if (!hasCriticalData && hasErrors) {
    return (
      <div>
        <div className="adm-page-header">
          <div>
            <p className="adm-page-eyebrow">// OVERVIEW_TERMINAL_V1</p>
            <h1 className="adm-page-title">The Kinetic<br />Dashboard</h1>
          </div>
        </div>
        <EmptyState
          title="Dashboard data is unavailable"
          body="The admin analytics endpoints did not respond cleanly. The rest of the admin area can still work, but this overview needs the backend to be reachable."
        />
      </div>
    );
  }

  return (
    <div>
      <div className="adm-page-header">
        <div>
          <p className="adm-page-eyebrow">// OVERVIEW_TERMINAL_V1</p>
          <h1 className="adm-page-title">The Kinetic<br />Dashboard</h1>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <div className="adm-sticker adm-sticker--rotate-r" style={{ background: hasErrors ? '#f8cc65' : '#c3fb9c' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              {hasErrors ? 'warning' : 'bolt'}
            </span>
            Last sync: {formatTimestamp(summary.updated_at)}
          </div>
          {hasErrors ? (
            <span className="adm-chip adm-chip--oat">Some panels are using partial data</span>
          ) : null}
        </div>
      </div>

      <div className="adm-grid-4" style={{ marginBottom: 28 }}>
        {cards.map((card) => (
          <MetricCard
            key={card.label}
            label={card.label}
            value={card.value}
            badge={card.badge}
            bar={card.bar}
            background={card.background}
            valueColor={card.valueColor}
            labelColor={card.labelColor}
            barColor={card.barColor}
          />
        ))}
      </div>

      <div className="adm-grid-2" style={{ marginBottom: 28 }}>
        <div className="adm-card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase', color: '#38671a', fontWeight: 700 }}>
              User Growth Trend
            </p>
            <span className="material-symbols-outlined" style={{ color: '#767775' }}>show_chart</span>
          </div>
          {growthBars.length ? (
            <>
              <div className="adm-bar-chart" style={{ height: 140 }}>
                {growthBars.map((bar) => (
                  <div
                    key={`${bar.date}-${bar.value}`}
                    className="adm-bar-segment"
                    title={`${bar.label}: ${bar.value} new users`}
                    style={{ height: `${bar.height}%`, background: `rgba(56,103,26,${0.28 + bar.height / 180})` }}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: '1px', color: '#767775' }}>
                {growthBars.map((bar) => (
                  <span key={bar.date}>{bar.label}</span>
                ))}
              </div>
            </>
          ) : (
            <p style={{ color: '#5b5c5a', margin: 0 }}>No user growth data has been recorded yet.</p>
          )}
        </div>

        <div className="adm-card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase', color: '#5d3fd3', fontWeight: 700 }}>
              Platform Activity (30d)
            </p>
            <span className="material-symbols-outlined" style={{ color: '#767775' }}>monitoring</span>
          </div>
          {activityBars.length ? (
            <>
              <div className="adm-bar-chart" style={{ height: 140, alignItems: 'flex-end' }}>
                {activityBars.map((bar) => (
                  <div
                    key={bar.date}
                    title={`${bar.label}: ${bar.workouts} workouts, ${bar.meals} meals, ${bar.weights} weigh-ins`}
                    style={{
                      width: '100%',
                      maxWidth: 22,
                      height: `${bar.containerHeight}%`,
                      minHeight: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      borderRadius: 9999,
                      overflow: 'hidden',
                      background: '#ece7dc',
                    }}
                  >
                    {bar.weightHeight > 0 ? <div style={{ height: `${bar.weightHeight}%`, background: '#f8cc65' }} /> : null}
                    {bar.mealHeight > 0 ? <div style={{ height: `${bar.mealHeight}%`, background: '#b4a5ff' }} /> : null}
                    {bar.workoutHeight > 0 ? <div style={{ height: `${bar.workoutHeight}%`, background: '#38671a' }} /> : null}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
                <span className="adm-chip adm-chip--green">Workouts</span>
                <span className="adm-chip adm-chip--purple">Meals</span>
                <span className="adm-chip adm-chip--oat" style={{ background: '#f8cc65', color: '#7c5507' }}>Weigh-ins</span>
              </div>
            </>
          ) : (
            <p style={{ color: '#5b5c5a', margin: 0 }}>No cross-product activity trend is available yet.</p>
          )}
        </div>
      </div>

      <div className="adm-grid-2" style={{ marginBottom: 28 }}>
        <div style={{ background: '#faf9f7', border: '2px dashed #dad4c8', borderRadius: 16, padding: 24 }}>
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase', color: '#38671a', fontWeight: 700, marginBottom: 20, textDecoration: 'underline', textDecorationStyle: 'wavy', textUnderlineOffset: 6 }}>
            Popular Exercises
          </p>
          {popularExercises.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {popularExercises.map((exercise) => (
                <div key={exercise.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
                    <span>{exercise.name}</span>
                    <span style={{ color: '#5b5c5a' }}>{formatNumber(exercise.logs)} logs</span>
                  </div>
                  <div style={{ height: 8, background: '#e8e2d6', borderRadius: 9999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${exercise.pct}%`, background: '#38671a', borderRadius: 9999 }} />
                  </div>
                  <div style={{ marginTop: 6, fontFamily: "'Space Mono', monospace", fontSize: 9, color: '#767775' }}>
                    {formatNumber(exercise.uniqueUsers)} distinct users
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#5b5c5a', margin: 0 }}>Popular exercise data will appear once users start logging workouts.</p>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="adm-metric-card" style={{ background: '#c3fb9c', flex: 1 }}>
            <p className="adm-metric-label" style={{ color: 'rgba(33,79,1,0.72)' }}>Goal Breakdown</p>
            {goalBreakdown.length ? (
              <>
                <p className="adm-metric-value" style={{ color: '#214f01', fontSize: 36 }}>
                  {goalBreakdown[0].goal}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
                  {goalBreakdown.map((goal) => (
                    <div key={goal.goal}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: '#214f01' }}>
                        <span>{goal.goal}</span>
                        <span>{formatNumber(goal.count)}</span>
                      </div>
                      <div style={{ height: 7, background: 'rgba(33,79,1,0.14)', borderRadius: 9999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${goal.pct}%`, background: '#214f01', borderRadius: 9999 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p style={{ color: '#214f01', margin: 0 }}>User goals have not been categorized yet.</p>
            )}
          </div>

          <div className="adm-metric-card" style={{ flex: 1 }}>
            <div style={{ position: 'absolute', top: 16, right: 16, width: 40, height: 40, borderRadius: '50%', background: '#f9f2e5', border: '2px dashed #38671a', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(12deg)' }}>
              <span className="material-symbols-outlined" style={{ color: '#38671a', fontSize: 20 }}>restaurant</span>
            </div>
            <p className="adm-metric-label">Nutrition & Ops</p>
            <p className="adm-metric-value">
              {formatNumber(firstNumber(nutritionStats.meals_today))}
              <span style={{ fontSize: 20 }}> meals today</span>
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
              <span className="adm-chip adm-chip--oat">Total meals: {formatCompact(firstNumber(nutritionStats.total_meals, nutritionStats.total_meals_logged))}</span>
              <span className="adm-chip adm-chip--purple">Pending exports: {formatNumber(firstNumber(moderationStats.pending_exports))}</span>
              <span className="adm-chip adm-chip--red">Deletion requests: {formatNumber(firstNumber(moderationStats.deletion_requests))}</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#2e2f2e', fontWeight: 700, margin: 0 }}>
            Recent Admin Activity
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className={`adm-chip ${ROLE_COLOR.admin}`}>audit logs</span>
            <span className="adm-chip adm-chip--oat">showing latest {recentActivity.length || 0}</span>
          </div>
        </div>
        <div className="adm-table-wrap">
          {recentActivity.length ? (
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Role</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((entry) => (
                  <tr key={entry.id}>
                    <td><strong>{entry.actor}</strong></td>
                    <td style={{ color: '#5b5c5a' }}>{entry.action}</td>
                    <td><span className="adm-chip adm-chip--oat">{entry.entity}</span></td>
                    <td><span className={`adm-chip ${ROLE_COLOR[entry.role]}`}>{entry.role}</span></td>
                    <td className="adm-td-mono">{entry.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: 24, color: '#5b5c5a' }}>No audit log activity has been returned by the backend yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
