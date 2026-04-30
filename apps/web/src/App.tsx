import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { api } from './api/client';
import Layout from './components/Layout';
import Home from './pages/Home';
import Ships from './pages/Ships';
import Materials from './pages/Materials';
import Missions from './pages/Missions';
import Trading from './pages/Trading';
import Colonisation from './pages/Colonisation';
import Exploration from './pages/Exploration';
import Settings from './pages/Settings';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';

function App() {
  const { user, isLoading, setLoading, setUser, setToken, token } = useAuthStore();

  useEffect(() => {
    const storedToken = localStorage.getItem('elite_token');

    if (storedToken && !user) {
      api.setToken(storedToken);
      api.getCurrentUser()
        .then((userData) => {
          setUser(userData);
          setToken(storedToken);
        })
        .catch(() => {
          localStorage.removeItem('elite_token');
          api.setToken(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-elite-darker">
        <div className="text-elite-orange animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ships" element={<Ships />} />
        <Route path="/materials" element={<Materials />} />
        <Route path="/missions" element={<Missions />} />
        <Route path="/trading" element={<Trading />} />
        <Route path="/colonisation" element={<Colonisation />} />
        <Route path="/exploration" element={<Exploration />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;