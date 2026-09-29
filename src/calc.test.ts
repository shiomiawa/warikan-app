import { describe, expect, it } from 'vitest';
import {
  amountSplitDiff,
  balances,
  equalPercents,
  itemAmount,
  itemShares,
  quickSplit,
  settle,
  sortItemsNewestFirst,
  summarize,
  toPercents,
  tollEstimate,
  withMembers,
} from './calc';
import type { Item, Rounding, WarikanEvent } from './types';

const members = [
  { id: 'A', nickname: 'A' },
  { id: 'B', nickname: 'B' },
  { id: 'C', nickname: 'C' },
];

const ev = (rounding: Rounding, items: Item[] = [], rates?: WarikanEvent['rates']): WarikanEvent => ({
  id: 'e', name: 'x', kind: '旅行', rounding, rates, members, items,
});

const normal = (id: string, amount: number, payerId: string, split: Item['split'], currency?: Item['currency']): Item => ({
  id, name: id, kind: 'normal', payerId, amount, split, currency,
});

describe('itemShares', () => {
  it('均等割りで端数は立て替え者が負担する', () => {
    const s = itemShares(normal('x', 1000, 'A', { mode: 'equal' }), ev(1));
    expect(s).toEqual({ A: 332, B: 334, C: 334 });
    expect(s.A + s.B + s.C).toBe(1000);
  });

  it('100円単位で切り上げ、余りは立て替え者に寄せる', () => {
    const s = itemShares(normal('x', 1000, 'A', { mode: 'equal' }), ev(100));
    expect(s).toEqual({ A: 200, B: 400, C: 400 });
  });

  it('比率指定: 70%・30%・0%', () => {
    const s = itemShares(normal('x', 3000, 'A', { mode: 'ratio', ratios: { A: 70, B: 30, C: 0 } }), ev(1));
    expect(s).toEqual({ A: 2100, B: 900, C: 0 });
  });

  it('立て替え者が対象外なら切り捨てて、余りは立て替え者が負担する', () => {
    const s = itemShares(normal('x', 1000, 'A', { mode: 'ratio', ratios: { A: 0, B: 50, C: 50 } }), ev(100));
    expect(s).toEqual({ A: 0, B: 500, C: 500 });
    const t = itemShares(normal('x', 1000, 'A', { mode: 'ratio', ratios: { A: 0, B: 33, C: 67 } }), ev(100));
    expect(t.A + t.B + t.C).toBe(1000);
    expect(t.A).toBeGreaterThanOrEqual(0);
  });

  it('金額指定はそのまま使う', () => {
    const s = itemShares(normal('x', 1000, 'A', { mode: 'amount', amounts: { A: 500, B: 300, C: 200 } }), ev(1));
    expect(s).toEqual({ A: 500, B: 300, C: 200 });
  });
});

describe('外貨', () => {
  it('ドルはイベントのレートで円に換算する', () => {
    const item = normal('x', 100, 'A', { mode: 'equal' }, 'USD');
    expect(itemAmount(item, { JPY: 1, USD: 150, KRW: 0.1 })).toBe(15000);
    expect(itemShares(item, ev(1, [], { USD: 150 }))).toEqual({ A: 5000, B: 5000, C: 5000 });
  });

  it('ウォンは円に換算して四捨五入する', () => {
    const item = normal('x', 30000, 'A', { mode: 'equal' }, 'KRW');
    expect(itemAmount(item, { JPY: 1, USD: 150, KRW: 0.11 })).toBe(3300);
  });

  it('金額指定(ドル)は各人の額を換算し、換算の端数は立て替え者に寄せる', () => {
    const item = normal('x', 100, 'A', { mode: 'amount', amounts: { A: 50, B: 30.5, C: 19.5 } }, 'USD');
    expect(amountSplitDiff(item)).toBe(0);
    expect(itemShares(item, ev(1, [], { USD: 150 }))).toEqual({ A: 7500, B: 4575, C: 2925 });
  });

  it('小数の誤差があっても金額指定の差は0になる', () => {
    const item = normal('x', 0.3, 'A', { mode: 'amount', amounts: { A: 0.1, B: 0.2 } }, 'USD');
    expect(amountSplitDiff(item)).toBe(0);
  });
});

