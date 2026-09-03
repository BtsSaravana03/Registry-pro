import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldPlus,
  Users,
  Table,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  Layers,
  ChevronRight,
  Database
} from 'lucide-react';
import styles from './ILTDashboard.module.css';

const ILTDashboardPage = () => {
  const { user, league, loginData } = useAuth();
  const navigate = useNavigate();

  const agentId = loginData?.agentId || '99';

  return (
    <div className={styles.dashboardContainer}>
      {/* 3 Cards across 2 Rows */}
      <div className={styles.cardsGrid}>
        {/* Row 1: 2 Cards (Create Team & Manage Team) */}
        <div className={styles.rowOne}>
          {/* Card 1: Create Team */}
          <div
            className={styles.actionCard}
            onClick={() => navigate('/create-team')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/create-team')}
          >
            <div className={styles.cardGlowBg} aria-hidden="true" />

            <div className={styles.cardTop}>
              <div className={styles.iconWrapper}>
                <ShieldPlus size={28} />
              </div>

              <div className={styles.cardBody}>
                <div className={styles.cardHeaderTitle}>
                  <h2 className={styles.cardTitle}>Create Team</h2>
                  <span className={styles.cardTag}>New Franchise</span>
                </div>
                <p className={styles.cardDescription}>
                  Provision new ILT franchise teams with dedicated usernames, passwords, and assign official high-resolution team logos via drag and drop.
                </p>
              </div>
            </div>

            <div className={styles.cardFooter}>
              <div className={styles.featureChips}>
                <span className={styles.featureChip}>Drag & Drop Logos</span>
                <span className={styles.featureChip}>Direct Provisioning</span>
              </div>
              <span className={styles.actionLink}>
                Launch Creator <ArrowRight size={16} className={styles.arrowIcon} />
              </span>
            </div>
          </div>

          {/* Card 2: Manage Team */}
          <div
            className={styles.actionCard}
            onClick={() => navigate('/manage-teams')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/manage-teams')}
          >
            <div className={styles.cardGlowBg} aria-hidden="true" />

            <div className={styles.cardTop}>
              <div className={styles.iconWrapper}>
                <Users size={28} />
              </div>

              <div className={styles.cardBody}>
                <div className={styles.cardHeaderTitle}>
                  <h2 className={styles.cardTitle}>Manage Team</h2>
                  <span className={styles.cardTag}>Franchises</span>
                </div>
                <p className={styles.cardDescription}>
                  View existing tournament teams, verify team accounts, inspect franchise logos, and manage team access privileges across the league.
                </p>
              </div>
            </div>

            <div className={styles.cardFooter}>
              <div className={styles.featureChips}>
                <span className={styles.featureChip}>Roster Access</span>
                <span className={styles.featureChip}>Team Credentials</span>
              </div>
              <span className={styles.actionLink}>
                Manage Teams <ArrowRight size={16} className={styles.arrowIcon} />
              </span>
            </div>
          </div>
        </div>

        {/* Row 2: 2 Cards (EOI Dashboard & EOI Players) */}
        <div className={styles.rowTwo}>
          {/* Card 3: EOI Dashboard */}
          <div
            className={`${styles.actionCard} ${styles.eoiCard}`}
            onClick={() => navigate('/eoi-team-dashboard?tab=dashboard')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/eoi-team-dashboard?tab=dashboard')}
          >
            <div className={styles.cardGlowBg} aria-hidden="true" />

            <div className={styles.cardTop}>
              <div className={styles.iconWrapper}>
                <Database size={28} />
              </div>

              <div className={styles.cardBody}>
                <div className={styles.cardHeaderTitle}>
                  <h2 className={styles.cardTitle}>EOI Dashboard</h2>
                  <span className={styles.cardTag} style={{ background: 'rgba(243, 6, 167, 0.15)', color: '#f306a7', borderColor: 'rgba(243, 6, 167, 0.3)' }}>
                    Analytics & Stats
                  </span>
                </div>
                <p className={styles.cardDescription}>
                  Overview of interested players across franchises, member type distribution cards, and real-time team expression of interest metrics.
                </p>
              </div>
            </div>

            <div className={styles.cardFooter}>
              <div className={styles.featureChips}>
                <span className={styles.featureChip}>Team Stats</span>
                <span className={styles.featureChip}>Member Counts</span>
              </div>
              <span className={styles.actionLink}>
                Open Dashboard <ArrowRight size={16} className={styles.arrowIcon} />
              </span>
            </div>
          </div>

          {/* Card 4: EOI Players */}
          <div
            className={`${styles.actionCard} ${styles.eoiCard}`}
            onClick={() => navigate('/eoi-team-dashboard?tab=eoi')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/eoi-team-dashboard?tab=eoi')}
          >
            <div className={styles.cardGlowBg} aria-hidden="true" />

            <div className={styles.cardTop}>
              <div className={styles.iconWrapper}>
                <Table size={28} />
              </div>

              <div className={styles.cardBody}>
                <div className={styles.cardHeaderTitle}>
                  <h2 className={styles.cardTitle}>EOI Players</h2>
                  <span className={styles.cardTag} style={{ background: 'rgba(243, 6, 167, 0.15)', color: '#f306a7', borderColor: 'rgba(243, 6, 167, 0.3)' }}>
                    Player Registry
                  </span>
                </div>
                <p className={styles.cardDescription}>
                  Comprehensive Expression of Interest (EOI) registry database. Search, filter by team names, member types, inspect passports, and export custom datasets.
                </p>
              </div>
            </div>

            <div className={styles.cardFooter}>
              <div className={styles.featureChips}>
                <span className={styles.featureChip}>Live Registry</span>
                <span className={styles.featureChip}>Team Filters</span>
                <span className={styles.featureChip}>Excel Export</span>
              </div>
              <span className={styles.actionLink}>
                View EOI Players <ArrowRight size={16} className={styles.arrowIcon} />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ILTDashboardPage;
