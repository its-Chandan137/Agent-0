import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchMe, sendOtp, verifyOtp } from '../lib/api';
import { buildE164Phone, countryCodes } from '../lib/phone';

function LoginPage({ onAuthenticated }) {
  const navigate = useNavigate();
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fullPhone = buildE164Phone(countryCode, phone);

  async function handleSendOtp(event) {
    event.preventDefault();
    setStatus('');

    try {
      setIsSubmitting(true);
      await sendOtp({ phone: fullPhone });
      setStep(2);
      setStatus(`OTP sent to ${fullPhone}`);
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
      await verifyOtp({ phone: fullPhone, otp });
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
              Approved members can sign in with a one-time SMS code sent to their phone.
            </p>

            <div className="auth-divider">
              <span />
              <strong>{step === 1 ? 'Phone verification' : 'Enter OTP'}</strong>
              <span />
            </div>

            {step === 1 ? (
              <form className="auth-form" onSubmit={handleSendOtp}>
                <label>
                  Phone number
                  <div className="phone-input-row">
                    <select
                      value={countryCode}
                      onChange={(event) => setCountryCode(event.target.value)}
                    >
                      {countryCodes.map((code) => (
                        <option key={code} value={code}>
                          {code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="9876543210"
                      required
                    />
                  </div>
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
                  Change number
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
