import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/Login';
import Layout from './components/layout/Layout';
import PlayersTable from './components/players/DataTable';
import { ImageModal, PlayerDetailModal } from './components/ui/Modals';
import { playerService } from './services/playerService';
import SettingsPage from './pages/Settings';
import PlayerRegistrationPage from './pages/PlayerRegistration';
import ExcelUploadPage from './pages/ExcelUpload';
import ILTDashboardPage from './pages/ILTDashboard';
import CreateTeamPage from './pages/CreateTeam';
import ManageTeamsPage from './pages/ManageTeams';
import EOITeamDashboardPage from './pages/EOITeamDashboard';
import MailManagerPage from './pages/MailManager';
import { MailProvider } from './context/MailContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}><div className="loading-spinner"></div></div>;
  if (!user) return <Navigate to="/login" />;

  return <Layout>{children}</Layout>;
};

const Dashboard = ({ viewType }) => {
  const { user, league, loginData } = useAuth();
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState({ type: null, data: null });

  const isAgent99 = (league?.id === 'ILT' || loginData?.league === 'ILT') && Number(loginData?.agentId) === 99;

  React.useEffect(() => {
    if (isAgent99) {
      navigate('/ilt-dashboard', { replace: true });
    } else if (user?.isTeam) {
      navigate('/eoi-team-dashboard', { replace: true });
    }
  }, [isAgent99, user, navigate]);

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

  if (isAgent99 || user?.isTeam) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

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
    <MailProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><Dashboard viewType="table" /></ProtectedRoute>} />
        <Route path="/ilt-dashboard" element={<ProtectedRoute><ILTDashboardPage /></ProtectedRoute>} />
        <Route path="/create-team" element={<ProtectedRoute><CreateTeamPage /></ProtectedRoute>} />
        <Route path="/manage-teams" element={<ProtectedRoute><ManageTeamsPage /></ProtectedRoute>} />
        <Route path="/eoi-team-dashboard" element={<ProtectedRoute><EOITeamDashboardPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><MailManagerPage /></ProtectedRoute>} />
        <Route path="/register" element={<ProtectedRoute><PlayerRegistrationPage /></ProtectedRoute>} />
        <Route path="/excel-upload" element={<ProtectedRoute><ExcelUploadPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </MailProvider>
  );
}

export default App;
