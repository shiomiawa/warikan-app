/** 横向きの飛行機(右向き) */
export default function Airplane({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 36" className={className} aria-hidden="true">
      <path d="M13 15 L8 4 H16 L25 15 Z" className="il-main il-line" />
      <path d="M8 21 Q8 15 16 15 H54 Q66 15 68 21 Q66 27 54 27 H16 Q8 27 8 21 Z" className="il-white il-line" />
      <circle cx="40" cy="20" r="1.8" className="il-main" />
      <circle cx="47" cy="20" r="1.8" className="il-main" />
      <circle cx="54" cy="20" r="1.8" className="il-main" />
      <path d="M30 22 H44 L36 33 H30 Z" className="il-main il-line" />
    </svg>
  );
}
