import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Table,
  Grid,
  FileText,
  Settings,
  ShieldCheck,
  UserPlus,
  FileSpreadsheet,
  LayoutDashboard,
  ShieldPlus,
  Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from './Sidebar.module.css';

const Sidebar = ({ isCollapsed, onItemClick }) => {
  const { user, league, loginData } = useAuth();

  const isAgent99 = Number(loginData?.agentId) === 99;

  const menuItems = [
    ...(isAgent99 ? [
      { path: '/ilt-dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
      { path: '/create-team', label: 'Create Team', icon: <ShieldPlus size={20} /> },
      { path: '/manage-teams', label: 'Manage Teams', icon: <Users size={20} /> }
    ] : []),
    { path: '/', label: isAgent99 ? 'EOI Registry' : 'Players', icon: <Table size={20} /> },
    { path: '/reports', label: 'Reports', icon: <FileText size={20} /> },
    ...(loginData?.agentId !== 100 ? [
      { path: '/register', label: 'Register a Player', icon: <UserPlus size={20} /> },
      { path: '/excel-upload', label: 'Excel Upload', icon: <FileSpreadsheet size={20} /> }
    ] : []),
    ...(loginData?.agentId === 100 ? [{ path: '/settings', label: 'Settings', icon: <Settings size={20} /> }] : [])
  ];

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.sidebarCollapsed : styles.sidebarExpanded}`}>
      {/* Sidebar Header */}
      <div className={`${styles.header} ${isCollapsed ? styles.headerCollapsed : styles.headerExpanded}`}>
        <img 
          src={league?.logo || "https://cloud.cricket-21.com/c21adminpanel/images/kadamba_logo.png"} 
          alt={league?.name || "Kadamba Logo"} 
          className={styles.logoImg} 
        />
        {!isCollapsed && <span className={styles.brandName}>{league?.id || 'PlayerHub Pro'}</span>}
      </div>

      {/* Navigation Links (Only shown for ILT) */}
      <nav className={styles.nav}>
        {!user?.isTeam && league?.id === 'ILT' && menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onItemClick}
            className={({ isActive }) => 
              `${styles.navLink} ${isCollapsed ? styles.navLinkCollapsed : styles.navLinkExpanded} ${isActive ? styles.navLinkActive : styles.navLinkInactive}`
            }
          >
            <div className={styles.navLinkIcon}>{item.icon}</div>
            {!isCollapsed && <span className={styles.navLinkLabel}>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Sidebar Footer: User Profile */}
      <div className={styles.footer}>
        <div className={`${styles.userContainer} ${isCollapsed ? styles.userContainerCollapsed : styles.userContainerExpanded}`}>
          <div className={styles.userAvatar}>
            {user?.name?.charAt(0).toUpperCase() || (user?.username?.charAt(0).toUpperCase()) || 'A'}
          </div>
          {!isCollapsed && (
            <div className={styles.userDetails}>
              <div className={styles.userName}>
                {user?.name || user?.username || 'Admin User'}
              </div>
              <div className={styles.userRole}>
                Super Admin
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
