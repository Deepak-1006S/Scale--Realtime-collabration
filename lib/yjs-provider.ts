import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { IndexeddbPersistence } from 'y-indexeddb';

export interface ProviderInstance {
  doc: Y.Doc;
  provider: WebrtcProvider;
  persistence: IndexeddbPersistence;
  destroy: () => void;
}

const instances = new Map<string, ProviderInstance>();

const SIGNALING_SERVERS = [
  'wss://signaling.yjs.dev',
];

export function getOrCreateProvider(roomId: string): ProviderInstance {
  if (instances.has(roomId)) {
    return instances.get(roomId)!;
  }

  const doc = new Y.Doc();
  const persistence = new IndexeddbPersistence(`scale-${roomId}`, doc);
  const provider = new WebrtcProvider(`scale-room-${roomId}`, doc, {
    signaling: SIGNALING_SERVERS,
    maxConns: 20,
    filterBcConns: true,
  });

  const instance: ProviderInstance = {
    doc,
    provider,
    persistence,
    destroy: () => {
      provider.destroy();
      persistence.destroy();
      doc.destroy();
      instances.delete(roomId);
    },
  };

  instances.set(roomId, instance);
  return instance;
}

export function destroyProvider(roomId: string): void {
  const instance = instances.get(roomId);
  if (instance) {
    instance.destroy();
  }
}
