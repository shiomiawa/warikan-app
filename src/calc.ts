import type { Etc, Gasoline, Item, Member, Rounding, Transfer, WarikanEvent } from './types';

export type EtcStatus = 'none' | 'estimated' | 'confirmed';

export function etcStatus(etc: Etc): EtcStatus {
  if (etc.confirmed != null) return 'confirmed';
  if (etc.estimated != null) return 'estimated';
  return 'none';
}

export function gasolineDistance(g: Gasoline): number {
  if (g.inputMode === 'odometer') return Math.max(0, (g.odoEnd ?? 0) - (g.odoStart ?? 0));
  return Math.max(0, g.distanceKm ?? 0);
}

/** 項目の金額(円・整数)を確定する */
export function itemAmount(item: Item): number {
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

/** 金額指定のとき、項目金額と入力合計の差(0なら一致)。金額指定でなければ null */
export function amountSplitDiff(item: Item): number | null {
  if (item.split.mode !== 'amount') return null;
  const sum = Object.values(item.split.amounts).reduce((a, b) => a + b, 0);
  return itemAmount(item) - sum;
}

/**
 * 項目ごとの各人の負担額。合計は必ず項目金額と一致する。
 * 立て替え者以外は端数処理の単位で切り上げ、余りは立て替え者が負担する。
 * 立て替え者が対象外のときは、立て替え者の持ち出しを避けるため切り捨てにする。
 */
export function itemShares(item: Item, members: Member[], rounding: Rounding): Record<string, number> {
  const amount = itemAmount(item);
  const shares: Record<string, number> = Object.fromEntries(members.map((m) => [m.id, 0]));

  const split = item.split;
  if (split.mode === 'amount') {
    for (const m of members) shares[m.id] = split.amounts[m.id] ?? 0;
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
  if (item.payerId in shares) shares[item.payerId] = amount - othersSum;
  return shares;
}

/** 各人の収支 = 立て替え合計 − 負担合計 (正=受け取る、負=払う) */
export function balances(event: WarikanEvent): Record<string, number> {
  const result: Record<string, number> = Object.fromEntries(event.members.map((m) => [m.id, 0]));
  for (const item of event.items) {
    if (item.payerId in result) result[item.payerId] += itemAmount(item);
    const shares = itemShares(item, event.members, event.rounding);
    for (const [id, s] of Object.entries(shares)) result[id] -= s;
  }
  return result;
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
