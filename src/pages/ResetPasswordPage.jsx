import { useState } from 'react';
import { Link } from 'react-router-dom';

function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Enter the email tied to your workspace.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      setError('Use a valid email address.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    setTimeout(() => {
      setStatus('Reset instructions dispatched (demo only). Check your inbox.');
      setIsSubmitting(false);
    }, 500);
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-badge">EvidenceShield</span>
          <h1>Reset access</h1>
          <p>We simulate a reset email; no data leaves this device.</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="reset-email">Email address</label>
          <input
            id="reset-email"
            type="email"
            placeholder="analyst@agency.gov"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError('');
              setStatus('');
            }}
          />
          {error && <div className="auth-error">{error}</div>}
          {status && <div className="auth-success">{status}</div>}
          <button type="submit" className="btn" disabled={isSubmitting || !email.trim()}>
            {isSubmitting ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
        <div className="auth-footer">
          <Link to="/login">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
