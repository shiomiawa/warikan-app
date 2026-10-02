import type { Currency, Item, Member } from './types';

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
  if (item.kind === 'etc') return '🛣️ 高速代';
  const category = item.category ?? OTHER;
  return `${ITEM_CATEGORY_ICONS[category] ?? '✏️'} ${category}`;
}

/**
 * 項目の表示名。詳細が空なら種類から自動で付ける。
 * ガソリン代・高速代は、分かっていれば区間も添える(例: ガソリン代（東京駅→箱根湯本駅 往復）)。
 */
export function itemTitle(item: Item): string {
  if (item.name.trim()) return item.name.trim();
  if (item.kind === 'gasoline') {
    const g = item.gasoline;
    const route = g?.inputMode === 'map' && g.from && g.to ? `${g.from}→${g.to}${g.roundTrip ? ' 往復' : ''}` : '';
    return route ? `ガソリン代（${route}）` : 'ガソリン代';
  }
  if (item.kind === 'etc') {
    const e = item.etc;
    const route = e?.mode === 'auto' && e.entryIc && e.exitIc ? `${e.entryIc}→${e.exitIc}` : '';
    return route ? `高速代（${route}）` : '高速代';
  }
  return item.category ?? OTHER;
}

export const MAX_MEMBERS = 10;

/**
 * メンバーのアバター(動物の絵文字と色)。赤系は避け、見分けやすい落ち着いた色にしている。
 * 文字色にも使うので、明るい背景で読める濃さにしている。
 */
export const AVATARS = [
  { emoji: '🐶', color: '#256b29' }, // 緑
  { emoji: '🐱', color: '#1565c0' }, // 青
  { emoji: '🐻', color: '#9a4d00' }, // オレンジ
  { emoji: '🐼', color: '#795548' }, // 茶
  { emoji: '🦊', color: '#006a5e' }, // 青緑
  { emoji: '🐰', color: '#303f9f' }, // 紺
  { emoji: '🐨', color: '#7d5d00' }, // からし
  { emoji: '🐸', color: '#536b17' }, // オリーブ
  { emoji: '🐵', color: '#4a616c' }, // 青灰
  { emoji: '🐧', color: '#6a4c93' }, // 紫
];

/** メンバーのアバター番号。古いデータで未設定なら並び順を使う */
export const avatarIndex = (m: Member, order: number): number => (m.avatar ?? order) % AVATARS.length;

export function memberAvatar(members: Member[], id: string) {
  const order = members.findIndex((m) => m.id === id);
  return AVATARS[order < 0 ? 0 : avatarIndex(members[order], order)];
}

/** まだ誰も使っていない最初のアバター番号 */
export function freeAvatar(members: Member[]): number {
  const used = new Set(members.map(avatarIndex));
  const free = AVATARS.findIndex((_, i) => !used.has(i));
  return free < 0 ? 0 : free;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** 今日の日付(YYYY-MM-DD、端末の時刻) */
export function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 'YYYY-MM-DD' → '10/3(土)' */
export function formatDate(date: string | undefined): string {
  if (!date) return '日付なし';
  const [y, m, d] = date.split('-').map(Number);
  const w = '日月火水木金土'[new Date(y, m - 1, d).getDay()];
  return `${m}/${d}(${w})`;
}

export const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/**
 * 数字の入力を半角にそろえる。全角数字・全角ピリオドを半角にし、カンマや数字以外を取り除く。
 * 小数を許すときは最初のピリオドだけ残す。
 */
export function normalizeNumber(s: string, allowDecimal: boolean): string {
  const half = s
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[．。]/g, '.');
  const digits = half.replace(allowDecimal ? /[^0-9.]/g : /[^0-9]/g, '');
  if (!allowDecimal) return digits;
  const dot = digits.indexOf('.');
  return dot < 0 ? digits : digits.slice(0, dot + 1) + digits.slice(dot + 1).replace(/\./g, '');
}

/** 入力欄の文字列を数値にする。空欄は undefined */
export function toNum(s: string): number | undefined {
  if (s.trim() === '') return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}
