import { customAlphabet } from 'nanoid';
import { clsx, type ClassValue } from 'clsx';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8);

export function generateRoomId(): string {
  return nanoid();
}

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatRoomId(id: string): string {
  if (id.length === 8) {
    return `${id.slice(0, 4)}-${id.slice(4)}`;
  }
  return id;
}

export const COLORS = [
  { bg: '#0ea5e9', name: 'Sky' },
  { bg: '#10b981', name: 'Emerald' },
  { bg: '#f59e0b', name: 'Amber' },
  { bg: '#ef4444', name: 'Red' },
  { bg: '#8b5cf6', name: 'Violet' },
  { bg: '#ec4899', name: 'Pink' },
  { bg: '#06b6d4', name: 'Cyan' },
  { bg: '#f97316', name: 'Orange' },
];

export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % COLORS.length;
  return COLORS[idx].bg;
}
