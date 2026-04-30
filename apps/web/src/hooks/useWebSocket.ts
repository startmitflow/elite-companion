import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

const WS_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      socketRef.current = io(WS_URL, {
        transports: ['websocket'],
      });

      socketRef.current.on('connect', () => {
        socketRef.current?.emit('subscribe', user.id);
      });

      socketRef.current.on('journal:synced', (data) => {
        console.log('Journal synced:', data);
      });

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [user]);

  const subscribe = useCallback((event: string, callback: (data: any) => void) => {
    socketRef.current?.on(event, callback);
    return () => socketRef.current?.off(event, callback);
  }, []);

  return { subscribe };
}