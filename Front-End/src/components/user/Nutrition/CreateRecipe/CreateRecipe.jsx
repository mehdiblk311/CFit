import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCreateRecipe, useRecipes, useDeleteRecipe, useLogRecipeToMeal, useMeals } from '../../../../hooks/queries/useNutrition';
import './CreateRecipe.css';

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateKey(value) {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return getLocalDateKey(parsed);
}

function getDraftFromState(state) {
  return {
    mode: state?.mode === 'builder' ? 'builder' : 'list',
    recipeName: typeof state?.recipeName === 'string' ? state.recipeName : '',
    servings: typeof state?.servings === 'number' && state.servings > 0 ? state.servings : 1,
    ingredients: Array.isArray(state?.ingredients) ? state.ingredients : [],
  };
}

function getTotalsFromIngredients(ingredients) {
  return ingredients.reduce(
    (acc, ingredient) => ({
      kcal: acc.kcal + (ingredient.macros?.kcal || 0),
      p: acc.p + (ingredient.macros?.p || 0),
      c: acc.c + (ingredient.macros?.c || 0),
      f: acc.f + (ingredient.macros?.f || 0),
    }),
    { kcal: 0, p: 0, c: 0, f: 0 }
  );
}

function getTotalsFromRecipe(recipe) {
  return (recipe.items || []).reduce(
    (acc, item) => ({
      kcal: acc.kcal + ((item.food?.calories || 0) * (item.quantity || 0)),
      p: acc.p + ((item.food?.protein || 0) * (item.quantity || 0)),
      c: acc.c + ((item.food?.carbohydrates || 0) * (item.quantity || 0)),
      f: acc.f + ((item.food?.fat || 0) * (item.quantity || 0)),
    }),
    { kcal: 0, p: 0, c: 0, f: 0 }
  );
}

function roundTotals(totals) {
  return {
    kcal: Math.round(totals.kcal || 0),
    p: Math.round(totals.p || 0),
    c: Math.round(totals.c || 0),
    f: Math.round(totals.f || 0),
  };
}

