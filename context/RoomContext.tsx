import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import * as Y from 'yjs';
import type { WebrtcProvider } from 'y-webrtc';
import { getOrCreateProvider, destroyProvider } from '@/lib/yjs-provider';
import { stringToColor } from '@/lib/utils';
import type { User, Peer } from '@/lib/types';

interface RoomContextValue {
  roomId: string;
  doc: Y.Doc | null;
  provider: WebrtcProvider | null;
  isConnected: boolean;
  localUser: User;
  setLocalUser: (user: User) => void;
  peers: Peer[];
}

const RoomContext = createContext<RoomContextValue>({
  roomId: '',
  doc: null,
  provider: null,
  isConnected: false,
  localUser: { name: 'Anonymous', color: '#3b82f6' },
  setLocalUser: () => {},
  peers: [],
});

function loadUser(): User {
  if (typeof window === 'undefined') return { name: 'Anonymous', color: '#3b82f6' };
  try {
    const raw = localStorage.getItem('scale-user');
    if (raw) {
      const parsed = JSON.parse(raw) as User;
      if (parsed.name && parsed.color) return parsed;
    }
  } catch { /* ignore */ }
  return { name: 'Anonymous', color: '#3b82f6' };
}

export function RoomProvider({ roomId, children }: { roomId: string; children: ReactNode }) {
  const [doc,          setDoc]          = useState<Y.Doc | null>(null);
  const [provider,     setProvider]     = useState<WebrtcProvider | null>(null);
  const [isConnected,  setIsConnected]  = useState(false);
  const [peers,        setPeers]        = useState<Peer[]>([]);
  const [localUser,    setLocalUserState] = useState<User>(loadUser);

  useEffect(() => {
    if (!roomId) return;

    const instance = getOrCreateProvider(roomId);
    setDoc(instance.doc);
    setProvider(instance.provider);

    const { awareness } = instance.provider;

    // Publish local user immediately
    awareness.setLocalState({
      user: { name: localUser.name, color: localUser.color },
    });

    const syncPeers = () => {
      const list: Peer[] = [];
      awareness.getStates().forEach((state, clientId) => {
        if (clientId !== awareness.clientID && state.user) {
          list.push({
            clientId,
            name:  (state.user as User).name  || 'Anonymous',
            color: (state.user as User).color || stringToColor(String(clientId)),
          });
        }
      });
      setPeers(list);
    };

    const onStatus = ({ connected }: { connected: boolean }) =>
      setIsConnected(connected);

    awareness.on('change', syncPeers);
    instance.provider.on('status', onStatus);

    syncPeers();
    // Mark as connected once the provider is ready (even without peers)
    setIsConnected(instance.provider.connected);

    // IndexedDB persistence fires 'synced' when local data is ready
    instance.persistence.on('synced', () => setIsConnected(true));

    return () => {
      awareness.off('change', syncPeers);
      instance.provider.off('status', onStatus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // Keep awareness in sync when user changes name/color
  useEffect(() => {
    if (!provider) return;
    provider.awareness.setLocalStateField('user', {
      name:  localUser.name,
      color: localUser.color,
    });
  }, [localUser, provider]);

  // Clean up on tab close
  useEffect(() => {
    const onUnload = () => destroyProvider(roomId);
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [roomId]);

  const setLocalUser = useCallback((user: User) => {
    setLocalUserState(user);
    try { localStorage.setItem('scale-user', JSON.stringify(user)); } catch { /* ignore */ }
  }, []);

  return (
    <RoomContext.Provider value={{ roomId, doc, provider, isConnected, localUser, setLocalUser, peers }}>
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  return useContext(RoomContext);
}
