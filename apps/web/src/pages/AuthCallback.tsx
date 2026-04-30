import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../api/client';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setToken, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      api.setToken(token);
      setToken(token);

      api.getCurrentUser()
        .then((user) => {
          setUser(user);
          navigate('/', { replace: true });
        })
        .catch((error) => {
          console.error('Failed to fetch user:', error);
          api.setToken(null);
          setToken(null);
          navigate('/login', { replace: true });
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
      navigate('/login', { replace: true });
    }
  }, [navigate, setToken, setUser, setLoading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-elite-darker">
      <div className="text-center">
        <div className="text-elite-orange text-2xl mb-4">Authenticating...</div>
        <div className="animate-pulse text-elite-muted">Please wait while we log you in.</div>
      </div>
    </div>
  );
}