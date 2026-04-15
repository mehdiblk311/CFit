import { useNavigate } from 'react-router-dom';
import { useMeals, useCreateMeal } from '../../../../hooks/queries/useNutrition';
import { authStore } from '../../../../stores/authStore';
import './Nutrition.css';

function getTodayDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

const MEAL_CONFIGS = [
  { type: 'breakfast', label: 'Breakfast' },
  { type: 'lunch',     label: 'Lunch' },
  { type: 'dinner',    label: 'Dinner' },
  { type: 'snack',     label: 'Snacks' },
];

const WEIGHT_BARS = [80, 85, 82, 75, 78, 70, 65];
const WEIGHT_LABELS = ['MAR 04', 'MAR 14', 'MAR 24', 'APR 04'];

function getMealTimestamp(meal) {
  const parsed = Date.parse(meal?.updated_at || meal?.created_at || '');

  return Number.isNaN(parsed) ? 0 : parsed;
}

function buildMealGroup(meals) {
  if (!meals.length) {
    return null;
  }

  const primaryMeal = [...meals].sort((a, b) => {
    const timeDiff = getMealTimestamp(b) - getMealTimestamp(a);

    if (timeDiff !== 0) {
      return timeDiff;
    }

    return String(b.id || '').localeCompare(String(a.id || ''));
  })[0] || meals[meals.length - 1];

  return {
    items: meals.flatMap(meal => meal.items ?? []),
    mealCount: meals.length,
    primaryMeal,
    total_calories: meals.reduce((sum, meal) => sum + (meal.total_calories || 0), 0),
    total_carbs: meals.reduce((sum, meal) => sum + (meal.total_carbs || 0), 0),
    total_fat: meals.reduce((sum, meal) => sum + (meal.total_fat || 0), 0),
    total_protein: meals.reduce((sum, meal) => sum + (meal.total_protein || 0), 0),
  };
}

