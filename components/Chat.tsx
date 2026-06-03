import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as Y from 'yjs';
import { Send, MessageSquare } from 'lucide-react';
import { useRoom } from '@/context/RoomContext';
import { Avatar } from './ui/Avatar';
import type { ChatMessage } from '@/lib/types';

function getArray(doc: Y.Doc): Y.Array<unknown> {
  return doc.getArray('chat');
}

// Safely coerce whatever Yjs gives us back to a ChatMessage
function toMessage(raw: unknown): ChatMessage | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (!o.id || !o.text || !o.sender) return null;
  return {
    id:          String(o.id),
    text:        String(o.text),
    sender:      String(o.sender),
    senderColor: String(o.senderColor ?? '#3b82f6'),
    timestamp:   Number(o.timestamp   ?? 0),
  };
}

function fmt(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function Chat() {
  const { doc, provider, localUser } = useRoom();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input,    setInput]    = useState('');
  const [typing,   setTyping]   = useState<Record<number, string>>({});
  const listRef   = useRef<HTMLDivElement>(null);
  const timerRef  = useRef<ReturnType<typeof setTimeout>>();

  // Read all messages from Yjs array
  const refresh = useCallback(() => {
    if (!doc) return;
    const arr  = getArray(doc);
    const msgs: ChatMessage[] = [];
    for (let i = 0; i < arr.length; i++) {
      const m = toMessage(arr.get(i));
      if (m) msgs.push(m);
    }
    setMessages(msgs);
  }, [doc]);

  useEffect(() => {
    if (!doc) return;
    const arr = getArray(doc);
    arr.observe(refresh);
    refresh();
    return () => arr.unobserve(refresh);
  }, [doc, refresh]);

  // Scroll to bottom when messages change
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Typing indicators via awareness
  useEffect(() => {
    if (!provider) return;
    const { awareness } = provider;
    const upd = () => {
      const t: Record<number, string> = {};
      awareness.getStates().forEach((s, id) => {
        if (id !== awareness.clientID && s.typing && s.user?.name)
          t[id] = String(s.user.name);
      });
      setTyping(t);
    };
    awareness.on('change', upd);
    return () => awareness.off('change', upd);
  }, [provider]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    provider?.awareness.setLocalStateField('typing', true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(
      () => provider?.awareness.setLocalStateField('typing', false),
      1500
    );
  };

  const send = () => {
    if (!doc || !input.trim()) return;
    const msg: ChatMessage = {
      id:          `m-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      text:        input.trim(),
      sender:      localUser.name,
      senderColor: localUser.color,
      timestamp:   Date.now(),
    };
    // Push as a plain object — Yjs stores it as-is
    (getArray(doc) as Y.Array<ChatMessage>).push([msg]);
    setInput('');
    provider?.awareness.setLocalStateField('typing', false);
  };

  const typingNames = Object.values(typing);

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#21262d] flex-shrink-0">
        <MessageSquare size={13} className="text-[#8b949e]" />
        <span className="text-xs font-semibold text-[#c9d1d9]">Chat</span>
        {messages.length > 0 && (
          <span className="text-[10px] text-[#484f58] ml-auto">{messages.length}</span>
        )}
      </div>

      {/* Messages */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-10 text-[#484f58]">
            <MessageSquare size={22} className="mb-2 opacity-30" />
            <p className="text-xs">No messages yet</p>
          </div>
        ) : messages.map((msg, i) => {
          const isOwn    = msg.sender === localUser.name;
          const prev     = messages[i - 1];
          const showMeta = !prev || prev.sender !== msg.sender;

          return (
            <div key={msg.id} className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
              {showMeta
                ? <Avatar name={msg.sender} color={msg.senderColor} size="xs" showTooltip={false} />
                : <div className="w-6 flex-shrink-0" />}

              <div className={`flex flex-col max-w-[80%] gap-0.5 ${isOwn ? 'items-end' : ''}`}>
                {showMeta && (
                  <div className={`flex items-center gap-1.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                    <span className="text-[11px] font-medium text-[#8b949e]">
                      {isOwn ? 'You' : msg.sender}
                    </span>
                    <span className="text-[10px] text-[#484f58]">{fmt(msg.timestamp)}</span>
                  </div>
                )}
                <div className={`px-3 py-2 rounded-2xl text-xs leading-relaxed break-words ${
                  isOwn
                    ? 'bg-blue-500 text-white rounded-tr-sm'
                    : 'bg-[#21262d] text-[#c9d1d9] rounded-tl-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing dots */}
        {typingNames.length > 0 && (
          <div className="flex items-center gap-2 text-[10px] text-[#484f58] pl-8">
            <div className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1 h-1 rounded-full bg-[#484f58] animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <span>
              {typingNames.slice(0, 2).join(', ')} {typingNames.length === 1 ? 'is' : 'are'} typing…
            </span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-[#21262d] flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={onInputChange}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Type a message…"
            className="flex-1 px-3 py-2.5 text-xs bg-[#161b22] border border-[#30363d] text-[#c9d1d9] placeholder-[#484f58] rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            className="p-2.5 bg-blue-500 hover:bg-blue-400 disabled:bg-[#21262d] disabled:text-[#484f58] text-white rounded-xl transition-colors"
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
