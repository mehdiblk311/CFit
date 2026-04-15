import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import {
  useChatConversations,
  useConversationMessages,
  useCoachSummary,
  useSendChatMessage,
  useSubmitChatFeedback,
} from '../../../hooks/queries/useChat';
import './AIAssistant.css';

const STARTER_PROMPTS = [
  'Analyze my week and tell me what to improve',
  'Build me a recovery-focused training day',
  'Am I hitting enough protein for muscle gain?',
  'Give me a practical meal plan for today',
];

const CONTEXT_LINKS = [
  {
    id: 'workouts',
    label: 'Open Workouts',
    icon: 'fitness_center',
    path: '/workouts',
    state: { tab: 'programs' },
    keywords: ['workout', 'training', 'session', 'sets', 'reps', 'program', 'volume', 'cardio'],
  },
  {
    id: 'nutrition',
    label: 'Open Nutrition',
    icon: 'restaurant',
    path: '/nutrition',
    keywords: ['nutrition', 'meal', 'calorie', 'protein', 'carbs', 'fat', 'macro', 'food'],
  },
  {
    id: 'exercise-library',
    label: 'Exercise Library',
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

function formatClock(value) {
  if (!value) return 'now';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'now';

  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatThreadDate(value) {
  if (!value) return 'Just now';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';

  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return `Today · ${formatClock(value)}`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
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
    .find((message) => (message?.role === 'assistant' || message?.role === 'user') && message?.content);

  return candidate?.content || '';
}

function getConversationTitle(conversation) {
  const rawTitle = (conversation?.title || '').trim();
  if (rawTitle && rawTitle.toLowerCase() !== 'new conversation') return rawTitle;

  const preview = getConversationPreview(conversation);
  if (preview) return preview;

  return 'New coaching conversation';
}

function summarizeCoachContext(rawSummary) {
  const daily = rawSummary?.daily_summary || {};
  const streaks = rawSummary?.streaks?.streaks || {};
  const adherence = rawSummary?.streaks?.adherence_summary || {};
  const recommendations = toArray(rawSummary?.recommendations?.rules).filter((rule) => rule?.applies !== false);
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

function MessageBubble({
  message,
  onFeedback,
  feedbackPending,
  onNavigate,
}) {
  const isUser = message.role === 'user';
  const links = isUser ? [] : inferContextLinks(message.content);
  const feedbackValue = message.feedback;

  return (
    <article className={`ai-coach-message ${isUser ? 'ai-coach-message--user' : 'ai-coach-message--assistant'}`}>
      <div className={`ai-coach-bubble ${isUser ? 'ai-coach-bubble--user' : 'ai-coach-bubble--assistant'}`}>
        {!isUser && <span className="ai-coach-badge">Coach AI</span>}

        <div className="ai-coach-copy">
          {String(message.content || '')
            .split('\n')
            .filter((line) => line.trim())
            .map((line, index) => (
              <p key={`${message.id || message.created_at || 'msg'}-${index}`}>{line}</p>
            ))}
        </div>

        {!isUser && links.length > 0 && (
          <div className="ai-coach-links" role="group" aria-label="Context links">
            {links.map((link) => (
              <button
                key={`${message.id || message.created_at || 'msg'}-${link.id}`}
                type="button"
                className="ai-coach-link"
                onClick={() => onNavigate(link.path, link.state)}
              >
                <span className="material-symbols-outlined">{link.icon}</span>
                <span>{link.label}</span>
              </button>
            ))}
          </div>
        )}

        {!isUser && message.id && (
          <div className="ai-coach-feedback" role="group" aria-label="Rate this answer">
            <button
              type="button"
              className={`ai-coach-feedback-btn${feedbackValue === 1 ? ' ai-coach-feedback-btn--active' : ''}`}
              onClick={() => onFeedback(message.id, 1)}
              disabled={feedbackPending}
            >
              <span className="material-symbols-outlined">thumb_up</span>
              Helpful
            </button>
            <button
              type="button"
              className={`ai-coach-feedback-btn${feedbackValue === -1 ? ' ai-coach-feedback-btn--active' : ''}`}
              onClick={() => onFeedback(message.id, -1)}
              disabled={feedbackPending}
            >
              <span className="material-symbols-outlined">thumb_down</span>
              Improve
            </button>
          </div>
        )}
      </div>

      <span className="ai-coach-time">{formatClock(message.created_at)}</span>
    </article>
  );
}

export default function AIAssistant() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeConversationId, setActiveConversationId] = useState(null);
  const [composerValue, setComposerValue] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState(null);
  const [pendingFeedbackKey, setPendingFeedbackKey] = useState('');

  const threadEndRef = useRef(null);
  const composerRef = useRef(null);
  const pendingIdRef = useRef(0);
  const conversationSelectionVersionRef = useRef(0);

  const historyParams = useMemo(() => ({ page: 1, limit: 40 }), []);

  const { data: conversationsData, isLoading: conversationsLoading } = useChatConversations(historyParams);
  const { data: conversationData, isLoading: conversationLoading } = useConversationMessages(activeConversationId);
  const { data: coachSummaryData, isLoading: coachSummaryLoading } = useCoachSummary();

  const sendMessage = useSendChatMessage();
  const submitFeedback = useSubmitChatFeedback();

  const conversations = useMemo(() => {
    if (Array.isArray(conversationsData?.data)) return conversationsData.data;
    if (Array.isArray(conversationsData)) return conversationsData;
    return [];
  }, [conversationsData]);

  const renderedMessages = useMemo(() => {
    const serverMessages = toArray(conversationData?.messages).filter((message) => {
      if (message?.role !== 'assistant' && message?.role !== 'user') return false;
      if (!message?.content) return false;
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

  const context = useMemo(() => summarizeCoachContext(coachSummaryData), [coachSummaryData]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [renderedMessages.length, sendMessage.isPending]);

  useEffect(() => {
    const textarea = composerRef.current;
    if (!textarea) return;

    textarea.style.height = '0px';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
  }, [composerValue]);

  function selectConversation(conversationId) {
    conversationSelectionVersionRef.current += 1;
    setActiveConversationId(conversationId);
  }

  function startNewConversation() {
    selectConversation(null);
    setHistoryOpen(false);
    setPendingMessage(null);
  }

  function handleSend(rawMessage) {
    const message = String(rawMessage || '').trim();
    if (!message || sendMessage.isPending) return;

    pendingIdRef.current += 1;
    const sourceConversationId = activeConversationId;
    const sourceSelectionVersion = conversationSelectionVersionRef.current;

    const optimistic = {
      id: `pending-${pendingIdRef.current}`,
      content: message,
      created_at: new Date().toISOString(),
      conversationId: sourceConversationId,
    };

    setPendingMessage(optimistic);
    setComposerValue('');

    sendMessage.mutate(
      {
        message,
        conversationId: sourceConversationId,
      },
      {
        onSuccess: (response) => {
          if (
            response?.conversation_id &&
            conversationSelectionVersionRef.current === sourceSelectionVersion
          ) {
            setActiveConversationId(response.conversation_id);
          }
          setPendingMessage((current) => (current?.id === optimistic.id ? null : current));
        },
        onError: () => {
          setPendingMessage((current) => (current?.id === optimistic.id ? null : current));
        },
      }
    );
  }

  function handleFeedback(messageId, feedback) {
    if (!activeConversationId || !messageId) return;

    const key = `${messageId}:${feedback}`;
    setPendingFeedbackKey(key);

    submitFeedback.mutate(
      {
        messageId,
        feedback,
        conversationId: activeConversationId,
      },
      {
        onSettled: () => {
          setPendingFeedbackKey('');
        },
      }
    );
  }

  function handleNavigate(path, state) {
    navigate(path, state ? { state } : undefined);
  }

  return (
    <div className="ai-coach-root">
      <header className="ai-coach-topbar">
        <div className="ai-coach-topbar-left">
          <button
            type="button"
            className="ai-coach-topbar-history"
            onClick={() => setHistoryOpen(true)}
            aria-label="Open conversation history"
          >
            <span className="material-symbols-outlined">history</span>
          </button>
          <div>
            <p className="ai-coach-eyebrow">AI Coach</p>
            <h1 className="ai-coach-title">Kinetic Coaching</h1>
          </div>
        </div>

        <div className="ai-coach-topbar-right">
          <div className="ai-coach-user-pill">
            <span className="material-symbols-outlined">face</span>
            <span>{user?.name || 'Athlete'}</span>
          </div>
          <button type="button" className="ai-coach-new-btn" onClick={startNewConversation}>
            <span className="material-symbols-outlined">add</span>
            New Chat
          </button>
        </div>
      </header>

      <div className="ai-coach-shell">
        <aside className={`ai-coach-history${historyOpen ? ' ai-coach-history--open' : ''}`}>
          <div className="ai-coach-history-head">
            <h2>Conversations</h2>
            <button type="button" onClick={startNewConversation}>
              <span className="material-symbols-outlined">add</span>
              Fresh Session
            </button>
          </div>

          <div className="ai-coach-history-list">
            {conversationsLoading ? (
              <div className="ai-coach-history-loading">
                {[1, 2, 3].map((row) => (
                  <div key={row} className="ai-coach-history-skeleton" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="ai-coach-history-empty">
                <span className="material-symbols-outlined">chat_bubble_outline</span>
                <p>No saved threads yet.</p>
              </div>
            ) : (
              conversations.map((conversation) => {
                const title = getConversationTitle(conversation);
                const preview = getConversationPreview(conversation) || 'Tap to continue this coaching thread.';
                const isActive = conversation.id === activeConversationId;

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    className={`ai-coach-history-card${isActive ? ' ai-coach-history-card--active' : ''}`}
                    onClick={() => {
                      selectConversation(conversation.id);
                      setHistoryOpen(false);
                    }}
                  >
                    <span className="ai-coach-history-card-title">{title}</span>
                    <span className="ai-coach-history-card-preview">{preview}</span>
                    <span className="ai-coach-history-card-date">{formatThreadDate(conversation.updated_at)}</span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="ai-coach-panel">
          <section className="ai-coach-summary">
            <div className="ai-coach-summary-head">
              <h2>Today&apos;s Context</h2>
              <span>Grounded in your data</span>
            </div>

            {coachSummaryLoading ? (
              <div className="ai-coach-summary-loading" />
            ) : (
              <>
                <div className="ai-coach-meters">
                  <div className="ai-coach-meter">
                    <div className="ai-coach-meter-row">
                      <span>Calories</span>
                      <strong>
                        {Math.round(context.caloriesTotal)} / {context.caloriesTarget || '—'}
                      </strong>
                    </div>
                    <div className="ai-coach-meter-track">
                      <div className="ai-coach-meter-fill" style={{ width: `${context.caloriesProgress}%` }} />
                    </div>
                  </div>

                  <div className="ai-coach-meter">
                    <div className="ai-coach-meter-row">
                      <span>Protein</span>
                      <strong>
                        {Math.round(context.proteinTotal)}g / {context.proteinTarget || '—'}g
                      </strong>
                    </div>
                    <div className="ai-coach-meter-track">
                      <div className="ai-coach-meter-fill ai-coach-meter-fill--purple" style={{ width: `${context.proteinProgress}%` }} />
                    </div>
                  </div>
                </div>

                <div className="ai-coach-kpis">
                  <div>
                    <span>Workout streak</span>
                    <strong>{context.workoutStreak} wk</strong>
                  </div>
                  <div>
                    <span>Meal streak</span>
                    <strong>{context.mealStreak} d</strong>
                  </div>
                  <div>
                    <span>7-day adherence</span>
                    <strong>{Math.round(context.adherence7)}%</strong>
                  </div>
                  <div>
                    <span>Tracked records</span>
                    <strong>{context.recordsCount}</strong>
                  </div>
                </div>

                {context.recommendations.length > 0 && (
                  <div className="ai-coach-recommendations">
                    {context.recommendations.slice(0, 2).map((rule) => (
                      <div key={rule.id || rule.name} className="ai-coach-rec-chip">
                        <span className="material-symbols-outlined">assistant</span>
                        <span>{rule.name || 'Recommendation'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

          <section className="ai-coach-thread" aria-live="polite">
            {activeConversationId && conversationLoading ? (
              <div className="ai-coach-thread-loading">
                <div className="ai-coach-thread-spinner" />
                Loading conversation…
              </div>
            ) : renderedMessages.length === 0 ? (
              <div className="ai-coach-empty">
                <span className="material-symbols-outlined">smart_toy</span>
                <h3>Ask your coach anything</h3>
                <p>
                  Use a starter prompt or ask about workouts, nutrition, recovery, and progress.
                </p>
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
              <article className="ai-coach-message ai-coach-message--assistant">
                <div className="ai-coach-bubble ai-coach-bubble--assistant ai-coach-bubble--typing">
                  <span className="ai-coach-badge">Coach AI</span>
                  <div className="ai-coach-typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </article>
            )}

            <div ref={threadEndRef} />
          </section>

          <form
            className="ai-coach-composer"
            onSubmit={(event) => {
              event.preventDefault();
              handleSend(composerValue);
            }}
          >
            <div className="ai-coach-prompts" role="group" aria-label="Starter prompts">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="ai-coach-prompt"
                  onClick={() => handleSend(prompt)}
                  disabled={sendMessage.isPending}
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="ai-coach-composer-row">
              <textarea
                ref={composerRef}
                className="ai-coach-input"
                value={composerValue}
                rows={1}
                placeholder="Ask for a plan, nutrition adjustment, or recovery strategy…"
                onChange={(event) => setComposerValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleSend(composerValue);
                  }
                }}
              />
              <button
                type="submit"
                className="ai-coach-send"
                disabled={!composerValue.trim() || sendMessage.isPending}
                aria-label="Send message"
              >
                <span className="material-symbols-outlined">arrow_upward</span>
              </button>
            </div>
          </form>
        </section>
      </div>

      {historyOpen && (
        <button
          type="button"
          className="ai-coach-backdrop"
          aria-label="Close conversation history"
          onClick={() => setHistoryOpen(false)}
        />
      )}
    </div>
  );
}
