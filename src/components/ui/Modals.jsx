import React from 'react';
import { 
  X, 
  User, 
  Calendar, 
  CreditCard, 
  ShieldCheck, 
  Smartphone, 
  Mail, 
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ArrowUpDown
} from 'lucide-react';
import styles from './Modals.module.css';
import { formatValue } from '../../utils/formatters';

export const ImageModal = ({ isOpen, onClose, imageUrl, title }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.imageModalOverlay} onClick={onClose}>
      <div className={styles.imageModalContainer} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          <X size={20} />
        </button>
        <div className={styles.zoomContainer}>
          <img 
            src={imageUrl} 
            alt={title} 
            className={styles.modalImage}
          />
        </div>
        {title && (
          <div className={styles.imageTitle}>
            {title}
          </div>
        )}
      </div>
    </div>
  );
};

const DetailSection = ({ icon: Icon, title, children }) => (
  <div className={styles.detailSection}>
    <div className={styles.detailSectionHeader}>
      <Icon size={18} color="var(--primary-color)" />
      <h3 className={styles.detailSectionTitle}>{title}</h3>
    </div>
    <div className={styles.detailGrid}>
      {children}
    </div>
  </div>
);

const DetailItem = ({ label, value, icon: Icon }) => (
  <div className={styles.detailItem}>
    <div className={styles.detailItemLabelContainer}>
      {Icon && <Icon size={14} color="var(--text-muted)" />}
      <label className={styles.detailItemLabel}>{label}</label>
    </div>
    <div className={styles.detailItemValue}>{value || 'N/A'}</div>
  </div>
);

export const PlayerDetailModal = ({ isOpen, onClose, player }) => {
  if (!isOpen || !player) return null;

  return (
    <div className={styles.playerModalOverlay} onClick={onClose}>
      <div className={`glass ${styles.playerModalContainer}`} onClick={e => e.stopPropagation()}>
        <button className={styles.closePlayerButton} onClick={onClose}>
          <X size={20} />
        </button>

        {/* Left Side: Attachments/Summary */}
        <div className={styles.leftPanel}>
          <div className={styles.imageWrapper}>
            <img 
              src={player.playerImage} 
              alt="" 
              className={styles.profileImage}
            />
            <div className={styles.categoryBadge}>
              {player.category?.toUpperCase() || 'PLAYER'} CATEGORY
            </div>
          </div>

          <h1 className={styles.playerName}>{player.fullName}</h1>
          <p className={styles.referenceNo}>{player.referenceNo}</p>

          <div className={styles.infoColumn}>
             <div className={styles.roleBox}>
                <ShieldCheck size={24} color="rgba(255,255,255,0.4)" />
                <div>
                   <div className={styles.roleLabel}>Role</div>
                   <div className={styles.roleValue}>{player.role}</div>
                </div>
             </div>
             
             <div className={styles.panBox}>
                <img src={player.panImage} alt="PAN" className={styles.panImage} />
                <div className={styles.panLabel}>PAN CARD ATTACHMENT</div>
             </div>
          </div>
        </div>

        {/* Right Side: Data Sections */}
        <div className={styles.rightPanel}>
          <div className={styles.dossierHeader}>
            <h2 className={styles.dossierTitle}>Player Registration Dossier</h2>
            <p className={styles.dossierDesc}>Full record for player identification and verification.</p>
          </div>

          <DetailSection icon={User} title="Personal Information">
            <DetailItem label="Date of Birth" value={formatValue(player.dob, 'dob')} icon={Calendar} />
            <DetailItem label="Email Address" value={player.email} icon={Mail} />
            <DetailItem label="Mobile Number" value={player.mobile} icon={Smartphone} />
            <DetailItem label="WhatsApp" value={player.whatsapp} icon={Smartphone} />
            <DetailItem label="Batting Style" value={player.battingStyle} icon={ArrowUpDown} />
            <DetailItem label="Bowling Type" value={player.bowlingType} icon={RotateCcw} />
          </DetailSection>

          <DetailSection icon={Clock} title="Availability & Commitment">
            <DetailItem label="Availability Type" value={player.availabilityType} />
            <DetailItem label="Period" value={player.availabilityPeriod} />
            <DetailItem label="Commitment Level" value={player.availabilityCommitment} />
            <DetailItem label="Base Price" value={new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(player.basePrice)} />
          </DetailSection>

          <DetailSection icon={ShieldCheck} title="Consents & Legal">
            {Object.entries(player.allConsents || {}).map(([key, value]) => (
              <div key={key} className={styles.consentRow}>
                <span className={styles.consentLabel}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                {value ? (
                  <div className={styles.consentAgreed}>
                    <CheckCircle2 size={16} /> AGREED
                  </div>
                ) : (
                  <div className={styles.consentRejected}>
                    <AlertCircle size={16} /> REJECTED
                  </div>
                )}
              </div>
            ))}
          </DetailSection>

          <DetailSection icon={CreditCard} title="Bank Details & Identification">
            <DetailItem label="Account Name" value={player.bankDetails?.accountName} />
            <DetailItem label="Account Number" value={player.bankDetails?.accountNumber} />
            <DetailItem label="Bank Name" value={player.bankDetails?.bankName} />
            <DetailItem label="IFSC Code" value={player.bankDetails?.ifscCode} />
            <DetailItem label="PAN Card Number" value={player.panCardNumber} />
          </DetailSection>
        </div>
      </div>
    </div>
  );
};
