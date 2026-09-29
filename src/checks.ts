// 通常の値から大きく外れた入力の確認。保存は止めず、注意と「ぶっぶー」の音で知らせる。

import type { Currency } from './types';

type Range = { label: string; unit: string; min: number; max: number };

const RANGES = {
  fuelEconomy: { label: '燃費', unit: 'km/L', min: 3, max: 40 },
  unitPrice: { label: 'ガソリン単価', unit: '円/L', min: 100, max: 300 },
  distance: { label: '距離', unit: 'km', min: 0.1, max: 3000 },
  toll: { label: '高速代', unit: '円', min: 50, max: 50000 },
  amountJPY: { label: '金額', unit: '円', min: 1, max: 1000000 },
  amountUSD: { label: '金額', unit: 'ドル', min: 0.01, max: 10000 },
  amountKRW: { label: '金額', unit: 'ウォン', min: 1, max: 10000000 },
  rateUSD: { label: '1ドルのレート', unit: '円', min: 50, max: 500 },
  rateKRW: { label: '1ウォンのレート', unit: '円', min: 0.01, max: 1 },
  quickTotal: { label: '合計金額', unit: '円', min: 1, max: 10000000 },
} satisfies Record<string, Range>;

export type RangeKey = keyof typeof RANGES;

export const amountKey = (currency: Currency): RangeKey => `amount${currency}`;
export const rateKey = (currency: Exclude<Currency, 'JPY'>): RangeKey => `rate${currency}`;

const fmt = (n: number) => n.toLocaleString('ja-JP', { maximumFractionDigits: 2 });

/** 範囲から外れていれば注意の文、範囲内か未入力なら null */
export function rangeWarning(key: RangeKey, value: number | undefined): string | null {
  if (value == null || value === 0) return null;
  const r: Range = RANGES[key];
  if (value >= r.min && value <= r.max) return null;
  return `${r.label} ${fmt(value)}${r.unit} は、ふつうの範囲（${fmt(r.min)}〜${fmt(r.max)}${r.unit}）から大きく外れています。入力を確認してください。`;
}

/** メーターの到着時が出発時以下なら注意の文 */
export function odometerWarning(start: number | undefined, end: number | undefined): string | null {
  if (start == null || end == null) return null;
  if (end <= start) return '到着時のメーターが出発時より小さくなっています。入力を確認してください。';
  return rangeWarning('distance', end - start);
}
