import React from 'react';
import { Eye, MapPin, User, Shield, Crosshair } from 'lucide-react';
import styles from './PlayerGrid.module.css';

const PlayerCard = ({ player, onViewDetails }) => {
  return (
    <div className={styles.card}>
      <div className={styles.imageWrapper}>
        {/* Holographic targeting accents */}
        <div className={styles.holographicTopLeft}></div>
        <div className={styles.holographicTopRight}></div>
        
        <img 
          src={player.playerImage || player.image} 
          alt={player.fullName || player.name} 
          className={styles.playerImage} 
        />
        <div className={styles.nameOverlay}>
          <h3 className={styles.playerName}>{player.fullName || player.name}</h3>
          <div className={styles.playerRole}>
            <Shield size={14} /> {player.role}
          </div>
        </div>
      </div>
      
      <div className={styles.detailsContainer}>
        <div className={styles.statsGrid}>
          <div className={styles.statBoxPrimary}>
            <div className={styles.statLabel}>IDENT/REF</div>
            <div className={styles.statValuePrimary}>{player.referenceNo || player.team || 'UNKNOWN'}</div>
          </div>
          <div className={styles.statBoxSuccess}>
            <div className={styles.statLabel}>VALUE/AGE</div>
            <div className={styles.statValueSuccess}>
              {player.basePrice ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(player.basePrice) : (player.age ? `${player.age} YRS` : 'N/A')}
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => onViewDetails(player)}
          className={`btn btn-primary ${styles.extractButton}`}
        >
          <Crosshair size={16} /> EXTRACT DATA
        </button>
      </div>
    </div>
  );
};

const PlayerGrid = ({ players, onViewDetails }) => {
  return (
    <div className={styles.gridContainer}>
      {players.map((player, index) => (
        <PlayerCard key={player.id || index} player={player} onViewDetails={onViewDetails} />
      ))}
    </div>
  );
};

export default PlayerGrid;
