import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as Y from 'yjs';
import { useRoom } from '@/context/RoomContext';
import { Users } from 'lucide-react';

// Get cursor offset (character index) within a contenteditable element
function getCursorOffset(el: HTMLElement): number {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !el.contains(sel.anchorNode)) return 0;
  const range = document.createRange();
  range.selectNodeContents(el);
  range.setEnd(sel.getRangeAt(0).startContainer, sel.getRangeAt(0).startOffset);
  return range.toString().length;
}

// Set cursor to a specific character offset within a contenteditable element
function setCursorOffset(el: HTMLElement, offset: number) {
  const sel = window.getSelection();
  if (!sel) return;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let cur = 0;
  let node = walker.nextNode() as Text | null;
  while (node) {
    const len = node.nodeValue?.length ?? 0;
    if (cur + len >= offset) {
      try {
        const range = document.createRange();
        range.setStart(node, offset - cur);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      } catch { /* ignore */ }
      return;
    }
    cur += len;
    node = walker.nextNode() as Text | null;
  }
  // Fall to end
  try {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  } catch { /* ignore */ }
}

export function CollabEditor() {
  const { doc, peers, localUser } = useRoom();
  const editorRef  = useRef<HTMLDivElement>(null);
  const composing  = useRef(false);
  const ignoring   = useRef(false);
  const [isEmpty, setIsEmpty] = useState(true);

  const getText = useCallback((): Y.Text | null =>
    doc ? doc.getText('editor-content') : null
  , [doc]);

  // Sync Yjs → DOM (incoming remote changes)
  const syncToDom = useCallback(() => {
    const yText = getText();
    const el    = editorRef.current;
    if (!yText || !el) return;

    const newContent = yText.toString();
    setIsEmpty(newContent.length === 0);

    if (el.innerText === newContent) return; // nothing to do

    ignoring.current = true;
    const offset = getCursorOffset(el);
    el.innerText = newContent;
    setCursorOffset(el, offset);
    ignoring.current = false;
  }, [getText]);

  useEffect(() => {
    const yText = getText();
    if (!yText) return;
    yText.observe(syncToDom);
    syncToDom();
    return () => yText.unobserve(syncToDom);
  }, [getText, syncToDom]);

  // Sync DOM → Yjs (local keystrokes)
  const handleInput = useCallback(() => {
    if (ignoring.current || composing.current) return;
    const yText = getText();
    const el    = editorRef.current;
    if (!yText || !el) return;

    const next = el.innerText;
    const prev = yText.toString();
    setIsEmpty(next.length === 0);
    if (next === prev) return;

    // LCS-style single-pass diff
    let s = 0;
    let oe = prev.length;
    let ne = next.length;
    while (s < oe && s < ne && prev[s] === next[s]) s++;
    while (oe > s && ne > s && prev[oe - 1] === next[ne - 1]) { oe--; ne--; }

    doc!.transact(() => {
      if (oe > s) yText.delete(s, oe - s);
      if (ne > s) yText.insert(s, next.slice(s, ne));
    });
  }, [getText, doc]);

  if (!doc) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0d1117]">
        <div className="text-center text-[#484f58]">
          <div className="spinner mx-auto mb-3" />
          <p className="text-xs">Connecting…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      {/* Toolbar */}
      <div className="flex items-center px-5 py-2.5 border-b border-[#21262d] flex-shrink-0">
        <span className="text-[10px] font-semibold text-[#484f58] tracking-widest uppercase">Document</span>
        <div className="flex-1" />
        {peers.length > 0 && (
          <div className="flex items-center gap-1.5 text-[10px] text-[#8b949e]">
            <Users size={11} />
            <span>{peers.length + 1} editing</span>
          </div>
        )}
        <span className="text-[10px] text-[#484f58] ml-3">Auto-synced · P2P</span>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-10 py-10 relative">
          {/* Placeholder */}
          {isEmpty && (
            <span className="absolute top-10 left-10 right-10 text-[#484f58] text-[15px] leading-7 pointer-events-none select-none">
              Start writing… syncs in real time to everyone in the room.
            </span>
          )}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            spellCheck
            onInput={handleInput}
            onCompositionStart={() => { composing.current = true; }}
            onCompositionEnd={() => { composing.current = false; handleInput(); }}
            className="editor-content text-[#e6edf3] text-[15px] leading-7 min-h-[60vh] focus:outline-none cursor-text select-text"
          />
        </div>
      </div>
    </div>
  );
}
