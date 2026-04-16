import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useChatConversations,
  useConversationMessages,
  useCoachSummary,
  useSendChatMessage,
  useSubmitChatFeedback,
} from '../../../hooks/queries/useChat';
import './AIAssistant.css';

const STARTER_PROMPTS = [
  { label: 'Weekly analysis', prompt: 'Analyze my week and tell me what to improve' },
  { label: 'Recovery day', prompt: 'Build me a recovery-focused training day' },
  { label: 'Protein check', prompt: 'Am I hitting enough protein for muscle gain?' },
  { label: 'Meal plan', prompt: 'Give me a practical meal plan for today' },
];

const CONTEXT_LINKS = [
  {
    id: 'workouts',
    label: 'Workouts',
    icon: 'fitness_center',
    path: '/workouts',
    state: { tab: 'programs' },
    keywords: ['workout', 'training', 'session', 'sets', 'reps', 'program', 'volume', 'cardio'],
  },
  {
    id: 'nutrition',
    label: 'Nutrition',
    icon: 'restaurant',
    path: '/nutrition',
    keywords: ['nutrition', 'meal', 'calorie', 'protein', 'carbs', 'fat', 'macro', 'food'],
  },
  {
    id: 'exercise-library',
    label: 'Exercises',
    icon: 'menu_book',
    path: '/workouts',
    state: { tab: 'library' },
    keywords: ['exercise', 'movement', 'form', 'muscle', 'technique', 'library'],
  },
];

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function clampPercent(value) {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 100) return 100;
  return value;
}

function formatWholeNumber(value) {
  if (!Number.isFinite(value)) return '0';
  return Math.round(value).toLocaleString('en-US');
}

function formatMetricLabel(value, unit = '') {
  return `${formatWholeNumber(value)}${unit}`;
}

function formatMetricTarget(value, unit = '') {
  if (!Number.isFinite(value) || value <= 0) return '—';
  return `${formatWholeNumber(value)}${unit}`;
}

