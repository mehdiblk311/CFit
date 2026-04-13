import { useState } from 'react';
import OnboardingBasicInfo     from './OnboardingBasicInfo';
import OnboardingGoalsActivity from './OnboardingGoalsActivity';
import OnboardingYourPlan      from './OnboardingYourPlan';

const STEP = { BASIC: 1, GOALS: 2, PLAN: 3 };

export default function OnboardingFlow() {
  const [step, setStep] = useState(STEP.BASIC);

  if (step === STEP.GOALS) {
    return (
      <OnboardingGoalsActivity
        step={2} totalSteps={3}
        onNext={() => setStep(STEP.PLAN)}
        onBack={() => setStep(STEP.BASIC)}
      />
    );
  }
  if (step === STEP.PLAN) {
    return (
      <OnboardingYourPlan
        step={3} totalSteps={3}
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
      onNext={() => setStep(STEP.GOALS)}
      onBack={() => {}}
    />
  );
}
