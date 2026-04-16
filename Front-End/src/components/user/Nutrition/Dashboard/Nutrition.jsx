import { createPortal } from 'react-dom';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  useCreateMeal,
  useDeleteMeal,
  useDeleteMealFood,
  useMeals,
  useUpdateMeal,
} from '../../../../hooks/queries/useNutrition';
import { weightAPI } from '../../../../api/weight';
import { authStore } from '../../../../stores/authStore';
import './Nutrition.css';

function getTodayDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeDateKey(value) {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const parsed = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return trimmed;
}

function formatHeaderDate(dateKey) {
  const parsed = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateKey;
  return parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

function normalizeList(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload)) return payload;
  return [];
}

const MEAL_CONFIGS = [
  { type: 'breakfast', label: 'Breakfast' },
  { type: 'lunch', label: 'Lunch' },
  { type: 'dinner', label: 'Dinner' },
  { type: 'snack', label: 'Snacks' },
];

function getMealTimestamp(meal) {
  const parsed = Date.parse(meal?.updated_at || meal?.created_at || '');
  return Number.isNaN(parsed) ? 0 : parsed;
}

function buildMealGroup(meals) {
  if (!meals.length) return null;

  const primaryMeal = [...meals].sort((a, b) => {
    const timeDiff = getMealTimestamp(b) - getMealTimestamp(a);
    if (timeDiff !== 0) return timeDiff;
    return String(b.id || '').localeCompare(String(a.id || ''));
  })[0] || meals[meals.length - 1];

  return {
    items: meals.flatMap((meal) => meal.items ?? []),
    mealCount: meals.length,
    primaryMeal,
    total_calories: meals.reduce((sum, meal) => sum + (meal.total_calories || 0), 0),
    total_carbs: meals.reduce((sum, meal) => sum + (meal.total_carbs || 0), 0),
    total_fat: meals.reduce((sum, meal) => sum + (meal.total_fat || 0), 0),
    total_protein: meals.reduce((sum, meal) => sum + (meal.total_protein || 0), 0),
  };
}

function getWeightDateLabel(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase();
}

