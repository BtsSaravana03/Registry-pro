import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { teamService, ILT_STATIC_LOGOS } from '../services/teamService';
import {
  ArrowLeft,
  ShieldPlus,
  Shield,
  Users,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  User,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Check
} from 'lucide-react';
import styles from './ManageTeams.module.css';

const ManageTeamsPage = () => {
  const { league, loginData } = useAuth();
  const navigate = useNavigate();

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit / Configure Team Modal State
  const [editingTeam, setEditingTeam] = useState(null);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editLogoUrl, setEditLogoUrl] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Toast / Snackbar State
  const [toast, setToast] = useState(null);

  const showToastNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const fetchTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await teamService.getAllTeams();
      setTeams(data);
    } catch (err) {
      console.error("Failed to load teams:", err);
      setError("Unable to load teams. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleOpenConfigure = (team) => {
    setEditingTeam(team);
    setEditName(team.Team_Name || '');
    setEditUsername(team.Team_Username || '');
    setEditPassword(''); // Password optional on update
    setEditLogoUrl(team.logoUrl || '');
    setShowPassword(false);
  };

  const handleCloseConfigure = () => {
    setEditingTeam(null);
    setEditName('');
    setEditUsername('');
    setEditPassword('');
    setEditLogoUrl('');
    setShowPassword(false);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();

    if (!editName.trim()) {
      showToastNotification('Team Name is required.', 'error');
      return;
    }
    if (!editUsername.trim()) {
      showToastNotification('Team Username is required.', 'error');
      return;
    }
    if (!editLogoUrl.trim()) {
      showToastNotification('Logo URL is required.', 'error');
      return;
    }

    setUpdating(true);

    try {
      await teamService.updateTeam({
        teamId: editingTeam.Team_Id,
        teamName: editName,
        teamUsername: editUsername,
        teamPassword: editPassword,
        logoUrl: editLogoUrl
      });

      showToastNotification('Team updated successfully!', 'success');
      handleCloseConfigure();
      await fetchTeams(); // Refresh live team list
    } catch (err) {
      console.error("Failed to update team:", err);
      showToastNotification(err.message || 'Error while updating team.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Top Header & Action */}
      <div className={styles.topNav}>
        <div>
          <button
            onClick={() => navigate('/ilt-dashboard')}
            className={styles.backBtn}
            type="button"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <h1 className={styles.headerTitle} style={{ marginTop: '0.75rem' }}>
            Franchise Teams Directory
          </h1>
          <p className={styles.headerSubtitle}>
            View and configure ILT20 franchise credentials, accounts, and official team logos.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            onClick={() => navigate('/create-team')}
            className="btn btn-primary"
          >
            <ShieldPlus size={18} /> Create New Team
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className={styles.loadingBox}>
          <div className={styles.spinner} />
          <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Fetching live franchise teams...</p>
        </div>
      ) : error ? (
        <div className={styles.emptyBox}>
          <AlertCircle size={36} color="#ef4444" />
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Error Loading Teams</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{error}</p>
          <button className="btn btn-primary" onClick={fetchTeams} style={{ marginTop: '0.5rem' }}>
            Retry Connection
          </button>
        </div>
      ) : teams.length === 0 ? (
        <div className={styles.emptyBox}>
          <Shield size={40} color="var(--primary-color)" />
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>No Franchise Teams Registered</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Click below to create the first team for the league.</p>
          <button className="btn btn-primary" onClick={() => navigate('/create-team')} style={{ marginTop: '0.5rem' }}>
            <ShieldPlus size={16} /> Create Team Now
          </button>
        </div>
      ) : (
        /* Teams Grid fetched from API */
        <div className={styles.teamsGrid}>
          {teams.map((team) => (
            <div key={team.Team_Id} className={styles.teamCard}>
              <div>
                <div className={styles.teamCardHeader}>
                  <img
                    src={team.logoUrl || "https://cloud.cricket-21.com/c21adminpanel/images/kadamba_logo.png"}
                    alt={team.Team_Name}
                    className={styles.teamLogo}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://cloud.cricket-21.com/c21adminpanel/images/kadamba_logo.png";
                    }}
                  />
                  <div className={styles.teamMeta}>
                    <h3 className={styles.teamName}>{team.Team_Name}</h3>
                    <span className={styles.teamCode}>@{team.Team_Username}</span>
                  </div>
                </div>

                <div className={styles.teamDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Franchise ID</span>
                    <span className={styles.detailValue}>#{team.Team_Id}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Username</span>
                    <span className={styles.detailValue}>{team.Team_Username}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Password</span>
                    <span className={styles.detailValue}>{team.Team_Password}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Created By</span>
                    <span className={styles.detailValue}>{team.UserName}</span>
                  </div>
                  {team.Created_at && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Created On</span>
                      <span className={styles.detailValue}>{new Date(team.Created_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.teamCardFooter}>
                <span className={styles.statusActive}>
                  <span className={styles.statusDot} /> Active Team
                </span>
                <button
                  className="btn btn-outline"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.775rem' }}
                  onClick={() => handleOpenConfigure(team)}
                >
                  Configure Team
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Configure Team Modal */}
      {editingTeam && (
        <div className={styles.modalOverlay} onClick={handleCloseConfigure}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <Shield size={22} color="var(--primary-color)" />
                Configure Team: {editingTeam.Team_Name}
              </h2>
              <button onClick={handleCloseConfigure} className={styles.closeBtn} type="button">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className={styles.modalForm}>
              <div className={styles.formGrid}>
                {/* Team Name */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Team Name *</label>
                  <div className={styles.inputWrapper}>
                    <Shield size={18} className={styles.inputIcon} />
                    <input
                      type="text"
                      className={styles.inputField}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Team Username */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Team Username *</label>
                  <div className={styles.inputWrapper}>
                    <User size={18} className={styles.inputIcon} />
                    <input
                      type="text"
                      className={styles.inputField}
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Password (Optional update) */}
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  New Password <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(Leave blank to keep existing)</span>
                </label>
                <div className={styles.inputWrapper}>
                  <Lock size={18} className={styles.inputIcon} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={styles.inputField}
                    placeholder="Enter new password (optional)"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className={styles.eyeToggle}
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Logo Selection Palette & Dropzone */}
              <div>
                <div className={styles.logosSectionTitle}>
                  <span>Select Team Logo</span>
                  {editLogoUrl && <span style={{ color: '#10b981', fontSize: '0.75rem' }}>Logo Selected</span>}
                </div>

                <div className={styles.modalLogosGrid}>
                  {ILT_STATIC_LOGOS.map((logo) => {
                    const isSelected = editLogoUrl === logo.url;
                    return (
                      <div
                        key={logo.id}
                        className={`${styles.modalLogoCard} ${isSelected ? styles.modalLogoSelected : ''}`}
                        onClick={() => setEditLogoUrl(logo.url)}
                      >
                        <img src={logo.url} alt={logo.name} className={styles.modalLogoImg} />
                        <span className={styles.modalLogoName}>{logo.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Buttons */}
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleCloseConfigure}
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={updating}
                >
                  {updating ? (
                    <>
                      <div className="loading-spinner" style={{ width: '18px', height: '18px', borderTopColor: '#fff' }} />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      <span>Update Team</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} color="#10b981" /> : <AlertCircle size={20} color="#ef4444" />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default ManageTeamsPage;
