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
  ショッピング: '🛍️',
  ドライブ: '🚗',
};
/** 選択肢からはずした種類。以前のイベントにはこのアイコンを出し続ける */
const OLD_EVENT_KIND_ICONS: Record<string, string> = {
  'BBQ・キャンプ': '🏕️',
  ゴルフ: '⛳',
};
export const EVENT_KINDS = Object.keys(EVENT_KIND_ICONS);
export const eventIcon = (kind: string): string => EVENT_KIND_ICONS[kind] ?? OLD_EVENT_KIND_ICONS[kind] ?? '🎉';

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

export const MAX_MEMBERS = 30;

/**
 * メンバーの色。赤系は避け、見分けやすい落ち着いた色にしている。
 * 文字色にも、白い頭文字をのせるバッジの背景にも使うので、明るい背景で読める濃さにしている。
 * 10人を超えたら同じ色をもう一度使う(頭文字で見分ける)。
 */
export const MEMBER_COLORS = [
  '#256b29', // 緑
  '#1565c0', // 青
  '#9a4d00', // オレンジ
  '#795548', // 茶
  '#006a5e', // 青緑
  '#303f9f', // 紺
  '#7d5d00', // からし
  '#536b17', // オリーブ
  '#4a616c', // 青灰
  '#6a4c93', // 紫
];

/** メンバーの色の番号(保存データの avatar)。古いデータで未設定なら並び順を使う */
export const colorIndex = (m: Member, order: number): number => (m.avatar ?? order) % MEMBER_COLORS.length;

export function memberColor(members: Member[], id: string): string {
  const order = members.findIndex((m) => m.id === id);
  return MEMBER_COLORS[order < 0 ? 0 : colorIndex(members[order], order)];
}

/** いちばん使われていない色の番号(同じ数なら番号の小さい方) */
export function freeColor(members: Member[]): number {
  const counts = MEMBER_COLORS.map(() => 0);
  members.forEach((m, i) => counts[colorIndex(m, i)]++);
  return counts.indexOf(Math.min(...counts));
}

/**
 * バッジに出す頭文字。名前の最初の1文字(英字は大文字)。
 * 仮の名前(メンバー12)やクイック割り勘の「2人目」は頭文字がそろうので番号にする。
 */
export function memberInitial(nickname: string): string {
  const name = nickname.trim();
  const numbered = name.match(/^メンバー(\d+)$/) ?? name.match(/^(\d+)人目$/);
  if (numbered) return numbered[1];
  const first = Array.from(name)[0];
  return first ? first.toUpperCase() : '?';
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
