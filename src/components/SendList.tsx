import { yen } from '../format';
import {
  checkPaypayLink,
  collectLinksText,
  lineShareUrl,
  memberPaypayLink,
  organizerIdOf,
  receiverText,
  smsShareUrl,
  transferKey,
  transferText,
  usableLink,
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
  /** 設定に登録した幹事自身のPayPay受け取りリンク */
  organizerLink: string;
};

/** LINE・SMS で送るボタン2つ */
function SendButtons({ text, label }: { text: string; label: string }) {
  return (
    <div className="send-actions">
      <span className="send-to">{label}</span>
      <a className="share line" href={lineShareUrl(text)} target="_blank" rel="noreferrer">
        LINE
      </a>
      <a className="share sms" href={smsShareUrl(text)}>
        SMS
      </a>
    </div>
  );
}

/**
 * 解散後の精算の連絡。幹事が受け取る人のPayPay受け取りリンクを集めておき(①)、
 * 払う人1人ずつに、送る相手・金額・受け取る人のリンクを LINE・SMS で送る(②)。
 * 送り先がわからない人は幹事に聞けるようにする。送金が済んだら「精算済」にして、グレーで表示する。
 */
export default function SendList({ event, transfers, onChange, paypayLinks, onChangePaypayLinks, organizerLink }: Props) {
  const member = (id: string) => event.members.find((m) => m.id === id);
  const nick = (id: string) => member(id)?.nickname ?? '?';
  const organizerId = organizerIdOf(event);
  const organizer = nick(organizerId);
  const linkOf = (id: string) => memberPaypayLink(member(id), paypayLinks, id === organizerId ? organizerLink : '');
  const paid = new Set(event.paidTransfers ?? []);

  // 受け取る人ごとに、誰からいくら受け取るか
  const receivers = [...new Set(transfers.map((t) => t.to))].map((id) => {
    const from = transfers.filter((t) => t.to === id).map((t) => ({ name: nick(t.from), amount: t.amount }));
    return { id, from, amount: from.reduce((a, p) => a + p.amount, 0) };
  });
  // リンクをまだ集めていない受け取る人(幹事は自分なので頼まない)
  const missing = receivers.filter((r) => r.id !== organizerId && !usableLink(linkOf(r.id)));

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
      <h3 className="send-title">📨 解散後の精算の連絡</h3>
      <p className="muted">
        幹事が、受け取る人の PayPay リンクを先に集めておくと、払う人への連絡に添えられます。送り先がわからない人は、幹事に聞けるようにします。
      </p>

      <label className="organizer-field">
        幹事（PayPayのリンクを集める人）
        <select value={organizerId} onChange={(e) => onChange({ ...event, organizerId: e.target.value })}>
          {event.members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nickname}
            </option>
          ))}
        </select>
      </label>

      <p className="send-step">① 受け取る人の PayPay リンクを集める</p>
      {missing.length > 0 && (
        <SendButtons
          label="まとめて頼む（グループに送る）"
          text={collectLinksText(
            event.name,
            missing.map((r) => ({ name: nick(r.id), amount: r.amount })),
            organizer,
          )}
        />
      )}
      {receivers.map((r) => {
        const link = linkOf(r.id);
        const check = checkPaypayLink(link);
        return (
          <div key={r.id} className="receiver-link">
            <label>
              <span className="receiver-link-name">
                <MemberName members={event.members} id={r.id} />
                さんの受け取りリンク（{yen(r.amount)} 受け取り）
              </span>
              <input
                type="url"
                inputMode="url"
                value={link}
                onChange={(e) => setLink(r.id, e.target.value)}
                placeholder="https://qr.paypay.ne.jp/…"
              />
            </label>
            {check === 'invalid' && <p className="route-error">https:// で始まるリンクを貼ってください。</p>}
            {check === 'other' && <p className="warn">PayPayのリンクではないようです。貼ったリンクを確認してください。</p>}
            {r.id !== organizerId && !usableLink(link) && (
              <SendButtons label={`${nick(r.id)}さんに頼む`} text={receiverText(event.name, nick(r.id), r.from, organizer)} />
            )}
          </div>
        );
      })}

      <p className="send-step">② 払う人に送る</p>
      <ul className="send-rows">
        {transfers.map((t) => {
          const done = paid.has(transferKey(t));
          return (
            <li key={transferKey(t)} className={done ? 'settled' : undefined}>
              <div className="send-who">
                <MemberName members={event.members} id={t.from} />
                <span className="arrow">→</span>
                <MemberName members={event.members} id={t.to} />
                <strong className="send-amount">{yen(t.amount)}</strong>
                {done && <span className="settled-label">精算済</span>}
              </div>
              {/* 幹事が払う人なら、自分あての連絡はいらない */}
              {t.from !== organizerId && (
                <SendButtons
                  label={`${nick(t.from)}さんへ`}
                  text={transferText(event.name, nick(t.from), nick(t.to), t.amount, linkOf(t.to), organizer)}
                />
              )}
              <button type="button" className={`share settle-toggle${done ? ' on' : ''}`} onClick={() => togglePaid(t)}>
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
