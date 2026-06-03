import React, { useState } from 'react';
import { FileText, Layers, CheckSquare, Share2, UserCircle, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { ConnectionStatus } from './ConnectionStatus';
import { CollabEditor } from './CollabEditor';
import { Whiteboard } from './Whiteboard';
import { TaskList } from './TaskList';
import { Chat } from './Chat';
import { ShareModal } from './ShareModal';
import { UserSetupModal } from './UserSetupModal';
import { useRoom } from '@/context/RoomContext';

type Tab = 'editor' | 'whiteboard' | 'tasks';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'editor',     label: 'Docs',  icon: <FileText    size={14} /> },
  { id: 'whiteboard', label: 'Board', icon: <Layers      size={14} /> },
  { id: 'tasks',      label: 'Tasks', icon: <CheckSquare size={14} /> },
];

const SW = 304; // sidebar width px

export function RoomLayout() {
  const { roomId } = useRoom();
  const [tab,         setTab]         = useState<Tab>('editor');
  const [shareOpen,   setShareOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="h-screen flex flex-col bg-[#0d1117] text-[#e6edf3] overflow-hidden">

      {/* ── Header ───────────────────────────────── */}
      <header className="flex-shrink-0 h-12 bg-[#0d1117] border-b border-[#21262d] flex items-center gap-3 px-4 z-20">
        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-6 h-6 rounded-md bg-blue-500 flex items-center justify-center shadow-sm shadow-blue-500/40">
            <Zap size={13} className="text-white" strokeWidth={3} />
          </div>
          <span className="text-sm font-bold text-white hidden sm:block">Scale</span>
        </div>

        <div className="w-px h-4 bg-[#21262d] mx-0.5 flex-shrink-0" />

        {/* Tabs */}
        <div className="flex items-center gap-0.5 bg-[#161b22] border border-[#21262d] rounded-lg p-0.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                tab === t.id
                  ? 'bg-[#21262d] text-blue-400 shadow-sm'
                  : 'text-[#8b949e] hover:text-[#c9d1d9]'
              }`}
            >
              {t.icon}
              <span className="hidden sm:block">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <ConnectionStatus />

        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          <button
            onClick={() => setProfileOpen(true)}
            title="Edit profile"
            className="p-2 text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#161b22] rounded-lg transition-colors"
          >
            <UserCircle size={16} />
          </button>
          <button
            onClick={() => setShareOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-400 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm shadow-blue-500/20"
          >
            <Share2 size={13} />
            <span className="hidden sm:block">Share</span>
          </button>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Main panel */}
        <main className="flex-1 overflow-hidden flex flex-col min-w-0 bg-[#0d1117]">
          {tab === 'editor'     && <CollabEditor />}
          {tab === 'whiteboard' && <Whiteboard />}
          {tab === 'tasks'      && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-2xl mx-auto">
                <TaskList />
              </div>
            </div>
          )}
        </main>

        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          className="absolute top-1/2 -translate-y-1/2 z-10 w-5 h-10 bg-[#161b22] border border-[#30363d] rounded-l-lg flex items-center justify-center text-[#8b949e] hover:text-[#c9d1d9] transition-all"
          style={{ right: sidebarOpen ? SW : 0 }}
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {sidebarOpen ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        {/* Sidebar */}
        <aside
          className="flex-shrink-0 border-l border-[#21262d] bg-[#0d1117] flex flex-col overflow-hidden transition-all duration-200"
          style={{ width: sidebarOpen ? SW : 0 }}
        >
          {sidebarOpen && (
            <div className="flex flex-col h-full w-full overflow-hidden">
              <div className="flex flex-col min-h-0" style={{ flex: '3 1 0' }}>
                <Chat />
              </div>
              <div className="flex flex-col min-h-0 border-t border-[#21262d]" style={{ flex: '2 1 0' }}>
                <TaskList />
              </div>
            </div>
          )}
        </aside>
      </div>

      {shareOpen   && <ShareModal   roomId={roomId} onClose={() => setShareOpen(false)} />}
      {profileOpen && <UserSetupModal               onClose={() => setProfileOpen(false)} />}
    </div>
  );
}
