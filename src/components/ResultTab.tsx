import { useState } from 'react';
import {
  etcStatus,
  eventRates,
  itemAmount,
  itemCurrency,
  itemOriginalAmount,
  itemShares,
  settle,
  sortItemsNewestFirst,
  summarize,
} from '../calc';
import { CURRENCIES, formatDate, itemLabel, memberAvatar, money, yen } from '../format';
import type { Currency, WarikanEvent } from '../types';
import MemberName from './MemberName';

export default function ResultTab({ event }: { event: WarikanEvent }) {
  const [copied, setCopied] = useState(false);
  const nick = (id: string) => event.members.find((m) => m.id === id)?.nickname ?? '?';

  const rates = eventRates(event);
  const summary = summarize(event);
  const transfers = settle(Object.fromEntries(Object.entries(summary).map(([id, s]) => [id, s.balance])));
  const pendingEtc = event.items.filter((i) => i.kind === 'etc' && i.etc && etcStatus(i.etc) !== 'confirmed');
  const usedCurrencies = [...new Set(event.items.map(itemCurrency))].filter((c): c is Exclude<Currency, 'JPY'> => c !== 'JPY');
  const rateNotes = usedCurrencies.map((c) => `1${CURRENCIES[c].unit}＝${rates[c]}円`);
  const total = event.items.reduce((a, i) => a + itemAmount(i, rates), 0);

  const text = [
    `【${event.name}】精算結果`,
    `合計 ${yen(total)}`,
    '',
    ...(transfers.length === 0
      ? ['精算は不要です']
      : transfers.map((t) => `${nick(t.from)} → ${nick(t.to)}：${yen(t.amount)}`)),
    ...(rateNotes.length > 0 ? ['', `※換算レート：${rateNotes.join('、')}`] : []),
    ...(pendingEtc.length > 0 ? ['※ETCに概算・未入力の項目があります'] : []),
  ].join('\n');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('コピーできませんでした。手動でコピーしてください。');
    }
  };

  if (event.items.length === 0) {
    return (
      <section className="card">
        <p className="muted">支払い項目を追加すると、精算結果が表示されます。</p>
      </section>
    );
  }

  return (
    <>
      <section className="card highlight">
        <h2>💸 最終的な精算表</h2>
        <p className="muted">この表のとおりに送金すれば、全員の精算が終わります（送金回数が最少になる組み合わせ）。</p>
        {pendingEtc.length > 0 && (
          <p className="warn">ETCに未確定（概算・未入力）の項目があります。確定すると金額が変わる場合があります。</p>
        )}
        {transfers.length === 0 ? (
          <p className="done">🎉 精算は不要です</p>
        ) : (
          <div className="table-wrap">
            <table className="final">
              <thead>
                <tr>
                  <th>払う人</th>
                  <th></th>
                  <th>受け取る人</th>
                  <th>金額</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((t, i) => (
                  <tr key={i}>
                    <td>
                      <MemberName members={event.members} id={t.from} size="md" />
                    </td>
                    <td className="arrow">→</td>
                    <td>
                      <MemberName members={event.members} id={t.to} size="md" />
                    </td>
                    <td className="amount">{yen(t.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {rateNotes.length > 0 && <p className="muted">換算レート：{rateNotes.join('、')}</p>}
        <button className="primary wide" onClick={copy}>
          {copied ? 'コピーしました' : '結果をテキストでコピー'}
        </button>
      </section>

      <section className="card">
        <h2>各人の収支</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>メンバー</th>
                <th>立て替えた額</th>
                <th>負担額</th>
                <th>差額</th>
              </tr>
            </thead>
            <tbody>
              {event.members.map((m) => {
                const s = summary[m.id];
                return (
                  <tr key={m.id}>
                    <td>
                      <MemberName members={event.members} id={m.id} />
                    </td>
                    <td>{yen(s.paid)}</td>
                    <td>{yen(s.share)}</td>
                    <td className={s.balance > 0 ? 'plus' : s.balance < 0 ? 'minus' : ''}>
                      {s.balance > 0 ? `${yen(s.balance)} 受け取る` : s.balance < 0 ? `${yen(-s.balance)} 払う` : '±0'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td>合計</td>
                <td>{yen(total)}</td>
                <td>{yen(total)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>明細：項目ごとの負担額</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>項目</th>
                <th>金額</th>
                <th>立替</th>
                {event.members.map((m) => (
                  <th key={m.id}>
                    <MemberName members={event.members} id={m.id} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortItemsNewestFirst(event.items).map((item) => {
                const shares = itemShares(item, event);
                const cur = itemCurrency(item);
                return (
                  <tr key={item.id}>
                    <td>
                      {item.name}
                      <div className="muted">
                        {formatDate(item.date)} {itemLabel(item)}
                      </div>
                    </td>
                    <td>
                      {yen(itemAmount(item, rates))}
                      {cur !== 'JPY' && <div className="muted">{money(itemOriginalAmount(item), cur)}</div>}
                    </td>
                    <td>
                      <MemberName members={event.members} id={item.payerId} />
                    </td>
                    {event.members.map((m) => (
                      <td key={m.id} style={{ color: memberAvatar(event.members, m.id).color }}>
                        {yen(shares[m.id] ?? 0)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
