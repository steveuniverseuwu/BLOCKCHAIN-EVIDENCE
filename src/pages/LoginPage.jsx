import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';

function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const emailTrimmed = form.email.trim();
    if (!emailTrimmed || !form.password.trim()) {
      setError('Enter an email address and password to continue.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(emailTrimmed)) {
      setError('Use a valid email address.');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      login(emailTrimmed);
      navigate('/', { replace: true });
    }, 450);
  };

  const canSubmit = form.email.trim() && form.password.trim() && !isSubmitting;

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-badge">EvidenceShield</span>
          <h1>Sign in to continue</h1>
          <p>Browser-only MVP · credentials stay local.</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            name="email"
            placeholder="analyst@agency.gov"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            name="password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            autoComplete="current-password"
          />

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn" disabled={!canSubmit}>
            {isSubmitting ? 'Signing in…' : 'Enter console'}
          </button>
        </form>
        <div className="auth-footer">
          <Link to="/reset-password">Forgot password?</Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
