import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as Y from 'yjs';
import { Pencil, Eraser, Trash2, Minus, Plus, Undo2 } from 'lucide-react';
import { useRoom } from '@/context/RoomContext';
import type { Stroke } from '@/lib/types';

function getMap(doc: Y.Doc): Y.Map<Stroke> {
  return doc.getMap<Stroke>('whiteboard');
}

// Keep ordered stroke IDs so undo removes the last one
function getOrder(doc: Y.Doc): Y.Array<string> {
  return doc.getArray<string>('whiteboard-order');
}

const PALETTE = ['#f0f6fc', '#ff7b72', '#ffa657', '#e3b341', '#7ee787', '#79c0ff', '#d2a8ff', '#f778ba'];
const BG = '#0d1117';

export function Whiteboard() {
  const { doc, provider, localUser } = useRoom();
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tool,  setTool]  = useState<'pen' | 'eraser'>('pen');
  const [width, setWidth] = useState(3);
  const [color, setColor] = useState(localUser.color);
  const drawing  = useRef(false);
  const strokeId = useRef('');
  const pts      = useRef<Array<[number, number]>>([]);
  const [cursors, setCursors] = useState<Record<number, { x: number; y: number; name: string; color: string }>>({});

  useEffect(() => { setColor(localUser.color); }, [localUser.color]);

  // ── Draw all strokes onto canvas ────────────────
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !doc) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill background first so eraser works correctly
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dot grid
    ctx.fillStyle = '#21262d';
    for (let x = 20; x < canvas.width; x += 40)
      for (let y = 20; y < canvas.height; y += 40)
        { ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill(); }

    const map   = getMap(doc);
    const order = getOrder(doc);

    // Draw in insertion order
    for (let i = 0; i < order.length; i++) {
      const stroke = map.get(order.get(i));
      if (!stroke || stroke.points.length < 2) continue;

      ctx.beginPath();
      if (stroke.tool === 'eraser') {
        ctx.strokeStyle = BG;
        ctx.lineWidth   = stroke.width * 6;
      } else {
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth   = stroke.width;
      }
      ctx.lineCap  = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = 'source-over';

      ctx.moveTo(stroke.points[0][0], stroke.points[0][1]);
      for (let j = 1; j < stroke.points.length - 1; j++) {
        const mx = (stroke.points[j][0] + stroke.points[j + 1][0]) / 2;
        const my = (stroke.points[j][1] + stroke.points[j + 1][1]) / 2;
        ctx.quadraticCurveTo(stroke.points[j][0], stroke.points[j][1], mx, my);
      }
      const last = stroke.points[stroke.points.length - 1];
      ctx.lineTo(last[0], last[1]);
      ctx.stroke();
    }
  }, [doc]);

  // Observe both the map AND the order array
  useEffect(() => {
    if (!doc) return;
    const map   = getMap(doc);
    const order = getOrder(doc);
    map.observe(redraw);
    order.observe(redraw);
    redraw();
    return () => { map.unobserve(redraw); order.unobserve(redraw); };
  }, [doc, redraw]);

  // Resize canvas on container size change
  useEffect(() => {
    const resize = () => {
      const c  = canvasRef.current;
      const el = containerRef.current;
      if (!c || !el) return;
      const { width: w, height: h } = el.getBoundingClientRect();
      c.width  = w;
      c.height = h;
      redraw();
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [redraw]);

  // Remote cursors via Yjs awareness
  useEffect(() => {
    if (!provider) return;
    const { awareness } = provider;
    const upd = () => {
      const c: typeof cursors = {};
      awareness.getStates().forEach((s, id) => {
        if (id !== awareness.clientID && s.wbCursor)
          c[id] = { x: s.wbCursor.x, y: s.wbCursor.y, name: s.user?.name || '?', color: s.user?.color || '#999' };
      });
      setCursors(c);
    };
    awareness.on('change', upd);
    return () => awareness.off('change', upd);
  }, [provider]);

  // ── Input helpers ───────────────────────────────
  const getPos = (e: React.MouseEvent | React.TouchEvent): [number, number] => {
    const r = canvasRef.current!.getBoundingClientRect();
    if ('touches' in e) return [e.touches[0].clientX - r.left, e.touches[0].clientY - r.top];
    return [(e as React.MouseEvent).clientX - r.left, (e as React.MouseEvent).clientY - r.top];
  };

  const onStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!doc) return;
    e.preventDefault();
    drawing.current  = true;
    strokeId.current = `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    pts.current      = [getPos(e)];
  };

  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!doc || !drawing.current) return;
    e.preventDefault();
    const p = getPos(e);
    pts.current.push(p);

    const stroke: Stroke = {
      id: strokeId.current, points: [...pts.current],
      color, width, tool,
    };
    doc.transact(() => {
      const map   = getMap(doc);
      const order = getOrder(doc);
      if (!map.has(strokeId.current)) order.push([strokeId.current]);
      map.set(strokeId.current, stroke);
    });

    provider?.awareness.setLocalStateField('wbCursor', { x: p[0], y: p[1] });
  };

  const onEnd = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) e.preventDefault();
    drawing.current = false;
    provider?.awareness.setLocalStateField('wbCursor', null);
  };

  const undo = () => {
    if (!doc) return;
    const order = getOrder(doc);
    if (order.length === 0) return;
    // Find the last stroke added by the local user
    // (we track ownership by strokeId prefix — all local IDs start with "s-")
    // Simple approach: remove the last entry in the order array
    doc.transact(() => {
      const lastId = order.get(order.length - 1);
      getMap(doc).delete(lastId);
      order.delete(order.length - 1, 1);
    });
  };

  const clearAll = () => {
    if (!doc) return;
    doc.transact(() => {
      const map   = getMap(doc);
      const order = getOrder(doc);
      map.forEach((_, k) => map.delete(k));
      order.delete(0, order.length);
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[#21262d] flex-wrap">

        {/* Tools */}
        <div className="flex items-center gap-0.5 bg-[#161b22] border border-[#21262d] rounded-lg p-0.5">
          <button
            onClick={() => setTool('pen')}
            title="Pen (P)"
            className={`p-1.5 rounded-md transition-all ${tool === 'pen' ? 'bg-[#21262d] text-blue-400' : 'text-[#8b949e] hover:text-[#c9d1d9]'}`}
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => setTool('eraser')}
            title="Eraser (E)"
            className={`p-1.5 rounded-md transition-all ${tool === 'eraser' ? 'bg-[#21262d] text-blue-400' : 'text-[#8b949e] hover:text-[#c9d1d9]'}`}
          >
            <Eraser size={13} />
          </button>
        </div>

        {/* Stroke size */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setWidth((w) => Math.max(1, w - 1))}
            className="p-1 rounded hover:bg-[#161b22] text-[#8b949e]"
          >
            <Minus size={12} />
          </button>
          <div className="w-8 h-8 flex items-center justify-center">
            <div
              className="rounded-full bg-[#c9d1d9] transition-all"
              style={{ width: Math.min(width * 3, 20), height: Math.min(width * 3, 20) }}
            />
          </div>
          <button
            onClick={() => setWidth((w) => Math.min(20, w + 1))}
            className="p-1 rounded hover:bg-[#161b22] text-[#8b949e]"
          >
            <Plus size={12} />
          </button>
        </div>

        {/* Color palette */}
        <div className="flex items-center gap-1">
          {PALETTE.map((c) => (
            <button
              key={c}
              onClick={() => { setColor(c); setTool('pen'); }}
              title={c}
              className={`w-4 h-4 rounded-full transition-all border-2 ${
                color === c && tool === 'pen'
                  ? 'border-white/60 scale-125'
                  : 'border-transparent hover:scale-110'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="flex-1" />

        {/* Undo */}
        <button
          onClick={undo}
          title="Undo last stroke"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#161b22] rounded-lg transition-colors"
        >
          <Undo2 size={12} />
          Undo
        </button>

        {/* Clear */}
        <button
          onClick={clearAll}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-red-500/20"
        >
          <Trash2 size={12} />
          Clear
        </button>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 ${tool === 'eraser' ? 'cursor-cell' : 'cursor-crosshair'}`}
          style={{ touchAction: 'none' }}
          onMouseDown={onStart}
          onMouseMove={onMove}
          onMouseUp={onEnd}
          onMouseLeave={onEnd}
          onTouchStart={onStart}
          onTouchMove={onMove}
          onTouchEnd={onEnd}
        />

        {/* Remote cursors */}
        {Object.entries(cursors).map(([id, c]) => (
          <div
            key={id}
            className="absolute pointer-events-none select-none"
            style={{ left: c.x, top: c.y, transform: 'translate(-4px, -4px)' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M3 1.5L14 8L9 9.5L6.5 15L3 1.5Z" fill={c.color} stroke="#0d1117" strokeWidth="1.5" />
            </svg>
            <div
              className="text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap mt-0.5 shadow"
              style={{ backgroundColor: c.color }}
            >
              {c.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
