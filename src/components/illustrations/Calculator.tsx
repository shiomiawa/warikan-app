/**
 * 笑顔の電卓キャラクター。色は styles.css の .il-* クラス(CSS変数)で付ける。
 * 他のイラストと組み合わせられるよう、図形だけを <g> で返す部品も用意する。
 */
export function CalculatorShapes() {
  return (
    <g>
      <rect x="4" y="4" width="52" height="64" rx="14" className="il-main il-line" />
      {/* 画面に顔 */}
      <rect x="12" y="12" width="36" height="22" rx="7" className="il-lcd il-line" />
      <circle cx="23" cy="21" r="2.6" className="il-text" />
      <circle cx="37" cy="21" r="2.6" className="il-text" />
      <path d="M24 26.5 Q30 31.5 36 26.5" className="il-line il-nofill" />
      {/* ボタン */}
      <rect x="12" y="41" width="9" height="8" rx="3" className="il-lcd il-line-thin" />
      <rect x="25.5" y="41" width="9" height="8" rx="3" className="il-lcd il-line-thin" />
      <rect x="39" y="41" width="9" height="8" rx="3" className="il-lcd il-line-thin" />
      <rect x="12" y="53" width="9" height="8" rx="3" className="il-lcd il-line-thin" />
      <rect x="25.5" y="53" width="9" height="8" rx="3" className="il-lcd il-line-thin" />
      <rect x="39" y="53" width="9" height="8" rx="3" className="il-accent il-line-thin" />
    </g>
  );
}

export default function Calculator({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 72" className={className} aria-hidden="true">
      <CalculatorShapes />
    </svg>
  );
}
