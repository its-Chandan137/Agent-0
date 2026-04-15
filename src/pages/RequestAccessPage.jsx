import { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestAccess } from '../lib/api';

function RequestAccessPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus('');

    try {
      setIsSubmitting(true);
      const response = await requestAccess({
        name,
        email,
      });

      setIsSuccess(true);
      setStatus(response.message || "Request sent! You'll be notified when approved.");
    } catch (error) {
      setIsSuccess(false);
      setStatus(error.message || 'Could not submit your request.');
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
            <p className="page-eyebrow">Invite only</p>
            <h1>Request access to Mantra</h1>
            <p className="auth-copy">
              Share your name and email. Once an admin approves you, you can log in with a
              one-time email code.
            </p>

            <div className="auth-divider">
              <span />
              <strong>Join the waitlist</strong>
              <span />
            </div>

            {isSuccess ? (
              <div className="auth-success">
                <h3>Request sent</h3>
                <p>{status}</p>
                <Link className="ghost-button auth-link-button" to="/login">
                  Back to login
                </Link>
              </div>
            ) : (
              <form className="auth-form" onSubmit={handleSubmit}>
                <label>
                  Full name
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Aarav Sharma"
                    required
                  />
                </label>

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
                  {isSubmitting ? 'Sending...' : 'Request access'}
                </button>

                {status ? <p className="form-status auth-status">{status}</p> : null}
              </form>
            )}

            <p className="auth-footer">
              Already approved? <Link to="/login">Go to login</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default RequestAccessPage;
