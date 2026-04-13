import { useState } from 'react';
import OnboardingBasicInfo     from './OnboardingBasicInfo';
import OnboardingGoalsActivity from './OnboardingGoalsActivity';
import OnboardingYourPlan      from './OnboardingYourPlan';

const STEP = { BASIC: 1, GOALS: 2, PLAN: 3 };

// Activity multipliers (Mifflin-St Jeor)
const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  light:     1.375,
  moderate:  1.55,
  very:      1.725,
};

// Goal caloric adjustment
const GOAL_ADJUSTMENTS = {
  lose:     -500,
  maintain: 0,
  gain:     +300,
};

// Macro split per goal (protein g/kg, fat % of calories, rest carbs)
const MACRO_SPLITS = {
  lose:     { proteinPerKg: 2.0, fatPct: 0.25 },
  maintain: { proteinPerKg: 1.8, fatPct: 0.28 },
  gain:     { proteinPerKg: 2.2, fatPct: 0.25 },
};

/**
 * Compute TDEE + macros from profile data.
 * Returns { calories, protein, carbs, fat }
 */
export function computeTDEE({ age, height, weight, gender, activityLevel, goal }) {
  // Mifflin-St Jeor BMR
  const bmr = gender === 'female'
    ? 10 * weight + 6.25 * height - 5 * age - 161
    : 10 * weight + 6.25 * height - 5 * age + 5;

  const factor = ACTIVITY_FACTORS[activityLevel] ?? 1.375;
  const tdee   = Math.round(bmr * factor);
  const adj    = GOAL_ADJUSTMENTS[goal] ?? 0;
  const calories = Math.max(1200, tdee + adj);

  const { proteinPerKg, fatPct } = MACRO_SPLITS[goal] ?? MACRO_SPLITS.maintain;
  const protein = Math.round(weight * proteinPerKg);
  const fat     = Math.round((calories * fatPct) / 9);
  const carbs   = Math.round((calories - protein * 4 - fat * 9) / 4);

  return { calories, protein, carbs, fat };
}

export default function OnboardingFlow() {
  const [step, setStep] = useState(STEP.BASIC);

  // Accumulated onboarding data across steps
  const [basicData, setBasicData]  = useState(null); // { age, height, weight, gender }
  const [goalsData, setGoalsData]  = useState(null); // { goal, activityLevel }

  function handleBasicNext(data) {
    setBasicData(data);
    setStep(STEP.GOALS);
  }

  function handleGoalsNext(data) {
    setGoalsData(data);
    setStep(STEP.PLAN);
  }

  // Compute TDEE when entering plan step
  const tdeeData = (basicData && goalsData)
    ? computeTDEE({
        age:           basicData.age,
        height:        basicData.height,
        weight:        basicData.weight,
        gender:        basicData.gender,
        activityLevel: goalsData.activityLevel,
        goal:          goalsData.goal,
      })
    : null;

  if (step === STEP.GOALS) {
    return (
      <OnboardingGoalsActivity
        step={2} totalSteps={3}
        onNext={handleGoalsNext}
        onBack={() => setStep(STEP.BASIC)}
      />
    );
  }
  if (step === STEP.PLAN) {
    return (
      <OnboardingYourPlan
        step={3} totalSteps={3}
        tdeeData={tdeeData}
        basicData={basicData}
        goalsData={goalsData}
        onBack={() => setStep(STEP.GOALS)}
      />
      // OnboardingYourPlan calls completeOnboarding() internally,
      // which sets onboarded:true → OnboardingRoute guard auto-redirects to /dashboard
    );
  }
  // default: STEP.BASIC
  return (
    <OnboardingBasicInfo
      step={1} totalSteps={3}
      onNext={handleBasicNext}
      onBack={() => {}}
    />
  );
}
