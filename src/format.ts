import type { Currency, Item } from './types';

export const yen = (n: number): string => `${n.toLocaleString('ja-JP')}円`;

export const CURRENCIES: Record<Currency, { label: string; unit: string; decimals: number }> = {
  JPY: { label: '日本円', unit: '円', decimals: 0 },
  USD: { label: '米ドル', unit: 'ドル', decimals: 2 },
  KRW: { label: '韓国ウォン', unit: 'ウォン', decimals: 0 },
};

export function money(n: number, currency: Currency = 'JPY'): string {
  if (currency === 'USD') return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (currency === 'KRW') return `₩${n.toLocaleString('ko-KR')}`;
  return yen(n);
}

export const roundTo = (n: number, decimals: number): number => Math.round(n * 10 ** decimals) / 10 ** decimals;

export const OTHER = 'その他';

const EVENT_KIND_ICONS: Record<string, string> = {
  旅行: '✈️',
  飲み会: '🍻',
  食事会: '🍽️',
  'BBQ・キャンプ': '🏕️',
  ゴルフ: '⛳',
};
export const EVENT_KINDS = Object.keys(EVENT_KIND_ICONS);
export const eventIcon = (kind: string): string => EVENT_KIND_ICONS[kind] ?? '🎉';

const ITEM_CATEGORY_ICONS: Record<string, string> = {
  '食事・飲み会': '🍽️',
  宿泊: '🏨',
  交通: '🚃',
  '観光・レジャー': '🎡',
  買い物: '🛍️',
};
export const ITEM_CATEGORIES = Object.keys(ITEM_CATEGORY_ICONS);

export function itemLabel(item: Item): string {
  if (item.kind === 'gasoline') return '⛽ ガソリン代';
  if (item.kind === 'etc') return '🛣️ ETC';
  const category = item.category ?? OTHER;
  return `${ITEM_CATEGORY_ICONS[category] ?? '✏️'} ${category}`;
}

const MEMBER_COLORS = ['#0ea5e9', '#f97316', '#22c55e', '#e11d48', '#a855f7', '#eab308', '#14b8a6', '#64748b'];
export const memberColor = (index: number): string => MEMBER_COLORS[index % MEMBER_COLORS.length];

export const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** 入力欄の文字列を数値にする。空欄は undefined */
export function toNum(s: string): number | undefined {
  if (s.trim() === '') return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}
