// 割り勘結果の共有(LINE・SMS)と、PayPayの受け取りリンクの扱い

import { yen } from './format';
import type { Member, Transfer, WarikanEvent } from './types';

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

/** 文に添えられるリンク(https のリンク)なら前後の空白を取って返す。使えなければ空 */
export function usableLink(link: string | undefined): string {
  const check = checkPaypayLink(link ?? '');
  return check === 'paypay' || check === 'other' ? link!.trim() : '';
}

/** 精算の送金1件を見分けるキー。金額が変わったら別の送金として扱う(精算済の印が外れる) */
export const transferKey = (t: Transfer): string => `${t.from}>${t.to}:${t.amount}`;

/**
 * メンバーのPayPay受け取りリンク。このイベントで入れていなければ、前に同じ名前で入れたものを使う。
 * それもなければ fallback(幹事なら設定に登録した幹事のリンク)
 */
export function memberPaypayLink(member: Member | undefined, remembered: Record<string, string> = {}, fallback = ''): string {
  if (!member) return '';
  return member.paypayLink ?? remembered[member.nickname.trim()] ?? fallback;
}

/** 払う人1人に送る文。受け取る人のリンクがあれば添え、なければ送り先を幹事に聞くよう伝える */
export function transferText(eventName: string, from: string, to: string, amount: number, link: string, organizer: string): string {
  const lines = [`【${eventName}】精算のお願い`, `${from}さん → ${to}さん：${yen(amount)}`, ''];
  const url = usableLink(link);
  if (url) lines.push(`PayPayで送る場合はこちら（${to}さんの受け取りリンク）：`, url);
  else lines.push(`PayPayの送り先がわからない場合は、幹事の${organizer}さんに連絡してください。`);
  return lines.join('\n');
}

export type Payment = { name: string; amount: number };

/** イベントの幹事のメンバーID。未設定や、その人がもういなければ1人目 */
export function organizerIdOf(event: WarikanEvent): string {
  return event.members.some((m) => m.id === event.organizerId) ? event.organizerId! : (event.members[0]?.id ?? '');
}

/** 受け取る人1人に、PayPayの受け取りリンクを作って幹事に送るよう頼む文 */
export function receiverText(eventName: string, to: string, from: Payment[], organizer: string): string {
  const total = from.reduce((a, p) => a + p.amount, 0);
  return [
    `【${eventName}】PayPayの受け取りリンクのお願い`,
    `${to}さんは、${from.map((p) => `${p.name}さん`).join('・')}から 合計 ${yen(total)} を受け取ります。`,
    `PayPayアプリの「受け取る」で受け取りリンクを作って、幹事の${organizer}さんに送ってください。${organizer}さんから、払う人に伝えます。`,
  ].join('\n');
}

/** 受け取る人みんなに(グループのLINEなどで)まとめて、受け取りリンクを幹事に送るよう頼む文 */
export function collectLinksText(eventName: string, receivers: Payment[], organizer: string): string {
  return [
    `【${eventName}】PayPayの受け取りリンクのお願い`,
    `精算でお金を受け取る人は、PayPayアプリの「受け取る」で受け取りリンクを作って、幹事の${organizer}さんに送ってください。`,
    '',
    ...receivers.map((r) => `・${r.name}さん（${yen(r.amount)} 受け取り）`),
  ].join('\n');
}
