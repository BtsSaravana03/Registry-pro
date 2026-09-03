import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { teamService, ILT_STATIC_LOGOS } from '../services/teamService';
import {
  ArrowLeft,
  ShieldPlus,
  Lock,
  User,
  Shield,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Check,
  X,
  Move
} from 'lucide-react';
import styles from './CreateTeam.module.css';

const CreateTeamPage = () => {
  const { user, loginData } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [teamName, setTeamName] = useState('');
  const [teamUsername, setTeamUsername] = useState('');
  const [teamPassword, setTeamPassword] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [selectedLogoObj, setSelectedLogoObj] = useState(null);

  // UI interaction states
  const [showPassword, setShowPassword] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [loading, setLoading] = useState(false);

  // Toast / Snackbar state
  const [snackbar, setSnackbar] = useState(null);

  const agentId = loginData?.agentId || 99;


  const showToast = (message, type = 'success') => {
    setSnackbar({ message, type });
    setTimeout(() => {
      setSnackbar(null);
    }, 4500);
  };

  // Drag and Drop handlers for the Dropzone
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    // Try to get structured json or plain text URL
    let droppedUrl = e.dataTransfer.getData('text/plain');
    const droppedJson = e.dataTransfer.getData('application/json');

    if (droppedJson) {
      try {
        const parsed = JSON.parse(droppedJson);
        if (parsed?.url) {
          setLogoUrl(parsed.url);
          setSelectedLogoObj(parsed);
          return;
        }
      } catch (_) { }
    }

    if (droppedUrl) {
      setLogoUrl(droppedUrl);
      const matched = ILT_STATIC_LOGOS.find(l => l.url === droppedUrl);
      setSelectedLogoObj(matched || { name: 'Custom Team Logo', url: droppedUrl });
    }
  };

  // Direct select handler
  const handleSelectLogo = (logo) => {
    setLogoUrl(logo.url);
    setSelectedLogoObj(logo);
  };

  const handleClearLogo = (e) => {
    e.stopPropagation();
    setLogoUrl('');
    setSelectedLogoObj(null);
  };

  // Drag start handler for individual logo cards
  const handleLogoDragStart = (e, logo) => {
    e.dataTransfer.setData('text/plain', logo.url);
    e.dataTransfer.setData('application/json', JSON.stringify(logo));
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!teamName.trim()) {
      showToast('Team Name is required.', 'error');
      return;
    }
    if (!teamUsername.trim()) {
      showToast('Team Username is required.', 'error');
      return;
    }
    if (!teamPassword.trim()) {
      showToast('Team Password is required.', 'error');
      return;
    }
    if (!logoUrl.trim()) {
      showToast('Please select or drag a Team Logo into the dropzone.', 'error');
      return;
    }

    setLoading(true);

    try {
      const result = await teamService.createTeam({
        teamName,
        teamUsername,
        teamPassword,
        createdBy: Number(agentId) || 99,
        logoUrl
      });

      // Show success notification
      showToast(result?.message || 'Team created successfully!', 'success');

      // Reset all form fields as requested
      setTeamName('');
      setTeamUsername('');
      setTeamPassword('');
      setLogoUrl('');
      setSelectedLogoObj(null);
      setShowPassword(false);

    } catch (err) {
      console.error('Failed to create team:', err);
      showToast(err.message || 'Server error while creating team.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* Top Bar with Navigation */}
      <div className={styles.topNav}>
        <button
          onClick={() => navigate('/ilt-dashboard')}
          className={styles.backBtn}
          type="button"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <div>
          <h1 className={styles.headerTitle}>Create New Franchise Team</h1>
          <p className={styles.headerSubtitle}>
            Configure authentication credentials and attach official ILT20 team branding.
          </p>
        </div>
      </div>

      <div className={styles.mainGrid}>
        {/* Left Column: Create Team Form Card */}
        <div className={styles.formCard}>
          <div className={styles.formSectionHeader}>
            <h2 className={styles.formSectionTitle}>
              <ShieldPlus size={20} color="var(--primary-color)" />
              Franchise Details
            </h2>
            <span className={styles.creatorBadge}>
              <User size={13} /> Created By: {user?.username}
            </span>
          </div>

          <form onSubmit={handleSubmit} className={styles.formBody}>
            {/* Team Name */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel} htmlFor="teamName">
                <span>Team Name <span className={styles.requiredStar}>*</span></span>
              </label>
              <div className={styles.inputWrapper}>
                <Shield size={18} className={styles.inputIcon} />
                <input
                  id="teamName"
                  type="text"
                  className={styles.inputField}
                  placeholder="e.g. Abu Dhabi Knight Riders"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Team Username */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel} htmlFor="teamUsername">
                <span>Team Username <span className={styles.requiredStar}>*</span></span>
              </label>
              <div className={styles.inputWrapper}>
                <User size={18} className={styles.inputIcon} />
                <input
                  id="teamUsername"
                  type="text"
                  className={styles.inputField}
                  placeholder="e.g. adkr_admin"
                  value={teamUsername}
                  onChange={(e) => setTeamUsername(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Team Password */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel} htmlFor="teamPassword">
                <span>Team Password <span className={styles.requiredStar}>*</span></span>
              </label>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.inputIcon} />
                <input
                  id="teamPassword"
                  type={showPassword ? 'text' : 'password'}
                  className={styles.inputField}
                  placeholder="Enter strong team access password"
                  value={teamPassword}
                  onChange={(e) => setTeamPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className={styles.eyeToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Team Logo Dropzone */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                <span>Team Logo <span className={styles.requiredStar}>*</span></span>
                {logoUrl && <span style={{ fontSize: '0.725rem', color: 'var(--success-color)', fontWeight: 600 }}>Logo Selected</span>}
              </label>

              <div className={styles.dropzoneContainer}>
                <div
                  className={`${styles.dropzone} ${isDraggingOver ? styles.dropzoneActive : ''} ${logoUrl ? styles.dropzoneHasLogo : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  tabIndex={0}
                  role="region"
                  aria-label="Team logo dropzone"
                >
                  {logoUrl ? (
                    <div className={styles.logoPreviewContainer}>
                      <div className={styles.logoPreviewLeft}>
                        <img
                          src={logoUrl}
                          alt={selectedLogoObj?.name || 'Selected Logo'}
                          className={styles.previewLogoImg}
                        />
                        <div className={styles.previewInfo}>
                          <p className={styles.previewTeamName}>
                            {selectedLogoObj?.name || 'Official Team Logo'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleClearLogo}
                        className={styles.clearLogoBtn}
                        title="Remove logo"
                      >
                        <X size={14} /> Clear
                      </button>
                    </div>
                  ) : (
                    <div className={styles.dropzoneEmpty}>
                      <div className={styles.dropzoneIconWrapper}>
                        <UploadCloud size={24} />
                      </div>
                      <p className={styles.dropzoneMainText}>
                        Drag and drop a team logo here
                      </p>
                      <p className={styles.dropzoneSubText}>
                        Or click on any logo from the palette on the right
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`btn btn-primary ${styles.submitBtn}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="loading-spinner" style={{ width: '20px', height: '20px', borderTopColor: '#fff' }} />
                  <span>Provisioning Franchise Team...</span>
                </>
              ) : (
                <>
                  <ShieldPlus size={18} />
                  <span>Create Team</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Official Team Logos Palette */}
        <div className={styles.logosSidebarCard}>
          <div className={styles.logosHeader}>
            <h3 className={styles.logosTitle}>
              <Sparkles size={18} color="#fbbf24" /> ILT Teams
            </h3>
            <p className={styles.logosSubtitle}>
              Drag any badge into the dropzone or click to select directly for this team.
            </p>
          </div>

          <div className={styles.logosGrid}>
            {ILT_STATIC_LOGOS.map((logo) => {
              const isSelected = logoUrl === logo.url;

              return (
                <div
                  key={logo.id}
                  className={`${styles.logoItemCard} ${isSelected ? styles.logoItemSelected : ''}`}
                  draggable={true}
                  onDragStart={(e) => handleLogoDragStart(e, logo)}
                  onClick={() => handleSelectLogo(logo)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSelectLogo(logo)}
                  title={`Drag ${logo.name} or click to select`}
                >
                  {isSelected && (
                    <div className={styles.selectedBadge}>
                      <Check size={12} />
                    </div>
                  )}

                  <img
                    src={logo.url}
                    alt={logo.name}
                    className={styles.logoItemImg}
                    loading="lazy"
                  />
                  <div className={styles.logoItemName}>{logo.name}</div>
                  <span className={styles.logoItemCode}>{logo.code}</span>

                  <div className={styles.dragHint}>
                    <Move size={10} /> Drag or Click
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Snackbar Notification */}
      {snackbar && (
        <div
          className={`${styles.snackbar} ${snackbar.type === 'success' ? styles.snackbarSuccess : styles.snackbarError
            }`}
          role="alert"
        >
          {snackbar.type === 'success' ? (
            <CheckCircle2 size={22} className={styles.snackbarIconSuccess} />
          ) : (
            <AlertCircle size={22} className={styles.snackbarIconError} />
          )}
          <span className={styles.snackbarText}>{snackbar.message}</span>
        </div>
      )}
    </div>
  );
};

export default CreateTeamPage;
