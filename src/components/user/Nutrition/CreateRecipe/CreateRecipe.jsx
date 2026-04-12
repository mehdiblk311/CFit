import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateRecipe.css';

const INITIAL_INGREDIENTS = [
  { id: 'protein', name: 'Protein Powder', desc: 'Whey Isolate / Vanilla', icon: 'grain',     qty: '30g',   iconColor: '#38671a', iconBg: '#c3fb9c' },
  { id: 'oat',     name: 'Oat Flour',      desc: 'Finely Ground / Gluten Free', icon: 'nutrition', qty: '50g', iconColor: '#5d3fd3', iconBg: '#b4a5ff' },
  { id: 'egg',     name: 'Egg',            desc: 'Large / Grade A',   icon: 'egg',      qty: '1 unit', iconColor: '#b02500', iconBg: 'rgba(249,86,48,0.1)' },
];

const RUNNING_TOTAL = { kcal: 420, p: '45g', c: '30g', f: '12g' };

export default function CreateRecipe() {
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState(INITIAL_INGREDIENTS);

  const removeIngredient = id => {
    setIngredients(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="cr-root">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="cr-header">
        <div className="cr-header-left">
          <div className="cr-avatar">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: 20, color: '#38671a' }}>person</span>
          </div>
          <h1 className="cr-header-brand">The Kinetic Craft</h1>
        </div>
        <div className="cr-header-right">
          <button className="cr-cal-btn" aria-label="Calendar">
            <span className="material-symbols-outlined" style={{ color: '#38671a' }}>calendar_today</span>
          </button>
          <div className="cr-tag-badge">UM6P_FIT</div>
        </div>
      </header>

      <main className="cr-main">
        {/* ── Running Total Dashboard ──────────────────────────────── */}
        <section className="cr-total-card">
          <span className="cr-step-label">Step 02 / Add Ingredients</span>
          <h2 className="cr-recipe-name">New Recipe: Protein Pancakes</h2>
          <div className="cr-sticker-row">
            <div className="cr-sticker cr-sticker--green cr-sticker--left">Total: {RUNNING_TOTAL.kcal} kcal</div>
            <div className="cr-sticker cr-sticker--purple cr-sticker--right">{RUNNING_TOTAL.p} P</div>
            <div className="cr-sticker cr-sticker--sand">{RUNNING_TOTAL.c} C</div>
            <div className="cr-sticker cr-sticker--red cr-sticker--left">{RUNNING_TOTAL.f} F</div>
          </div>
          <div className="cr-deco-icon">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: 80, opacity: 0.1 }}>restaurant</span>
          </div>
        </section>

        {/* ── Ingredient List ─────────────────────────────────────── */}
        <section className="cr-ingredients">
          <h3 className="cr-section-title">Current Composition</h3>
          <div className="cr-ingredient-list">
            {ingredients.map((ing, i) => {
              const tilts = ['cr-item--left', 'cr-item--right', 'cr-item--left-sm'];
              return (
                <div
                  key={ing.id}
                  id={`cr-ingredient-${ing.id}`}
                  className={`cr-item ${tilts[i % tilts.length]}`}
                >
                  <div className="cr-item-left">
                    <div
                      className="cr-item-icon"
                      style={{ background: ing.iconBg, borderColor: ing.iconColor, color: ing.iconColor }}
                    >
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {ing.icon}
                      </span>
                    </div>
                    <div>
                      <p className="cr-item-name">{ing.name}</p>
                      <p className="cr-item-desc">{ing.desc}</p>
                    </div>
                  </div>
                  <div className="cr-item-right">
                    <span className="cr-item-qty">({ing.qty})</span>
                    <button
                      className="cr-remove-btn"
                      onClick={() => removeIngredient(ing.id)}
                      aria-label={`Remove ${ing.name}`}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Actions ──────────────────────────────────────────────── */}
        <section className="cr-actions">
          <button
            id="cr-add-ingredient-btn"
            className="cr-add-ingredient-btn"
            onClick={() => navigate('/nutrition/food-search?meal=recipe')}
          >
            <span className="material-symbols-outlined">add_circle</span>
            Add Ingredient
          </button>
          <button
            id="cr-save-btn"
            className="cr-save-btn"
            onClick={() => navigate('/nutrition')}
          >
            Review &amp; Save
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </section>

        {/* ── Editorial Image Card ─────────────────────────────────── */}
        <section className="cr-image-card">
          <div className="cr-image-area">
            <span className="cr-image-emoji">🥞</span>
            <div className="cr-image-gradient" />
            <div className="cr-time-badge">EST. 15 MINS</div>
          </div>
          <div className="cr-image-caption">
            <p className="cr-image-quote">"Balance the texture by sifting the oat flour before adding the protein powder for maximum airiness."</p>
          </div>
        </section>
      </main>
    </div>
  );
}
