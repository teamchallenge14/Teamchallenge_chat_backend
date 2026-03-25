import { type Socket } from 'socket.io';

export interface AuthenticatedSocket extends Socket {
  userId: string;
}

export type SocketAckResponse = {
  ok: boolean;
  data?: unknown;
  message?: string;
};

export type SocketAck = (response: SocketAckResponse) => void;
