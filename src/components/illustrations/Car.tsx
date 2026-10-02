/** 横向きの車(右向き) */
export default function Car({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 42" className={className} aria-hidden="true">
      <path
        d="M6 30 V23 Q6 19 10 19 H18 L26 9 H46 L56 19 H62 Q66 19 66 23 V30 Q66 32 64 32 H8 Q6 32 6 30 Z"
        className="il-accent il-line"
      />
      <path d="M28 13 H44 L50 19 H22 Z" className="il-lcd il-line-thin" />
      <circle cx="20" cy="32" r="6" className="il-text" />
      <circle cx="52" cy="32" r="6" className="il-text" />
      <circle cx="20" cy="32" r="2" className="il-white" />
      <circle cx="52" cy="32" r="2" className="il-white" />
    </svg>
  );
}
