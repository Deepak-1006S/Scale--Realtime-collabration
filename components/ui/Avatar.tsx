import React from 'react';

interface AvatarProps {
  name: string;
  color: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const sizes = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
};

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export function Avatar({ name, color, size = 'md', showTooltip = true }: AvatarProps) {
  return (
    <div className="relative group flex-shrink-0">
      <div
        className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white ring-2 ring-[#0d1117]`}
        style={{ backgroundColor: color }}
        title={showTooltip ? name : undefined}
      >
        {initials(name)}
      </div>
      {showTooltip && (
        <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-[#161b22] border border-[#30363d] text-[#e6edf3] text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl">
          {name}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#161b22]" />
        </div>
      )}
    </div>
  );
}
