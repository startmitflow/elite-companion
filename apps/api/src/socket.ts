import { Server } from 'socket.io';

let io: Server | null = null;

export const initSocket = (server: any, corsOrigin: string) => {
  io = new Server(server, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
    },
  });
  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

export { io };