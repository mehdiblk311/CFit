import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './FoodSearch.css';

const FILTER_CHIPS = ['All', 'Recent', 'Favorites', 'My Recipes', 'Custom'];

const FOODS = [
  { id: 'greek-yogurt',  name: 'Greek Yogurt', kcal: 59,  protein: '10g',  emoji: '🥛', flag: null },
  { id: 'amlou',         name: 'Amlou',        kcal: 598, protein: '15g',  emoji: '🍯', flag: '🇲🇦' },
  { id: 'oatmeal',       name: 'Oatmeal',      kcal: 68,  protein: '2.4g', emoji: '🥣', flag: null },
  { id: 'harcha',        name: 'Harcha',       kcal: 420, protein: '8g',   emoji: '🍞', flag: '🇲🇦' },
];

export default function FoodSearch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const meal = searchParams.get('meal') || 'breakfast';
  const mealLabel = meal.charAt(0).toUpperCase() + meal.slice(1);

  const [query, setQuery]       = useState('');
  const [active, setActive]     = useState('All');

  const filtered = FOODS.filter(f =>
    f.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fs-root">
      {/* Header */}
      <nav className="fs-header">
        <div className="fs-header-left">
          <button
            id="fs-back-btn"
            className="fs-back-btn"
            onClick={() => navigate('/nutrition')}
            aria-label="Back"
          >
            <span className="material-symbols-outlined fs-back-icon">arrow_back</span>
          </button>
          <h1 className="fs-title">Add to {mealLabel}</h1>
        </div>
        <div className="fs-avatar">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: 20, color: '#38671a' }}>person</span>
        </div>
      </nav>

      <main className="fs-main">
        {/* Search Input */}
        <div className="fs-search-wrap">
          <span className="material-symbols-outlined fs-search-icon">search</span>
          <input
            id="fs-search-input"
            type="text"
            className="fs-search-input"
            placeholder="Search foods..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        {/* Filter Chips */}
        <div className="fs-chips">
          {FILTER_CHIPS.map(chip => (
            <button
              key={chip}
              id={`fs-chip-${chip.toLowerCase().replace(' ', '-')}`}
              className={`fs-chip${active === chip ? ' fs-chip--active' : ''}`}
              onClick={() => setActive(chip)}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Results */}
        <section className="fs-results">
          <div className="fs-results-header">
            <h2 className="fs-results-title">Suggested Results</h2>
            <span className="material-symbols-outlined fs-sort-icon">sort</span>
          </div>

          {filtered.map((food, i) => {
            const tilts = ['fs-row--tilt-left', '', 'fs-row--tilt-right-sm', 'fs-row--tilt-right'];
            return (
              <div
                key={food.id}
                id={`fs-food-${food.id}`}
                className={`fs-row ${tilts[i % tilts.length]}`}
                onClick={() => navigate(`/nutrition/add-quantity?food=${food.id}&meal=${meal}`)}
                role="button"
              >
                <div className="fs-row-left">
                  <div className="fs-thumbnail">{food.emoji}</div>
                  <div>
                    <div className="fs-food-name-row">
                      <h3 className="fs-food-name">{food.name}</h3>
                      {food.flag && <span className="fs-flag">{food.flag}</span>}
                    </div>
                    <div className="fs-food-macros">
                      <span className="fs-macro-tag">
                        <span className="fs-dot fs-dot--kcal" />
                        {food.kcal} kcal
                      </span>
                      <span className="fs-macro-tag">
                        <span className="fs-dot fs-dot--protein" />
                        {food.protein} protein
                      </span>
                    </div>
                  </div>
                </div>
                <div className="fs-row-right">
                  <span className="fs-food-emoji">{food.emoji}</span>
                  <button
                    id={`fs-add-${food.id}`}
                    className="fs-add-btn"
                    onClick={e => { e.stopPropagation(); navigate(`/nutrition/add-quantity?food=${food.id}&meal=${meal}`); }}
                    aria-label={`Add ${food.name}`}
                  >
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
              </div>
            );
          })}
        </section>

        {/* Custom food callout */}
        <section className="fs-custom-callout">
          <span className="material-symbols-outlined fs-custom-icon">inventory_2</span>
          <div>
            <p className="fs-custom-title">Can't find your food?</p>
            <p className="fs-custom-desc">Create a unique entry for your macro tracking.</p>
          </div>
          <button 
            id="fs-create-custom-btn" 
            className="fs-custom-btn"
            onClick={() => navigate('/nutrition/custom-food')}
          >
            Create Custom Food
          </button>
        </section>
      </main>
    </div>
  );
}
