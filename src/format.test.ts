import { describe, expect, it } from 'vitest';
import { itemTitle, normalizeNumber } from './format';
import type { Item } from './types';

describe('itemTitle', () => {
  const base: Item = { id: 'x', name: '', kind: 'normal', payerId: 'A', amount: 0, split: { mode: 'equal' } };

  it('詳細があれば詳細を使う', () => {
    expect(itemTitle({ ...base, name: ' ホテル雅 ', category: '宿泊' })).toBe('ホテル雅');
  });

  it('詳細が空なら種類名を使う', () => {
    expect(itemTitle({ ...base, category: '宿泊' })).toBe('宿泊');
    expect(itemTitle(base)).toBe('その他');
  });

  it('ガソリン代は地図の区間を添える', () => {
    const gasoline = { inputMode: 'map' as const, from: '東京駅', to: '箱根湯本駅', fuelEconomy: 15, unitPrice: 170 };
    expect(itemTitle({ ...base, kind: 'gasoline', gasoline })).toBe('ガソリン代（東京駅→箱根湯本駅）');
    expect(itemTitle({ ...base, kind: 'gasoline', gasoline: { ...gasoline, roundTrip: true } })).toBe(
      'ガソリン代（東京駅→箱根湯本駅 往復）',
    );
    expect(itemTitle({ ...base, kind: 'gasoline', gasoline: { ...gasoline, inputMode: 'distance' } })).toBe('ガソリン代');
  });

  it('高速代は自動計算のときICの区間を添える', () => {
    const etc = { entryIc: '東京IC', exitIc: '御殿場IC', passedAt: '', vehicleClass: '普通車', discount: 'なし' };
    expect(itemTitle({ ...base, kind: 'etc', etc: { ...etc, mode: 'auto' } })).toBe('高速代（東京IC→御殿場IC）');
    expect(itemTitle({ ...base, kind: 'etc', etc: { ...etc, mode: 'manual' } })).toBe('高速代');
  });
});

describe('normalizeNumber', () => {
  it('全角数字を半角にする', () => {
    expect(normalizeNumber('１２３４５', false)).toBe('12345');
  });

  it('カンマや単位などの文字を取り除く', () => {
    expect(normalizeNumber('12,000円', false)).toBe('12000');
    expect(normalizeNumber('１，５００', false)).toBe('1500');
  });

  it('小数を許すときはピリオドを1つだけ残す', () => {
    expect(normalizeNumber('１２．５', true)).toBe('12.5');
    expect(normalizeNumber('1.2.3', true)).toBe('1.23');
    expect(normalizeNumber('12.5', false)).toBe('125');
  });
});