describe('パーセント', () => {
  it('均等に分けると合計100%になる', () => {
    expect(equalPercents(['A', 'B', 'C'])).toEqual({ A: 34, B: 33, C: 33 });
  });

  it('以前の比率(7:3:0)をパーセントに直す', () => {
    expect(toPercents({ A: 7, B: 3, C: 0 }, ['A', 'B', 'C'])).toEqual({ A: 70, B: 30, C: 0 });
    const p = toPercents({ A: 1, B: 1, C: 1 }, ['A', 'B', 'C']);
    expect(p.A + p.B + p.C).toBe(100);
  });
});

describe('quickSplit', () => {
  it('割り切れるときは全員同額', () => {
    expect(quickSplit(9000, 3, 1)).toEqual({ perPerson: 3000, organizer: 3000 });
  });

  it('端数は切り上げ、余りは幹事が負担する', () => {
    expect(quickSplit(10000, 3, 1)).toEqual({ perPerson: 3334, organizer: 3332 });
    expect(quickSplit(10000, 3, 100)).toEqual({ perPerson: 3400, organizer: 3200 });
  });

  it('少額で幹事がマイナスになるときは切り捨てる', () => {
    expect(quickSplit(150, 3, 100)).toEqual({ perPerson: 0, organizer: 150 });
    expect(quickSplit(250, 3, 100)).toEqual({ perPerson: 100, organizer: 50 });
  });

  it('人数が2人未満や金額が0なら計算しない', () => {
    expect(quickSplit(1000, 1, 1)).toBeNull();
    expect(quickSplit(0, 3, 1)).toBeNull();
  });
});

describe('withMembers', () => {
  it('いなくなったメンバーを比率・金額の指定から取り除く', () => {
    const event = ev(1, [
      normal('r', 1000, 'A', { mode: 'ratio', ratios: { A: 50, B: 30, C: 20 } }),
      normal('m', 1000, 'A', { mode: 'amount', amounts: { A: 500, B: 300, C: 200 } }),
    ]);
    const next = withMembers(event, members.slice(0, 2));
    expect(next.members.map((m) => m.id)).toEqual(['A', 'B']);
    expect(next.items[0].split).toEqual({ mode: 'ratio', ratios: { A: 50, B: 30 } });
    expect(next.items[1].split).toEqual({ mode: 'amount', amounts: { A: 500, B: 300 } });
  });
});

describe('並べ替え', () => {
  it('新しい日付が上、同じ日は後から追加した順、日付なしは一番下', () => {
    const item = (id: string, date?: string): Item => ({ ...normal(id, 100, 'A', { mode: 'equal' }), date });
    const sorted = sortItemsNewestFirst([
      item('old', '2026-10-01'),
      item('none'),
      item('new', '2026-10-03'),
      item('mid1', '2026-10-02'),
      item('mid2', '2026-10-02'),
    ]);
    expect(sorted.map((i) => i.id)).toEqual(['new', 'mid2', 'mid1', 'old', 'none']);
  });
});

