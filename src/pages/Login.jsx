import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';
import styles from './Login.module.css';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  // Reset Password Modal States
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const sessionMsg = localStorage.getItem('player_registry_session_msg');
    if (sessionMsg) {
      setError(sessionMsg);
      localStorage.removeItem('player_registry_session_msg');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {

    const payload = {
      Checkout: "updatepassword",
      FirstName: "", MiddleName: "", Surname: "", Mobile: "",
      DOB: "", Email: "", State: "", TrialCity: "", TrialZone: "",
      PlayingRoles: "", BattingHandedness: "", PreferredBowlingStyle: "",
      PreferredBattingOrders: "", email: resetEmail,
    };


    setResetError('');
    setResetMessage('');

    if (!resetEmail || !resetEmail.trim()) {
      setResetError('Email is required.');
      return;
    }

    setResetLoading(true);
    try {
      const response = await fetch('https://auqvn8x7x4.execute-api.ap-south-1.amazonaws.com/ECLPlayerRegistration/player/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      let parsedBody = data;
      if (data.body && typeof data.body === 'string') {
        parsedBody = JSON.parse(data.body);
      }

      if (data.statusCode === 200 || parsedBody.success) {
        setResetMessage(parsedBody.message || 'A new password has been generated and sent to your registered email address.');
        setResetEmail('');
      } else {
        setResetError(parsedBody.message || 'No user found with this email address.');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setResetError(err.message || 'Server error while processing forgot password.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      {/* Dynamic Background Elements */}
      <div className={styles.bgBlob} aria-hidden="true" />
      <div className={styles.bgBlob2} aria-hidden="true" />
      <div className={styles.bgBlob3} aria-hidden="true" />
      <div className={styles.meshGradient} aria-hidden="true" />

      <div className={`glass ${styles.loginCard}`}>
        <div className={styles.headerArea}>
          <div className={styles.logoBox}>
            <img
              src="https://cloud.cricket-21.com/c21adminpanel/images/kadamba_logo.png"
              alt="Kadamba Logo"
              className={styles.logoImage}
            />
          </div>
          <h1 className={styles.title}>REGISTRY <span className={styles.titleHighlight}>Pro</span></h1>
          {/* <p className={styles.subtitle}>Enterprise-Grade Sports Management</p> */}
        </div>

        <form onSubmit={handleSubmit} className={styles.formArea}>
          {error && (
            <div className={styles.errorBox} role="alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} htmlFor="username">Username</label>
            <div className={styles.inputWrapper}>
              <User size={18} className={styles.inputIcon} />
              <input
                id="username"
                type="text"
                className={`input-field ${styles.inputField}`}
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} htmlFor="password">Password</label>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.inputIcon} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={`input-field ${styles.inputField}`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className={styles.eyeToggle}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={`btn btn-primary ${styles.loginBtn}`}
            disabled={loading}
          >
            {loading ? (
              <span className={styles.btnContent}>
                <div className="loading-spinner" style={{ width: '18px', height: '18px', borderTopColor: '#fff' }}></div>
                Authenticating...
              </span>
            ) : (
              'Sign In to Dashboard'
            )}
          </button>

          <div style={{ justifyContent: "center", display: "flex", alignItems: "center", marginTop: "20px" }}>
            <p className={styles.helperText}>
              Forgot Password? <span className={styles.reglinkText} onClick={() => setResetModalOpen(true)} style={{ cursor: 'pointer' }}>Reset Password</span>
            </p>
          </div>

          <footer className={styles.loginFooter}>
            <p className={styles.helperText}>
              Kadamba
            </p>
          </footer>
        </form>
      </div>

      {/* Reset Password Modal */}
      {resetModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={`glass ${styles.loginCard}`} style={{ maxWidth: '400px', animation: 'none' }}>
            <div className={styles.headerArea} style={{ marginBottom: '1.5rem' }}>
              <h2 className={styles.title} style={{ fontSize: '1.5rem' }}>Reset Password</h2>
              <p className={styles.subtitle} style={{ marginTop: '0.5rem' }}>Enter your registered email address to reset password</p>
            </div>

            {resetMessage && (
              <div className={styles.successBox} role="alert" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#86efac', padding: '0.875rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.8125rem', border: '1px solid rgba(34, 197, 94, 0.2)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CheckCircle size={18} />
                <span>{resetMessage}</span>
              </div>
            )}

            {resetError && (
              <div className={styles.errorBox} role="alert">
                <AlertCircle size={18} />
                <span>{resetError}</span>
              </div>
            )}

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel} htmlFor="resetEmail">Email</label>
              <div className={styles.inputWrapper}>
                <input
                  id="resetEmail"
                  type="email"
                  className={`input-field ${styles.inputField}`}
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  style={{ paddingLeft: '1rem' }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                className={`btn btn-secondary`}
                onClick={() => { setResetModalOpen(false); setResetEmail(''); setResetError(''); setResetMessage(''); }}
                disabled={resetLoading}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.1)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.2)' }}
              >
                Cancel
              </button>
              <button
                className={`btn btn-primary ${styles.loginBtn}`}
                onClick={handleResetPassword}
                disabled={resetLoading}
                style={{ flex: 1, marginTop: 0 }}
              >
                {resetLoading ? (
                  <span className={styles.btnContent}>
                    <div className="loading-spinner" style={{ width: '18px', height: '18px', borderTopColor: '#fff' }}></div>
                  </span>
                ) : 'Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default LoginPage;
