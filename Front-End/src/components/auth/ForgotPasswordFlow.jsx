import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ForgotPassword  from './ForgotPassword';
import OTPVerification from './OTPVerification';
import ResetPassword   from './ResetPassword';
import PasswordChanged from './PasswordChanged';

const STEP = { FORGOT: 'forgot', OTP: 'otp', RESET: 'reset', DONE: 'done' };

export default function ForgotPasswordFlow() {
  const navigate = useNavigate();
  const [step,       setStep]       = useState(STEP.FORGOT);
  const [resetEmail, setResetEmail] = useState('');

  if (step === STEP.OTP) {
    return (
      <OTPVerification
        email={resetEmail}
        onBack={() => setStep(STEP.FORGOT)}
        onSuccess={() => setStep(STEP.RESET)}
      />
    );
  }
  if (step === STEP.RESET) {
    return (
      <ResetPassword
        onBack={() => setStep(STEP.OTP)}
        onSuccess={() => setStep(STEP.DONE)}
      />
    );
  }
  if (step === STEP.DONE) {
    return (
      <PasswordChanged
        onBackToLogin={() => navigate('/login')}
      />
    );
  }
  // default: STEP.FORGOT
  return (
    <ForgotPassword
      onBack={() => navigate('/login')}
      onSuccess={email => { setResetEmail(email); setStep(STEP.OTP); }}
    />
  );
}
