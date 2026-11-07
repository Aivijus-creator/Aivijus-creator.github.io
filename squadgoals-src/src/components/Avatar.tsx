import React from 'react';

const AVATAR_GRADIENTS = [
  'from-[#FF7A00] to-[#FF5757]',
  'from-[#F59E0B] to-[#FF7A00]',
  'from-[#0EA5E9] to-[#6366F1]',
  'from-[#10B981] to-[#0EA5E9]',
  'from-[#8B5CF6] to-[#EC4899]',
  'from-[#FF5757] to-[#EC4899]',
  'from-[#14B8A6] to-[#10B981]',
];

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return Array.from(parts[0]).slice(0, 2).join('').toUpperCase();
  return (Array.from(parts[0])[0] + Array.from(parts[parts.length - 1])[0]).toUpperCase();
}

function gradientFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

interface AvatarProps {
  name: string;
  seed: string;
  size?: 'sm' | 'md';
  title?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, seed, size = 'md', title }) => (
  <span
    title={title}
    aria-hidden={title ? undefined : true}
    className={`inline-flex items-center justify-center shrink-0 rounded-full bg-gradient-to-br ${gradientFor(
      seed
    )} text-white font-['Outfit'] font-bold shadow-xs select-none ${
      size === 'sm' ? 'w-7 h-7 text-[11px]' : 'w-9 h-9 text-xs'
    }`}
  >
    {getInitials(name)}
  </span>
);
