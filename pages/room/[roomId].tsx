import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { RoomProvider } from '@/context/RoomContext';
import { formatRoomId } from '@/lib/utils';

const RoomLayout = dynamic(
  () => import('@/components/RoomLayout').then((m) => m.RoomLayout),
  {
    ssr: false,
    loading: () => (
      <div className="h-screen flex flex-col items-center justify-center bg-[#0d1117] gap-4">
        <div className="spinner" />
        <p className="text-[#8b949e] text-sm">Joining room…</p>
      </div>
    ),
  }
);

const UserSetupModal = dynamic(
  () => import('@/components/UserSetupModal').then((m) => m.UserSetupModal),
  { ssr: false }
);

function RoomInner() {
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    try {
      const raw  = localStorage.getItem('scale-user');
      const user = raw ? JSON.parse(raw) : null;
      if (!user || !user.name || user.name === 'Anonymous') setShowSetup(true);
    } catch {
      setShowSetup(true);
    }
  }, []);

  return (
    <>
      <RoomLayout />
      {showSetup && <UserSetupModal onClose={() => setShowSetup(false)} />}
    </>
  );
}

export default function RoomPage() {
  const router = useRouter();
  const { roomId } = router.query;

  if (!roomId || typeof roomId !== 'string') {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0d1117]">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Room {formatRoomId(roomId)} — Scale</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <RoomProvider roomId={roomId}>
        <RoomInner />
      </RoomProvider>
    </>
  );
}
