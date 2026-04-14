const GRAM_UNITS = new Set(['g', 'gram', 'grams', 'gm']);

function roundToStep(value, step) {
  return Math.round(value / step) * step;
}

export function formatMeasureValue(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return '0';
  }

  return Number(numericValue.toFixed(2)).toString();
}

export function getServingUnit(food) {
  return `${food?.serving_unit || ''}`.trim();
}

export function isGramBasedFood(food) {
  const unit = getServingUnit(food).toLowerCase();

  return !unit || GRAM_UNITS.has(unit);
}

export function getServingSize(food) {
  const numericServingSize = Number(food?.serving_size);

  if (numericServingSize > 0) {
    return numericServingSize;
  }

  return isGramBasedFood(food) ? 100 : 1;
}

export function formatMeasurement(value, unit) {
  const formattedValue = formatMeasureValue(value);

  if (!unit) {
    return formattedValue;
  }

  return unit === 'g' ? `${formattedValue}${unit}` : `${formattedValue} ${unit}`;
}

export function getFoodMeasurementMeta(food) {
  const gramBased = isGramBasedFood(food);
  const servingSize = getServingSize(food);
  const servingUnit = gramBased ? 'g' : getServingUnit(food) || 'serving';
  const referenceQuantity = gramBased ? 100 : servingSize;
  const referenceLabel = gramBased
    ? '100g'
    : formatMeasurement(servingSize, servingUnit);

  return {
    gramBased,
    referenceQuantity,
    referenceLabel,
    servingSize,
    servingUnit,
  };
}

export function getQuickMeasurePresets(food) {
  const { gramBased, servingSize } = getFoodMeasurementMeta(food);

  if (gramBased) {
    return [25, 50, 100, 150, 200];
  }

  return Array.from(new Set(
    [0.5, 1, 1.5, 2, 3]
      .map(multiplier => roundToStep(servingSize * multiplier, 0.25))
      .filter(value => value > 0)
  ));
}
