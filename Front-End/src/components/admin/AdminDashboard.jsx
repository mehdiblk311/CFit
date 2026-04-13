/* ── Admin Dashboard ─────────────────────────────────────────────── */

const METRICS = [
  { label: 'Total Users',     value: '1,247', badge: '+12%', bar: 75,  bg: '#fff' },
  { label: 'Active Today',    value: '482',   badge: null,   bar: null, bg: '#c3fb9c' },
  { label: 'New This Week',   value: '89',    badge: '/ 100 goal', bar: 89, bg: '#fff' },
  { label: 'Workouts Logged', value: '15,4K', badge: null,   bar: null, bg: '#b4a5ff' },
];

const POPULAR_EXERCISES = [
  { name: 'Deadlift',       logs: 892, pct: 95 },
  { name: 'Bench Press',    logs: 745, pct: 80 },
  { name: 'Squat',          logs: 612, pct: 65 },
  { name: 'Pull-up',        logs: 534, pct: 57 },
  { name: 'Overhead Press', logs: 401, pct: 43 },
];

const GROWTH_BARS = [25, 33, 66, 50, 80, 100]; // % heights Jan-Jun
const HOURLY_BARS = [10, 15, 40, 35, 60, 85, 70, 90, 65, 55, 45, 30];

const RECENT_ACTIVITY = [
  { user: 'Mehdi Alami',    action: 'Completed Push Day',        time: '2 min ago',  role: 'admin' },
  { user: 'Sarah Bennani',  action: 'Logged 2,150 kcal',         time: '14 min ago', role: 'user' },
  { user: 'Yassine Amrani', action: 'Created PPL Beginner plan', time: '1 hr ago',   role: 'coach' },
  { user: 'Inès Kadiri',    action: 'Completed onboarding',      time: '2 hr ago',   role: 'user' },
  { user: 'Omar Fassi',     action: 'Set new PR — 100kg Squat',  time: '3 hr ago',   role: 'user' },
];

const ROLE_COLOR = { admin: 'adm-chip--green', coach: 'adm-chip--purple', user: 'adm-chip--oat' };

export default function AdminDashboard() {
  return (
    <div>
      {/* Header */}
      <div className="adm-page-header">
        <div>
          <p className="adm-page-eyebrow">// OVERVIEW_TERMINAL_V1</p>
          <h1 className="adm-page-title">The Kinetic<br/>Dashboard</h1>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <div className="adm-sticker adm-sticker--rotate-r" style={{ background: '#c3fb9c' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>bolt</span>
            Last sync: today 09:42 AM
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="adm-grid-4" style={{ marginBottom: 28 }}>
        {METRICS.map((m, i) => (
          <div
            key={i}
            className="adm-metric-card"
            style={{ background: m.bg }}
          >
            {m.badge && (
              <div className="adm-metric-badge"
                style={m.bg !== '#fff' ? { background: '#2e2f2e', color: '#faf9f7' } : {}}>
                {m.badge}
              </div>
            )}
            <p className="adm-metric-label"
              style={m.bg !== '#fff' ? { color: 'rgba(33,79,1,0.7)' } : {}}>
              {m.label}
            </p>
            <p className="adm-metric-value"
              style={m.bg === '#b4a5ff' ? { color: '#180058' } : m.bg === '#c3fb9c' ? { color: '#214f01' } : {}}>
              {m.value}
            </p>
            {m.bar && (
              <div className="adm-metric-bar-wrap">
                <div className="adm-metric-bar" style={{ width: `${m.bar}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="adm-grid-2" style={{ marginBottom: 28 }}>
        {/* User growth */}
        <div className="adm-card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase', color: '#38671a', fontWeight: 700 }}>
              User Growth Trend
            </p>
            <span className="material-symbols-outlined" style={{ color: '#767775' }}>show_chart</span>
          </div>
          <div className="adm-bar-chart" style={{ height: 140 }}>
            {GROWTH_BARS.map((h, i) => (
              <div
                key={i}
                className="adm-bar-segment"
                style={{ height: `${h}%`, background: `rgba(56,103,26,${0.3 + h / 200})` }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: '1px', color: '#767775' }}>
            {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'].map(m => <span key={m}>{m}</span>)}
          </div>
        </div>

        {/* Active users log */}
        <div className="adm-card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase', color: '#5d3fd3', fontWeight: 700 }}>
              Active Users (24h)
            </p>
            <span className="material-symbols-outlined" style={{ color: '#767775' }}>monitoring</span>
          </div>
          <div className="adm-bar-chart" style={{ height: 140 }}>
            {HOURLY_BARS.map((h, i) => (
              <div key={i} className="adm-bar-segment" style={{ height: `${h}%`, background: '#b4a5ff' }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: '1px', color: '#767775' }}>
            {['00:00', '06:00', '12:00', '18:00', '23:59'].map(t => <span key={t}>{t}</span>)}
          </div>
        </div>
      </div>

      {/* Popular exercises + Activity */}
      <div className="adm-grid-2" style={{ marginBottom: 28 }}>
        {/* Popular exercises */}
        <div style={{ background: '#faf9f7', border: '2px dashed #dad4c8', borderRadius: 16, padding: 24 }}>
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase', color: '#38671a', fontWeight: 700, marginBottom: 20, textDecoration: 'underline', textDecorationStyle: 'wavy', textUnderlineOffset: 6 }}>
            Popular Exercises
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {POPULAR_EXERCISES.map(ex => (
              <div key={ex.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
                  <span>{ex.name}</span>
                  <span style={{ color: '#5b5c5a' }}>{ex.logs} logs</span>
                </div>
                <div style={{ height: 8, background: '#e8e2d6', borderRadius: 9999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${ex.pct}%`, background: '#38671a', borderRadius: 9999 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="adm-metric-card" style={{ background: '#c3fb9c', flex: 1 }}>
            <p className="adm-metric-label" style={{ color: 'rgba(33,79,1,0.7)' }}>Avg Workouts</p>
            <p className="adm-metric-value" style={{ color: '#214f01' }}>3.4<span style={{ fontSize: 20 }}>/week</span></p>
            <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
              {[1, 2, 3].map(d => (
                <div key={d} style={{ width: 20, height: 20, borderRadius: '50%', background: '#214f01' }} />
              ))}
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(33,79,1,0.3)' }} />
            </div>
          </div>
          <div className="adm-metric-card" style={{ flex: 1 }}>
            <div style={{ position: 'absolute', top: 16, right: 16, width: 40, height: 40, borderRadius: '50%', background: '#f9f2e5', border: '2px dashed #38671a', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(12deg)' }}>
              <span className="material-symbols-outlined" style={{ color: '#38671a', fontSize: 20 }}>restaurant</span>
            </div>
            <p className="adm-metric-label">Avg Calories</p>
            <p className="adm-metric-value">2,150<span style={{ fontSize: 20 }}> kcal</span></p>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, marginTop: 8, color: '#38671a', fontWeight: 700, letterSpacing: '1px' }}>SURPLUS TREND: +150</p>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#2e2f2e', fontWeight: 700, marginBottom: 16 }}>
          Recent Activity
        </p>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Action</th>
                <th>Role</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_ACTIVITY.map((a, i) => (
                <tr key={i}>
                  <td><strong>{a.user}</strong></td>
                  <td style={{ color: '#5b5c5a' }}>{a.action}</td>
                  <td><span className={`adm-chip ${ROLE_COLOR[a.role]}`}>{a.role}</span></td>
                  <td className="adm-td-mono">{a.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