describe('itemAmount', () => {
  const base = { id: 'g', name: 'g', payerId: 'A', amount: 0, split: { mode: 'equal' } as const };

  it('ガソリン: 距離÷燃費×単価', () => {
    const item: Item = { ...base, kind: 'gasoline', gasoline: { inputMode: 'distance', distanceKm: 300, fuelEconomy: 15, unitPrice: 170 } };
    expect(itemAmount(item)).toBe(3400);
  });

  it('ガソリン: オドメーターの差', () => {
    const item: Item = { ...base, kind: 'gasoline', gasoline: { inputMode: 'odometer', odoStart: 10000, odoEnd: 10150, fuelEconomy: 10, unitPrice: 170 } };
    expect(itemAmount(item)).toBe(2550);
  });

  it('ガソリン: 地図の距離は往復なら2倍', () => {
    const g = { inputMode: 'map' as const, distanceKm: 150, fuelEconomy: 10, unitPrice: 170 };
    expect(itemAmount({ ...base, kind: 'gasoline', gasoline: g })).toBe(2550);
    expect(itemAmount({ ...base, kind: 'gasoline', gasoline: { ...g, roundTrip: true } })).toBe(5100);
  });

  const etc = { entryIc: '', exitIc: '', passedAt: '', vehicleClass: '普通車', discount: 'なし' };

  it('高速代(手入力): 入力した金額。旧データは確定額、なければ概算額', () => {
    expect(itemAmount({ ...base, kind: 'etc', etc: { ...etc, mode: 'manual', amount: 1500 } })).toBe(1500);
    expect(itemAmount({ ...base, kind: 'etc', etc: { ...etc, estimated: 1000 } })).toBe(1000);
    expect(itemAmount({ ...base, kind: 'etc', etc: { ...etc, estimated: 1000, confirmed: 1200 } })).toBe(1200);
    expect(itemAmount({ ...base, kind: 'etc', etc })).toBe(0);
  });

  it('高速代(自動計算): 金額欄の値を使い、古いデータで金額がなければ距離から計算する', () => {
    expect(itemAmount({ ...base, kind: 'etc', etc: { ...etc, mode: 'auto', distanceKm: 100, amount: 2800 } })).toBe(2800);
    expect(itemAmount({ ...base, kind: 'etc', etc: { ...etc, mode: 'auto', distanceKm: 100 } })).toBe(2871);
  });
});

describe('tollEstimate', () => {
  it('普通車100km: (150 + 24.6×100) × 1.1', () => {
    expect(tollEstimate(100, '普通車', 'なし')).toBe(2871);
  });

  it('長距離は100km超で25%、200km超で30%安くなる', () => {
    // 24.6 × (100 + 100×0.75 + 100×0.7) = 6027
    expect(tollEstimate(300, '普通車', 'なし')).toBe(Math.round((150 + 6027) * 1.1));
  });

  it('車種と割引を反映する', () => {
    expect(tollEstimate(100, '軽自動車等', 'なし')).toBe(Math.round(2610 * 0.8 * 1.1));
    expect(tollEstimate(100, '普通車', '休日割引')).toBe(Math.round(2871 * 0.7));
    expect(tollEstimate(0, '普通車', 'なし')).toBe(0);
  });
});

describe('精算', () => {
  it('指示書の動作確認例: 相殺後の金額が手計算と合う', () => {
    const event = ev(1, [
      normal('hotel', 30000, 'A', { mode: 'equal' }),
      normal('dinner', 9000, 'B', { mode: 'equal' }),
      normal('drink', 3000, 'A', { mode: 'ratio', ratios: { A: 70, B: 30, C: 0 } }),
    ]);
    // 負担: A=10000+3000+2100=15100, B=10000+3000+900=13900, C=10000+3000=13000
    // 立替: A=33000, B=9000
    expect(summarize(event)).toEqual({
      A: { paid: 33000, share: 15100, balance: 17900 },
      B: { paid: 9000, share: 13900, balance: -4900 },
      C: { paid: 0, share: 13000, balance: -13000 },
    });
    expect(settle(balances(event))).toEqual([
      { from: 'C', to: 'A', amount: 13000 },
      { from: 'B', to: 'A', amount: 4900 },
    ]);
  });

  it('送金回数が最少になる組み合わせを選ぶ', () => {
    expect(settle({ A: 500, B: 300, C: -500, D: -300 })).toEqual([
      { from: 'C', to: 'A', amount: 500 },
      { from: 'D', to: 'B', amount: 300 },
    ]);
  });

  it('収支の合計は0になる(外貨を含む)', () => {
    const event = ev(10, [
      normal('a', 12345, 'B', { mode: 'equal' }),
      normal('b', 999, 'C', { mode: 'ratio', ratios: { A: 33, B: 67, C: 0 } }),
      normal('c', 12.34, 'A', { mode: 'equal' }, 'USD'),
      normal('d', 45678, 'C', { mode: 'equal' }, 'KRW'),
    ], { USD: 147.25, KRW: 0.107 });
    expect(Object.values(balances(event)).reduce((a, b) => a + b, 0)).toBe(0);
  });
});
