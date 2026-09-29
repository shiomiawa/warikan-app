import type { Currency, Etc, Gasoline, Item, Rates, Transfer, WarikanEvent } from './types';

export type EtcStatus = 'none' | 'estimated' | 'confirmed';

/** 為替レートの初期値(目安)。1通貨単位あたりの円 */
export const DEFAULT_RATES: Rates = { JPY: 1, USD: 150, KRW: 0.11 };

export function eventRates(event: Pick<WarikanEvent, 'rates'>): Rates {
  return { ...DEFAULT_RATES, ...event.rates, JPY: 1 };
}

export function etcStatus(etc: Etc): EtcStatus {
  if (etc.confirmed != null) return 'confirmed';
  if (etc.estimated != null) return 'estimated';
  return 'none';
}

export function gasolineDistance(g: Gasoline): number {
  if (g.inputMode === 'odometer') return Math.max(0, (g.odoEnd ?? 0) - (g.odoStart ?? 0));
  return Math.max(0, g.distanceKm ?? 0);
}

/** 項目の通貨。ガソリン・ETCは常に円 */
export function itemCurrency(item: Item): Currency {
  return item.kind === 'normal' ? (item.currency ?? 'JPY') : 'JPY';
}

/** 項目の金額(項目の通貨のまま) */
export function itemOriginalAmount(item: Item): number {
  if (item.kind === 'gasoline' && item.gasoline) {
    const g = item.gasoline;
    if (g.fuelEconomy <= 0) return 0;
    return Math.round((gasolineDistance(g) / g.fuelEconomy) * g.unitPrice);
  }
  if (item.kind === 'etc' && item.etc) {
    return item.etc.confirmed ?? item.etc.estimated ?? 0;
  }
  return item.amount;
}

/** 精算に使う金額(円・整数) */
export function itemAmount(item: Item, rates: Rates = DEFAULT_RATES): number {
  return Math.round(itemOriginalAmount(item) * rates[itemCurrency(item)]);
}

/** 金額指定のとき、項目金額と入力合計の差(項目の通貨、0なら一致)。金額指定でなければ null */
export function amountSplitDiff(item: Item): number | null {
  if (item.split.mode !== 'amount') return null;
  const sum = Object.values(item.split.amounts).reduce((a, b) => a + b, 0);
  // 小数(ドル)の誤差を消し、-0 を 0 にそろえる
  return Math.round((itemOriginalAmount(item) - sum) * 100) / 100 || 0;
}

/** 100%を人数で均等に分ける(余りは先頭から1%ずつ) */
export function equalPercents(ids: string[]): Record<string, number> {
  if (ids.length === 0) return {};
  const base = Math.floor(100 / ids.length);
  let rest = 100 - base * ids.length;
  return Object.fromEntries(ids.map((id) => [id, base + (rest-- > 0 ? 1 : 0)]));
}

/** 比率を合計100の整数パーセントに直す(端数は小数部の大きい人から1%ずつ) */
export function toPercents(ratios: Record<string, number>, ids: string[]): Record<string, number> {
  const raw = ids.map((id) => ({ id, v: Math.max(0, ratios[id] ?? 0) }));
  const total = raw.reduce((a, r) => a + r.v, 0);
  if (total <= 0) return equalPercents(ids);
  const exact = raw.map((r) => ({ id: r.id, v: (r.v * 100) / total }));
  const result: Record<string, number> = Object.fromEntries(exact.map((r) => [r.id, Math.floor(r.v + 1e-9)]));
  let rest = 100 - Object.values(result).reduce((a, b) => a + b, 0);
  exact.sort((a, b) => (b.v - Math.floor(b.v)) - (a.v - Math.floor(a.v)));
  for (const r of exact) {
    if (rest <= 0) break;
    result[r.id] += 1;
    rest -= 1;
  }
  return result;
}

