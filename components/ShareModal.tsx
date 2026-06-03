import React, { useState } from 'react';
import { Copy, Check, Link2 } from 'lucide-react';
import { Modal } from './ui/Modal';
import { formatRoomId } from '@/lib/utils';

interface Props { roomId: string; onClose: () => void; }

export function ShareModal({ roomId, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? `${window.location.origin}/room/${roomId}` : '';

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); } catch {
      const el = document.createElement('textarea');
      el.value = url; document.body.appendChild(el); el.select();
      document.execCommand('copy'); document.body.removeChild(el);
    }
    setCopied(true); setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal title="Invite Collaborators" onClose={onClose}>
      <div className="mb-4">
        <p className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider mb-2">Room ID</p>
        <div className="bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-4 text-center">
          <span className="font-mono text-2xl font-bold text-white tracking-[0.2em]">
            {formatRoomId(roomId)}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider mb-2">Share Link</p>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-3 min-w-0">
            <Link2 size={13} className="text-[#484f58] flex-shrink-0" />
            <span className="text-xs text-[#8b949e] truncate font-mono">{url}</span>
          </div>
          <button
            onClick={copy}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
              copied ? 'bg-emerald-500 text-white' : 'bg-blue-500 hover:bg-blue-400 text-white'
            }`}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <p className="text-xs font-semibold text-blue-400 mb-1">How it works</p>
        <p className="text-xs text-[#8b949e] leading-relaxed">
          Anyone with this link can join instantly. No account required.
          All data syncs peer-to-peer via WebRTC — no server involved.
        </p>
      </div>
    </Modal>
  );
}
