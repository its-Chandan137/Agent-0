import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchMe, sendOtp, verifyOtp } from '../lib/api';

function LoginPage({ onAuthenticated }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSendOtp(event) {
    event.preventDefault();
    setStatus('');

    try {
      setIsSubmitting(true);
      await sendOtp({ email });
      setStep(2);
      setStatus(`OTP sent to ${email.trim().toLowerCase()}`);
    } catch (error) {
      setStatus(error.message || 'Could not send OTP.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyOtp(event) {
    event.preventDefault();
    setStatus('');

    try {
      setIsSubmitting(true);
      await verifyOtp({ email, otp });
      const response = await fetchMe();
      onAuthenticated?.(response.user);
      navigate('/');
    } catch (error) {
      setStatus(error.message || 'Could not verify OTP.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="page auth-page">
      <div className="auth-scene">
        <Link className="auth-home-link" to="/">
          <span aria-hidden="true">‹</span>
          <span>Home</span>
        </Link>

        <div className="auth-layout">
          <div className="auth-card panel auth-premium-card">
            <div className="auth-card-badge">M</div>
            <p className="page-eyebrow">Secure login</p>
            <h1>Log in to Mantra</h1>
            <p className="auth-copy">
              Approved members can sign in with a one-time code sent to their email inbox.
            </p>

            <div className="auth-divider">
              <span />
              <strong>{step === 1 ? 'Email verification' : 'Enter OTP'}</strong>
              <span />
            </div>

            {step === 1 ? (
              <form className="auth-form" onSubmit={handleSendOtp}>
                <label>
                  Email address
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </label>

                <button type="submit" className="primary-button" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleVerifyOtp}>
                <label>
                  One-time password
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength="6"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    required
                  />
                </label>

                <button type="submit" className="primary-button" disabled={isSubmitting}>
                  {isSubmitting ? 'Verifying...' : 'Verify OTP'}
                </button>

                <button
                  type="button"
                  className="ghost-button auth-link-button"
                  onClick={() => {
                    setStep(1);
                    setOtp('');
                    setStatus('');
                  }}
                >
                  Change email
                </button>
              </form>
            )}

            {status ? <p className="form-status auth-status">{status}</p> : null}

            <p className="auth-footer">
              New here? <Link to="/request-access">Request access</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default LoginPage;
