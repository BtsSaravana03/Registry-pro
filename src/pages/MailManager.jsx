import React, { useState } from 'react';
import { useMail } from '../context/MailContext';
import { playerService } from '../services/playerService';
import { Mail, AlertCircle, FileX, Trash2, Send, CheckCircle2, Loader2 } from 'lucide-react';
import styles from './MailManager.module.css';

const MailManagerPage = () => {
  const {
    invalidPassportList,
    noPassportList,
    removeFromInvalidPassport,
    removeFromNoPassport,
    clearInvalidPassport,
    clearNoPassport,
    toastMessage,
    showToast
  } = useMail();

  // Progress states
  const [sendingInvalid, setSendingInvalid] = useState(false);
  const [invalidProgress, setInvalidProgress] = useState({ current: 0, total: 0 });

  const [sendingNoPassport, setSendingNoPassport] = useState(false);
  const [noPassportProgress, setNoPassportProgress] = useState({ current: 0, total: 0 });

  // Batch send for Invalid Passport
  const handleSendInvalidPassportMail = async () => {
    if (invalidPassportList.length === 0) return;

    setSendingInvalid(true);
    const total = invalidPassportList.length;
    setInvalidProgress({ current: 0, total });

    let successCount = 0;
    for (let i = 0; i < total; i++) {
      const player = invalidPassportList[i];
      try {
        await playerService.sendMailForInvalidPassport({
          firstname: player.firstname,
          refno: player.refno,
          email: player.email
        });
        successCount++;
      } catch (err) {
        console.error(`Failed to send invalid passport mail to ${player.refno}:`, err);
      }
      setInvalidProgress({ current: i + 1, total });
    }

    setSendingInvalid(false);
    clearInvalidPassport();
    showToast(`Mail sent successfully to ${successCount} player(s)!`);
  };

  // Batch send for No Passport
  const handleSendNoPassportMail = async () => {
    if (noPassportList.length === 0) return;

    setSendingNoPassport(true);
    const total = noPassportList.length;
    setNoPassportProgress({ current: 0, total });

    let successCount = 0;
    for (let i = 0; i < total; i++) {
      const player = noPassportList[i];
      try {
        await playerService.sendMailToUploadPassport({
          firstname: player.firstname,
          refno: player.refno,
          email: player.email
        });
        successCount++;
      } catch (err) {
        console.error(`Failed to send upload passport mail to ${player.refno}:`, err);
      }
      setNoPassportProgress({ current: i + 1, total });
    }

    setSendingNoPassport(false);
    clearNoPassport();
    showToast(`Mail sent successfully to ${successCount} player(s)!`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <Mail size={28} style={{ color: '#2563eb' }} />
          Mail Manager
        </h1>
        <p className={styles.subtitle}>
          Manage queued player email notifications for invalid passports and missing passport uploads.
        </p>
      </div>

      <div className={styles.grid}>
        {/* Section 1: Invalid Passport */}
        <div className={styles.boxCard}>
          <div className={styles.boxHeader}>
            <div className={styles.headerTitle}>
              <AlertCircle size={20} style={{ color: '#ef4444' }} />
              <span>Invalid Passport</span>
            </div>
            <span className={`${styles.badge} ${styles.badgeDanger}`}>
              {invalidPassportList.length} Players
            </span>
          </div>

          <div className={styles.playerList}>
            {invalidPassportList.length === 0 ? (
              <div className={styles.emptyState}>
                <FileX size={32} />
                <p>No players added to Invalid Passport queue.</p>
              </div>
            ) : (
              invalidPassportList.map((player) => (
                <div key={player.refno} className={styles.playerRow}>
                  <div className={styles.playerInfo}>
                    <span className={styles.playerName}>{player.playerName}</span>
                    <div className={styles.playerDetails}>
                      <span className={styles.detailItem}>
                        <strong>Ref:</strong> {player.refno}
                      </span>
                      <span className={styles.detailItem}>
                        <strong>Email:</strong> {player.email || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeFromInvalidPassport(player.refno)}
                    title="Remove Player"
                    disabled={sendingInvalid}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className={styles.boxFooter}>
            {sendingInvalid && (
              <div className={styles.progressContainer}>
                <div className={styles.progressText}>
                  <span>Sending mail...</span>
                  <span>
                    {invalidProgress.current} / {invalidProgress.total}
                  </span>
                </div>
                <div className={styles.progressBarBg}>
                  <div
                    className={styles.progressBarFill}
                    style={{
                      width: `${invalidProgress.total > 0 ? (invalidProgress.current / invalidProgress.total) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
            )}

            <button
              className={styles.sendBtn}
              onClick={handleSendInvalidPassportMail}
              disabled={sendingInvalid || invalidPassportList.length === 0}
            >
              {sendingInvalid ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Sending Mails...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Send Mail for Invalid Passport
                </>
              )}
            </button>
          </div>
        </div>

        {/* Section 2: No Passport */}
        <div className={styles.boxCard}>
          <div className={styles.boxHeader}>
            <div className={styles.headerTitle}>
              <AlertCircle size={20} style={{ color: '#f59e0b' }} />
              <span>No Passport</span>
            </div>
            <span className={`${styles.badge} ${styles.badgeWarning}`}>
              {noPassportList.length} Players
            </span>
          </div>

          <div className={styles.playerList}>
            {noPassportList.length === 0 ? (
              <div className={styles.emptyState}>
                <FileX size={32} />
                <p>No players added to No Passport queue.</p>
              </div>
            ) : (
              noPassportList.map((player) => (
                <div key={player.refno} className={styles.playerRow}>
                  <div className={styles.playerInfo}>
                    <span className={styles.playerName}>{player.playerName}</span>
                    <div className={styles.playerDetails}>
                      <span className={styles.detailItem}>
                        <strong>Ref:</strong> {player.refno}
                      </span>
                      <span className={styles.detailItem}>
                        <strong>Email:</strong> {player.email || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeFromNoPassport(player.refno)}
                    title="Remove Player"
                    disabled={sendingNoPassport}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className={styles.boxFooter}>
            {sendingNoPassport && (
              <div className={styles.progressContainer}>
                <div className={styles.progressText}>
                  <span>Sending mail...</span>
                  <span>
                    {noPassportProgress.current} / {noPassportProgress.total}
                  </span>
                </div>
                <div className={styles.progressBarBg}>
                  <div
                    className={styles.progressBarFill}
                    style={{
                      width: `${noPassportProgress.total > 0 ? (noPassportProgress.current / noPassportProgress.total) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
            )}

            <button
              className={styles.sendBtn}
              onClick={handleSendNoPassportMail}
              disabled={sendingNoPassport || noPassportList.length === 0}
            >
              {sendingNoPassport ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Sending Mails...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Send Mail to Upload Passport
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Snackbar Notification */}
      {toastMessage && (
        <div className={styles.snackbar}>
          <CheckCircle2 size={20} style={{ color: '#10b981' }} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default MailManagerPage;
