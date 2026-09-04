import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Bell, User, LogOut, ChevronDown, Sun, Moon, ShieldCheck, Table, FileText, Settings, Menu, UserPlus, FileSpreadsheet, LayoutDashboard, ShieldPlus, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from './Navbar.module.css';

const Navbar = ({ onLogout, theme, onThemeToggle, onMobileMenuToggle }) => {
  const { user, league, loginData } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const location = useLocation();

  const isAgent99 = Number(loginData?.agentId) === 99;

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
            src={user?.logoUrl || league?.logo || "https://cloud.cricket-21.com/c21adminpanel/images/kadamba_logo.png"}
            alt={user?.name || league?.name || "Logo"}
            className={styles.logoImg}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = league?.logo || "https://cloud.cricket-21.com/c21adminpanel/images/kadamba_logo.png";
            }}
          />
          <span className={styles.brandText}>
            {user?.isTeam ? user.name : (league?.name || 'PlayerHub Pro')}
          </span>
        </div>
      </div>

      {/* Center Section: Navigation Links */}
      <div className={styles.centerSection}>
        {(league?.id === 'ILT' && !isAgent99 && !user?.isTeam) && [
          { path: '/', label: 'Players', icon: <Table size={18} /> },
          { path: '/reports', label: 'Manage Mails', icon: <FileText size={18} /> },
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

        {user?.isTeam && [
          { path: '/eoi-team-dashboard?tab=dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, tab: 'dashboard' },
          { path: '/eoi-team-dashboard?tab=eoi', label: 'EOI', icon: <Users size={18} />, tab: 'eoi' }
        ].map(item => {
          const currentTab = new URLSearchParams(location.search).get('tab') || 'dashboard';
          const isTabActive = location.pathname.includes('/eoi-team-dashboard') && currentTab === item.tab;
          return (
            <NavLink
              key={item.tab}
              to={item.path}
              className={`${styles.navLink} ${isTabActive ? styles.navLinkActive : ''}`}
            >
              {item.icon}
              {item.label}
            </NavLink>
          );
        })}
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
