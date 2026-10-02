import { yen } from '../format';
import {
  checkPaypayLink,
  lineShareUrl,
  memberPaypayLink,
  receiverText,
  smsShareUrl,
  transferKey,
  transferText,
} from '../share';
import { playCoinSound } from '../sound';
import type { Transfer, WarikanEvent } from '../types';
import MemberName from './MemberName';

type Props = {
  event: WarikanEvent;
  transfers: Transfer[];
  onChange: (e: WarikanEvent) => void;
  /** メンバーの名前 → PayPay受け取りリンク(次のイベントでも引き継ぐ) */
  paypayLinks: Record<string, string>;
  onChangePaypayLinks: (links: Record<string, string>) => void;
};

/**
 * 払う人1人ずつに、送る相手・金額・受け取る人のPayPayリンクを LINE・SMS で送る。
 * 受け取る人には、自分で受け取りリンクを作って払う人に送るよう頼む文を送れる(幹事がリンクを知らなくてよい)。
 * 送金が済んだら「精算済」にして、グレーで表示する。
 */
export default function SendList({ event, transfers, onChange, paypayLinks, onChangePaypayLinks }: Props) {
  const member = (id: string) => event.members.find((m) => m.id === id);
  const nick = (id: string) => member(id)?.nickname ?? '?';
  const linkOf = (id: string) => memberPaypayLink(member(id), paypayLinks);
  const receivers = [...new Set(transfers.map((t) => t.to))];
  const paid = new Set(event.paidTransfers ?? []);

  // このイベントのメンバーに保存し、名前でも覚えておいて次のイベントで引き継ぐ
  const setLink = (id: string, link: string) => {
    onChange({ ...event, members: event.members.map((m) => (m.id === id ? { ...m, paypayLink: link } : m)) });
    const name = nick(id).trim();
    const rest = Object.fromEntries(Object.entries(paypayLinks).filter(([n]) => n !== name));
    onChangePaypayLinks(link.trim() ? { ...rest, [name]: link.trim() } : rest);
  };

  // 今の精算表にない送金の印は、ついでに捨てる(項目を変えて金額が変わった場合など)
  const togglePaid = (t: Transfer) => {
    const key = transferKey(t);
    const current = transfers.map(transferKey).filter((k) => paid.has(k));
    const next = paid.has(key) ? current.filter((k) => k !== key) : [...current, key];
    if (!paid.has(key)) playCoinSound();
    onChange({ ...event, paidTransfers: next });
  };

  return (
    <div className="send-list">
      <h3 className="send-title">📨 1人ずつ送る</h3>
      <p className="muted">
        送金ごとに、払う人と受け取る人のそれぞれに LINE・SMS で連絡できます。受け取る人の PayPay リンクを知っていれば入れておくと、払う人への文に添えます。知らなければ、受け取る人に「リンクを作って払う人に送って」と頼む文を送れます。
      </p>

      {receivers.map((id) => {
        const link = linkOf(id);
        const check = checkPaypayLink(link);
        return (
          <label key={id} className="receiver-link">
            <span className="receiver-link-name">
              <MemberName members={event.members} id={id} />
              さんの PayPay 受け取りリンク（任意）
            </span>
            <input
              type="url"
              inputMode="url"
              value={link}
              onChange={(e) => setLink(id, e.target.value)}
              placeholder="https://qr.paypay.ne.jp/…"
            />
            {check === 'invalid' && <span className="route-error">https:// で始まるリンクを貼ってください。</span>}
            {check === 'other' && <span className="warn">PayPayのリンクではないようです。貼ったリンクを確認してください。</span>}
          </label>
        );
      })}

      <ul className="send-rows">
        {transfers.map((t) => {
          const done = paid.has(transferKey(t));
          const toPayer = transferText(event.name, nick(t.from), nick(t.to), t.amount, linkOf(t.to));
          const toReceiver = receiverText(event.name, nick(t.from), nick(t.to), t.amount, linkOf(t.to));
          return (
            <li key={transferKey(t)} className={done ? 'settled' : undefined}>
              <div className="send-who">
                <MemberName members={event.members} id={t.from} />
                <span className="arrow">→</span>
                <MemberName members={event.members} id={t.to} />
                <strong className="send-amount">{yen(t.amount)}</strong>
                {done && <span className="settled-label">精算済</span>}
              </div>
              {[
                { label: `${nick(t.from)}さんへ（払う人）`, text: toPayer },
                { label: `${nick(t.to)}さんへ（受け取る人）`, text: toReceiver },
              ].map(({ label, text }) => (
                <div key={label} className="send-actions">
                  <span className="send-to">{label}</span>
                  <a className="share line" href={lineShareUrl(text)} target="_blank" rel="noreferrer">
                    LINE
                  </a>
                  <a className="share sms" href={smsShareUrl(text)}>
                    SMS
                  </a>
                </div>
              ))}
              <button type="button" className={`share wide settle-toggle${done ? ' on' : ''}`} onClick={() => togglePaid(t)}>
                {done ? '✓ 精算済' : '精算済にする'}
              </button>
            </li>
          );
        })}
      </ul>
      {transfers.length > 0 && transfers.every((t) => paid.has(transferKey(t))) && (
        <p className="done">🎉 全員の精算が済みました</p>
      )}
    </div>
  );
}
