import { describe, expect, it } from 'vitest';
import {
  balanceLabel,
  checkPaypayLink,
  collectLinksText,
  detailLines,
  lineShareUrl,
  memberPaypayLink,
  organizerIdOf,
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

  it('どちらもなければ fallback(幹事のリンク)を使う', () => {
    expect(memberPaypayLink({ id: 'm2', nickname: 'あや' }, remembered, 'https://qr.paypay.ne.jp/aya')).toBe(
      'https://qr.paypay.ne.jp/aya',
    );
  });

  it('このイベントで消したら、前のリンクは使わない', () => {
    expect(memberPaypayLink({ id: 'm1', nickname: 'けん', paypayLink: '' }, remembered)).toBe('');
  });
});

describe('transferText', () => {
  it('送る相手・金額と、受け取る人のリンクを入れる', () => {
    expect(transferText('九州旅行', 'ゆう', 'けん', 13500, 'https://qr.paypay.ne.jp/ken', 'あや')).toBe(
      '【九州旅行】精算のお願い\nゆうさん → けんさん：13,500円\n\nPayPayで送る場合はこちら（けんさんの受け取りリンク）：\nhttps://qr.paypay.ne.jp/ken',
    );
  });

  it('リンクがなければ、送り先を幹事に聞くよう伝える', () => {
    expect(transferText('九州旅行', 'ゆう', 'けん', 13500, '', 'あや')).toBe(
      '【九州旅行】精算のお願い\nゆうさん → けんさん：13,500円\n\nPayPayの送り先がわからない場合は、幹事のあやさんに連絡してください。',
    );
  });
});

describe('receiverText', () => {
  it('受け取る合計と払う人を伝え、リンクを幹事に送るよう頼む', () => {
    expect(
      receiverText('九州旅行', 'けん', [{ name: 'ゆう', amount: 1000 }, { name: 'さき', amount: 1500 }], 'あや'),
    ).toBe(
      '【九州旅行】PayPayの受け取りリンクのお願い\nけんさんは、ゆうさん・さきさんから 合計 2,500円 を受け取ります。\nPayPayアプリの「受け取る」で受け取りリンクを作って、幹事のあやさんに送ってください。あやさんから、払う人に伝えます。',
    );
  });
});

describe('collectLinksText', () => {
  it('受け取る人と金額を並べて、まとめて頼む', () => {
    expect(collectLinksText('九州旅行', [{ name: 'けん', amount: 2500 }, { name: 'ゆう', amount: 800 }], 'あや')).toBe(
      '【九州旅行】PayPayの受け取りリンクのお願い\n精算でお金を受け取る人は、PayPayアプリの「受け取る」で受け取りリンクを作って、幹事のあやさんに送ってください。\n\n・けんさん（2,500円 受け取り）\n・ゆうさん（800円 受け取り）',
    );
  });
});

describe('organizerIdOf', () => {
  const event = (organizerId?: string) => ({
    id: 'e',
    name: '',
    kind: '旅行',
    rounding: 1 as const,
    members: [
      { id: 'a', nickname: 'あや' },
      { id: 'b', nickname: 'けん' },
    ],
    items: [],
    organizerId,
  });

  it('選んだ幹事を返す', () => {
    expect(organizerIdOf(event('b'))).toBe('b');
  });

  it('未設定や、もういないメンバーなら1人目', () => {
    expect(organizerIdOf(event())).toBe('a');
    expect(organizerIdOf(event('x'))).toBe('a');
  });
});

describe('detailLines', () => {
  it('項目ごとの明細と、各人の収支を並べる', () => {
    expect(
      detailLines(
        [
          { date: '9/30(水)', title: '宿泊', amount: 40000, payer: 'けん' },
          { date: '9/29(火)', title: '食事', amount: 3000, original: '$20.00', payer: 'あや' },
        ],
        [
          { name: 'あや', paid: 3000, share: 21500, balance: -18500 },
          { name: 'けん', paid: 40000, share: 21500, balance: 18500 },
        ],
      ),
    ).toEqual([
      '■ 明細',
      '9/30(水) 宿泊：40,000円（けんが立て替え）',
      '9/29(火) 食事：$20.00＝3,000円（あやが立て替え）',
      '',
      '■ 各人の収支',
      'あや：立て替え 3,000円／負担 21,500円 → 18,500円 払う',
      'けん：立て替え 40,000円／負担 21,500円 → 18,500円 受け取る',
    ]);
  });
});

describe('balanceLabel', () => {
  it('受け取る・払う・±0', () => {
    expect(balanceLabel(1000)).toBe('1,000円 受け取る');
    expect(balanceLabel(-1000)).toBe('1,000円 払う');
    expect(balanceLabel(0)).toBe('±0');
  });
});

