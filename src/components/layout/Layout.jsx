import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import styles from './Layout.module.css';

const Layout = ({ children }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Theme State
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <div className={styles.layoutWrapper}>
      <Navbar
        onLogout={handleLogout}
        theme={theme}
        onThemeToggle={toggleTheme}
        onMobileMenuToggle={toggleMobileMenu}
      />

      <main className={`container-fluid ${styles.mainContainer}`}>
        <div className={styles.contentWrapper}>
          {children}
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <img src="https://cloud.cricket-21.com/c21adminpanel/images/kadamba_logo.png" alt="Kadamba Logo" className={styles.footerLogo} />
          <span>Powered by <strong>KadambaTechnology</strong></span>
        </div>
      </footer>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={toggleMobileMenu}
          className={styles.mobileOverlay}
        />
      )}

      {/* Mobile Drawer */}
      <div className={`${styles.mobileDrawer} ${isMobileMenuOpen ? styles.drawerOpen : styles.drawerClosed}`}>
        <Sidebar isCollapsed={false} onItemClick={() => setIsMobileMenuOpen(false)} />
      </div>
    </div>
  );
};

export default Layout;
