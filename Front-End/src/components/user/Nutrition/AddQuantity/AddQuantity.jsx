import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './AddQuantity.css';

const FOODS_DB = {
  'greek-yogurt': { name: 'Greek Yogurt', desc: 'Full fat, strained', emoji: '🥛', per100: { kcal: 59, p: 10, c: 4, f: 5 } },
  'amlou': { name: 'Amlou', desc: 'Argan oil, almonds, honey', emoji: '🍯', per100: { kcal: 598, p: 15, c: 30, f: 45 } },
  'oatmeal': { name: 'Oatmeal', desc: 'Whole grain Scottish oats', emoji: '🥣', per100: { kcal: 68, p: 6, c: 28, f: 3 } },
  'harcha': { name: 'Harcha', desc: 'Moroccan semolina bread', emoji: '🍞', per100: { kcal: 420, p: 8, c: 60, f: 14 } },
};

const QUICK_AMOUNTS = [50, 100, 150, 200, 250];

export default function AddQuantity() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const foodId = searchParams.get('food') || 'oatmeal';
  const meal = searchParams.get('meal') || 'breakfast';
  const mealLabel = meal.charAt(0).toUpperCase() + meal.slice(1);

  const food = FOODS_DB[foodId] || FOODS_DB['oatmeal'];
  const [qty, setQty] = useState(150);

  /* Live macro calculation */
  const calc = key => Math.round((food.per100[key] * qty) / 100);

  const handleQuick = g => setQty(g);
  const handleInput = e => {
    const v = parseInt(e.target.value, 10);
    if (!isNaN(v) && v >= 0) setQty(v);
  };

  const handleAddFood = async () => {
    try {
      // Send the request to the backend to log this food entry under the selected meal
      const response = await fetch('/api/nutrition/log-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foodId: food.id || foodId,
          name: food.name,
          meal: meal,
          quantity: qty,
          macros: {
            kcal: calc('kcal'),
            protein: calc('p'),
            carbs: calc('c'),
            fats: calc('f')
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to log food');
      }

      // After a successful save, redirect the user back to their journal
      navigate('/nutrition');
    } catch (error) {
      console.error("Error logging food:", error);
      // Fallback for demonstration
      navigate('/nutrition');
    }
  };

  return (
    <div className="aq-root">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="aq-header">
        <div className="aq-header-left">
          <button
            id="aq-back-btn"
            className="aq-back-btn"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <span className="material-symbols-outlined" style={{ color: '#38671a' }}>arrow_back</span>
          </button>
          <h1 className="aq-header-title">The Kinetic Craft</h1>
        </div>
        <div className="aq-header-right">
          <span className="material-symbols-outlined" style={{ opacity: 0.5 }}>calendar_today</span>
          <div className="aq-avatar">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: 20, color: '#38671a' }}>person</span>
          </div>
        </div>
      </header>

      <main className="aq-main">
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="aq-hero">
          <div className="aq-hero-top">
            <h2 className="aq-food-name">{food.emoji} {food.name}</h2>
            <div className="aq-ref-chip">Ref: 100g</div>
          </div>
          <p className="aq-food-desc">{food.desc}</p>

          {/* Per-100g info */}
          <div className="aq-ref-card">
            <div>
              <span className="aq-ref-label">Per 100g</span>
              <span className="aq-ref-kcal">{food.per100.kcal} kcal</span>
            </div>
            <div className="aq-ref-macros">
              {[
                { k: 'P', v: food.per100.p },
                { k: 'C', v: food.per100.c },
                { k: 'F', v: food.per100.f },
              ].map(m => (
                <div key={m.k} className="aq-ref-macro">
                  <span className="aq-ref-macro-key">{m.k}</span>
                  <span className="aq-ref-macro-val">{m.v}g</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Quantity Input Canvas ─────────────────────────────────── */}
        <section className="aq-input-canvas">
          <div className="aq-sticker-badge">FRESH BATCH</div>
          <label className="aq-qty-label">Select Quantity</label>
          <div className="aq-qty-row">
            <input
              id="aq-qty-input"
              type="number"
              className="aq-qty-input"
              value={qty}
              onChange={handleInput}
              min={0}
              aria-label="Quantity in grams"
            />
            <span className="aq-qty-unit">g</span>
          </div>
          <div className="aq-qty-underline" />

          {/* Quick amounts */}
          <div className="aq-quick-amounts">
            {QUICK_AMOUNTS.map(g => (
              <button
                key={g}
                id={`aq-quick-${g}`}
                className={`aq-quick-btn${qty === g ? ' aq-quick-btn--active' : ''}`}
                onClick={() => handleQuick(g)}
              >
                {g}g
              </button>
            ))}
          </div>
        </section>

        {/* ── Live Macros Grid ─────────────────────────────────────── */}
        <section className="aq-macros-grid">
          <div className="aq-macro-chip aq-macro-chip--kcal">
            <span className="aq-macro-chip-label">Calories</span>
            <span className="aq-macro-chip-val">{calc('kcal')} <span className="aq-macro-chip-unit">kcal</span></span>
          </div>
          {[
            { key: 'p', label: 'Protein' },
            { key: 'c', label: 'Carbs' },
            { key: 'f', label: 'Fats' },
          ].map(m => (
            <div key={m.key} className="aq-macro-chip">
              <span className="aq-macro-chip-label">{m.label}</span>
              <span className="aq-macro-chip-val">{calc(m.key)} <span className="aq-macro-chip-unit">g</span></span>
            </div>
          ))}
        </section>

        {/* ── Food Image Card ──────────────────────────────────────── */}
        <div className="aq-image-card">
          <div className="aq-image-placeholder">
            <span className="aq-image-emoji">{food.emoji}</span>
          </div>
          <div className="aq-image-overlay">
            <p className="aq-image-title">Morning Fuel Choice</p>
            <p className="aq-image-subtitle">Complex Carbs · Sustained Energy</p>
          </div>
        </div>
      </main>

      {/* ── Sticky CTA ───────────────────────────────────────────── */}
      <div className="aq-sticky-cta">
        <div className="aq-cta-inner">
          <button
            id="aq-add-btn"
            className="aq-add-btn"
            onClick={handleAddFood}
          >
            <span className="material-symbols-outlined">add_circle</span>
            Add to {mealLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
