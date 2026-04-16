import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { nutritionAPI } from '../../../../api/nutrition';
import './NutritionHistory.css';

const DAYS_OF_WEEK = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const TIME_RANGES = ['1W', '1M', '3M'];
const RANGE_CONFIG = {
  '1W': { days: 7, bucketSize: 1 },
  '1M': { days: 30, bucketSize: 1 },
  '3M': { days: 84, bucketSize: 7 },
};
const RANGE_THEME = {
  '1W': { key: 'week', title: 'Daily Sprint', icon: 'local_fire_department' },
  '1M': { key: 'month', title: 'Monthly Rhythm', icon: 'query_stats' },
  '3M': { key: 'quarter', title: 'Quarter Arc', icon: 'timeline' },
};
const MEAL_ORDER = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 };

function toDateKey(value) {
  if (!value) return '';
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

function fromDateKey(key) {
  if (!key) return null;
  const [year, month, day] = key.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function addDays(date, amount) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatMonthLabel(date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatDateLabel(dateKey) {
  const parsed = fromDateKey(dateKey);
  if (!parsed) return 'Unknown Date';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function formatMealType(value) {
  const normalized = `${value || 'meal'}`.toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getCalendarCells(visibleMonth, mealsByDate) {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells = [];

  for (let i = firstWeekday; i > 0; i -= 1) {
    const day = prevMonthDays - i + 1;
    const date = new Date(year, month - 1, day);
    const dateKey = toDateKey(date);
    cells.push({
      dateKey,
      label: day,
      isCurrentMonth: false,
      hasLog: mealsByDate.has(dateKey),
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const dateKey = toDateKey(date);
    cells.push({
      dateKey,
      label: day,
      isCurrentMonth: true,
      hasLog: mealsByDate.has(dateKey),
    });
  }

  let trailingDay = 1;
  while (cells.length % 7 !== 0 || cells.length < 35) {
    const date = new Date(year, month + 1, trailingDay);
    const dateKey = toDateKey(date);
    cells.push({
      dateKey,
      label: trailingDay,
      isCurrentMonth: false,
      hasLog: mealsByDate.has(dateKey),
    });
    trailingDay += 1;
  }

  return cells;
}

function buildTrendBuckets(mealsByDate, endDateKey, range) {
  const config = RANGE_CONFIG[range] || RANGE_CONFIG['1M'];
  const endDate = fromDateKey(endDateKey) || new Date();
  const startDate = addDays(endDate, -(config.days - 1));
  const buckets = [];

  for (let cursor = new Date(startDate); cursor <= endDate; cursor = addDays(cursor, config.bucketSize)) {
    const bucketStart = new Date(cursor);
    const rawBucketEnd = addDays(bucketStart, config.bucketSize - 1);
    const bucketEnd = rawBucketEnd > endDate ? endDate : rawBucketEnd;

    let totalCalories = 0;
    for (let dayCursor = new Date(bucketStart); dayCursor <= bucketEnd; dayCursor = addDays(dayCursor, 1)) {
      const dateKey = toDateKey(dayCursor);
      totalCalories += mealsByDate.get(dateKey)?.totalCalories || 0;
    }

    const label = config.days <= 7
      ? bucketEnd.toLocaleDateString('en-US', { weekday: 'short' })
      : config.bucketSize > 1
        ? bucketEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : bucketEnd.toLocaleDateString('en-US', { day: 'numeric' });

    buckets.push({
      label,
      calories: Math.round(totalCalories),
    });
  }

  return buckets;
}

function getMealTotals(meal) {
  const itemTotals = Array.isArray(meal?.items)
    ? meal.items.reduce((acc, item) => {
      const quantity = Number(item?.quantity || 0);
      const food = item?.food || {};
      acc.calories += (Number(food.calories) || 0) * quantity;
      acc.protein += (Number(food.protein) || 0) * quantity;
      acc.carbs += (Number(food.carbohydrates) || 0) * quantity;
      acc.fat += (Number(food.fat) || 0) * quantity;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 })
    : { calories: 0, protein: 0, carbs: 0, fat: 0 };

  return {
    calories: Number(meal?.total_calories ?? itemTotals.calories) || itemTotals.calories,
    protein: Number(meal?.total_protein ?? itemTotals.protein) || itemTotals.protein,
    carbs: Number(meal?.total_carbs ?? itemTotals.carbs) || itemTotals.carbs,
    fat: Number(meal?.total_fat ?? itemTotals.fat) || itemTotals.fat,
  };
}

async function fetchAllMealsForHistory() {
  const meals = [];
  let page = 1;
  const limit = 100;

  while (page <= 200) {
    const payload = await nutritionAPI.getMeals({ page, limit });
    const pageMeals = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : [];

    if (pageMeals.length === 0) break;

    meals.push(...pageMeals);

    const metadata = payload?.metadata || {};
    const totalPages = Number(payload?.metadata?.total_pages || 0);
    const hasExplicitMeta =
      metadata.has_next !== undefined ||
      metadata.page !== undefined ||
      metadata.limit !== undefined ||
      totalPages > 0;

    if (typeof metadata.has_next === 'boolean') {
      if (!metadata.has_next) break;
    } else if (totalPages > 0) {
      if (page >= totalPages) break;
    } else if (hasExplicitMeta) {
      const pageLimit = Number(metadata.limit || limit);
      if (pageMeals.length < pageLimit) break;
    }

    page += 1;
  }

  return meals;
}

export default function NutritionHistory() {
  const navigate = useNavigate();
  const [activeRange, setActiveRange] = useState('1M');
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const todayDateKey = toDateKey(new Date());
  const currentMonth = startOfMonth(new Date());
  const rangeTheme = RANGE_THEME[activeRange] || RANGE_THEME['1M'];

  const {
    data: meals = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['nutrition', 'history', 'meals'],
    queryFn: fetchAllMealsForHistory,
    staleTime: 1000 * 60,
  });

  const mealsByDate = useMemo(() => {
    const grouped = new Map();

    meals.forEach((meal) => {
      const dateKey = toDateKey(meal?.date);
      if (!dateKey) return;

      const existing = grouped.get(dateKey) || {
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        meals: [],
      };

      const totals = getMealTotals(meal);
      existing.totalCalories += totals.calories;
      existing.totalProtein += totals.protein;
      existing.totalCarbs += totals.carbs;
      existing.totalFat += totals.fat;
      existing.meals.push(meal);

      grouped.set(dateKey, existing);
    });

    return grouped;
  }, [meals]);

  const calendarCells = useMemo(
    () => getCalendarCells(visibleMonth, mealsByDate),
    [visibleMonth, mealsByDate],
  );

  const selectedDay = mealsByDate.get(selectedDate) || {
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    meals: [],
  };

  const selectedMeals = useMemo(
    () => [...selectedDay.meals].sort((a, b) => {
      const byMealOrder = (MEAL_ORDER[a.meal_type] ?? 99) - (MEAL_ORDER[b.meal_type] ?? 99);
      if (byMealOrder !== 0) return byMealOrder;
      return String(a.id || '').localeCompare(String(b.id || ''));
    }),
    [selectedDay.meals],
  );

  const chartData = useMemo(
    () => buildTrendBuckets(mealsByDate, selectedDate || todayDateKey, activeRange),
    [mealsByDate, selectedDate, todayDateKey, activeRange],
  );

  const maxChartValue = useMemo(
    () => Math.max(...chartData.map((item) => item.calories), 1),
    [chartData],
  );

  const selectedProgress = Math.min((selectedDay.totalCalories / 2000) * 100, 100);
  const canNavigateNextMonth = visibleMonth < currentMonth;

  const handleMonthChange = (delta) => {
    const nextMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + delta, 1);
    if (delta > 0 && nextMonth > currentMonth) return;
    setVisibleMonth(nextMonth);

    const selectedDateObject = fromDateKey(selectedDate) || new Date();
    const targetDay = selectedDateObject.getDate();
    const maxDayInNextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
    const nextSelectedDate = new Date(
      nextMonth.getFullYear(),
      nextMonth.getMonth(),
      Math.min(targetDay, maxDayInNextMonth),
    );
    const nextSelectedDateKey = toDateKey(nextSelectedDate);
    setSelectedDate(nextSelectedDateKey > todayDateKey ? todayDateKey : nextSelectedDateKey);
  };

  const handleCalendarDayClick = (cell) => {
    if (cell.dateKey > todayDateKey) return;
    setSelectedDate(cell.dateKey);
    if (!cell.isCurrentMonth) {
      const clickedDate = fromDateKey(cell.dateKey);
      if (clickedDate) {
        setVisibleMonth(startOfMonth(clickedDate));
      }
    }
  };

  return (
    <div className={`nh-root nh-root--${rangeTheme.key}`}>
      <nav className="nh-header">
        <div className="nh-header-left">
          <button
            id="nh-back-btn"
            className="nh-back-btn"
            onClick={() => navigate('/nutrition')}
            aria-label="Go back"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="nh-title">Nutrition History</h1>
        </div>
        <div className="nh-header-right">
          <span className="nh-logged-label">{isFetching ? 'Refreshing…' : 'Live Data'}</span>
          <div className="nh-avatar">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: 20, color: '#38671a' }}>person</span>
          </div>
        </div>
      </nav>

      <main className="nh-main">
        {isLoading ? (
          <section className="nh-loading-state">
            <span className="material-symbols-outlined">progress_activity</span>
            <p>Loading nutrition history…</p>
          </section>
        ) : isError ? (
          <section className="nh-error-card">
            <p>Could not load nutrition history from backend.</p>
            <button type="button" className="nh-view-journal-btn" onClick={() => refetch()}>Retry</button>
          </section>
        ) : (
          <>
            <section className="nh-cal-section">
              <div className="nh-calendar-card">
                <div className="nh-cal-header">
                  <h2 className="nh-cal-month">{formatMonthLabel(visibleMonth)}</h2>
                  <div className="nh-cal-nav">
                    <button
                      className="nh-cal-nav-btn"
                      aria-label="Previous month"
                      onClick={() => handleMonthChange(-1)}
                    >
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <button
                      className="nh-cal-nav-btn"
                      aria-label="Next month"
                      onClick={() => handleMonthChange(1)}
                      disabled={!canNavigateNextMonth}
                    >
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                </div>

                <div className="nh-cal-grid">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day} className="nh-cal-day-label">{day}</div>
                  ))}

                  {calendarCells.map((cell) => {
                    const isSelected = selectedDate === cell.dateKey;
                    const isFuture = cell.dateKey > todayDateKey;
                    return (
                      <button
                        key={cell.dateKey}
                        className={`nh-cal-cell nh-cal-cell--btn${cell.isCurrentMonth ? '' : ' nh-cal-cell--dim'}${isFuture ? ' nh-cal-cell--future' : ''}${isSelected ? ' nh-cal-cell--selected' : ''}`}
                        onClick={() => handleCalendarDayClick(cell)}
                        disabled={isFuture}
                      >
                        {cell.label}
                        {cell.hasLog && (
                          <span className={`nh-day-dot${isSelected ? ' nh-day-dot--light' : ''}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="nh-summary-card">
                <span className="nh-summary-tag">Selected Date</span>
                <h3 className="nh-summary-date">{formatDateLabel(selectedDate)}</h3>

                <div className="nh-summary-body">
                  <div className="nh-summary-cal-row">
                    <span className="nh-summary-cal-label">Calories</span>
                    <span className="nh-summary-cal-val">{Math.round(selectedDay.totalCalories)} kcal</span>
                  </div>

                  <div className="nh-summary-cal-row">
                    <span className="nh-summary-cal-label">Meals Logged</span>
                    <span className="nh-summary-cal-val">{selectedMeals.length}</span>
                  </div>

                  <div className="nh-progress-track">
                    <div className="nh-progress-fill" style={{ width: `${selectedProgress}%` }} />
                  </div>

                  {selectedMeals.length === 0 ? (
                    <p className="nh-day-log-empty">No meals logged on this date.</p>
                  ) : (
                    <div className="nh-day-log-list">
                      {selectedMeals.map((meal) => (
                        <div key={meal.id} className="nh-day-log-row">
                          <div>
                            <p className="nh-day-log-type">{formatMealType(meal.meal_type)}</p>
                            <p className="nh-day-log-meta">{meal.items?.length || 0} items</p>
                          </div>
                          <span className="nh-day-log-kcal">{Math.round(meal.total_calories || 0)} kcal</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  id="nh-view-journal-btn"
                  className="nh-view-journal-btn"
                  onClick={() => navigate(`/nutrition?date=${selectedDate}&readonly=1`)}
                >
                  View Full Journal
                </button>
              </div>
            </section>

            <div className="nh-range-wrap">
              <div className="nh-range-group">
                {TIME_RANGES.map((range) => (
                  <button
                    key={range}
                    id={`nh-range-${range}`}
                    className={`nh-range-btn${activeRange === range ? ' nh-range-btn--active' : ''}`}
                    onClick={() => setActiveRange(range)}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            <div className="nh-charts-grid">
              <div className={`nh-chart-card nh-chart-card--wide nh-chart-card--${rangeTheme.key}`}>
                <div className="nh-chart-card-header">
                  <h4 className="nh-chart-card-title">{rangeTheme.title}</h4>
                  <span className="material-symbols-outlined nh-chart-icon">{rangeTheme.icon}</span>
                </div>
                <div className="nh-bar-chart">
                  <div className="nh-bar-chart-grid">
                    <div className="nh-grid-line" />
                    <div className="nh-grid-line" />
                    <div className="nh-grid-line" />
                  </div>
                  {chartData.map((item, index) => {
                    const isLast = index === chartData.length - 1;
                    const barHeight = item.calories <= 0 ? 8 : Math.max((item.calories / maxChartValue) * 100, 8);
                    return (
                      <div key={`${item.label}-${index}`} className="nh-bar-col">
                        <div
                          className={`nh-bar-item${isLast ? ' nh-bar-item--accent' : ''}${item.calories <= 0 ? ' nh-bar-item--empty' : ''}`}
                          style={{ height: `${barHeight}%` }}
                        />
                        {isLast && <span className="nh-bar-tooltip">{item.calories} kcal</span>}
                      </div>
                    );
                  })}
                </div>
                <div className="nh-chart-x-axis">
                  {chartData.map((item, index) => {
                    const showLabel = activeRange === '1W'
                      ? true
                      : activeRange === '1M'
                        ? index % 5 === 0 || index === chartData.length - 1
                        : index % 2 === 0 || index === chartData.length - 1;
                    return <span key={`${item.label}-${index}`}>{showLabel ? item.label : ''}</span>;
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
