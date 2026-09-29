import { useState } from 'react';
import { newId } from '../format';
import type { WarikanEvent } from '../types';

type Props = { event: WarikanEvent; onChange: (e: WarikanEvent) => void; onNext: () => void };

export default function MembersTab({ event, onChange, onNext }: Props) {
  const [nickname, setNickname] = useState('');

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const n = nickname.trim();
    if (!n) return;
    onChange({ ...event, members: [...event.members, { id: newId(), nickname: n }] });
    setNickname('');
  };

  const remove = (id: string) => {
    const used = event.items.some((i) => i.payerId === id);
    if (used) {
      alert('このメンバーは支払い項目の立て替え者になっているため削除できません。先に項目を削除・変更してください。');
      return;
    }
    onChange({
      ...event,
      members: event.members.filter((m) => m.id !== id),
      items: event.items.map((i) => {
        if (i.split.mode === 'ratio') {
          const { [id]: _r, ...ratios } = i.split.ratios;
          return { ...i, split: { mode: 'ratio' as const, ratios } };
        }
        if (i.split.mode === 'amount') {
          const { [id]: _a, ...amounts } = i.split.amounts;
          return { ...i, split: { mode: 'amount' as const, amounts } };
        }
        return i;
      }),
    });
  };

  return (
    <section className="card">
      <h2>メンバー</h2>
      <form onSubmit={add} className="row">
        <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="ニックネーム" />
        <button type="submit" className="primary" disabled={!nickname.trim()}>
          追加
        </button>
      </form>
      {event.members.length === 0 ? (
        <p className="muted">メンバーを追加してください（2人以上）。</p>
      ) : (
        <ul className="list">
          {event.members.map((m) => (
            <li key={m.id}>
              <span>{m.nickname}</span>
              <button className="danger" onClick={() => remove(m.id)}>
                削除
              </button>
            </li>
          ))}
        </ul>
      )}
      {event.members.length >= 2 && (
        <button className="primary wide" onClick={onNext}>
          支払い項目へ進む
        </button>
      )}
    </section>
  );
}
