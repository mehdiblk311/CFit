import { useState, useRef, useEffect } from 'react';
import { useSendChatMessage } from '../../../hooks/queries/useChat';
import './AIAssistant.css';

// ── Mock history data ─────────────────────────────────────────────
const MOCK_HISTORY = [
  {
    id: 'h1',
    tag: 'Nutrition Plan',
    tagColor: 'purple',
    date: 'Today, 10:45 AM',
    preview: "How should I adjust my macros for the marathon training block next month? I'm feeling a bit sluggish...",
  },
  {
    id: 'h2',
    tag: 'Workout Review',
    tagColor: 'green',
    date: 'Yesterday, 4:20 PM',
    preview: "That deadlift session was intense! Can you analyze my form? I want to make sure I'm not rounding my back.",
  },
  {
    id: 'h3',
    tag: 'Supplements',
    tagColor: 'neutral',
    date: 'Oct 24, 09:12 AM',
    preview: 'Recommendation for magnesium glycinate brands available in Morocco? I\'ve been having sleep issues...',
  },
  {
    id: 'h4',
    tag: 'Injury Support',
    tagColor: 'red',
    date: 'Oct 21, 08:30 PM',
    preview: 'Lower back strain during morning kettlebell swings. What\'s the protocol for immediate recovery?',
  },
];

const CHIPS = [
  'Analyze my week',
  'Suggest a meal',
  'Am I overtraining?',
  'Best recovery tips',
];

const INITIAL_MESSAGES = [
  {
    id: 1,
    role: 'user',
    text: 'How is my protein intake looking for this week?',
    time: '10:42 AM',
  },
  {
    id: 2,
    role: 'ai',
    text: 'Based on your protein intake this week (average 110g), you are slightly below your target of 150g. I suggest adding more lean protein to your dinner — try chicken breast, Greek yogurt, or cottage cheese.',
    time: '10:42 AM',
  },
  {
    id: 3,
    role: 'ai',
    text: null,
    time: '10:43 AM',
    workout: {
      title: "Today's Hypertrophy Boost",
      exercises: [
        { name: 'Dumbbell Press', sets: 4, reps: '10-12' },
        { name: 'Incline Flys',   sets: 3, reps: '15'    },
        { name: 'Weighted Dips',  sets: 3, reps: 'AMRAP' },
      ],
    },
  },
];

// ── Sub-components ────────────────────────────────────────────────

function UserBubble({ msg }) {
  return (
    <div className="ai-msg ai-msg--user">
      <div className="ai-bubble ai-bubble--user">
        <p>{msg.text}</p>
      </div>
      <span className="ai-time">{msg.time}</span>
    </div>
  );
}

