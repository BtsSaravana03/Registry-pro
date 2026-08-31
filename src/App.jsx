import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/Login';
import Layout from './components/layout/Layout';
import PlayersTable from './components/players/DataTable';
import { ImageModal, PlayerDetailModal } from './components/ui/Modals';
import { playerService } from './services/playerService';
import SettingsPage from './pages/Settings';
import PlayerRegistrationPage from './pages/PlayerRegistration';
import ExcelUploadPage from './pages/ExcelUpload';

// Placeholder Pages
const ReportsPage = () => <div className="card" style={{ padding: '3rem', textAlign: 'center' }}><h1>Reports</h1><p>Reports and Analytics module is coming soon.</p></div>;

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}><div className="loading-spinner"></div></div>;
  if (!user) return <Navigate to="/login" />;

  return <Layout>{children}</Layout>;
};

const Dashboard = ({ viewType }) => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState({ type: null, data: null });

  const openImageModal = (url, title) => setModalState({ type: 'image', data: { url, title } });
  const openDetailModal = (player) => setModalState({ type: 'details', data: player });
  const closeModal = () => setModalState({ type: null, data: null });

  // For Grid View, we fetch all (or some) players
  React.useEffect(() => {
    if (viewType === 'grid') {
      setLoading(true);
      playerService.getPlayers({ pageSize: 100 }).then(res => {
        setPlayers(res.data);
        setLoading(false);
      });
    }
  }, [viewType]);

  return (
    <>
      <PlayersTable onViewImage={openImageModal} />

      <ImageModal
        isOpen={modalState.type === 'image'}
        onClose={closeModal}
        imageUrl={modalState.data?.url}
        title={modalState.data?.title}
      />
    </>
  );
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Dashboard viewType="table" /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
      <Route path="/register" element={<ProtectedRoute><PlayerRegistrationPage /></ProtectedRoute>} />
      <Route path="/excel-upload" element={<ProtectedRoute><ExcelUploadPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
