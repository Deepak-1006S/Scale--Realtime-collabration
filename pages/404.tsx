import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Zap, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <>
      <Head><title>404 — Scale</title></Head>
      <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mb-8">
          <Zap size={22} className="text-blue-400" strokeWidth={2.5} />
        </div>
        <p className="text-7xl font-black text-blue-400 mb-4">404</p>
        <p className="text-xl font-semibold text-white mb-2">Page not found</p>
        <p className="text-[#8b949e] mb-8 max-w-xs text-sm">
          This page doesn&apos;t exist. If you have a room ID, go back home to join.
        </p>
        <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl transition-colors text-sm">
          <Home size={15} />
          Back to Home
        </Link>
      </div>
    </>
  );
}
