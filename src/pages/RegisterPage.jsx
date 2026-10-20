import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RegisterPage() {
  const { sendOtp, resendOtp, verifyAndRegister, error, setError } = useAuth();
  const navigate = useNavigate();

  // Wizard step: 'details' or 'verify'
  const [step, setStep] = useState('details');

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 6-digit OTP fields
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);

  // Loading & Feedback states
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [successMsg, setSuccessMsg] = useState('');

  // Countdown timer for resend button
  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Focus first OTP input when switching to verify step
  useEffect(() => {
    if (step === 'verify') {
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // Request verification code (Step 1 -> Step 2)
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const result = await sendOtp(name.trim(), email.trim(), password);
    setLoading(false);

    if (result.success) {
      setStep('verify');
      setResendCountdown(60);
      setSuccessMsg(`We sent a 6-digit verification code to ${email.trim()}`);
      setOtp(['', '', '', '', '', '']);
    }
  };

  // Resend OTP code
  const handleResend = async () => {
    if (resendCountdown > 0 || resending) return;
    setError('');
    setSuccessMsg('');
    setResending(true);

    const result = await resendOtp(email.trim(), name.trim());
    setResending(false);

    if (result.success) {
      setResendCountdown(60);
      setSuccessMsg('A new verification code has been sent to your email.');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    }
  };

  // Handle individual digit input
  const handleOtpChange = (index, value) => {
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    if (cleaned.length > 1) {
      // Pasted or browser-autofilled multiple digits
      const newOtp = [...otp];
      for (let i = 0; i < cleaned.length && index + i < 6; i++) {
        newOtp[index + i] = cleaned[i];
      }
      setOtp(newOtp);
      const nextIdx = Math.min(index + cleaned.length, 5);
      otpRefs.current[nextIdx]?.focus();
      return;
    }

    const char = cleaned.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = char;
    setOtp(newOtp);

    // Auto advance to next box
    if (char && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Handle key controls (Backspace & arrow keys)
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Move back and clear previous
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        otpRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Handle pasting full 6 digits
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);

    if (!digits) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = digits[i] || '';
    }
    setOtp(newOtp);

    // Focus appropriate input box
    const nextEmptyIndex = newOtp.findIndex((digit) => !digit);
    if (nextEmptyIndex !== -1) {
      otpRefs.current[nextEmptyIndex]?.focus();
    } else {
      otpRefs.current[5]?.focus();
    }
  };

  // Submit OTP and complete registration
  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const fullCode = otp.join('').trim();
    if (fullCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    const success = await verifyAndRegister(name.trim(), email.trim(), password, fullCode);
    setLoading(false);

    if (success) {
      navigate('/today');
    }
  };

  // Return to step 1 to edit email or name
  const handleBackToDetails = () => {
    setError('');
    setSuccessMsg('');
    setStep('details');
  };

  return (
    <div className="auth-page">
      <div className="auth-container fade-in">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo">A</div>
          <h1 className="auth-title">
            {step === 'details' ? 'Create your workspace' : 'Verify your email'}
          </h1>
          <p className="auth-subtitle">
            {step === 'details'
              ? 'Start your learning journey with Arcstep'
              : 'Enter the 6-digit code sent to your inbox'}
          </p>
        </div>

        {/* Card */}
        <div className="auth-card">
          {error && <div className="auth-error">{error}</div>}
          {successMsg && <div className="auth-success-banner">{successMsg}</div>}

          {step === 'details' ? (
            /* STEP 1: Registration details */
            <form className="auth-form" onSubmit={handleRequestCode}>
              <div className="form-group">
                <label className="form-label" htmlFor="register-name">
                  Full Name
                </label>
                <input
                  id="register-name"
                  className="form-input"
                  type="text"
                  placeholder="e.g. Alex Mercer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="register-email">
                  Email Address
                </label>
                <input
                  id="register-email"
                  className="form-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" htmlFor="register-password">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-tertiary)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  id="register-password"
                  className="form-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              <button
                type="submit"
                className="auth-btn"
                disabled={loading}
                style={{ opacity: loading ? 0.6 : 1 }}
              >
                {loading ? 'Sending verification code...' : 'Continue to Verification →'}
              </button>
            </form>
          ) : (
            /* STEP 2: 6-Digit Email Verification */
            <form className="auth-form" onSubmit={handleVerify}>
              <div className="auth-verify-meta">
                <span className="auth-target-email">{email}</span>
                <button
                  type="button"
                  className="auth-change-email-btn"
                  onClick={handleBackToDetails}
                >
                  Edit email
                </button>
              </div>

              <div className="otp-group">
                <label className="form-label" style={{ textAlign: 'center', display: 'block', marginBottom: '4px' }}>
                  Enter 6-digit code
                </label>
                <div className="otp-boxes-container" onPaste={handleOtpPaste}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      className={`otp-digit-box ${digit ? 'filled' : ''}`}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      autoComplete="one-time-code"
                      aria-label={`Digit ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="auth-btn"
                disabled={loading || otp.join('').length !== 6}
                style={{
                  opacity: loading || otp.join('').length !== 6 ? 0.6 : 1,
                  marginTop: '4px'
                }}
              >
                {loading ? 'Verifying...' : 'Verify & Create Account'}
              </button>

              <div className="otp-resend-wrapper">
                {resendCountdown > 0 ? (
                  <span className="otp-countdown-text">
                    Resend code in <strong>{resendCountdown}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    className="otp-resend-btn"
                    onClick={handleResend}
                    disabled={resending}
                  >
                    {resending ? 'Sending...' : 'Didn’t get a code? Resend code'}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
