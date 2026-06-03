import React, { useState, useEffect, useCallback } from 'react';
import * as Y from 'yjs';
import { Plus, Trash2, CheckCircle2, Circle, ListTodo } from 'lucide-react';
import { useRoom } from '@/context/RoomContext';
import { Avatar } from './ui/Avatar';
import { stringToColor } from '@/lib/utils';
import type { Task } from '@/lib/types';

function getArray(doc: Y.Doc): Y.Array<Y.Map<unknown>> {
  return doc.getArray<Y.Map<unknown>>('tasks');
}

function readTasks(doc: Y.Doc): Task[] {
  const arr = getArray(doc);
  const out: Task[] = [];
  for (let i = 0; i < arr.length; i++) {
    const t = arr.get(i);
    out.push({
      id:        String(t.get('id')        ?? ''),
      text:      String(t.get('text')      ?? ''),
      done:      Boolean(t.get('done')),
      createdBy: String(t.get('createdBy') ?? ''),
      createdAt: Number(t.get('createdAt') ?? 0),
    });
  }
  return out;
}

export function TaskList() {
  const { doc, localUser, peers } = useRoom();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState('');

  const refresh = useCallback(() => {
    if (doc) setTasks(readTasks(doc));
  }, [doc]);

  useEffect(() => {
    if (!doc) return;
    const arr = getArray(doc);

    // Observe array-level changes (add / remove)
    arr.observe(refresh);

    // Also observe each existing map for deep changes (toggle)
    const deepObserver = () => refresh();
    const observeAll = () => {
      for (let i = 0; i < arr.length; i++) {
        arr.get(i).observe(deepObserver);
      }
    };

    // Re-attach deep observers whenever array changes
    const onArrayChange = () => {
      refresh();
      observeAll();
    };
    arr.observe(onArrayChange);
    observeAll();
    refresh();

    return () => {
      arr.unobserve(refresh);
      arr.unobserve(onArrayChange);
      for (let i = 0; i < arr.length; i++) {
        try { arr.get(i).unobserve(deepObserver); } catch { /* may already be gone */ }
      }
    };
  }, [doc, refresh]);

  const add = () => {
    if (!doc || !input.trim()) return;
    const task = new Y.Map<unknown>();
    task.set('id',        `t-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    task.set('text',      input.trim());
    task.set('done',      false);
    task.set('createdBy', localUser.name);
    task.set('createdAt', Date.now());
    getArray(doc).push([task]);
    setInput('');
  };

  const toggle = (id: string) => {
    if (!doc) return;
    const arr = getArray(doc);
    for (let i = 0; i < arr.length; i++) {
      const t = arr.get(i);
      if (t.get('id') === id) {
        t.set('done', !t.get('done'));
        break;
      }
    }
  };

  const remove = (id: string) => {
    if (!doc) return;
    const arr = getArray(doc);
    for (let i = 0; i < arr.length; i++) {
      if (arr.get(i).get('id') === id) { arr.delete(i, 1); break; }
    }
  };

  const getColor = (name: string) =>
    name === localUser.name
      ? localUser.color
      : peers.find((p) => p.name === name)?.color ?? stringToColor(name);

  const done = tasks.filter((t) => t.done).length;

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#21262d] flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ListTodo size={13} className="text-[#8b949e]" />
            <span className="text-xs font-semibold text-[#c9d1d9]">Tasks</span>
          </div>
          <span className="text-[10px] font-medium text-[#484f58]">{done}/{tasks.length}</span>
        </div>
        {tasks.length > 0 && (
          <div className="h-0.5 bg-[#21262d] rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${tasks.length ? (done / tasks.length) * 100 : 0}%` }}
            />
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-10 text-[#484f58]">
            <CheckCircle2 size={20} className="mb-2 opacity-30" />
            <p className="text-xs">No tasks yet</p>
          </div>
        ) : (
          <ul>
            {tasks.map((task) => (
              <li
                key={task.id}
                className="group flex items-start gap-3 px-4 py-3 hover:bg-[#161b22] transition-colors border-b border-[#21262d]/40 last:border-0"
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggle(task.id)}
                  className="mt-0.5 flex-shrink-0 text-[#484f58] hover:text-blue-400 transition-colors"
                >
                  {task.done
                    ? <CheckCircle2 size={16} className="text-blue-500" />
                    : <Circle       size={16} />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs leading-relaxed ${task.done ? 'line-through text-[#484f58]' : 'text-[#c9d1d9]'}`}>
                    {task.text}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Avatar name={task.createdBy} color={getColor(task.createdBy)} size="xs" showTooltip={false} />
                    <span className="text-[10px] text-[#484f58]">{task.createdBy}</span>
                  </div>
                </div>

                {/* Delete (hover) */}
                <button
                  onClick={() => remove(task.id)}
                  className="opacity-0 group-hover:opacity-100 mt-0.5 p-1 text-[#484f58] hover:text-red-400 transition-all flex-shrink-0 rounded"
                >
                  <Trash2 size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add input */}
      <div className="px-3 py-3 border-t border-[#21262d] flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="Add a task…"
            className="flex-1 px-3 py-2.5 text-xs bg-[#161b22] border border-[#30363d] text-[#c9d1d9] placeholder-[#484f58] rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
          />
          <button
            onClick={add}
            disabled={!input.trim()}
            className="p-2.5 bg-blue-500 hover:bg-blue-400 disabled:bg-[#21262d] disabled:text-[#484f58] text-white rounded-xl transition-colors"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
