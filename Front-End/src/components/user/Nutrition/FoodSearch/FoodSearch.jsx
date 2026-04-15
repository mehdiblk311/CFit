import { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { nutritionAPI } from '../../../../api/nutrition';
import { useRecipes, useLogRecipeToMeal } from '../../../../hooks/queries/useNutrition';
import { getFoodMeasurementMeta } from '../foodMeasurement';
import './FoodSearch.css';

const FILTER_CHIPS = ['All', 'Recent', 'Favorites', 'My Recipes', 'Custom'];

const CATEGORY_EMOJI = {
  'Dairy': '🥛', 'Milk': '🥛',
  'Fruit': '🍎', 'Fruits': '🍎',
  'Vegetable': '🥦', 'Vegetables': '🥦',
  'Poultry': '🍗', 'Chicken': '🍗',
  'Beef': '🥩', 'Pork': '🥩', 'Lamb': '🥩',
  'Fish': '🐟', 'Seafood': '🦐',
  'Grain': '🌾', 'Grains': '🌾', 'Bread': '🍞', 'Cereal': '🥣',
  'Legume': '🫘', 'Beans': '🫘', 'Lentil': '🫘',
  'Nut': '🥜', 'Nuts': '🥜', 'Seeds': '🌻',
  'Snack': '🍿', 'Sweets': '🍬', 'Candy': '🍬',
  'Beverage': '🥤', 'Juice': '🧃',
  'Oil': '🫙', 'Fat': '🧈',
  'Egg': '🥚',
  'Soup': '🍲',
  'Spice': '🧂', 'Herb': '🌿',
};

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getCategoryEmoji(category = '') {
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJI)) {
    if (category.toLowerCase().includes(key.toLowerCase())) return emoji;
  }
  return '🍽️';
}