function AIBubble({ msg }) {
  return (
    <div className="ai-msg ai-msg--ai">
      <div className="ai-bubble ai-bubble--ai">
        <div className="ai-bubble-tag">Coach AI</div>
        {msg.text && <p>{msg.text}</p>}
        {msg.workout && (
          <>
            <h3 className="ai-workout-title">{msg.workout.title}</h3>
            <div className="ai-workout-table-wrap">
              <table className="ai-workout-table">
                <thead>
                  <tr><th>Exercise</th><th>Sets</th><th>Reps</th></tr>
                </thead>
                <tbody>
                  {msg.workout.exercises.map((ex, i) => (
                    <tr key={i}>
                      <td>{ex.name}</td>
                      <td>{ex.sets}</td>
                      <td>{ex.reps}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="ai-save-btn">
              <span className="material-symbols-outlined">save</span>
              Save to My Programs
            </button>
          </>
        )}
      </div>
      <span className="ai-time">{msg.time}</span>
    </div>
  );
}

// ── History Panel ─────────────────────────────────────────────────

function HistoryPanel({ onClose, onSelect }) {
  const [items, setItems] = useState(MOCK_HISTORY);

  function removeItem(id, e) {
    e.stopPropagation();
    setItems(prev => prev.filter(h => h.id !== id));
  }

  const tagClass = {
    purple:  'ai-hist-tag--purple',
    green:   'ai-hist-tag--green',
    neutral: 'ai-hist-tag--neutral',
    red:     'ai-hist-tag--red',
  };

  return (
    <div className="ai-hist-root">
      {/* Header */}
      <header className="ai-hist-header">
        <div className="ai-hist-header-left">
          <button className="ai-hist-back" onClick={onClose} aria-label="Back">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="ai-hist-title"><em>Chat History</em></h1>
        </div>
        <button className="ai-hist-new-btn" onClick={onClose}>
          <span className="material-symbols-outlined">add</span>
          <span className="ai-hist-new-label">New Chat</span>
        </button>
      </header>

      {/* Body */}
      <main className="ai-hist-main">
        <div className="ai-hist-hero">
          <span className="ai-hist-eyebrow">Previous Sessions</span>
          <h2 className="ai-hist-heading">Your Kinetic<br />Conversations</h2>
        </div>

        <div className="ai-hist-list">
          {items.length === 0 && (
            <div className="ai-hist-empty">
              <span className="material-symbols-outlined ai-hist-empty-icon">chat_bubble_outline</span>
              <p>No conversations yet.</p>
            </div>
          )}

          {items.map(h => (
            <div
              key={h.id}
              className="ai-hist-card"
              onClick={() => onSelect(h)}
            >
              <div className="ai-hist-card-body">
                <div className="ai-hist-card-meta">
                  <span className={`ai-hist-tag ${tagClass[h.tagColor]}`}>{h.tag}</span>
                  <span className="ai-hist-date">{h.date}</span>
                </div>
                <p className="ai-hist-preview">{h.preview}</p>
              </div>
              <div className="ai-hist-card-actions">
                <div className="ai-hist-arrow">
                  <span className="material-symbols-outlined">chevron_right</span>
                </div>
                <button
                  className="ai-hist-delete"
                  onClick={(e) => removeItem(h.id, e)}
                  aria-label="Delete conversation"
                >
                  <span className="material-symbols-outlined">delete_outline</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Fresh start card */}
        <div className="ai-hist-fresh">
          <div className="ai-hist-fresh-icon">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", color: '#38671a', fontSize: 28 }}>park</span>
          </div>
          <h4 className="ai-hist-fresh-title">Looking for a fresh start?</h4>
          <p className="ai-hist-fresh-desc">Launch a brand new coaching session for tailored advice.</p>
          <button className="ai-hist-fresh-btn" onClick={onClose}>
            Start a new session
          </button>
        </div>
      </main>
    </div>
  );
}

// ── Main AIAssistant ──────────────────────────────────────────────

export default function AIAssistant() {
  const [showHistory, setShowHistory] = useState(false);
  const [messages, setMessages]       = useState(INITIAL_MESSAGES);
  const [input, setInput]             = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading]         = useState(false);
  const msgIdRef = useRef(INITIAL_MESSAGES.length + 1);
  const bottomRef = useRef(null);
  const sendChatMessage = useSendChatMessage();

  function nextMessageId() {
    const id = msgIdRef.current;
    msgIdRef.current += 1;
    return id;
  }

  function nowLabel() {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text) {
    if (!text.trim() || loading) return;
    const messageText = text.trim();
    const userMsg = {
      id: nextMessageId(),
      role: 'user',
      text: messageText,
      time: nowLabel(),
    };
    setMessages(p => [...p, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const response = await sendChatMessage.mutateAsync({
        message: messageText,
        conversation_id: conversationId,
      });
      if (response?.conversation_id) {
        setConversationId(response.conversation_id);
      }
      setMessages((p) => [
        ...p,
        {
          id: nextMessageId(),
          role: 'ai',
          text: response?.message || 'I could not generate a reply right now. Please try again.',
          time: nowLabel(),
        },
      ]);
    } catch {
      setMessages((p) => [
        ...p,
        {
          id: nextMessageId(),
          role: 'ai',
          text: 'I ran into a connection issue. Please retry in a moment.',
          time: nowLabel(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleHistorySelect(thread) {
    // Load thread preview as a user message and close history
    setMessages([
      { id: nextMessageId(), role: 'user', text: thread.preview, time: thread.date },
      { id: nextMessageId(), role: 'ai', text: "Let me pick up where we left off. Here's a summary of what we discussed in this session...", time: 'Now' },
    ]);
    setConversationId(null);
    setShowHistory(false);
  }

  if (showHistory) {
    return (
      <HistoryPanel
        onClose={() => setShowHistory(false)}
        onSelect={handleHistorySelect}
      />
    );
  }

  return (
    <div className="ai-root">
      {/* Header */}
      <header className="ai-header">
        <div className="ai-header-left">
          <div className="ai-avatar">
            <span className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1", color: '#d6ffb7', fontSize: 22 }}>
              smart_toy
            </span>
          </div>
          <div>
            <h1 className="ai-title">AI Assistant</h1>
            <p className="ai-subtitle">UM6P_Fit Coach</p>
          </div>
        </div>
        <button className="ai-history-btn" onClick={() => setShowHistory(true)} aria-label="Chat history">
          <span className="material-symbols-outlined">history</span>
        </button>
      </header>

      {/* Messages */}
      <main className="ai-main">
        {messages.map(msg =>
          msg.role === 'user'
            ? <UserBubble key={msg.id} msg={msg} />
            : <AIBubble   key={msg.id} msg={msg} />
        )}
        {loading && (
          <div className="ai-msg ai-msg--ai">
            <div className="ai-bubble ai-bubble--ai ai-bubble--typing">
              <div className="ai-bubble-tag">Coach AI</div>
              <div className="ai-typing-dots">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </main>

      {/* Input area */}
      <section className="ai-input-area">
        <div className="ai-chips">
          {CHIPS.map(chip => (
            <button key={chip} className="ai-chip" onClick={() => sendMessage(chip)}>
              {chip}
            </button>
          ))}
        </div>
        <div className="ai-input-bar">
          <input
            className="ai-input"
            type="text"
            placeholder="Ask me anything about your fitness..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
          />
          <button
            className="ai-send-btn"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            aria-label="Send"
          >
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </section>
    </div>
  );
}
