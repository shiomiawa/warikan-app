import { useState } from 'react';
import { balances, etcStatus, itemAmount, itemShares, settle } from '../calc';
import { yen } from '../format';
import type { WarikanEvent } from '../types';

export default function ResultTab({ event }: { event: WarikanEvent }) {
  const [copied, setCopied] = useState(false);
  const nick = (id: string) => event.members.find((m) => m.id === id)?.nickname ?? '?';

  const transfers = settle(balances(event));
  const pendingEtc = event.items.filter((i) => i.kind === 'etc' && i.etc && etcStatus(i.etc) !== 'confirmed');

  const text = [
    `【${event.name}】精算結果`,
    ...(transfers.length === 0
      ? ['精算は不要です']
      : transfers.map((t) => `${nick(t.from)} → ${nick(t.to)}：${yen(t.amount)}`)),
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
      <section className="card">
        <h2>相殺後：誰が誰にいくら払うか</h2>
        {pendingEtc.length > 0 && (
          <p className="warn">ETCに未確定（概算・未入力）の項目があります。確定すると金額が変わる場合があります。</p>
        )}
        {transfers.length === 0 ? (
          <p>精算は不要です。</p>
        ) : (
          <ul className="list transfers">
            {transfers.map((t, i) => (
              <li key={i}>
                <span>
                  <strong>{nick(t.from)}</strong> → <strong>{nick(t.to)}</strong>
                </span>
                <span className="amount">{yen(t.amount)}</span>
              </li>
            ))}
          </ul>
        )}
        <button className="primary wide" onClick={copy}>
          {copied ? 'コピーしました' : '結果をテキストでコピー'}
        </button>
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
                  <th key={m.id}>{m.nickname}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {event.items.map((item) => {
                const shares = itemShares(item, event.members, event.rounding);
                return (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{yen(itemAmount(item))}</td>
                    <td>{nick(item.payerId)}</td>
                    {event.members.map((m) => (
                      <td key={m.id}>{yen(shares[m.id] ?? 0)}</td>
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
