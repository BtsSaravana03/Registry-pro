import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { teamService, ILT_STATIC_LOGOS } from '../services/teamService';
import afgLogo from '../assets/ILT/afg-logo.png';
import iccLogo from '../assets/ILT/icc.png';
import ireLogo from '../assets/ILT/ire.jpg';
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
  Check,
  Sparkles
} from 'lucide-react';
import styles from './ManageTeams.module.css';

const MEMBER_SELECTOR_CARDS = [
  { key: 'Afghanistan', label: 'Afghanistan', logo: afgLogo, accentColor: '#22c55e', dbField: 'Afghanistan' },
  { key: 'ICC Associate Member', label: 'ICC Associate Member', logo: iccLogo, accentColor: '#3b82f6', dbField: 'ICC_Associate_Member' },
  { key: 'ICC Full Member', label: 'ICC Full Member', logo: iccLogo, accentColor: '#6366f1', dbField: 'ICC_Full_Member' },
  { key: 'Ireland', label: 'Ireland', logo: ireLogo, accentColor: '#22c55e', dbField: 'Ireland' }
];

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

  // Member Selectors Modal State
  const [showMemberSelectorModal, setShowMemberSelectorModal] = useState(false);
  const [memberSelectorCounts, setMemberSelectorCounts] = useState({
    Afghanistan: 0,
    Ireland: 0,
    ICC_Full_Member: 0,
    ICC_Associate_Member: 0,
    total: 0
  });
  const [savingMemberSelectors, setSavingMemberSelectors] = useState(false);
  const [fetchingMemberSelectors, setFetchingMemberSelectors] = useState(false);

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

  const handleOpenMemberSelectors = async () => {
    setShowMemberSelectorModal(true);
    setFetchingMemberSelectors(true);
    try {
      const data = await teamService.getEOIRestrictions();
      if (data) {
        setMemberSelectorCounts({
          Afghanistan: data.Afghanistan !== null && data.Afghanistan !== undefined ? data.Afghanistan : 0,
          Ireland: data.Ireland !== null && data.Ireland !== undefined ? data.Ireland : 0,
          ICC_Full_Member: data.ICC_Full_Member !== null && data.ICC_Full_Member !== undefined ? data.ICC_Full_Member : 0,
          ICC_Associate_Member: data.ICC_Associate_Member !== null && data.ICC_Associate_Member !== undefined ? data.ICC_Associate_Member : 0,
          total: data.total !== null && data.total !== undefined ? data.total : 0
        });
      } else {
        setMemberSelectorCounts({
          Afghanistan: 0,
          Ireland: 0,
          ICC_Full_Member: 0,
          ICC_Associate_Member: 0,
          total: 0
        });
      }
    } catch (err) {
      console.error("Failed to fetch EOI restrictions:", err);
      showToastNotification("Failed to load EOI restrictions.", "error");
    } finally {
      setFetchingMemberSelectors(false);
    }
  };

  const calculatedTotal = (memberSelectorCounts.Afghanistan !== '' ? Number(memberSelectorCounts.Afghanistan) || 0 : 0) +
    (memberSelectorCounts.Ireland !== '' ? Number(memberSelectorCounts.Ireland) || 0 : 0) +
    (memberSelectorCounts.ICC_Full_Member !== '' ? Number(memberSelectorCounts.ICC_Full_Member) || 0 : 0) +
    (memberSelectorCounts.ICC_Associate_Member !== '' ? Number(memberSelectorCounts.ICC_Associate_Member) || 0 : 0);

  const handleSaveMemberSelectors = async (e) => {
    e.preventDefault();
    setSavingMemberSelectors(true);
    try {
      const afg = memberSelectorCounts.Afghanistan !== '' ? Number(memberSelectorCounts.Afghanistan) : 0;
      const ire = memberSelectorCounts.Ireland !== '' ? Number(memberSelectorCounts.Ireland) : 0;
      const full = memberSelectorCounts.ICC_Full_Member !== '' ? Number(memberSelectorCounts.ICC_Full_Member) : 0;
      const assoc = memberSelectorCounts.ICC_Associate_Member !== '' ? Number(memberSelectorCounts.ICC_Associate_Member) : 0;
      const sumTotal = afg + ire + full + assoc;

      const payload = {
        Afghanistan: afg,
        Ireland: ire,
        ICC_Full_Member: full,
        ICC_Associate_Member: assoc,
        total: sumTotal
      };
      await teamService.saveEOIRestrictions(payload);
      showToastNotification("Updated successfully", "success");
      setShowMemberSelectorModal(false);
    } catch (err) {
      console.error("Failed to save EOI restrictions:", err);
      showToastNotification(err.message || "Failed to update EOI restrictions.", "error");
    } finally {
      setSavingMemberSelectors(false);
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
            onClick={handleOpenMemberSelectors}
            className="btn btn-outline"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              borderColor: '#f306a7',
              color: '#ffffff',
              background: 'rgba(243, 6, 167, 0.15)',
              fontWeight: 700,
              padding: '0.65rem 1.1rem',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(243, 6, 167, 0.25)',
              transition: 'all 0.25s ease'
            }}
          >
            <Sparkles size={18} color="#f306a7" /> Manage Member Selectors
          </button>
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

      {/* Member Selectors Modal */}
      {showMemberSelectorModal && (
        <div className={styles.modalOverlay} onClick={() => setShowMemberSelectorModal(false)}>
          <div className={styles.modalCard} style={{ maxWidth: '780px' }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <Sparkles size={22} color="#f306a7" />
                Manage Member Selectors
              </h2>
              <button onClick={() => setShowMemberSelectorModal(false)} className={styles.closeBtn} type="button">
                <X size={20} />
              </button>
            </div>

            {fetchingMemberSelectors ? (
              <div className={styles.loadingBox} style={{ border: 'none', background: 'transparent' }}>
                <div className={styles.spinner} />
                <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Fetching member selector restrictions...</p>
              </div>
            ) : (
              <form onSubmit={handleSaveMemberSelectors} className={styles.modalForm}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
                  {MEMBER_SELECTOR_CARDS.map((card) => {
                    const countVal = memberSelectorCounts[card.dbField] ?? 0;
                    return (
                      <div
                        key={card.key}
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: `1px solid var(--border-color)`,
                          borderLeft: `4px solid ${card.accentColor}`,
                          borderRadius: 'var(--radius-lg)',
                          padding: '1.25rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.75rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <img src={card.logo} alt={card.label} style={{ width: '44px', height: '44px', objectFit: 'contain' }} />
                          <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>{card.label}</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Restriction Count Limit
                          </label>
                          <input
                            type="number"
                            min="0"
                            className={styles.inputField}
                            style={{
                              boxSizing: 'border-box',
                              width: '100%',
                              padding: '0.6rem 0.85rem',
                              fontWeight: 700,
                              fontSize: '1.1rem'
                            }}
                            value={countVal}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0);
                              setMemberSelectorCounts(prev => ({ ...prev, [card.dbField]: val }));
                            }}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Total Count Card */}
                <div
                  style={{
                    background: 'rgba(243, 6, 167, 0.05)',
                    border: '1px solid rgba(243, 6, 167, 0.3)',
                    borderLeft: '4px solid #f306a7',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '0.5rem'
                  }}
                >
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>Total Limit Count</h4>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Overall maximum EOI player limit (Auto-sum of all member categories)</p>
                  </div>
                  <div style={{ width: '160px' }}>
                    <input
                      type="number"
                      readOnly
                      disabled
                      className={styles.inputField}
                      style={{
                        boxSizing: 'border-box',
                        width: '100%',
                        padding: '0.6rem 0.85rem',
                        fontWeight: 800,
                        fontSize: '1.2rem',
                        borderColor: 'rgba(243, 6, 167, 0.5)',
                        color: '#f306a7',
                        background: 'rgba(243, 6, 167, 0.1)',
                        cursor: 'not-allowed'
                      }}
                      value={calculatedTotal}
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className={styles.modalFooter}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowMemberSelectorModal(false)}
                    disabled={savingMemberSelectors}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ background: 'linear-gradient(135deg, #f306a7 0%, #a855f7 100%)', border: 'none' }}
                    disabled={savingMemberSelectors}
                  >
                    {savingMemberSelectors ? (
                      <>
                        <div className="loading-spinner" style={{ width: '18px', height: '18px', borderTopColor: '#fff' }} />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        <span>Save Restrictions</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
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