function RecipesListView() {
  const navigate = useNavigate();
  const { data: recipesData, isLoading, isError } = useRecipes({ limit: 50 });
  const deleteRecipe = useDeleteRecipe();
  const logRecipe = useLogRecipeToMeal();
  
  const [loggingRecipeId, setLoggingRecipeId] = useState(null);
  const [logMealType, setLogMealType] = useState('snack');
  
  const todayKey = getLocalDateKey();
  const { data: mealsData } = useMeals({ date: todayKey });
  const todayMeals = Array.isArray(mealsData?.data) ? mealsData.data : Array.isArray(mealsData) ? mealsData : [];

  const recipes = Array.isArray(recipesData?.data)
    ? recipesData.data
    : Array.isArray(recipesData)
      ? recipesData
      : [];

  const handleDelete = (e, recipeId) => {
    e.stopPropagation();
    if (window.confirm('Delete this recipe?')) {
      deleteRecipe.mutate(recipeId);
    }
  };

  return (
    <div className="cr-root">
      <header className="cr-header">
        <div className="cr-header-left">
          <div className="cr-avatar">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: 20, color: '#38671a' }}>person</span>
          </div>
          <h1 className="cr-header-brand">The Kinetic Craft</h1>
        </div>
        <div className="cr-header-right">
          <button
            className="cr-cal-btn"
            aria-label="Create recipe"
            onClick={() => navigate('/nutrition/recipe', {
              state: { mode: 'builder', recipeName: '', servings: 1, ingredients: [] },
            })}
          >
            <span className="material-symbols-outlined" style={{ color: '#38671a' }}>add_circle</span>
          </button>
          <div className="cr-tag-badge">MY_RECIPES</div>
        </div>
      </header>

      <main className="cr-main">
        <section className="cr-total-card">
          <span className="cr-step-label">Recipe Library</span>
          <h2 className="cr-recipe-name">My Recipes</h2>
          <p className="cr-library-copy">Save frequently used meals here, then reuse them without rebuilding from scratch.</p>
          <button
            id="cr-create-recipe-btn"
            className="cr-save-btn"
            onClick={() => navigate('/nutrition/recipe', {
              state: { mode: 'builder', recipeName: '', servings: 1, ingredients: [] },
            })}
          >
            <span className="material-symbols-outlined">add_circle</span>
            Create Recipe
          </button>
        </section>

        <section className="cr-ingredients">
          <div className="cr-list-header-row">
            <h3 className="cr-section-title">Saved Recipes</h3>
            {!isLoading && !isError && <span className="cr-list-count">{recipes.length} total</span>}
          </div>

          {isLoading && <p className="cr-empty-state">Loading your recipes…</p>}
          {isError && <p className="cr-empty-state">Could not load your recipes right now.</p>}
          {!isLoading && !isError && recipes.length === 0 && (
            <p className="cr-empty-state">You do not have any saved recipes yet. Tap “Create Recipe” to add your first one.</p>
          )}

          <div className="cr-recipe-library">
            {recipes.map((recipe, index) => {
              const totals = roundTotals(getTotalsFromRecipe(recipe));
              const servings = recipe.servings > 0 ? recipe.servings : 1;
              const perServing = roundTotals({
                kcal: totals.kcal / servings,
                p: totals.p / servings,
                c: totals.c / servings,
                f: totals.f / servings,
              });
              const tilts = ['cr-item--left', 'cr-item--right', 'cr-item--left-sm'];

              return (
                <div key={recipe.id} className={`cr-item cr-recipe-card ${tilts[index % tilts.length]}`}>
                  <div className="cr-recipe-card-top">
                    <div>
                      <p className="cr-item-name">{recipe.name}</p>
                      <p className="cr-item-desc">
                        {recipe.items?.length || 0} ingredients · {servings} serving{servings === 1 ? '' : 's'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className="cr-recipe-card-chip">{perServing.kcal} kcal / serving</span>
                      <button
                        className="cr-log-btn"
                        onClick={(e) => { e.stopPropagation(); setLoggingRecipeId(recipe.id); }}
                        title="Log to Meal"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_task</span>
                      </button>
                      <button
                        className="cr-remove-btn"
                        onClick={(e) => handleDelete(e, recipe.id)}
                        disabled={deleteRecipe.isPending}
                        title="Delete Recipe"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#f95630' }}>delete</span>
                      </button>
                    </div>
                  </div>

                  <div className="cr-sticker-row cr-sticker-row--compact">
                    <div className="cr-sticker cr-sticker--green">{perServing.p}g P</div>
                    <div className="cr-sticker cr-sticker--sand">{perServing.c}g C</div>
                    <div className="cr-sticker cr-sticker--red">{perServing.f}g F</div>
                  </div>

                  {!!recipe.items?.length && (
                    <div className="cr-recipe-card-items">
                      {recipe.items.slice(0, 3).map(item => (
                        <span key={item.id} className="cr-recipe-card-item-pill">{item.food?.name || 'Ingredient'}</span>
                      ))}
                      {recipe.items.length > 3 && (
                        <span className="cr-recipe-card-item-pill">+{recipe.items.length - 3} more</span>
                      )}
                    </div>
                  )}

                  {loggingRecipeId === recipe.id && (
                    <div className="cr-log-panel">
                      <select 
                        value={logMealType} 
                        onChange={e => setLogMealType(e.target.value)} 
                        className="cr-recipe-input" 
                        style={{ marginTop: 0, padding: '6px 10px', width: 'auto' }}
                      >
                        <option value="breakfast">Breakfast</option>
                        <option value="lunch">Lunch</option>
                        <option value="dinner">Dinner</option>
                        <option value="snack">Snack</option>
                      </select>
                      <button
                        className="cr-save-btn"
                        style={{ padding: '8px 16px', fontSize: '12px', flex: 1 }}
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const existingMeal = todayMeals.find((meal) =>
                              meal.meal_type === logMealType && getDateKey(meal.date) === todayKey
                            );
                            await logRecipe.mutateAsync({
                              recipe_id: recipe.id,
                              data: {
                                date: todayKey,
                                meal_type: logMealType,
                                servings: 1,
                                ...(existingMeal ? { meal_id: existingMeal.id } : {})
                              }
                            });
                            setLoggingRecipeId(null);
                            navigate('/nutrition');
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        disabled={logRecipe.isPending}
                      >
                        {logRecipe.isPending ? 'Logging...' : 'Log 1 Serving'}
                      </button>
                      <button
                        className="cr-remove-btn"
                        onClick={(e) => { e.stopPropagation(); setLoggingRecipeId(null); }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

function RecipeBuilderView({ initialDraft }) {
  const navigate = useNavigate();
  const createRecipe = useCreateRecipe();
  const [ingredients, setIngredients] = useState(initialDraft.ingredients);
  const [recipeName, setRecipeName] = useState(initialDraft.recipeName);
  const [servings, setServings] = useState(initialDraft.servings);
  const [saveError, setSaveError] = useState('');

  const totals = getTotalsFromIngredients(ingredients);
  const validItems = ingredients.filter(ingredient => ingredient.foodId && ingredient.quantity > 0);
  const safeServings = servings > 0 ? servings : 1;
  const perServing = roundTotals({
    kcal: totals.kcal / safeServings,
    p: totals.p / safeServings,
    c: totals.c / safeServings,
    f: totals.f / safeServings,
  });

  const removeIngredient = id => {
    setIngredients(prev => prev.filter(ingredient => ingredient.id !== id));
  };

  const handleSaveRecipe = async () => {
    if (!recipeName.trim()) {
      setSaveError('Please add a recipe name.');
      return;
    }

    if (ingredients.length === 0) {
      setSaveError('Please add at least one ingredient.');
      return;
    }

    if (validItems.length === 0) {
      setSaveError('Your selected ingredients are missing food data. Please re-add them.');
      return;
    }

    setSaveError('');

    try {
      await createRecipe.mutateAsync({
        name: recipeName.trim(),
        servings: safeServings,
        notes: '',
        items: validItems.map(ingredient => ({
          food_id: ingredient.foodId,
          quantity: ingredient.quantity,
        })),
      });

      navigate('/nutrition/recipe', { replace: true });
    } catch (error) {
      console.error('Failed to save recipe:', error);
      setSaveError(error?.response?.data?.error || 'Failed to save recipe. Please try again.');
    }
  };

  return (
    <div className="cr-root">
      <header className="cr-header">
        <div className="cr-header-left">
          <button
            id="cr-back-to-library-btn"
            className="cr-back-btn"
            onClick={() => navigate('/nutrition/recipe')}
            aria-label="Back to recipes"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="cr-avatar">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: 20, color: '#38671a' }}>person</span>
          </div>
          <h1 className="cr-header-brand">The Kinetic Craft</h1>
        </div>
        <div className="cr-header-right">
          <div className="cr-tag-badge">RECIPE_BUILDER</div>
        </div>
      </header>

      <main className="cr-main">
        <section className="cr-total-card">
          <span className="cr-step-label">Recipe Builder</span>
          <h2 className="cr-recipe-name">{recipeName.trim() || 'New Recipe'}</h2>
          <input
            id="cr-recipe-name-input"
            className="cr-recipe-input"
            type="text"
            value={recipeName}
            onChange={event => setRecipeName(event.target.value)}
            placeholder="Name your recipe (e.g., Protein Pancakes)"
            aria-label="Recipe name"
          />

          <div className="cr-servings-row">
            <label className="cr-servings-label" htmlFor="cr-servings-input">Servings</label>
            <input
              id="cr-servings-input"
              className="cr-servings-input"
              type="number"
              min={1}
              value={servings}
              onChange={event => setServings(Math.max(1, Number(event.target.value) || 1))}
            />
          </div>

          <div className="cr-sticker-row">
            <div className="cr-sticker cr-sticker--green cr-sticker--left">Total: {totals.kcal} kcal</div>
            <div className="cr-sticker cr-sticker--purple cr-sticker--right">{totals.p}g P</div>
            <div className="cr-sticker cr-sticker--sand">{totals.c}g C</div>
            <div className="cr-sticker cr-sticker--red cr-sticker--left">{totals.f}g F</div>
          </div>

          <div className="cr-per-serving-row">
            <span>Per serving</span>
            <span>{perServing.kcal} kcal · {perServing.p}g P · {perServing.c}g C · {perServing.f}g F</span>
          </div>

          <div className="cr-deco-icon">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: 80, opacity: 0.1 }}>restaurant</span>
          </div>
        </section>

        <section className="cr-ingredients">
          <h3 className="cr-section-title">Current Composition</h3>
          <div className="cr-ingredient-list">
            {ingredients.length === 0 && (
              <p className="cr-empty-state">No ingredients yet. Add your first ingredient to get started.</p>
            )}

            {ingredients.map((ingredient, index) => {
              const tilts = ['cr-item--left', 'cr-item--right', 'cr-item--left-sm'];
              return (
                <div
                  key={ingredient.id}
                  id={`cr-ingredient-${ingredient.id}`}
                  className={`cr-item ${tilts[index % tilts.length]}`}
                >
                  <div className="cr-item-left">
                    <div
                      className="cr-item-icon"
                      style={{
                        background: ingredient.iconBg,
                        borderColor: ingredient.iconColor,
                        color: ingredient.iconColor,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {ingredient.icon}
                      </span>
                    </div>
                    <div>
                      <p className="cr-item-name">{ingredient.name}</p>
                      <p className="cr-item-desc">{ingredient.desc}</p>
                    </div>
                  </div>
                  <div className="cr-item-right">
                    <span className="cr-item-qty">({ingredient.qty})</span>
                    <button
                      className="cr-remove-btn"
                      onClick={() => removeIngredient(ingredient.id)}
                      aria-label={`Remove ${ingredient.name}`}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {saveError && <p className="cr-save-error">{saveError}</p>}

        <section className="cr-actions">
          <button
            id="cr-add-ingredient-btn"
            className="cr-add-ingredient-btn"
            onClick={() => navigate('/nutrition/food-search?meal=recipe', {
              state: { mode: 'builder', ingredients, recipeName, servings: safeServings },
            })}
          >
            <span className="material-symbols-outlined">add_circle</span>
            Add Ingredient
          </button>
          <button
            id="cr-save-btn"
            className="cr-save-btn"
            onClick={handleSaveRecipe}
            disabled={createRecipe.isPending}
          >
            {createRecipe.isPending ? 'Saving…' : 'Save Recipe'}
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </section>

        <section className="cr-image-card">
          <div className="cr-image-area">
            <span className="cr-image-emoji">🥞</span>
            <div className="cr-image-gradient" />
            <div className="cr-time-badge">EST. 15 MINS</div>
          </div>
          <div className="cr-image-caption">
            <p className="cr-image-quote">"Build once, save it, and reuse it from your recipes list whenever you need it."</p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function CreateRecipe() {
  const location = useLocation();
  const draft = getDraftFromState(location.state);

  if (draft.mode !== 'builder') {
    return <RecipesListView />;
  }

  return <RecipeBuilderView key={location.key} initialDraft={draft} />;
}
