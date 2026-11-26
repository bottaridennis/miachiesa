import { useId } from 'react';

/**
 * Rosone di vetrata disegnato in SVG (nessuna immagine esterna).
 * 12 petali esterni + 6 interni con vetri colorati, piombature scure e croce dorata al centro.
 */
const GLASS = ['#2f5bd8', '#8a4fe0', '#13a37e', '#d23a55', '#3c7bf0', '#e8b04a'];

export function RoseWindow({ className }: { className?: string }) {
  const id = useId().replace(/:/g, '');
  const petal = (r1: number, r2: number, width: number) => `M0 ${-r1} C ${width} ${-(r1 + r2) / 2}, ${width} ${-r2}, 0 ${-r2} C ${-width} ${-r2}, ${-width} ${-(r1 + r2) / 2}, 0 ${-r1} Z`;
  return (
    <svg viewBox="-110 -110 220 220" className={className} aria-hidden>
      <defs>
        <radialGradient id={`glow-${id}`}>
          <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`sheen-${id}`} cx="35%" cy="30%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="55%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* cornice in pietra */}
      <circle r="106" fill="#0b1033" />
      <circle r="102" fill="none" stroke="#2a336e" strokeWidth="3" />
      {/* anello esterno: 24 spicchi */}
      {Array.from({ length: 24 }).map((_, i) => (
        <path key={`o${i}`} d="M0 -100 A100 100 0 0 1 25.88 -96.59 L 20.7 -77.27 A80 80 0 0 0 0 -80 Z" transform={`rotate(${i * 15})`} fill={GLASS[i % GLASS.length]} opacity="0.92" stroke="#0b1033" strokeWidth="2.2" />
      ))}
      <circle r="80" fill="#0b1033" />
      {/* 12 petali */}
      {Array.from({ length: 12 }).map((_, i) => (
        <path key={`p${i}`} d={petal(26, 78, 20)} transform={`rotate(${i * 30})`} fill={GLASS[(i + 2) % GLASS.length]} stroke="#0b1033" strokeWidth="2.6" />
      ))}
      {/* 6 petali interni */}
      {Array.from({ length: 6 }).map((_, i) => (
        <path key={`q${i}`} d={petal(12, 44, 14)} transform={`rotate(${i * 60 + 15})`} fill={GLASS[(i * 2 + 1) % GLASS.length]} stroke="#0b1033" strokeWidth="2.4" />
      ))}
      {/* centro con croce */}
      <circle r="20" fill="#e8b04a" stroke="#0b1033" strokeWidth="3" />
      <path d="M0 -12v24M-8 -3h16" stroke="#0b1033" strokeWidth="4" strokeLinecap="round" />
      {/* riflessi */}
      <circle r="100" fill={`url(#sheen-${id})`} />
      <circle r="100" fill={`url(#glow-${id})`} opacity="0.35" />
    </svg>
  );
}
