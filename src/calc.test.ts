import { describe, expect, it } from 'vitest';
import { balances, itemAmount, itemShares, settle } from './calc';
import type { Item, WarikanEvent } from './types';

const members = [
  { id: 'A', nickname: 'A' },
  { id: 'B', nickname: 'B' },
  { id: 'C', nickname: 'C' },
];

const normal = (id: string, amount: number, payerId: string, split: Item['split']): Item => ({
  id, name: id, kind: 'normal', payerId, amount, split,
});

describe('itemShares', () => {
  it('均等割りで端数は立て替え者が負担する', () => {
    const s = itemShares(normal('x', 1000, 'A', { mode: 'equal' }), members, 1);
    expect(s).toEqual({ A: 332, B: 334, C: 334 });
    expect(s.A + s.B + s.C).toBe(1000);
  });

  it('100円単位で切り上げ、余りは立て替え者に寄せる', () => {
    const s = itemShares(normal('x', 1000, 'A', { mode: 'equal' }), members, 100);
    expect(s).toEqual({ A: 200, B: 400, C: 400 });
  });

  it('比率指定: 7・3・0', () => {
    const s = itemShares(normal('x', 3000, 'A', { mode: 'ratio', ratios: { A: 7, B: 3, C: 0 } }), members, 1);
    expect(s).toEqual({ A: 2100, B: 900, C: 0 });
  });

  it('立て替え者が対象外なら切り捨てて、余りは立て替え者が負担する', () => {
    const s = itemShares(normal('x', 1000, 'A', { mode: 'ratio', ratios: { A: 0, B: 1, C: 1 } }), members, 100);
    expect(s).toEqual({ A: 0, B: 500, C: 500 });
    const t = itemShares(normal('x', 1000, 'A', { mode: 'ratio', ratios: { A: 0, B: 1, C: 2 } }), members, 100);
    expect(t.A + t.B + t.C).toBe(1000);
    expect(t.A).toBeGreaterThanOrEqual(0);
  });

  it('金額指定はそのまま使う', () => {
    const s = itemShares(normal('x', 1000, 'A', { mode: 'amount', amounts: { A: 500, B: 300, C: 200 } }), members, 1);
    expect(s).toEqual({ A: 500, B: 300, C: 200 });
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

  it('ETC: 確定額があれば確定額、なければ概算額', () => {
    const etc = { entryIc: '', exitIc: '', passedAt: '', vehicleClass: '普通車', discount: '' };
    expect(itemAmount({ ...base, kind: 'etc', etc: { ...etc, estimated: 1000 } })).toBe(1000);
    expect(itemAmount({ ...base, kind: 'etc', etc: { ...etc, estimated: 1000, confirmed: 1200 } })).toBe(1200);
    expect(itemAmount({ ...base, kind: 'etc', etc })).toBe(0);
  });
});

describe('精算', () => {
  it('指示書の動作確認例: 相殺後の金額が手計算と合う', () => {
    const event: WarikanEvent = {
      id: 'e', name: '旅行', kind: '旅行', rounding: 1, members,
      items: [
        normal('hotel', 30000, 'A', { mode: 'equal' }),
        normal('dinner', 9000, 'B', { mode: 'equal' }),
        normal('drink', 3000, 'A', { mode: 'ratio', ratios: { A: 7, B: 3, C: 0 } }),
      ],
    };
    // 負担: A=10000+3000+2100=15100, B=10000+3000+900=13900, C=10000+3000=13000
    // 立替: A=33000, B=9000
    const bal = balances(event);
    expect(bal).toEqual({ A: 17900, B: -4900, C: -13000 });
    expect(settle(bal)).toEqual([
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

  it('収支の合計は0になる', () => {
    const event: WarikanEvent = {
      id: 'e', name: 'x', kind: '', rounding: 10, members,
      items: [normal('a', 12345, 'B', { mode: 'equal' }), normal('b', 999, 'C', { mode: 'ratio', ratios: { A: 1, B: 2, C: 0 } })],
    };
    expect(Object.values(balances(event)).reduce((a, b) => a + b, 0)).toBe(0);
  });
});