function getEntryDateKey(value) {
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function ModalPortal({ children }) {
  if (typeof document === 'undefined') return children;
  return createPortal(children, document.body);
}

function MealEditorModal({
  meal,
  onClose,
  onSubmit,
  onDelete,
  onAddIngredient,
  onEditIngredient,
  onRemoveIngredient,
  isSaving,
  isDeleting,
  deletingIngredientId,
}) {
  const [form, setForm] = useState({
    notes: meal?.notes || '',
  });

  return (
    <ModalPortal>
      <div className="nd-modal-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
        <div className="nd-modal">
          <button className="nd-modal-close" onClick={onClose} aria-label="Close meal editor">
            <span className="material-symbols-outlined">close</span>
          </button>

          <div className="nd-modal-copy">
            <p className="nd-modal-eyebrow">Meal Journal</p>
            <h3 className="nd-modal-title">Edit Meal</h3>
            <p className="nd-modal-desc">
              Keep your notes clean, remove ingredients you do not want, and jump into each ingredient page to edit quantity.
            </p>
          </div>

          <label className="nd-modal-field">
            <span>Notes</span>
            <textarea
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              rows={3}
              placeholder="Add context like meal prep, family dinner, or post-workout meal."
            />
          </label>

          <div className="nd-modal-meta-actions">
            <button
              className="nd-modal-primary"
              onClick={() => onSubmit(form)}
              disabled={isSaving}
            >
              <span className="material-symbols-outlined">{isSaving ? 'progress_activity' : 'check_circle'}</span>
              {isSaving ? 'Saving…' : 'Save Notes'}
            </button>
          </div>

          <div className="nd-modal-meal-items">
            <div className="nd-modal-items-head">
              <span>Current Ingredients</span>
              <span>{meal?.items?.length || 0} items</span>
            </div>

            {!meal?.items?.length ? (
              <p className="nd-modal-empty">No ingredients yet. Add your first ingredient below.</p>
            ) : (
              <div className="nd-modal-item-list">
                {meal.items.map((item) => {
                  return (
                    <div key={item.id} className="nd-modal-item-row nd-modal-item-row--editable">
                      <div className="nd-modal-item-info">
                        <span className="nd-modal-item-name" title={item.food?.name || 'Ingredient'}>
                          {item.food?.name || 'Ingredient'}
                        </span>
                        <span className="nd-modal-item-meta">{Number(item.quantity || 0).toFixed(2)} x serving</span>
                      </div>

                      <div className="nd-modal-item-actions">
                        <button
                          className="nd-modal-mini"
                          onClick={() => onEditIngredient(item)}
                        >
                          Edit
                        </button>
                        <button
                          className="nd-modal-mini nd-modal-mini--danger"
                          onClick={() => onRemoveIngredient(item)}
                          disabled={deletingIngredientId === item.id}
                        >
                          {deletingIngredientId === item.id ? 'Removing…' : 'Remove'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

          <button className="nd-modal-add-cta" onClick={onAddIngredient}>
            <span>Add Ingredient</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>

          <button className="nd-modal-danger" onClick={onDelete} disabled={isDeleting}>
            <span className="material-symbols-outlined">delete</span>
            {isDeleting ? 'Deleting…' : 'Delete Meal'}
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}

export default function Nutrition() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const user = authStore((state) => state.user);
  const today = getTodayDateKey();

  const requestedDate = normalizeDateKey(searchParams.get('date'));
  const isReadOnly = searchParams.get('readonly') === '1';
  const journalDate = isReadOnly && requestedDate ? requestedDate : today;
  const headerDate = formatHeaderDate(journalDate);

  const [mealEditor, setMealEditor] = useState(null);
  const [creatingMealType, setCreatingMealType] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [weightFeedback, setWeightFeedback] = useState('');
  const [weightError, setWeightError] = useState('');

  const { data: mealsData, isLoading } = useMeals({ date: journalDate, limit: 50 });
  const { data: weightEntriesData = [] } = useQuery({
    queryKey: ['weightEntries', user?.id],
    queryFn: () => weightAPI.getEntries(),
    enabled: !!user?.id,
    staleTime: 1000 * 60,
  });

  const createMeal = useCreateMeal();
  const updateMeal = useUpdateMeal(mealEditor?.meal?.id);
  const deleteMeal = useDeleteMeal(mealEditor?.meal?.id);
  const deleteMealFood = useDeleteMealFood();

  const meals = normalizeList(mealsData);
  const weightEntries = useMemo(
    () => (Array.isArray(weightEntriesData) ? weightEntriesData : []),
    [weightEntriesData],
  );

  const todayWeightEntry = useMemo(
    () => [...weightEntries].sort((a, b) => new Date(b.updated_at || b.created_at || b.date) - new Date(a.updated_at || a.created_at || a.date))
      .find((entry) => getEntryDateKey(entry.date) === today) || null,
    [weightEntries, today],
  );

  const logWeight = useMutation({
    mutationFn: async (data) => {
      if (todayWeightEntry?.id) {
        return weightAPI.updateEntry(todayWeightEntry.id, {
          weight: data.weight,
          date: data.date,
          notes: todayWeightEntry.notes || '',
        });
      }

      return weightAPI.addEntry(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weightEntries', user?.id] });
      setWeightInput('');
      setWeightError('');
      setWeightFeedback(todayWeightEntry?.id ? 'Today’s weight was updated.' : 'Weight logged successfully.');
    },
    onError: () => {
      setWeightFeedback('');
      setWeightError('Could not log weight right now. Please try again.');
    },
  });

  const mealsByType = meals.reduce((groupedMeals, meal) => {
    const key = meal.meal_type || 'meal';
    if (!groupedMeals[key]) groupedMeals[key] = [];
    groupedMeals[key].push(meal);
    return groupedMeals;
  }, {});

  const mealGroupsByType = Object.fromEntries(
    MEAL_CONFIGS.map(({ type }) => [type, buildMealGroup(mealsByType[type] ?? [])]),
  );

  const totalCalories = Math.round(meals.reduce((sum, meal) => sum + (meal.total_calories || 0), 0));
  const totalProtein = Math.round(meals.reduce((sum, meal) => sum + (meal.total_protein || 0), 0));
  const totalCarbs = Math.round(meals.reduce((sum, meal) => sum + (meal.total_carbs || 0), 0));
  const totalFat = Math.round(meals.reduce((sum, meal) => sum + (meal.total_fat || 0), 0));

  const tdee = user?.tdee || 2000;
  const goals = {
    calories: tdee,
    protein: Math.round((tdee * 0.3) / 4),
    carbs: Math.round((tdee * 0.45) / 4),
    fat: Math.round((tdee * 0.25) / 9),
  };

  const kcalLeft = Math.max(goals.calories - totalCalories, 0);
  const ringRadius = 88;
  const ringCirc = 2 * Math.PI * ringRadius;
  const progress = Math.min(totalCalories / goals.calories, 1);
  const offset = ringCirc * (1 - progress);

  const sortedWeightEntries = useMemo(
    () => [...weightEntries].sort((a, b) => new Date(a.date) - new Date(b.date)),
    [weightEntries],
  );
  const recentWeightEntries = sortedWeightEntries.slice(-7);

  const weightChartBars = useMemo(() => {
    if (recentWeightEntries.length === 0) return [];
    const values = recentWeightEntries.map((entry) => Number(entry.weight) || 0);
    const minWeight = Math.min(...values);
    const maxWeight = Math.max(...values);
    return values.map((value) => {
      if (minWeight === maxWeight) return 70;
      return 35 + (((value - minWeight) / (maxWeight - minWeight)) * 55);
    });
  }, [recentWeightEntries]);

  const monthlyDelta = useMemo(() => {
    if (sortedWeightEntries.length < 2) return null;
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const inWindow = sortedWeightEntries.filter((entry) => {
      const parsed = new Date(entry.date);
      return !Number.isNaN(parsed.getTime()) && parsed >= monthAgo;
    });
    if (inWindow.length < 2) return null;
    const firstWeight = Number(inWindow[0].weight) || 0;
    const latestWeight = Number(inWindow[inWindow.length - 1].weight) || 0;
    return latestWeight - firstWeight;
  }, [sortedWeightEntries]);

  const handleOpenMealLogger = async (mealType) => {
    if (isReadOnly) return;

    const existingGroup = mealGroupsByType[mealType];
    if (existingGroup?.primaryMeal?.id) {
      navigate(`/nutrition/food-search?mealId=${existingGroup.primaryMeal.id}&mealType=${mealType}`);
      return;
    }

    setCreatingMealType(mealType);
    try {
      const meal = await createMeal.mutateAsync({
        user_id: user?.id,
        meal_type: mealType,
        date: today,
        notes: '',
      });
      navigate(`/nutrition/food-search?mealId=${meal.id}&mealType=${mealType}`);
    } catch (error) {
      console.error('Failed to create meal:', error);
    } finally {
      setCreatingMealType('');
    }
  };

  const openEditMeal = (mealType, meal) => {
    if (isReadOnly) return;
    setMealEditor({ mealType, meal });
  };

  const handleSaveMeal = async (form) => {
    try {
      await updateMeal.mutateAsync({
        notes: form.notes,
      });
      setMealEditor(null);
    } catch (error) {
      console.error('Failed to save meal:', error);
    }
  };

  const handleDeleteMeal = async () => {
    try {
      await deleteMeal.mutateAsync();
      setMealEditor(null);
    } catch (error) {
      console.error('Failed to delete meal:', error);
    }
  };

  const handleRemoveIngredient = async (item) => {
    if (!mealEditor?.meal?.id) return;

    try {
      await deleteMealFood.mutateAsync({
        meal_food_id: item.id,
        meal_id: mealEditor.meal.id,
      });

      setMealEditor((prev) => {
        if (!prev?.meal?.items) return prev;
        return {
          ...prev,
          meal: {
            ...prev.meal,
            items: prev.meal.items.filter((mealItem) => mealItem.id !== item.id),
          },
        };
      });
    } catch (error) {
      console.error('Failed to remove ingredient:', error);
    }
  };

  const handleEditIngredient = (item) => {
    if (!mealEditor?.meal?.id || !item?.food?.id) return;

    const params = new URLSearchParams({
      mealId: mealEditor.meal.id,
      mealType: mealEditor.meal.meal_type || 'meal',
      foodId: item.food.id,
      mealFoodId: item.id,
      quantity: String(item.quantity || ''),
    });

    navigate(`/nutrition/add-quantity?${params.toString()}`);
    setMealEditor(null);
  };

  const handleLogWeight = () => {
    if (isReadOnly) {
      setWeightFeedback('');
      setWeightError('History view is read-only. Return to today to log weight.');
      return;
    }

    const numericWeight = Number(weightInput);
    if (!user?.id) {
      setWeightFeedback('');
      setWeightError('You need to be logged in to log weight.');
      return;
    }
    if (!Number.isFinite(numericWeight) || numericWeight <= 0) {
      setWeightFeedback('');
      setWeightError('Enter a valid weight in kg.');
      return;
    }

    setWeightError('');
    setWeightFeedback('');
    logWeight.mutate({
      user_id: user.id,
      weight: Number(numericWeight.toFixed(2)),
      date: today,
    });
  };

  return (
    <div className="nd-root">
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
            <span className="nd-date-text">{isReadOnly ? `History, ${headerDate}` : `Today, ${headerDate}`}</span>
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

      <main className="nd-main">
        {isReadOnly && (
          <section className="nd-readonly-banner">
            <p className="nd-readonly-copy">Read-only journal view for {headerDate}. Adding or editing is muted.</p>
            <button className="nd-readonly-btn" onClick={() => navigate('/nutrition')}>Back To Today</button>
          </section>
        )}

        <section className="nd-macro-card">
          <div className="nd-macro-inner">
            <div className="nd-ring-wrap">
              <svg className="nd-ring-svg" viewBox="0 0 192 192">
                <circle cx="96" cy="96" r={ringRadius} fill="transparent" stroke="#dad4c8" strokeWidth="16" />
                <circle
                  cx="96"
                  cy="96"
                  r={ringRadius}
                  fill="transparent"
                  stroke="#38671a"
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeDasharray={ringCirc}
                  strokeDashoffset={isLoading ? ringCirc : offset}
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

            <div className="nd-bars">
              {[
                { label: 'Protein', consumed: totalProtein, goal: goals.protein, color: '#38671a' },
                { label: 'Carbs', consumed: totalCarbs, goal: goals.carbs, color: '#5d3fd3' },
                { label: 'Fats', consumed: totalFat, goal: goals.fat, color: '#f95630' },
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

        <div className="nd-meals-grid">
          {MEAL_CONFIGS.map((config, index) => {
            const mealGroup = mealGroupsByType[config.type];
            const items = mealGroup?.items ?? [];
            const isEmpty = !mealGroup || items.length === 0;
            const rotate = index % 2 === 0 ? 'nd-card--tilt-left' : 'nd-card--tilt-right';
            const mealKcal = Math.round(mealGroup?.total_calories || 0);
            const isCreating = creatingMealType === config.type && createMeal.isPending;

            if (isEmpty) {
              return (
                <div
                  key={config.type}
                  id={`nd-meal-${config.type}`}
                  className={`nd-card nd-card--empty${isReadOnly ? ' nd-card--disabled' : ''}`}
                  onClick={() => !isReadOnly && handleOpenMealLogger(config.type)}
                  role="button"
                  aria-label={`Create ${config.label}`}
                >
                  <h3 className="nd-card-title nd-card-title--faded">{config.label}</h3>
                  <span className="nd-card-empty-label">{isReadOnly ? 'READ ONLY' : 'NO ITEMS LOGGED'}</span>
                  <button className="nd-card-add-circle" tabIndex={-1} disabled={isReadOnly || isCreating}>
                    <span className="material-symbols-outlined">{isCreating ? 'progress_activity' : 'add'}</span>
                  </button>
                </div>
              );
            }

            return (
              <div key={config.type} id={`nd-meal-${config.type}`} className={`nd-card ${rotate}`}>
                <div>
                  <div className="nd-card-header">
                    <div>
                      <h3 className="nd-card-title">{config.label}</h3>
                      {mealGroup.mealCount > 1 && (
                        <p style={{ margin: '4px 0 0', fontSize: 11, color: '#888' }}>
                          {mealGroup.mealCount} meals merged
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {!isReadOnly && (
                        <button
                          className="nd-icon-btn nd-card-icon"
                          title="Edit Meal"
                          onClick={() => openEditMeal(config.type, mealGroup.primaryMeal)}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>
                        </button>
                      )}
                      <span className="nd-card-kcal-pill">{mealKcal} KCAL</span>
                    </div>
                  </div>

                  <ul className="nd-card-items">
                    {items.slice(0, 4).map((item) => (
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
                  id={`nd-add-food-${config.type}`}
                  className="nd-add-food-btn"
                  onClick={() => handleOpenMealLogger(config.type)}
                  disabled={isReadOnly || isCreating}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    {isCreating ? 'progress_activity' : 'add'}
                  </span>
                  {isReadOnly ? 'READ ONLY' : 'ADD INGREDIENT'}
                </button>
              </div>
            );
          })}
        </div>

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
                  type="number"
                  step="0.1"
                  min="0"
                  className="nd-weight-input"
                  placeholder="00.0"
                  aria-label="Enter weight in kg"
                  value={weightInput}
                  onChange={(event) => setWeightInput(event.target.value)}
                  disabled={isReadOnly}
                />
                <span className="nd-weight-unit">KG</span>
              </div>
              <button
                id="nd-log-weight-btn"
                className="nd-log-btn"
                onClick={handleLogWeight}
                disabled={logWeight.isPending || isReadOnly}
              >
                {logWeight.isPending ? 'LOGGING…' : 'LOG WEIGHT'}
              </button>
            </div>
          </div>
          {weightError && <p className="nd-weight-feedback nd-weight-feedback--error">{weightError}</p>}
          {weightFeedback && <p className="nd-weight-feedback">{weightFeedback}</p>}

          <div className="nd-chart-section">
            <div className="nd-chart-labels">
              <span className="nd-chart-period">1M TREND</span>
              <span className="nd-chart-delta">
                {monthlyDelta === null ? 'LOG 2 ENTRIES TO SEE TREND' : `${monthlyDelta > 0 ? '+' : ''}${monthlyDelta.toFixed(1)} KG THIS MONTH`}
              </span>
            </div>
            {weightChartBars.length === 0 ? (
              <p className="nd-weight-empty">No weight entries yet. Log your first weigh-in above.</p>
            ) : (
              <>
                <div className="nd-chart-bars">
                  {weightChartBars.map((height, index) => (
                    <div
                      key={index}
                      className={`nd-chart-bar${index === weightChartBars.length - 1 ? ' nd-chart-bar--active' : ''}`}
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
                <div className="nd-chart-x-labels">
                  {recentWeightEntries.map((entry) => <span key={entry.id}>{getWeightDateLabel(entry.date)}</span>)}
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      {mealEditor && !isReadOnly ? (
        <MealEditorModal
          key={mealEditor.meal?.id}
          meal={mealEditor.meal}
          onClose={() => setMealEditor(null)}
          onSubmit={handleSaveMeal}
          onDelete={handleDeleteMeal}
          onAddIngredient={() => {
            navigate(`/nutrition/food-search?mealId=${mealEditor.meal.id}&mealType=${mealEditor.meal.meal_type}`);
            setMealEditor(null);
          }}
          onEditIngredient={handleEditIngredient}
          onRemoveIngredient={handleRemoveIngredient}
          isSaving={updateMeal.isPending}
          isDeleting={deleteMeal.isPending}
          deletingIngredientId={deleteMealFood.variables?.meal_food_id || ''}
        />
      ) : null}
    </div>
  );
}
