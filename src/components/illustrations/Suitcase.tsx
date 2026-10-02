/** スーツケース。組み合わせ用に図形だけの部品も返す */
export function SuitcaseShapes() {
  return (
    <g>
      <path d="M15 12 V7 Q15 3 19 3 H25 Q29 3 29 7 V12" className="il-line il-nofill" />
      <rect x="4" y="12" width="36" height="30" rx="8" className="il-accent il-line" />
      <path d="M16 13 V41 M28 13 V41" className="il-stripe" />
      <circle cx="12" cy="45" r="3" className="il-text" />
      <circle cx="32" cy="45" r="3" className="il-text" />
    </g>
  );
}

export default function Suitcase({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 44 50" className={className} aria-hidden="true">
      <SuitcaseShapes />
    </svg>
  );
}
