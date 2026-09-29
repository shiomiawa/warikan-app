import { describe, expect, it } from 'vitest';
import { amountKey, odometerWarning, rangeWarning } from './checks';

describe('rangeWarning', () => {
  it('ふつうの範囲なら注意しない', () => {
    expect(rangeWarning('fuelEconomy', 15)).toBeNull();
    expect(rangeWarning('unitPrice', 175)).toBeNull();
    expect(rangeWarning(amountKey('USD'), 120.5)).toBeNull();
  });

  it('未入力や0は注意しない(必須チェックは別で行う)', () => {
    expect(rangeWarning('fuelEconomy', undefined)).toBeNull();
    expect(rangeWarning('fuelEconomy', 0)).toBeNull();
  });

  it('大きく外れた値は範囲を添えて注意する', () => {
    expect(rangeWarning('fuelEconomy', 150)).toBe(
      '燃費 150km/L は、ふつうの範囲（3〜40km/L）から大きく外れています。入力を確認してください。',
    );
    expect(rangeWarning('unitPrice', 17)).not.toBeNull();
    expect(rangeWarning(amountKey('JPY'), 12000000)).not.toBeNull();
    expect(rangeWarning('rateKRW', 11)).not.toBeNull();
  });
});

describe('odometerWarning', () => {
  it('到着時が出発時以下なら注意する', () => {
    expect(odometerWarning(10150, 10000)).not.toBeNull();
    expect(odometerWarning(10000, 10000)).not.toBeNull();
  });

  it('差がふつうの距離なら注意しない', () => {
    expect(odometerWarning(10000, 10150)).toBeNull();
    expect(odometerWarning(undefined, 10150)).toBeNull();
  });
});
