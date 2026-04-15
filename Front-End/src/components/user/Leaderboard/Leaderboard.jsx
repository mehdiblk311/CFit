import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { leaderboardAPI } from '../../../api/leaderboard';
import { useAuth } from '../../../hooks/useAuth';
import { useLeaderboard } from '../../../hooks/queries/useLeaderboard';
import './Leaderboard.css';

const PERIOD_FILTERS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'alltime', label: 'All-Time' },
];

const PILLAR_FILTERS = [
  { value: 'all', label: 'All Pillars' },
  { value: 'training', label: 'Training' },
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'consistency', label: 'Consistency' },
];

const PILLAR_META = {
  training: {
    icon: 'fitness_center',
    label: 'Iron Engine',
    tone: 'training',
  },
  nutrition: {
    icon: 'restaurant',
    label: 'Fuel Master',
    tone: 'nutrition',
  },
  consistency: {
    icon: 'event_repeat',
    label: 'Rhythm Keeper',
    tone: 'consistency',
  },
};

const LIMIT = 20;
const SNAPSHOT_LIMIT = 100;

function formatScore(value) {
  if (!Number.isFinite(value)) return '0';
  if (value >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (value >= 100) return value.toFixed(1);
  return value.toFixed(2);
}

function normalizeId(value) {
  return String(value || '').toLowerCase();
}

function getInitial(name) {
  return String(name || 'A').trim().charAt(0).toUpperCase() || 'A';
}

function scoreForPillar(entry, pillar) {
  if (!entry) return 0;
  if (pillar === 'training') return entry.training_score;
  if (pillar === 'nutrition') return entry.nutrition_score;
  if (pillar === 'consistency') return entry.consistency_score;
  return entry.score;
}

function getPillarMedal(entry) {
  if (!entry) return null;

  const scores = [
    { key: 'training', value: Number(entry.training_score) || 0 },
    { key: 'nutrition', value: Number(entry.nutrition_score) || 0 },
    { key: 'consistency', value: Number(entry.consistency_score) || 0 },
  ];

  const dominant = scores.sort((a, b) => b.value - a.value)[0];
  if (!dominant || dominant.value <= 0) return null;

  return {
    ...PILLAR_META[dominant.key],
    score: dominant.value,
  };
}

function MedalBadge({ entry }) {
  const medal = getPillarMedal(entry);
  if (!medal) return null;

  return (
    <span className={`lb-medal lb-medal--${medal.tone}`}>
      <span className="material-symbols-outlined">{medal.icon}</span>
      <span>{medal.label}</span>
    </span>
  );
}

function PodiumCard({ entry, rankNumber, tone }) {
  if (!entry) return null;

  return (
    <article className={`lb-podium-card lb-podium-card--${tone}`}>
      <span className="lb-podium-rank">#{entry.rank || rankNumber}</span>
      <div className="lb-podium-avatar">
        {entry.avatar ? <img src={entry.avatar} alt="" loading="lazy" /> : getInitial(entry.user_name)}
      </div>
      <h3 className="lb-podium-name">{entry.user_name}</h3>
      <p className="lb-podium-score">{formatScore(entry.score)} pts</p>
      <MedalBadge entry={entry} />
    </article>
  );
}

function MotivationalEmptyState({ onLogWorkout, onLogMeal, onGoDashboard, periodLabel }) {
  return (
    <div className="lb-motivation-empty">
      <div className="lb-empty-hero">
        <span className="material-symbols-outlined lb-empty-icon">emoji_events</span>
        <h2 className="lb-empty-title">No ranking yet for this {periodLabel}</h2>
        <p className="lb-empty-copy">
          First actions create momentum. Start with one workout, one meal log, then keep your streak alive.
        </p>
      </div>

      <div className="lb-empty-steps">
        <article className="lb-step-card lb-step-card--training">
          <span className="lb-step-label">Step 1</span>
          <h3>Train today</h3>
          <p>Workout logs feed your training points immediately.</p>
        </article>

        <article className="lb-step-card lb-step-card--nutrition">
          <span className="lb-step-label">Step 2</span>
          <h3>Log your meals</h3>
          <p>Nutrition consistency compounds and boosts your pillar score.</p>
        </article>

        <article className="lb-step-card lb-step-card--consistency">
          <span className="lb-step-label">Step 3</span>
          <h3>Protect the streak</h3>
          <p>Small daily wins are how athletes climb the league.</p>
        </article>
      </div>

      <div className="lb-empty-actions">
        <button className="lb-empty-btn lb-empty-btn--training" onClick={onLogWorkout}>
          <span className="material-symbols-outlined">fitness_center</span>
          Log Workout
        </button>
        <button className="lb-empty-btn lb-empty-btn--nutrition" onClick={onLogMeal}>
          <span className="material-symbols-outlined">restaurant</span>
          Log Meal
        </button>
        <button className="lb-empty-btn" onClick={onGoDashboard}>
          <span className="material-symbols-outlined">dashboard</span>
          Open Dashboard
        </button>
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [period, setPeriod] = useState('weekly');
  const [pillar, setPillar] = useState('all');
  const [offset, setOffset] = useState(0);

  const rowRefs = useRef({});
  const pendingJumpRef = useRef(false);

  const { data, isLoading, isError, refetch, isFetching } = useLeaderboard({
    period,
    pillar,
    offset,
    limit: LIMIT,
  });

  const { data: snapshotData } = useLeaderboard(
    { period, pillar, offset: 0, limit: SNAPSHOT_LIMIT },
    { enabled: !!user?.id }
  );

  const entries = useMemo(() => data?.entries ?? [], [data?.entries]);
  const total = data?.total || 0;
  const scanTotal = data?.total || snapshotData?.total || 0;
  const currentUserId = normalizeId(user?.id);

  const currentEntryOnPage = useMemo(
    () => entries.find((entry) => normalizeId(entry.user_id) === currentUserId),
    [entries, currentUserId]
  );

  const currentSnapshotEntry = useMemo(
    () => snapshotData?.entries?.find((entry) => normalizeId(entry.user_id) === currentUserId),
    [snapshotData, currentUserId]
  );

  const { data: currentScannedEntry, isFetching: isFindingCurrentEntry } = useQuery({
    queryKey: ['leaderboard-current-entry', currentUserId, period, pillar, scanTotal],
    enabled:
      Boolean(currentUserId) &&
      scanTotal > SNAPSHOT_LIMIT &&
      !currentEntryOnPage &&
      !currentSnapshotEntry,
    queryFn: async () => {
      let targetTotal = scanTotal;
      for (let scanOffset = 0; scanOffset < targetTotal; scanOffset += SNAPSHOT_LIMIT) {
        const page = await leaderboardAPI.getLeaderboard({
          period,
          pillar,
          offset: scanOffset,
          limit: SNAPSHOT_LIMIT,
        });

        if (Number(page?.total) > targetTotal) {
          targetTotal = Number(page.total);
        }

        const found = page?.entries?.find(
          (entry) => normalizeId(entry.user_id) === currentUserId
        );
        if (found) return found;
        if (!Array.isArray(page?.entries) || page.entries.length === 0) break;
      }
      return null;
    },
    staleTime: 1000 * 30,
  });

  const currentEntry = currentEntryOnPage || currentSnapshotEntry || currentScannedEntry || null;
  const currentRank = currentEntry?.rank || null;

  const percentile = useMemo(() => {
    if (!currentRank || !total) return null;
    const pct = ((total - currentRank + 1) / total) * 100;
    return Math.max(1, Math.round(pct));
  }, [currentRank, total]);

  const podiumEntries = useMemo(() => {
    const source = snapshotData?.entries?.length ? snapshotData.entries : entries;
    return source.slice(0, 3);
  }, [snapshotData, entries]);

  const hasPrev = offset > 0;
  const hasNext = offset + LIMIT < total;

  const jumpButtonLabel = useMemo(() => {
    if (isFindingCurrentEntry) return 'Finding your rank...';
    if (!currentEntry) return 'Join board';
    if (currentEntryOnPage) return 'Jump to me';
    return 'Go to my page';
  }, [currentEntry, currentEntryOnPage, isFindingCurrentEntry]);

  useEffect(() => {
    if (!pendingJumpRef.current || !currentEntryOnPage) return;
    const key = normalizeId(currentEntryOnPage.user_id);
    rowRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    pendingJumpRef.current = false;
  }, [currentEntryOnPage]);

  function setRowRef(userId, node) {
    const key = normalizeId(userId);
    if (!key) return;
    if (node) rowRefs.current[key] = node;
    else delete rowRefs.current[key];
  }

  function changePeriod(nextPeriod) {
    setPeriod(nextPeriod);
    setOffset(0);
  }

  function changePillar(nextPillar) {
    setPillar(nextPillar);
    setOffset(0);
  }

  function jumpToMyRank() {
    if (isFindingCurrentEntry) return;

    if (!currentEntry) {
      navigate('/workouts');
      return;
    }

    if (currentEntryOnPage) {
      const key = normalizeId(currentEntryOnPage.user_id);
      rowRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (currentEntry.rank) {
      pendingJumpRef.current = true;
      setOffset(Math.floor((currentEntry.rank - 1) / LIMIT) * LIMIT);
    }
  }

  return (
    <div className="lb-root">
      <header className="lb-header">
        <button
          className="lb-back-btn"
          onClick={() => navigate('/workouts', { state: { tab: 'progress' } })}
          aria-label="Back to progress"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>

        <div className="lb-headline-wrap">
          <h1 className="lb-title">Kinetic League</h1>
          <p className="lb-subtitle">Friendly competition. Real consistency.</p>
        </div>
      </header>

      <main className="lb-main">
        <section className="lb-hero">
          <div className="lb-hero-left">
            <span className="lb-label">Your Standing</span>
            <p className="lb-rank-number">{currentRank ? `#${currentRank}` : '—'}</p>
            <p className="lb-rank-meta">
              {currentEntry
                ? `You are ahead of ${percentile}% of athletes this ${period.replace('alltime', 'all-time')}.`
                : 'Log workouts and meals this week to enter the board.'}
            </p>
          </div>

          <div className="lb-hero-right">
            <div className="lb-sticker lb-sticker--dragon">Motivation</div>
            <span className="lb-mini-label">Score</span>
            <p className="lb-score-number">{formatScore(scoreForPillar(currentEntry, pillar))}</p>
            <span className="lb-mini-note">points</span>
            <MedalBadge entry={currentEntry} />
          </div>
        </section>

        <section className="lb-filters">
          <div className="lb-filter-group" role="tablist" aria-label="Period filter">
            {PERIOD_FILTERS.map((item) => (
              <button
                key={item.value}
                className={`lb-chip${period === item.value ? ' lb-chip--active' : ''}`}
                onClick={() => changePeriod(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="lb-filter-group" role="tablist" aria-label="Pillar filter">
            {PILLAR_FILTERS.map((item) => (
              <button
                key={item.value}
                className={`lb-chip lb-chip--ghost${pillar === item.value ? ' lb-chip--active' : ''}`}
                onClick={() => changePillar(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        {isLoading ? (
          <section className="lb-list-card">
            <div className="lb-loading">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="lb-skeleton-row" />
              ))}
            </div>
          </section>
        ) : isError ? (
          <section className="lb-list-card lb-empty-card">
            <span className="material-symbols-outlined lb-empty-icon">warning</span>
            <h2 className="lb-empty-title">Could not load leaderboard</h2>
            <button className="lb-retry-btn" onClick={() => refetch()}>Try again</button>
          </section>
        ) : (
          <>
            {podiumEntries.length > 0 && (
              <section className="lb-podium-wrap">
                <span className="lb-label">Top Athletes</span>
                <div className="lb-podium-grid">
                  <PodiumCard entry={podiumEntries[1]} rankNumber={2} tone="silver" />
                  <PodiumCard entry={podiumEntries[0]} rankNumber={1} tone="gold" />
                  <PodiumCard entry={podiumEntries[2]} rankNumber={3} tone="bronze" />
                </div>
              </section>
            )}

            <section className="lb-list-card">
              <div className="lb-list-header">
                <span className="lb-label">Rankings</span>
                <div className="lb-list-header-right">
                  <span className="lb-count">{total} athletes</span>
                  <button className="lb-jump-btn" onClick={jumpToMyRank} disabled={isFindingCurrentEntry}>
                    <span className="material-symbols-outlined">my_location</span>
                    {jumpButtonLabel}
                  </button>
                </div>
              </div>

              {entries.length === 0 ? (
                <MotivationalEmptyState
                  periodLabel={period.replace('alltime', 'all-time')}
                  onLogWorkout={() => navigate('/workouts')}
                  onLogMeal={() => navigate('/nutrition')}
                  onGoDashboard={() => navigate('/dashboard')}
                />
              ) : (
                <div className="lb-list">
                  {entries.map((entry) => {
                    const isCurrentUser = normalizeId(entry.user_id) === currentUserId;
                    return (
                      <article
                        key={`${entry.user_id}-${entry.rank}`}
                        ref={(node) => setRowRef(entry.user_id, node)}
                        className={`lb-row${isCurrentUser ? ' lb-row--me' : ''}`}
                      >
                        <div className="lb-rank-badge">#{entry.rank}</div>

                        <div className="lb-avatar">
                          {entry.avatar ? <img src={entry.avatar} alt="" loading="lazy" /> : getInitial(entry.user_name)}
                        </div>

                        <div className="lb-row-main">
                          <div className="lb-name-line">
                            <h3 className="lb-name">{entry.user_name}</h3>
                            {isCurrentUser && <span className="lb-me-pill">You</span>}
                          </div>

                          <div className="lb-breakdown">
                            <span>T {formatScore(entry.training_score)}</span>
                            <span>N {formatScore(entry.nutrition_score)}</span>
                            <span>C {formatScore(entry.consistency_score)}</span>
                          </div>

                          <MedalBadge entry={entry} />
                        </div>

                        <div className="lb-score-col">
                          <span className="lb-score">{formatScore(scoreForPillar(entry, pillar))}</span>
                          <span className="lb-score-label">pts</span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {total > 0 && (
                <div className="lb-pagination">
                  <button className="lb-page-btn" disabled={!hasPrev} onClick={() => setOffset((prev) => Math.max(0, prev - LIMIT))}>
                    Previous
                  </button>
                  <span className="lb-page-meta">
                    {offset + 1}-{Math.min(offset + LIMIT, total)}
                    {isFetching ? ' · updating…' : ''}
                  </span>
                  <button className="lb-page-btn" disabled={!hasNext} onClick={() => setOffset((prev) => prev + LIMIT)}>
                    Next
                  </button>
                </div>
              )}
            </section>

            {!currentEntryOnPage && currentEntry && (
              <section className="lb-my-rank-card">
                <span className="lb-label">Your Rank Snapshot</span>
                <div className="lb-my-rank-row">
                  <p>#{currentEntry.rank}</p>
                  <p>{formatScore(scoreForPillar(currentEntry, pillar))} pts</p>
                </div>
                <button className="lb-jump-btn" onClick={jumpToMyRank} disabled={isFindingCurrentEntry}>
                  <span className="material-symbols-outlined">arrow_downward</span>
                  Jump to my row
                </button>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
