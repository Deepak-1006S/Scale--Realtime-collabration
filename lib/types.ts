export interface User {
  name: string;
  color: string;
}

export interface Peer {
  clientId: number;
  name: string;
  color: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  senderColor: string;
  timestamp: number;
}

export interface Task {
  id: string;
  text: string;
  done: boolean;
  createdBy: string;
  createdAt: number;
}

export type WhiteboardTool = 'pen' | 'eraser' | 'rect' | 'circle';

export interface Stroke {
  id: string;
  points: Array<[number, number]>;
  color: string;
  width: number;
  tool: 'pen' | 'eraser';
}
