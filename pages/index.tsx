import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  FileText, Layers, CheckSquare, MessageSquare,
  Zap, Users, Shield, Globe, ArrowRight, Plus,
} from 'lucide-react';
import { generateRoomId } from '@/lib/utils';

export default function HomePage() {
  const router = useRouter();
  const [joinId, setJoinId]   = useState('');
  const [creating, setCreating] = useState(false);
  const [joinError, setJoinError] = useState('');

  const handleCreate = async () => {
    setCreating(true);
    await router.push(`/room/${generateRoomId()}`);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = joinId.trim().replace(/-/g, '').toLowerCase();
    if (clean.length < 4) { setJoinError('Enter at least 4 characters'); return; }
    setJoinError('');
    router.push(`/room/${clean}`);
  };

  const features = [
    { icon: <FileText size={20} />, title: 'Collaborative Docs',   desc: 'Rich-text editing with live cursors and conflict-free sync via CRDT.',       accent: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
    { icon: <Layers size={20} />,   title: 'Shared Whiteboard',    desc: 'Draw and sketch together with real-time cursor tracking and smooth strokes.',  accent: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
    { icon: <CheckSquare size={20}/>,title: 'Task Board',           desc: 'Shared to-do lists that sync instantly. Assign, complete, and track together.', accent: 'text-emerald-400',bg: 'bg-emerald-500/10',border: 'border-emerald-500/20' },
    { icon: <MessageSquare size={20}/>,title: 'Live Chat',          desc: 'Built-in messaging with typing indicators and full message history.',           accent: 'text-pink-400',   bg: 'bg-pink-500/10',   border: 'border-pink-500/20' },
    { icon: <Shield size={20} />,   title: 'Private by Default',   desc: 'Rooms use cryptographically random IDs. Only people with the link can join.',   accent: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20' },
    { icon: <Globe size={20} />,    title: 'Zero Backend',         desc: 'Pure peer-to-peer WebRTC. Your data never passes through any server.',          accent: 'text-teal-400',   bg: 'bg-teal-500/10',   border: 'border-teal-500/20' },
  ];

  return (
    <>
      <Head><title>Scale — Real-time Collaboration</title></Head>

      <div className="min-h-screen bg-[#0d1117] text-[#e6edf3]">

        {/* ── Navbar ─────────────────────────────── */}
        <nav className="sticky top-0 z-50 border-b border-[#21262d] bg-[#0d1117]/90 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Zap size={14} className="text-white" strokeWidth={3} />
              </div>
              <span className="text-base font-bold tracking-tight text-white">Scale</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#8b949e]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse-slow" />
              WebRTC · Yjs · No backend
            </div>
          </div>
        </nav>

        {/* ── Hero ───────────────────────────────── */}
        <section className="relative overflow-hidden">
          {/* Subtle glow */}
          <div className="pointer-events-none absolute inset-0 flex items-start justify-center">
            <div className="w-[700px] h-[400px] rounded-full bg-blue-600/10 blur-[120px] mt-10" />
          </div>

          <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-24 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 border border-[#30363d] bg-[#161b22] rounded-full px-4 py-1.5 text-xs text-[#8b949e] mb-8 animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              No sign-up &nbsp;·&nbsp; No server &nbsp;·&nbsp; 100% peer-to-peer
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.08] tracking-tight mb-6 animate-slide-up">
              Collaborate in real time,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400">
                without the friction
              </span>
            </h1>

            <p className="text-lg text-[#8b949e] max-w-xl mx-auto mb-12 leading-relaxed animate-slide-up">
              Create a room in one click. Share the link. Start working together instantly —
              docs, whiteboard, tasks, and chat, all synced peer-to-peer.
            </p>

            {/* CTA row */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-center animate-slide-up">
              <button
                onClick={handleCreate}
                disabled={creating}
                className="group flex items-center gap-2 px-7 py-3.5 bg-blue-500 hover:bg-blue-400 active:bg-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {creating
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Plus size={17} strokeWidth={2.5} />}
                Create a Room
                {!creating && <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />}
              </button>

              <form onSubmit={handleJoin} className="flex flex-col items-start gap-1">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinId}
                    onChange={(e) => { setJoinId(e.target.value); setJoinError(''); }}
                    placeholder="Room ID…"
                    className="w-44 px-4 py-3.5 bg-[#161b22] border border-[#30363d] text-[#e6edf3] placeholder-[#484f58] rounded-xl text-sm focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                  <button
                    type="submit"
                    className="px-5 py-3.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#c9d1d9] font-medium rounded-xl text-sm transition-colors"
                  >
                    Join
                  </button>
                </div>
                {joinError && <p className="text-red-400 text-xs ml-1">{joinError}</p>}
              </form>
            </div>
          </div>
        </section>

        {/* ── Features ───────────────────────────── */}
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">Everything your team needs</h2>
            <p className="text-[#8b949e] text-base max-w-lg mx-auto">
              A complete collaboration suite built on conflict-free replicated data types.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className={`group rounded-xl p-5 border ${f.border} ${f.bg} hover:border-opacity-60 transition-all hover:-translate-y-0.5`}
              >
                <div className={`w-10 h-10 rounded-lg bg-[#0d1117]/60 flex items-center justify-center mb-4 ${f.accent}`}>
                  {f.icon}
                </div>
                <h3 className="text-sm font-semibold text-white mb-1.5">{f.title}</h3>
                <p className="text-xs text-[#8b949e] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA Banner ─────────────────────────── */}
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <div className="relative overflow-hidden rounded-2xl border border-[#21262d] bg-[#161b22] p-12 text-center">
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="w-[500px] h-[200px] rounded-full bg-blue-600/10 blur-[80px]" />
            </div>
            <div className="relative">
              <h2 className="text-3xl font-bold text-white mb-3">Ready to collaborate?</h2>
              <p className="text-[#8b949e] mb-8 max-w-sm mx-auto">
                No account. No setup. Create a room and share the link.
              </p>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-500/20 text-sm disabled:opacity-50"
              >
                {creating
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Users size={17} />}
                Create Free Room
              </button>
            </div>
          </div>
        </section>

        {/* ── Footer ─────────────────────────────── */}
        <footer className="border-t border-[#21262d] py-7 text-center text-xs text-[#484f58]">
          Scale — Built with Next.js, Yjs &amp; WebRTC &nbsp;·&nbsp; No backend required &nbsp;·&nbsp; Open Source
        </footer>
      </div>
    </>
  );
}
