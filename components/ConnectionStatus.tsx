import React from 'react';
import { Users } from 'lucide-react';
import { useRoom } from '@/context/RoomContext';
import { Avatar } from './ui/Avatar';

export function ConnectionStatus() {
  const { isConnected, peers, localUser } = useRoom();

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center -space-x-2">
        <Avatar name={`${localUser.name} (you)`} color={localUser.color} size="sm" />
        {peers.slice(0, 3).map((p) => (
          <Avatar key={p.clientId} name={p.name} color={p.color} size="sm" />
        ))}
        {peers.length > 3 && (
          <div className="w-7 h-7 rounded-full bg-[#21262d] border-2 border-[#0d1117] flex items-center justify-center text-[10px] font-semibold text-[#8b949e]">
            +{peers.length - 3}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 text-xs text-[#8b949e]">
        <Users size={13} />
        <span>{peers.length + 1}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse-slow' : 'bg-amber-400'}`} />
        <span className={`text-xs font-medium ${isConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
          {isConnected ? 'Live' : 'Connecting…'}
        </span>
      </div>
    </div>
  );
}
