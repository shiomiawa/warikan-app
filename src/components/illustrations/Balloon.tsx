/** 気球。color で球皮の色(ピンク・水色)を選ぶ */
export default function Balloon({ className, color = 'pink' }: { className?: string; color?: 'pink' | 'blue' }) {
  const body = color === 'pink' ? 'il-pay' : 'il-main';
  return (
    <svg viewBox="0 0 40 58" className={className} aria-hidden="true">
      <path
        d="M20 4 C31 4 37 12 37 21 C37 31 28 37 25 42 H15 C12 37 3 31 3 21 C3 12 9 4 20 4 Z"
        className={`${body} il-line`}
      />
      {/* 真ん中の白い帯 */}
      <path d="M20 4 C14 11 13 31 16 42 H24 C27 31 26 11 20 4 Z" className="il-white il-line-thin" />
      <path d="M16 42 L17 48 M24 42 L23 48" className="il-line-thin il-nofill" />
      <rect x="14" y="48" width="12" height="7" rx="2" className="il-accent il-line-thin" />
    </svg>
  );
}
