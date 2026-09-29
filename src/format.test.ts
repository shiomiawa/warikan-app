import { describe, expect, it } from 'vitest';
import { normalizeNumber } from './format';

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