/**
 * 項目ごとの各人の負担額(円)。合計は必ず項目金額(円)と一致する。
 * 立て替え者以外は端数処理の単位で切り上げ、余りは立て替え者が負担する。
 * 立て替え者が対象外のときは、立て替え者の持ち出しを避けるため切り捨てにする。
 */
export function itemShares(item: Item, event: WarikanEvent): Record<string, number> {
  const { members, rounding } = event;
  const rates = eventRates(event);
  const amount = itemAmount(item, rates);
  const shares: Record<string, number> = Object.fromEntries(members.map((m) => [m.id, 0]));
  const payerIn = item.payerId in shares;

  const split = item.split;
  if (split.mode === 'amount') {
    // 項目の通貨で入力された額を円に換算し、換算の端数は立て替え者に寄せる
    const rate = rates[itemCurrency(item)];
    let othersSum = 0;
    for (const m of members) {
      if (m.id === item.payerId) continue;
      const s = Math.round((split.amounts[m.id] ?? 0) * rate);
      shares[m.id] = s;
      othersSum += s;
    }
    if (payerIn) shares[item.payerId] = amount - othersSum;
    return shares;
  }

  const weights: Record<string, number> = Object.fromEntries(
    members.map((m) => [m.id, split.mode === 'ratio' ? Math.max(0, split.ratios[m.id] ?? 0) : 1]),
  );
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  if (total === 0 || amount === 0) return shares;

  const payerParticipates = (weights[item.payerId] ?? 0) > 0;
  let othersSum = 0;
  for (const m of members) {
    if (m.id === item.payerId || weights[m.id] === 0) continue;
    const unit = (amount * weights[m.id]) / total / rounding;
    // 浮動小数点の誤差で余計に切り上がらないよう、ごく小さい値を補正してから丸める
    const rounded = (payerParticipates ? Math.ceil(unit - 1e-9) : Math.floor(unit + 1e-9)) * rounding;
    shares[m.id] = rounded;
    othersSum += rounded;
  }
  if (payerIn) shares[item.payerId] = amount - othersSum;
  return shares;
}

export type MemberSummary = {
  paid: number; // 立て替えた合計
  share: number; // 負担の合計
  balance: number; // 収支 = 立て替え − 負担 (正=受け取る、負=払う)
};

export function summarize(event: WarikanEvent): Record<string, MemberSummary> {
  const rates = eventRates(event);
  const result: Record<string, MemberSummary> = Object.fromEntries(
    event.members.map((m) => [m.id, { paid: 0, share: 0, balance: 0 }]),
  );
  for (const item of event.items) {
    if (item.payerId in result) result[item.payerId].paid += itemAmount(item, rates);
    for (const [id, s] of Object.entries(itemShares(item, event))) result[id].share += s;
  }
  for (const s of Object.values(result)) s.balance = s.paid - s.share;
  return result;
}

/** 各人の収支 (正=受け取る、負=払う) */
export function balances(event: WarikanEvent): Record<string, number> {
  return Object.fromEntries(Object.entries(summarize(event)).map(([id, s]) => [id, s.balance]));
}

/** 受け取る人と払う人を大きい順に組み合わせ、送金回数が少なくなるように相殺する */
export function settle(bal: Record<string, number>): Transfer[] {
  const creditors = Object.entries(bal).filter(([, v]) => v > 0).map(([id, v]) => ({ id, v }));
  const debtors = Object.entries(bal).filter(([, v]) => v < 0).map(([id, v]) => ({ id, v: -v }));
  const transfers: Transfer[] = [];
  while (creditors.length && debtors.length) {
    creditors.sort((a, b) => b.v - a.v);
    debtors.sort((a, b) => b.v - a.v);
    const c = creditors[0];
    const d = debtors[0];
    const amount = Math.min(c.v, d.v);
    transfers.push({ from: d.id, to: c.id, amount });
    c.v -= amount;
    d.v -= amount;
    if (c.v === 0) creditors.shift();
    if (d.v === 0) debtors.shift();
  }
  return transfers;
}
