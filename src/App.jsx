import { useState } from 'react';
import { useAuth } from './hooks/useAuth';

// ── Auth screens ──────────────────────────────────────────────────
import Login              from './components/auth/Login';
import Signup             from './components/auth/Signup';
import ForgotPassword     from './components/auth/ForgotPassword';
import OTPVerification    from './components/auth/OTPVerification';
import ResetPassword      from './components/auth/ResetPassword';
import PasswordChanged    from './components/auth/PasswordChanged';

// ── Onboarding screens ────────────────────────────────────────────
import OnboardingBasicInfo     from './components/auth/OnboardingBasicInfo';
import OnboardingGoalsActivity from './components/auth/OnboardingGoalsActivity';
import OnboardingYourPlan      from './components/auth/OnboardingYourPlan';

// ── App layout + screens ──────────────────────────────────────────
import AppLayout    from './components/common/AppLayout';
import Dashboard    from './components/user/Dashboard/Dashboard';
import Workouts     from './components/user/Workouts/Workouts';
import Nutrition    from './components/user/Nutrition/Nutrition';
import AIAssistant  from './components/user/AIAssistant/AIAssistant';
import Settings     from './components/user/Settings/Settings';

// ── Admin ─────────────────────────────────────────────────────────
import Admin        from './components/admin/Admin';

// ── Screen name constants ─────────────────────────────────────────
const S = {
  LOGIN:    'login',
  SIGNUP:   'signup',
  FORGOT:   'forgot',
  OTP:      'otp',
  RESET_PW: 'reset-pw',
  PW_DONE:  'pw-done',
};

const STEP = { BASIC: 1, GOALS: 2, PLAN: 3 };

// ── Root App ──────────────────────────────────────────────────────
export default function App() {
  const { isAuthenticated, isOnboarded, isAdmin } = useAuth();

  const [screen,      setScreen]      = useState(S.LOGIN);
  const [resetEmail,  setResetEmail]  = useState('');
  const [onboardStep, setOnboardStep] = useState(STEP.BASIC);
  const [activeTab,   setActiveTab]   = useState('dashboard');

  // ── Not authenticated ─────────────────────────────────────────
  if (!isAuthenticated) {
    switch (screen) {

      case S.SIGNUP:
        return (
          <Signup
            onBack={() => setScreen(S.LOGIN)}
            onLogin={() => setScreen(S.LOGIN)}
          />
        );

      case S.FORGOT:
        return (
          <ForgotPassword
            onBack={() => setScreen(S.LOGIN)}
            onSuccess={email => { setResetEmail(email); setScreen(S.OTP); }}
          />
        );

      case S.OTP:
        return (
          <OTPVerification
            email={resetEmail}
            onBack={() => setScreen(S.FORGOT)}
            onSuccess={() => setScreen(S.RESET_PW)}
          />
        );

      case S.RESET_PW:
        return (
          <ResetPassword
            onBack={() => setScreen(S.OTP)}
            onSuccess={() => setScreen(S.PW_DONE)}
          />
        );

      case S.PW_DONE:
        return (
          <PasswordChanged
            onBackToLogin={() => setScreen(S.LOGIN)}
          />
        );

      default: // S.LOGIN
        return (
          <Login
            onForgotPassword={() => setScreen(S.FORGOT)}
            onSignup={() => setScreen(S.SIGNUP)}
          />
        );
    }
  }

  // ── Authenticated, not onboarded → Onboarding ────────────────
  if (!isOnboarded) {
    if (onboardStep === STEP.BASIC) {
      return (
        <OnboardingBasicInfo
          step={1} totalSteps={3}
          onNext={() => setOnboardStep(STEP.GOALS)}
          onBack={() => {}}
        />
      );
    }
    if (onboardStep === STEP.GOALS) {
      return (
        <OnboardingGoalsActivity
          step={2} totalSteps={3}
          onNext={() => setOnboardStep(STEP.PLAN)}
          onBack={() => setOnboardStep(STEP.BASIC)}
        />
      );
    }
    if (onboardStep === STEP.PLAN) {
      return (
        <OnboardingYourPlan
          step={3} totalSteps={3}
          onBack={() => setOnboardStep(STEP.GOALS)}
        />
      );
    }
  }

  // ── Admin users → Admin Panel ────────────────────────────────
  if (isAdmin) {
    return <Admin onExit={() => {}} />;
  }

  // ── Fully authenticated + onboarded → Main App ───────────────
  const tabContent = {
    dashboard: <Dashboard onTabChange={setActiveTab} />,
    workouts:  <Workouts  onClose={() => setActiveTab('dashboard')} />,
    nutrition: <Nutrition />,
    ai:        <AIAssistant />,
    settings:  <Settings  />,
  };

  return (
    <AppLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {tabContent[activeTab] ?? <Dashboard />}
    </AppLayout>
  );
}
