import { CalculatorShapes } from './Calculator';
import { SuitcaseShapes } from './Suitcase';

/** スーツケースを持った電卓(イベントがまだない空の状態に出す) */
export default function CalculatorWithSuitcase({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 112 76" className={className} aria-hidden="true">
      <CalculatorShapes />
      {/* 腕でスーツケースの持ち手をつかむ */}
      <path d="M55 46 Q64 44 72 36" className="il-line il-nofill" />
      <g transform="translate(64 24)">
        <SuitcaseShapes />
      </g>
    </svg>
  );
}