export default function FoodSearch() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const legacyMeal = searchParams.get('meal') || '';
  const mealId = searchParams.get('mealId') || '';
  const mealType = searchParams.get('mealType') || legacyMeal || 'meal';
  const mealLabel = mealType === 'snack' ? 'Snacks' : mealType.charAt(0).toUpperCase() + mealType.slice(1);

  const [query, setQuery] = useState('');
  const [active, setActive] = useState('All');

  const isSearching = query.length >= 2;

  /* Search results when user types */
  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ['foods', 'search', query],
    queryFn: () => nutritionAPI.searchFoods(query, { limit: 20 }),
    enabled: isSearching,
    staleTime: 1000 * 30,
  });

  /* Suggested foods on load (no query) */
  const { data: suggestedData, isLoading: suggestedLoading } = useQuery({
    queryKey: ['foods', 'suggested'],
    queryFn: () => nutritionAPI.searchFoods('', { limit: 10 }),
    enabled: !isSearching,
    staleTime: 1000 * 60 * 5,
  });

  const isLoading = isSearching ? searchLoading : suggestedLoading;
  const foods = isSearching ? (searchData?.data ?? []) : (suggestedData?.data ?? []);
  
  const logRecipeToMeal = useLogRecipeToMeal();
  const { data: recipesData, isLoading: recipesLoading } = useRecipes({ limit: 50 });
  const recipes = Array.isArray(recipesData?.data) ? recipesData.data : (Array.isArray(recipesData) ? recipesData : []);

  const resultsLabel = active === 'My Recipes' ? 'Your Recipes' : (isSearching ? `${foods.length} Results for "${query}"` : 'Suggested Foods');

  const handleLogRecipe = async (recipe) => {
    if (!mealType || mealType === 'recipe') return;
    try {
      await logRecipeToMeal.mutateAsync({
        recipe_id: recipe.id,
        data: {
          date: getLocalDateKey(),
          ...(mealId ? { meal_id: mealId } : {}),
          meal_type: mealType,
          servings: 1,
        }
      });
      navigate('/nutrition');
    } catch (err) {
      console.error('Failed to log recipe:', err);
      alert('Failed to log recipe.');
    }
  };

  const goToAddQuantity = (food) => {
    const params = new URLSearchParams({ foodId: food.id });

    if (mealId) {
      params.set('mealId', mealId);
    }

    if (mealType === 'recipe' && !mealId) {
      params.set('meal', 'recipe');
    } else {
      params.set('mealType', mealType);
    }

    navigate(`/nutrition/add-quantity?${params.toString()}`, {
      state: location.state,
    });
  };

  const tilts = ['fs-row--tilt-left', '', 'fs-row--tilt-right-sm', 'fs-row--tilt-right'];

  const handleBack = () => {
    if (mealType === 'recipe') {
      navigate('/nutrition/recipe', { state: location.state });
      return;
    }

    navigate('/nutrition');
  };

  return (
    <div className="fs-root">
      {/* Header */}
      <nav className="fs-header">
        <div className="fs-header-left">
          <button
            id="fs-back-btn"
            className="fs-back-btn"
            onClick={handleBack}
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
          {isLoading && (
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#aaa', animation: 'spin 1s linear infinite' }}>progress_activity</span>
          )}
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
            <h2 className="fs-results-title">{isLoading ? 'Loading…' : resultsLabel}</h2>
            <span className="material-symbols-outlined fs-sort-icon">sort</span>
          </div>

          {active === 'My Recipes' ? (
            recipesLoading ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: '#888' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 8, animation: 'spin 1s linear infinite' }}>progress_activity</span>
                <p style={{ margin: 0, fontSize: 14 }}>Loading recipes...</p>
              </div>
            ) : recipes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: '#888' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>menu_book</span>
                <p style={{ margin: 0, fontSize: 14 }}>No recipes found.</p>
                <p style={{ margin: '4px 0 0', fontSize: 12 }}>Create a recipe in the Recipes tab first.</p>
              </div>
            ) : (
              recipes.map((recipe, i) => (
                <div
                  key={recipe.id}
                  id={`fs-recipe-${recipe.id}`}
                  className={`fs-row ${tilts[i % tilts.length]}`}
                  onClick={() => handleLogRecipe(recipe)}
                  role="button"
                >
                  <div className="fs-row-left">
                    <div className="fs-thumbnail">🥞</div>
                    <div>
                      <div className="fs-food-name-row">
                        <h3 className="fs-food-name">{recipe.name}</h3>
                      </div>
                      <div className="fs-food-macros">
                        <span className="fs-macro-tag" style={{ marginTop: '4px' }}>
                          {recipe.items?.length || 0} ingredients
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="fs-row-right">
                    <span className="fs-food-emoji">🥞</span>
                    <button
                      className="fs-add-btn"
                      onClick={e => { e.stopPropagation(); handleLogRecipe(recipe); }}
                      aria-label={`Log ${recipe.name}`}
                      disabled={logRecipeToMeal.isPending}
                    >
                      <span className="material-symbols-outlined">add</span>
                    </button>
                  </div>
                </div>
              ))
            )
          ) : (
            <>
              {!isLoading && foods.length === 0 && isSearching && (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: '#888' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>search_off</span>
                  <p style={{ margin: 0, fontSize: 14 }}>No foods found for <strong>"{query}"</strong></p>
                  <p style={{ margin: '4px 0 0', fontSize: 12 }}>Try a different name or create a custom food below</p>
                </div>
              )}

              {foods.map((food, i) => {
                const emoji = getCategoryEmoji(food.category);
                const { gramBased, referenceLabel, referenceQuantity, servingSize } = getFoodMeasurementMeta(food);
                const referenceValue = (key) => Math.round(
                  gramBased
                    ? ((food[key] || 0) / servingSize) * referenceQuantity
                    : (food[key] || 0)
                );

                return (
                  <div
                    key={food.id}
                    id={`fs-food-${food.id}`}
                    className={`fs-row ${tilts[i % tilts.length]}`}
                    onClick={() => goToAddQuantity(food)}
                    role="button"
                  >
                    <div className="fs-row-left">
                      <div className="fs-thumbnail">{emoji}</div>
                      <div>
                        <div className="fs-food-name-row">
                          <h3 className="fs-food-name">{food.name}</h3>
                        </div>
                        {food.brand && <p style={{ margin: '0 0 2px', fontSize: 11, color: '#888' }}>{food.brand}</p>}
                        <div className="fs-food-macros">
                          <span className="fs-macro-tag">
                            <span className="fs-dot fs-dot--kcal" />
                            {referenceValue('calories')} kcal
                          </span>
                          <span className="fs-macro-tag">
                            <span className="fs-dot fs-dot--protein" />
                            {referenceValue('protein')}g protein
                          </span>
                          <span style={{ fontSize: 10, color: '#aaa', alignSelf: 'center' }}>per {referenceLabel}</span>
                        </div>
                      </div>
                    </div>
                    <div className="fs-row-right">
                      <span className="fs-food-emoji">{emoji}</span>
                      <button
                        id={`fs-add-${food.id}`}
                        className="fs-add-btn"
                        onClick={e => { e.stopPropagation(); goToAddQuantity(food); }}
                        aria-label={`Add ${food.name}`}
                      >
                        <span className="material-symbols-outlined">add</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
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
