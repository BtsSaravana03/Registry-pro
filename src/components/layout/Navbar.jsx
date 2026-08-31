import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Bell, User, LogOut, ChevronDown, Sun, Moon, ShieldCheck, Table, FileText, Settings, Menu, UserPlus, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from './Navbar.module.css';

const Navbar = ({ onLogout, theme, onThemeToggle, onMobileMenuToggle }) => {
  const { user, league, loginData } = useAuth();
  const [showProfile, setShowProfile] = useState(false);

  return (
    <nav className={`${styles.navbar} glass`}>
      {/* Left Section: Branding & Mobile Menu */}
      <div className={styles.leftSection}>
        {league?.id === 'ILT' && (
          <button
            className={styles.mobileHamburger}
            onClick={onMobileMenuToggle}
          >
            <Menu size={24} />
          </button>
        )}
        <div className={styles.brandContainer}>
          <img
            src={league?.logo || "https://cloud.cricket-21.com/c21adminpanel/images/kadamba_logo.png"}
            alt={league?.name || "Kadamba Logo"}
            className={styles.logoImg}
          />
          <span className={styles.brandText}>
            {league?.name || 'PlayerHub Pro'}
          </span>
        </div>
      </div>

      {/* Center Section: Navigation Links (Only shown for ILT) */}
      <div className={styles.centerSection}>
        {league?.id === 'ILT' && [
          { path: '/', label: 'Players', icon: <Table size={18} /> },
          { path: '/reports', label: 'Reports', icon: <FileText size={18} /> },
          ...(loginData?.agentId !== 100 ? [
            { path: '/register', label: 'Register a Player', icon: <UserPlus size={18} /> },
            { path: '/excel-upload', label: 'Excel Upload', icon: <FileSpreadsheet size={18} /> }
          ] : []),
          ...(loginData?.agentId === 100 ? [{ path: '/settings', label: 'Settings', icon: <Settings size={18} /> }] : [])
        ].map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </div>

      {/* Right Section: Theme, Notifs, Profile */}
      <div className={styles.rightSection}>
        {/* Theme Toggle */}
        <button
          onClick={onThemeToggle}
          className={styles.controlButton}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        {/* Notifications */}
        {/* <button className={`${styles.notificationBtn} ${styles.desktopOnly}`}>
          <Bell size={20} />
          <span className={styles.notificationBadge}></span>
        </button> */}

        {/* User Profile */}
        <div className={styles.profileContainer}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className={styles.profileButton}
          >
            <div className={styles.avatar}>
              {user?.name?.charAt(0).toUpperCase() || (user?.username?.charAt(0).toUpperCase()) || 'A'}
            </div>
            <ChevronDown size={14} color="var(--text-muted)" className={styles.desktopOnly} />
          </button>

          {showProfile && (
            <div className={`card glass ${styles.profileDropdown}`}>
              <div className={styles.profileDropdownHeader}>
                <div className={styles.profileName}>{user?.name || user?.username}</div>
                <div className={styles.profileEmail}>{user?.email}</div>
              </div>
              <button className={styles.dropdownItem}>
                <User size={16} /> Profile
              </button>
              <button
                onClick={onLogout}
                className={`${styles.dropdownItem} ${styles.logoutItem}`}
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
