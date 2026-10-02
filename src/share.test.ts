import { describe, expect, it } from 'vitest';
import {
  checkPaypayLink,
  lineShareUrl,
  memberPaypayLink,
  receiverText,
  smsShareUrl,
  transferKey,
  transferText,
  usableLink,
  withPaypayLink,
} from './share';

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

describe('usableLink', () => {
  it('https のリンクだけ返す', () => {
    expect(usableLink(' https://qr.paypay.ne.jp/abc ')).toBe('https://qr.paypay.ne.jp/abc');
    expect(usableLink('http://qr.paypay.ne.jp/abc')).toBe('');
    expect(usableLink(undefined)).toBe('');
  });
});

describe('transferKey', () => {
  it('金額が変わると別のキーになる', () => {
    expect(transferKey({ from: 'a', to: 'b', amount: 1000 })).toBe('a>b:1000');
    expect(transferKey({ from: 'a', to: 'b', amount: 1200 })).not.toBe(transferKey({ from: 'a', to: 'b', amount: 1000 }));
  });
});

describe('memberPaypayLink', () => {
  const remembered = { けん: 'https://qr.paypay.ne.jp/ken' };

  it('このイベントで入れたリンクを優先する', () => {
    expect(memberPaypayLink({ id: 'm1', nickname: 'けん', paypayLink: 'https://qr.paypay.ne.jp/new' }, remembered)).toBe(
      'https://qr.paypay.ne.jp/new',
    );
  });

  it('入れていなければ、前に同じ名前で入れたリンクを使う', () => {
    expect(memberPaypayLink({ id: 'm1', nickname: ' けん ' }, remembered)).toBe('https://qr.paypay.ne.jp/ken');
    expect(memberPaypayLink({ id: 'm2', nickname: 'あや' }, remembered)).toBe('');
  });

  it('このイベントで消したら、前のリンクは使わない', () => {
    expect(memberPaypayLink({ id: 'm1', nickname: 'けん', paypayLink: '' }, remembered)).toBe('');
  });
});

describe('transferText', () => {
  it('送る相手・金額と、受け取る人のリンクを入れる', () => {
    expect(transferText('九州旅行', 'ゆう', 'けん', 13500, 'https://qr.paypay.ne.jp/ken')).toBe(
      '【九州旅行】精算のお願い\nゆうさん → けんさん：13,500円\n\nPayPayで送る場合はこちら（けんさんの受け取りリンク）：\nhttps://qr.paypay.ne.jp/ken',
    );
  });

  it('リンクがなければ添えない', () => {
    expect(transferText('九州旅行', 'ゆう', 'けん', 13500, '')).toBe('【九州旅行】精算のお願い\nゆうさん → けんさん：13,500円');
  });
});

describe('receiverText', () => {
  it('リンクがなければ、受け取る人に自分でリンクを作って送るよう頼む', () => {
    expect(receiverText('九州旅行', 'ゆう', 'けん', 10000, '')).toBe(
      '【九州旅行】精算のお知らせ\nけんさんは、ゆうさんから 10,000円 を受け取ります。\nPayPayアプリの「受け取る」で受け取りリンクを作って、ゆうさんに送ってください。',
    );
  });

  it('リンクを入れてあれば、払う人への連絡に入れたと伝える', () => {
    expect(receiverText('九州旅行', 'ゆう', 'けん', 10000, 'https://qr.paypay.ne.jp/ken')).toBe(
      '【九州旅行】精算のお知らせ\nけんさんは、ゆうさんから 10,000円 を受け取ります。\nPayPayの受け取りリンクは、ゆうさんへの連絡に入れてあります。',
    );
  });
});