function formatClock(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatThreadDate(value) {
  if (!value) return 'Just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return `Today · ${formatClock(value)}`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function inferContextLinks(content) {
  const normalized = (content || '').toLowerCase();
  if (!normalized) return [];
  return CONTEXT_LINKS.filter((link) =>
    link.keywords.some((keyword) => normalized.includes(keyword))
  );
}

function getConversationPreview(conversation) {
  const messages = toArray(conversation?.messages);
  const candidate = [...messages]
    .reverse()
    .find((m) => (m?.role === 'assistant' || m?.role === 'user') && m?.content);
  return candidate?.content || '';
}

function getConversationTitle(conversation) {
  const rawTitle = (conversation?.title || '').trim();
  if (rawTitle && rawTitle.toLowerCase() !== 'new conversation') return rawTitle;
  const preview = getConversationPreview(conversation);
  if (preview) return preview;
  return 'New coaching conversation';
}

function sortMessagesChronologically(messages) {
  return toArray(messages)
    .map((message, index) => ({ message, index }))
    .sort((a, b) => {
      const aTime = Date.parse(a.message?.created_at || '') || 0;
      const bTime = Date.parse(b.message?.created_at || '') || 0;
      if (aTime !== bTime) return aTime - bTime;
      return a.index - b.index;
    })
    .map((entry) => entry.message);
}

function summarizeCoachContext(rawSummary) {
  const daily = rawSummary?.daily_summary || {};
  const streaks = rawSummary?.streaks?.streaks || {};
  const adherence = rawSummary?.streaks?.adherence_summary || {};
  const recommendations = toArray(rawSummary?.recommendations?.rules).filter(
    (rule) => rule?.applies !== false
  );
  const records = toArray(rawSummary?.records);

  const caloriesTotal = Number(daily.total_calories || 0);
  const caloriesTarget = Number(daily.target_calories || 0);
  const proteinTotal = Number(daily.total_protein || 0);
  const proteinTarget = Number(daily.target_protein || 0);

  return {
    caloriesTotal,
    caloriesTarget,
    caloriesProgress: caloriesTarget > 0 ? clampPercent((caloriesTotal / caloriesTarget) * 100) : 0,
    proteinTotal,
    proteinTarget,
    proteinProgress: proteinTarget > 0 ? clampPercent((proteinTotal / proteinTarget) * 100) : 0,
    workoutStreak: Number(streaks.workout_streak || 0),
    mealStreak: Number(streaks.meal_streak || 0),
    adherence7: Number(adherence.days_7 || 0),
    recommendations,
    recordsCount: records.length,
  };
}

/* ── Message Bubble ────────────────────────────────────────────── */

function MessageBubble({ message, onFeedback, feedbackPending, onNavigate }) {
  const isUser = message.role === 'user';
  const links = isUser ? [] : inferContextLinks(message.content);

  return (
    <article
      className={`coach-msg${isUser ? ' coach-msg--user' : ' coach-msg--assistant'}`}
    >
      <div className={`coach-bubble${isUser ? ' coach-bubble--user' : ' coach-bubble--assistant'}`}>
        {!isUser && (
          <span className="coach-badge">Coach AI</span>
        )}

        <div className="coach-bubble__copy">
          {String(message.content || '')
            .split('\n')
            .filter((line) => line.trim())
            .map((line, i) => (
              <p key={`${message.id || message.created_at || 'm'}-${i}`}>{line}</p>
            ))}
        </div>

        {!isUser && links.length > 0 && (
          <div className="coach-bubble__links" role="group" aria-label="Context links">
            {links.map((link) => (
              <button
                key={`${message.id || message.created_at || 'm'}-${link.id}`}
                type="button"
                className="coach-ctx-link"
                onClick={() => onNavigate(link.path, link.state)}
              >
                <span className="material-symbols-outlined">{link.icon}</span>
                <span>{link.label}</span>
              </button>
            ))}
          </div>
        )}

        {!isUser && message.id && (
          <div className="coach-feedback" role="group" aria-label="Rate this answer">
            <button
              type="button"
              className={`coach-feedback__btn${message.feedback === 1 ? ' coach-feedback__btn--up' : ''}`}
              onClick={() => onFeedback(message.id, 1)}
              disabled={feedbackPending}
              aria-label="Helpful"
            >
              <span className="material-symbols-outlined">thumb_up</span>
            </button>
            <button
              type="button"
              className={`coach-feedback__btn${message.feedback === -1 ? ' coach-feedback__btn--down' : ''}`}
              onClick={() => onFeedback(message.id, -1)}
              disabled={feedbackPending}
              aria-label="Needs improvement"
            >
              <span className="material-symbols-outlined">thumb_down</span>
            </button>
          </div>
        )}
      </div>

      <span className="coach-msg__time">{formatClock(message.created_at)}</span>
    </article>
  );
}

/* ── Context Panel ─────────────────────────────────────────────── */

function ContextPanel({ context, loading }) {
  if (loading) {
    return (
      <div className="coach-ctx coach-ctx--loading">
        <div className="coach-ctx__shimmer" />
        <div className="coach-ctx__shimmer coach-ctx__shimmer--short" />
        <div className="coach-ctx__shimmer coach-ctx__shimmer--narrow" />
      </div>
    );
  }

  const hasAnyData =
    context.caloriesTarget > 0 ||
    context.proteinTarget > 0 ||
    context.workoutStreak > 0 ||
    context.mealStreak > 0 ||
    context.adherence7 > 0 ||
    context.recordsCount > 0;

  return (
    <aside className="coach-ctx">
      <div className="coach-ctx__head">
        <h2>Today&apos;s Context</h2>
        <span className="coach-ctx__label">{hasAnyData ? 'Grounded in your data' : 'Getting started'}</span>
      </div>

      {!hasAnyData ? (
        <div className="coach-ctx__onboard">
          <span className="material-symbols-outlined coach-ctx__onboard-icon">rocket_launch</span>
          <div className="coach-ctx__onboard-body">
            <p className="coach-ctx__onboard-title">Track to unlock insights</p>
            <p className="coach-ctx__onboard-desc">
              Log a workout or meal and your stats will appear here. Your coach gets smarter with every entry.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="coach-ctx__meters">
            <div className="coach-meter">
              <div className="coach-meter__row">
                <span>Calories</span>
                <strong>
                  {formatMetricLabel(context.caloriesTotal)} / {formatMetricTarget(context.caloriesTarget)}
                </strong>
              </div>
              <div className="coach-meter__track">
                <div
                  className="coach-meter__fill"
                  style={{ width: `${context.caloriesProgress}%` }}
                />
              </div>
            </div>

            <div className="coach-meter">
              <div className="coach-meter__row">
                <span>Protein</span>
                <strong>
                  {formatMetricLabel(context.proteinTotal, 'g')} / {formatMetricTarget(context.proteinTarget, 'g')}
                </strong>
              </div>
              <div className="coach-meter__track">
                <div
                  className="coach-meter__fill coach-meter__fill--ube"
                  style={{ width: `${context.proteinProgress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="coach-ctx__kpis">
            <div className="coach-kpi">
              <span className="coach-kpi__label">Workout streak</span>
              <strong className="coach-kpi__value">{context.workoutStreak}<small>wk</small></strong>
            </div>
            <div className="coach-kpi">
              <span className="coach-kpi__label">Meal streak</span>
              <strong className="coach-kpi__value">{context.mealStreak}<small>d</small></strong>
            </div>
            <div className="coach-kpi">
              <span className="coach-kpi__label">7-day adherence</span>
              <strong className="coach-kpi__value">{Math.round(context.adherence7)}<small>%</small></strong>
            </div>
            <div className="coach-kpi">
              <span className="coach-kpi__label">Tracked records</span>
              <strong className="coach-kpi__value">{context.recordsCount}</strong>
            </div>
          </div>
        </>
      )}

      {context.recommendations.length > 0 && (
        <div className="coach-ctx__recs">
          {context.recommendations.slice(0, 2).map((rule) => (
            <div key={rule.id || rule.name} className="coach-rec">
              <span className="material-symbols-outlined">assistant</span>
              <span>{rule.name || 'Recommendation'}</span>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}

/* ── Main Component ─────────────────────────────────────────────── */

export default function AIAssistant() {
  const navigate = useNavigate();

  const [activeConversationId, setActiveConversationId] = useState(null);
  const [composerValue, setComposerValue] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState(null);
  const [pendingFeedbackKey, setPendingFeedbackKey] = useState('');
  const [summaryCollapsed, setSummaryCollapsed] = useState(() => 
    typeof window !== 'undefined' && window.innerWidth < 680
  );

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 680) {
        setSummaryCollapsed(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const threadEndRef = useRef(null);
  const composerRef = useRef(null);
  const pendingIdRef = useRef(0);
  const conversationVersionRef = useRef(0);

  const historyParams = useMemo(() => ({ page: 1, limit: 40 }), []);

  const { data: conversationsData, isLoading: conversationsLoading } =
    useChatConversations(historyParams);
  const { data: conversationData, isLoading: conversationLoading } =
    useConversationMessages(activeConversationId);
  const { data: coachSummaryData, isLoading: coachSummaryLoading } = useCoachSummary();

  const sendMessage = useSendChatMessage();
  const submitFeedback = useSubmitChatFeedback();

  const conversations = useMemo(() => {
    if (Array.isArray(conversationsData?.data)) return conversationsData.data;
    if (Array.isArray(conversationsData)) return conversationsData;
    return [];
  }, [conversationsData]);

  const context = useMemo(
    () => summarizeCoachContext(coachSummaryData),
    [coachSummaryData]
  );

  const renderedMessages = useMemo(() => {
    const serverMessages = sortMessagesChronologically(conversationData?.messages).filter((m) => {
      if (m?.role !== 'assistant' && m?.role !== 'user') return false;
      if (!m?.content) return false;
      return true;
    });

    if (pendingMessage?.conversationId === activeConversationId) {
      return [
        ...serverMessages,
        {
          id: pendingMessage.id,
          role: 'user',
          content: pendingMessage.content,
          created_at: pendingMessage.created_at,
        },
      ];
    }
    return serverMessages;
  }, [activeConversationId, conversationData?.messages, pendingMessage]);

  /* auto-scroll */
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [renderedMessages.length, sendMessage.isPending]);

  /* auto-resize textarea */
  useEffect(() => {
    const textarea = composerRef.current;
    if (!textarea) return;
    textarea.style.height = '0px';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
  }, [composerValue]);

  const selectConversation = useCallback((id) => {
    conversationVersionRef.current += 1;
    setActiveConversationId(id);
  }, []);

  const startNewConversation = useCallback(() => {
    selectConversation(null);
    setHistoryOpen(false);
    setPendingMessage(null);
  }, [selectConversation]);

  const handleSend = useCallback(
    (raw) => {
      const message = String(raw || '').trim();
      if (!message || sendMessage.isPending) return;

      pendingIdRef.current += 1;
      const srcId = activeConversationId;
      const srcVersion = conversationVersionRef.current;

      const optimistic = {
        id: `pending-${pendingIdRef.current}`,
        content: message,
        created_at: new Date().toISOString(),
        conversationId: srcId,
      };

      setPendingMessage(optimistic);
      setComposerValue('');

      sendMessage.mutate(
        { message, conversationId: srcId },
        {
          onSuccess: (response) => {
            if (response?.conversation_id && conversationVersionRef.current === srcVersion) {
              setActiveConversationId(response.conversation_id);
            }
            setPendingMessage((cur) => (cur?.id === optimistic.id ? null : cur));
          },
          onError: () => {
            setPendingMessage((cur) => (cur?.id === optimistic.id ? null : cur));
          },
        }
      );
    },
    [activeConversationId, sendMessage]
  );

  const handleFeedback = useCallback(
    (messageId, feedback) => {
      if (!activeConversationId || !messageId) return;
      const key = `${messageId}:${feedback}`;
      setPendingFeedbackKey(key);
      submitFeedback.mutate(
        { messageId, feedback, conversationId: activeConversationId },
        { onSettled: () => setPendingFeedbackKey('') }
      );
    },
    [activeConversationId, submitFeedback]
  );

  const handleNavigate = useCallback(
    (path, state) => navigate(path, state ? { state } : undefined),
    [navigate]
  );

  return (
    <div className="coach">
      {/* ── Top Bar ─────────────────────────────────────────── */}
      <header className="coach-topbar">
        <div className="coach-topbar__left">
          <button
            type="button"
            className="coach-topbar__menu"
            onClick={() => setHistoryOpen(true)}
            aria-label="Conversation history"
          >
            <span className="material-symbols-outlined">history</span>
          </button>
          <div className="coach-topbar__brand">
            <span className="coach-topbar__eyebrow">Coach</span>
            <h1 className="coach-topbar__title">Kinetic AI</h1>
          </div>
        </div>

        <div className="coach-topbar__right">
          <button
            type="button"
            className="coach-topbar__new"
            onClick={startNewConversation}
          >
            <span className="material-symbols-outlined">add</span>
            <span>New chat</span>
          </button>
        </div>
      </header>

      {/* ── Shell ───────────────────────────────────────────── */}
      <div className="coach-shell">
        {/* ── History Drawer ──────────────────────────────── */}
        <aside className={`coach-history${historyOpen ? ' coach-history--open' : ''}`}>
          <div className="coach-history__head">
            <h2>Threads</h2>
            <button type="button" className="coach-history__fresh" onClick={startNewConversation}>
              <span className="material-symbols-outlined">add</span>
              <span>New</span>
            </button>
          </div>

          <div className="coach-history__list">
            {conversationsLoading ? (
              <div className="coach-history__skeletons">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="coach-history__skeleton" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="coach-history__empty">
                <span className="material-symbols-outlined">chat_bubble_outline</span>
                <p>No saved threads yet</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const title = getConversationTitle(conv);
                const preview = getConversationPreview(conv) || 'Continue this thread';
                const isActive = conv.id === activeConversationId;
                return (
                  <button
                    key={conv.id}
                    type="button"
                    className={`coach-history__card${isActive ? ' coach-history__card--active' : ''}`}
                    onClick={() => {
                      selectConversation(conv.id);
                      setHistoryOpen(false);
                    }}
                  >
                    <span className="coach-history__card-title">{title}</span>
                    <span className="coach-history__card-preview">{preview}</span>
                    <span className="coach-history__card-date">
                      {formatThreadDate(conv.updated_at)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ── Main Panel ──────────────────────────────────── */}
        <section className="coach-panel">
          {/* Context summary – collapsible */}
          <div className={`coach-ctx-wrapper${summaryCollapsed ? ' coach-ctx-wrapper--collapsed' : ''}`}>
            <ContextPanel context={context} loading={coachSummaryLoading} />
            <button
              type="button"
              className="coach-ctx-toggle"
              onClick={() => setSummaryCollapsed((v) => !v)}
              aria-label={summaryCollapsed ? 'Expand context' : 'Collapse context'}
            >
              <span className="material-symbols-outlined">
                {summaryCollapsed ? 'expand_more' : 'expand_less'}
              </span>
            </button>
          </div>

          {/* Thread */}
          <section className="coach-thread" aria-live="polite">
            {activeConversationId && conversationLoading ? (
              <div className="coach-thread__loading">
                <div className="coach-thread__spinner" />
                <span>Loading conversation…</span>
              </div>
            ) : renderedMessages.length === 0 ? (
              <div className="coach-thread__empty">
                <div className="coach-thread__empty-icon">
                  <span className="material-symbols-outlined">smart_toy</span>
                </div>
                <h3>Ask your coach anything</h3>
                <p>
                  Workouts, nutrition, recovery, progress — your coach is rooted in your real data.
                </p>
                <div className="coach-thread__empty-hint">
                  <span className="material-symbols-outlined">touch_app</span>
                  <span>Tap a suggestion below or type your question</span>
                </div>
              </div>
            ) : (
              renderedMessages.map((message) => (
                <MessageBubble
                  key={message.id || message.created_at}
                  message={message}
                  onFeedback={handleFeedback}
                  feedbackPending={
                    submitFeedback.isPending && pendingFeedbackKey.startsWith(`${message.id}:`)
                  }
                  onNavigate={handleNavigate}
                />
              ))
            )}

            {sendMessage.isPending && (
              <article className="coach-msg coach-msg--assistant">
                <div className="coach-bubble coach-bubble--assistant coach-bubble--typing">
                  <span className="coach-badge">Coach AI</span>
                  <div className="coach-typing">
                    <span /><span /><span />
                  </div>
                </div>
              </article>
            )}

            <div ref={threadEndRef} />
          </section>

          {/* Composer */}
          <form
            className="coach-composer"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(composerValue);
            }}
          >
            {renderedMessages.length === 0 && (
              <div className="coach-prompts" role="group" aria-label="Starter prompts">
                {STARTER_PROMPTS.map((sp) => (
                  <button
                    key={sp.label}
                    type="button"
                    className="coach-prompt"
                    onClick={() => handleSend(sp.prompt)}
                    disabled={sendMessage.isPending}
                  >
                    {sp.label}
                  </button>
                ))}
              </div>
            )}

            <div className="coach-composer__row">
              <textarea
                ref={composerRef}
                className="coach-composer__input"
                value={composerValue}
                rows={1}
                placeholder="Ask about training, nutrition, or recovery…"
                onChange={(e) => setComposerValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(composerValue);
                  }
                }}
              />
              <button
                type="submit"
                className="coach-composer__send"
                disabled={!composerValue.trim() || sendMessage.isPending}
                aria-label="Send message"
              >
                <span className="material-symbols-outlined">arrow_upward</span>
              </button>
            </div>
          </form>
        </section>
      </div>

      {/* ── Backdrop ──────────────────────────────────────── */}
      {historyOpen && (
        <button
          type="button"
          className="coach-backdrop"
          aria-label="Close history"
          onClick={() => setHistoryOpen(false)}
        />
      )}
    </div>
  );
}