export default function Nutrition() {
  const navigate = useNavigate();
  const user = authStore(state => state.user);

  /* Today in YYYY-MM-DD for the API */
  const today = getTodayDateKey();
  const todayFormatted = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  const { data: mealsData, isLoading } = useMeals({ date: today });
  const createMeal = useCreateMeal();

  const meals = mealsData?.data ?? [];

  const mealsByType = meals.reduce((groupedMeals, meal) => {
    const key = meal.meal_type || 'meal';

    if (!groupedMeals[key]) {
      groupedMeals[key] = [];
    }

    groupedMeals[key].push(meal);

    return groupedMeals;
  }, {});

  const mealGroupsByType = Object.fromEntries(
    MEAL_CONFIGS.map(({ type }) => [type, buildMealGroup(mealsByType[type] ?? [])])
  );

  /* Daily totals from backend-calculated fields */
  const totalCalories  = Math.round(meals.reduce((s, m) => s + (m.total_calories || 0), 0));
  const totalProtein   = Math.round(meals.reduce((s, m) => s + (m.total_protein  || 0), 0));
  const totalCarbs     = Math.round(meals.reduce((s, m) => s + (m.total_carbs    || 0), 0));
  const totalFat       = Math.round(meals.reduce((s, m) => s + (m.total_fat      || 0), 0));

  /* Goals from user's TDEE; fall back to sensible defaults */
  const tdee = user?.tdee || 2000;
  const goals = {
    calories : tdee,
    protein  : Math.round(tdee * 0.30 / 4),
    carbs    : Math.round(tdee * 0.45 / 4),
    fat      : Math.round(tdee * 0.25 / 9),
  };

  const kcalLeft = Math.max(goals.calories - totalCalories, 0);

  /* SVG ring math */
  const R     = 88;
  const CIRC  = 2 * Math.PI * R;
  const progress = Math.min(totalCalories / goals.calories, 1);
  const offset   = CIRC * (1 - progress);

  /* Navigate to food search, creating the meal first if it doesn't exist */
  const handleAddFood = async (mealType) => {
    const existingGroup = mealGroupsByType[mealType];

    if (existingGroup?.primaryMeal?.id) {
      navigate(`/nutrition/food-search?mealId=${existingGroup.primaryMeal.id}&mealType=${mealType}`);
      return;
    }
    try {
      const meal = await createMeal.mutateAsync({
        user_id  : user?.id,
        meal_type: mealType,
        date     : today,
      });
      navigate(`/nutrition/food-search?mealId=${meal.id}&mealType=${mealType}`);
    } catch (err) {
      console.error('Failed to create meal:', err);
    }
  };

  return (
    <div className="nd-root">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="nd-header">
        <div className="nd-header-left">
          <div className="nd-avatar">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: 22, color: '#38671a' }}>
              person
            </span>
          </div>
          <h1 className="nd-title">Nutrition</h1>
        </div>
        <div className="nd-header-right">
          <div className="nd-date-pill">
            <span className="nd-date-text">Today, {todayFormatted}</span>
            <span className="material-symbols-outlined nd-date-icon">calendar_today</span>
          </div>
          <button
            id="nd-history-btn"
            className="nd-icon-btn"
            onClick={() => navigate('/nutrition/history')}
            aria-label="View nutrition history"
          >
            <span className="material-symbols-outlined">history</span>
          </button>
        </div>
      </header>

      {/* ── Main content ───────────────────────────────────────────── */}
      <main className="nd-main">

        {/* Macro Dashboard */}
        <section className="nd-macro-card">
          <div className="nd-macro-inner">

            {/* Calorie Ring */}
            <div className="nd-ring-wrap">
              <svg className="nd-ring-svg" viewBox="0 0 192 192">
                <circle cx="96" cy="96" r={R} fill="transparent" stroke="#dad4c8" strokeWidth="16" />
                <circle
                  cx="96" cy="96" r={R} fill="transparent"
                  stroke="#38671a" strokeWidth="16"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={isLoading ? CIRC : offset}
                  transform="rotate(-90 96 96)"
                  className="nd-ring-progress"
                />
              </svg>
              <div className="nd-ring-center">
                {isLoading ? (
                  <span className="nd-ring-goal" style={{ fontSize: 13 }}>Loading…</span>
                ) : (
                  <>
                    <span className="nd-ring-kcal">{totalCalories.toLocaleString()}</span>
                    <span className="nd-ring-goal">/ {goals.calories.toLocaleString()} KCAL</span>
                  </>
                )}
              </div>
              {!isLoading && <div className="nd-ring-sticker">{kcalLeft} KCAL LEFT</div>}
            </div>

            {/* Macro Bars */}
            <div className="nd-bars">
              {[
                { label: 'Protein', consumed: totalProtein, goal: goals.protein, color: '#38671a' },
                { label: 'Carbs',   consumed: totalCarbs,   goal: goals.carbs,   color: '#5d3fd3' },
                { label: 'Fats',    consumed: totalFat,     goal: goals.fat,     color: '#f95630' },
              ].map(({ label, consumed, goal, color }) => (
                <div key={label} className="nd-bar-row">
                  <div className="nd-bar-labels">
                    <span>{label}</span>
                    <span>{consumed}g / {goal}g</span>
                  </div>
                  <div className="nd-bar-track">
                    <div
                      className="nd-bar-fill"
                      style={{ width: `${Math.min((consumed / goal) * 100, 100)}%`, background: color }}
                    />
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ── Meal Cards Grid ──────────────────────────────────────── */}
        <div className="nd-meals-grid">
          {MEAL_CONFIGS.map((cfg, i) => {
            const mealGroup = mealGroupsByType[cfg.type];
            const items = mealGroup?.items ?? [];
            const isEmpty = !mealGroup || items.length === 0;
            const rotate = i % 2 === 0 ? 'nd-card--tilt-left' : 'nd-card--tilt-right';
            const mealKcal = Math.round(mealGroup?.total_calories || 0);

            if (isEmpty) {
              return (
                <div
                  key={cfg.type}
                  id={`nd-meal-${cfg.type}`}
                  className="nd-card nd-card--empty"
                  onClick={() => handleAddFood(cfg.type)}
                  role="button"
                  aria-label={`Add food to ${cfg.label}`}
                >
                  <h3 className="nd-card-title nd-card-title--faded">{cfg.label}</h3>
                  <span className="nd-card-empty-label">NO ITEMS LOGGED</span>
                  <button className="nd-card-add-circle" tabIndex={-1}>
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
              );
            }

            return (
              <div key={cfg.type} id={`nd-meal-${cfg.type}`} className={`nd-card ${rotate}`}>
                <div>
                  <div className="nd-card-header">
                    <div>
                      <h3 className="nd-card-title">{cfg.label}</h3>
                      {mealGroup.mealCount > 1 && (
                        <p style={{ margin: '4px 0 0', fontSize: 11, color: '#888' }}>
                          {mealGroup.mealCount} meals merged
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button className="nd-icon-btn" style={{ width: '28px', height: '28px' }} title="Clone Meal">
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>content_copy</span>
                      </button>
                      <span className="nd-card-kcal-pill">{mealKcal} KCAL</span>
                    </div>
                  </div>
                  <ul className="nd-card-items">
                    {items.slice(0, 4).map(item => (
                      <li key={item.id} className="nd-card-item">
                        <div className="nd-item-thumb">🍽️</div>
                        <span className="nd-item-name">{item.food?.name ?? 'Food'}</span>
                      </li>
                    ))}
                    {items.length > 4 && (
                      <li className="nd-card-item" style={{ opacity: 0.6, fontSize: 11 }}>
                        +{items.length - 4} more items
                      </li>
                    )}
                  </ul>
                </div>
                <button
                  id={`nd-add-food-${cfg.type}`}
                  className="nd-add-food-btn"
                  onClick={() => handleAddFood(cfg.type)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                  ADD FOOD
                </button>
              </div>
            );
          })}
        </div>

        {/* ── Weekly Weight Log ────────────────────────────────────── */}
        <section className="nd-weight-card">
          <div className="nd-weight-top">
            <div>
              <h3 className="nd-weight-title">Weekly&nbsp;&nbsp;&nbsp;Weight&nbsp;&nbsp;&nbsp;&nbsp;Log</h3>
              <p className="nd-weight-desc">Stay consistent with your progress tracking.</p>
            </div>
            <div className="nd-weight-input-row">
              <div className="nd-weight-input-wrap">
                <input
                  id="nd-weight-input"
                  type="text"
                  className="nd-weight-input"
                  placeholder="00.0"
                  aria-label="Enter weight in kg"
                />
                <span className="nd-weight-unit">KG</span>
              </div>
              <button id="nd-log-weight-btn" className="nd-log-btn">LOG WEIGHT</button>
            </div>
          </div>

          {/* Chart */}
          <div className="nd-chart-section">
            <div className="nd-chart-labels">
              <span className="nd-chart-period">1M TREND</span>
              <span className="nd-chart-delta">-1.2 KG THIS MONTH</span>
            </div>
            <div className="nd-chart-bars">
              {WEIGHT_BARS.map((h, idx) => (
                <div
                  key={idx}
                  className={`nd-chart-bar${idx === WEIGHT_BARS.length - 1 ? ' nd-chart-bar--active' : ''}`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="nd-chart-x-labels">
              {WEIGHT_LABELS.map(l => <span key={l}>{l}</span>)}
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
