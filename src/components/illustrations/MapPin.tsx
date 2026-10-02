/** 地図のピン */
export default function MapPin({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 46" className={className} aria-hidden="true">
      <path d="M18 43 C18 43 4 28 4 17 A14 14 0 0 1 32 17 C32 28 18 43 18 43 Z" className="il-pay il-line" />
      <circle cx="18" cy="17" r="5" className="il-white il-line-thin" />
    </svg>
  );
}
