import React, { useState } from 'react';
import { User } from 'lucide-react';
import { Modal } from './ui/Modal';
import { COLORS } from '@/lib/utils';
import { useRoom } from '@/context/RoomContext';

interface Props { onClose: () => void; }

export function UserSetupModal({ onClose }: Props) {
  const { localUser, setLocalUser } = useRoom();
  const [name,  setName]  = useState(localUser.name === 'Anonymous' ? '' : localUser.name);
  const [color, setColor] = useState(localUser.color);

  const save = () => {
    const t = name.trim();
    if (!t) return;
    setLocalUser({ name: t, color });
    onClose();
  };

  return (
    <Modal title="Your Profile" onClose={onClose}>
      {/* Preview */}
      <div className="flex items-center gap-3 mb-5 p-3 bg-[#0d1117] border border-[#21262d] rounded-xl">
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0"
          style={{ backgroundColor: color }}>
          {name ? name[0].toUpperCase() : '?'}
        </div>
        <div>
          <p className="text-sm font-medium text-[#e6edf3]">{name || 'Your name'}</p>
          <p className="text-xs text-[#8b949e]">Visible to everyone in the room</p>
        </div>
      </div>

      {/* Name */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-[#8b949e] mb-2 uppercase tracking-wider">
          Display Name
        </label>
        <div className="relative">
          <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#484f58]" />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            placeholder="Enter your name…"
            maxLength={30}
            autoFocus
            className="w-full pl-9 pr-4 py-3 bg-[#0d1117] border border-[#30363d] text-[#e6edf3] placeholder-[#484f58] rounded-xl text-sm focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>

      {/* Color */}
      <div className="mb-5">
        <label className="block text-xs font-semibold text-[#8b949e] mb-2 uppercase tracking-wider">
          Cursor Color
        </label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c.bg}
              onClick={() => setColor(c.bg)}
              title={c.name}
              className={`w-8 h-8 rounded-full transition-all ${
                color === c.bg
                  ? 'ring-2 ring-offset-2 ring-offset-[#161b22] ring-white/50 scale-110'
                  : 'hover:scale-105'
              }`}
              style={{ backgroundColor: c.bg }}
            />
          ))}
        </div>
      </div>

      <button
        onClick={save}
        disabled={!name.trim()}
        className="w-full py-3 bg-blue-500 hover:bg-blue-400 disabled:bg-[#21262d] disabled:text-[#484f58] text-white font-semibold rounded-xl transition-colors text-sm"
      >
        Join Room
      </button>
    </Modal>
  );
}
