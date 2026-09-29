// 割り勘結果の共有(LINE・SMS)と、PayPayの受け取りリンクの扱い

/** LINEの「送る」画面を開くURL(スマホではLINEアプリが開く) */
export const lineShareUrl = (text: string): string => `https://line.me/R/share?text=${encodeURIComponent(text)}`;

/** SMSの作成画面を開くURL。iPhone・Androidの両方で本文が入る書き方にしている */
export const smsShareUrl = (text: string): string => `sms:?&body=${encodeURIComponent(text)}`;

export type LinkCheck = 'empty' | 'paypay' | 'other' | 'invalid';

/** 貼り付けられたリンクの確認。https のURLだけをQRにし、PayPay以外なら注意を出す */
export function checkPaypayLink(link: string): LinkCheck {
  const s = link.trim();
  if (!s) return 'empty';
  let url: URL;
  try {
    url = new URL(s);
  } catch {
    return 'invalid';
  }
  if (url.protocol !== 'https:') return 'invalid';
  return url.hostname === 'paypay.ne.jp' || url.hostname.endsWith('.paypay.ne.jp') ? 'paypay' : 'other';
}

/** 共有する本文の最後に、PayPayの受け取りリンクを添える */
export function withPaypayLink(text: string, link: string | undefined): string {
  const check = checkPaypayLink(link ?? '');
  if (check !== 'paypay' && check !== 'other') return text;
  return `${text}\n\nPayPayで送る場合はこちら：\n${link!.trim()}`;
}
