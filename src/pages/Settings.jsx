import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { playerService } from '../services/playerService';
import { ShieldCheck, AlertTriangle, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import styles from './Settings.module.css';

const SettingsPage = () => {
  const { league, loginData } = useAuth();
  const navigate = useNavigate();

  const [validationEnabled, setValidationEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const isAuthorized = league?.id === 'ILT' && loginData?.agentId === 100;

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await playerService.getValidationStatus();
      
      // Handle response that might contain statusCode or success inside the parsed body
      const success = res.success === true || res.success === 'true' || res.statusCode === 200;
      
      if (success) {
        // validation is either 0 or 1
        const val = Number(res.validation);
        setValidationEnabled(val === 1);
      } else {
        setError(res.message || "Failed to fetch validation status.");
      }
    } catch (err) {
      console.error("Error loading settings:", err);
      setError("Unable to connect to the registry service. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchStatus();
    } else {
      setLoading(false);
    }
  }, [isAuthorized]);

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleToggle = async () => {
    if (updating) return;

    const nextValue = validationEnabled ? 0 : 1;
    setUpdating(true);

    try {
      const res = await playerService.updateValidationStatus(nextValue);
      const success = res.success === true || res.success === 'true' || res.statusCode === 200;

      if (success) {
        setValidationEnabled(nextValue === 1);
        showToast(
          `Player Validation has been successfully ${nextValue === 1 ? 'enabled' : 'disabled'}.`,
          'success'
        );
      } else {
        showToast(res.message || "Failed to update validation status.", 'error');
      }
    } catch (err) {
      console.error("Error toggling player validation:", err);
      showToast("Failed to save validation settings. Please try again.", 'error');
    } finally {
      setUpdating(false);
    }
  };

  // 1. Loading State
  if (loading && isAuthorized) {
    return (
      <div className={styles.settingsContainer}>
        <div className={`card ${styles.settingsCard}`}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p className={styles.loadingText}>Fetching system configuration...</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthorized State
  if (!isAuthorized) {
    return (
      <div className={styles.unauthorizedContainer}>
        <div className={`card glass ${styles.unauthorizedCard}`}>
          <div className={styles.unauthorizedIcon}>
            <AlertTriangle size={32} />
          </div>
          <h2 className={styles.unauthorizedTitle}>Access Restricted</h2>
          <p className={styles.unauthorizedDesc}>
            You do not have administrative privileges to access the settings panel. Only authorized agents can modify registry options.
          </p>
          <button
            onClick={() => navigate('/')}
            className={`btn btn-primary ${styles.backBtn}`}
          >
            <ArrowLeft size={16} /> Return to Players List
          </button>
        </div>
      </div>
    );
  }

  // 3. Error State
  if (error) {
    return (
      <div className={styles.settingsContainer}>
        <div className={`card glass ${styles.settingsCard} ${styles.errorCard}`}>
          <AlertTriangle size={36} />
          <h3 className={styles.errorTitle}>Configuration Error</h3>
          <p className={styles.errorDesc}>{error}</p>
          <button
            onClick={fetchStatus}
            className={`btn btn-primary ${styles.retryBtn}`}
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // 4. Standard Authorized View
  return (
    <div className={styles.settingsContainer}>
      <div className={`card glass ${styles.settingsCard}`}>
        <div className={styles.header}>
          <h1 className={styles.title}>System Settings</h1>
          <p className={styles.subtitle}>
            Manage and configure the registry behaviors and global validation constraints for the {league?.name}.
          </p>
        </div>

        <div className={styles.settingsList}>
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>Enable Player Validation</div>
              <div className={styles.settingDescription}>
                Strictly validate player registrations against compliance criteria. Disabling this skips manual validation processes.
              </div>
            </div>
            
            <div className={styles.switchWrapper}>
              <span className={`${styles.statusIndicator} ${validationEnabled ? styles.statusActive : styles.statusInactive}`}>
                {validationEnabled ? 'Active' : 'Inactive'}
              </span>
              
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={validationEnabled}
                  onChange={handleToggle}
                  disabled={updating}
                  aria-label="Toggle Player Validation"
                />
                <span className={styles.slider}></span>
              </label>
              
              {updating && <div className={styles.inlineSpinner}></div>}
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification Container */}
      {toast && (
        <div className={styles.toast}>
          {toast.type === 'success' ? (
            <CheckCircle2 size={18} color="#10b981" />
          ) : (
            <XCircle size={18} color="#ef4444" />
          )}
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
