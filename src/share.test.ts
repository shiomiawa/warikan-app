import { describe, expect, it } from 'vitest';
import { checkPaypayLink, lineShareUrl, smsShareUrl, withPaypayLink } from './share';

describe('共有URL', () => {
  it('本文をURLエンコードする', () => {
    expect(lineShareUrl('割り勘 1,000円')).toBe('https://line.me/R/share?text=%E5%89%B2%E3%82%8A%E5%8B%98%201%2C000%E5%86%86');
    expect(smsShareUrl('a&b\nc')).toBe('sms:?&body=a%26b%0Ac');
  });
});

describe('checkPaypayLink', () => {
  it('PayPayのhttpsリンクを受け付ける', () => {
    expect(checkPaypayLink('https://qr.paypay.ne.jp/abc123')).toBe('paypay');
    expect(checkPaypayLink('  https://paypay.ne.jp/x ')).toBe('paypay');
  });

  it('PayPay以外のhttpsリンクは other、httpsでないものは invalid', () => {
    expect(checkPaypayLink('https://example.com/pay')).toBe('other');
    expect(checkPaypayLink('https://paypay.ne.jp.example.com/x')).toBe('other');
    expect(checkPaypayLink('http://qr.paypay.ne.jp/abc')).toBe('invalid');
    expect(checkPaypayLink('javascript:alert(1)')).toBe('invalid');
    expect(checkPaypayLink('PayPayのリンク')).toBe('invalid');
    expect(checkPaypayLink('')).toBe('empty');
  });
});

describe('withPaypayLink', () => {
  it('有効なリンクだけを本文に添える', () => {
    expect(withPaypayLink('結果', 'https://qr.paypay.ne.jp/abc')).toBe(
      '結果\n\nPayPayで送る場合はこちら：\nhttps://qr.paypay.ne.jp/abc',
    );
    expect(withPaypayLink('結果', '')).toBe('結果');
    expect(withPaypayLink('結果', 'http://x')).toBe('結果');
  });
});
