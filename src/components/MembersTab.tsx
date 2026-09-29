import { useState } from 'react';
import { AVATARS, MAX_MEMBERS, avatarIndex, freeAvatar, newId } from '../format';
import type { WarikanEvent } from '../types';
import MemberName, { Avatar } from './MemberName';

type Props = { event: WarikanEvent; onChange: (e: WarikanEvent) => void; onNext: () => void };

export default function MembersTab({ event, onChange, onNext }: Props) {
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState(() => freeAvatar(event.members));
  const used = new Set(event.members.map(avatarIndex));
  const full = event.members.length >= MAX_MEMBERS;

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const n = nickname.trim();
    if (!n || full) return;
    const members = [...event.members, { id: newId(), nickname: n, avatar }];
    onChange({ ...event, members });
    setNickname('');
    setAvatar(freeAvatar(members));
  };

  const remove = (id: string) => {
    const used = event.items.some((i) => i.payerId === id);
    if (used) {
      alert('このメンバーは支払い項目の立て替え者になっているため削除できません。先に項目を削除・変更してください。');
      return;
    }
    // 古いデータはアバター番号が並び順なので、削除でずれないよう今の番号を固定する
    const members = event.members.map((m, i) => ({ ...m, avatar: avatarIndex(m, i) })).filter((m) => m.id !== id);
    onChange({
      ...event,
      members,
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
    setAvatar(freeAvatar(members));
  };

  return (
    <section className="card">
      <h2>
        メンバー（{event.members.length}/{MAX_MEMBERS}人）
      </h2>
      {full ? (
        <p className="warn">メンバーは{MAX_MEMBERS}人までです。</p>
      ) : (
        <form onSubmit={add}>
          <div className="avatar-picker" role="radiogroup" aria-label="アバター">
            {AVATARS.map((a, i) => (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={avatar === i}
                className={`avatar-choice${avatar === i ? ' selected' : ''}`}
                style={{ borderColor: avatar === i ? a.color : 'transparent' }}
                disabled={used.has(i)}
                onClick={() => setAvatar(i)}
              >
                <Avatar avatar={a} />
              </button>
            ))}
          </div>
          <div className="row">
            <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="ニックネーム" />
            <button type="submit" className="primary" disabled={!nickname.trim()}>
              追加
            </button>
          </div>
        </form>
      )}
      {event.members.length === 0 ? (
        <p className="muted">メンバーを追加してください（2人以上）。</p>
      ) : (
        <ul className="list">
          {event.members.map((m) => (
            <li key={m.id}>
              <span className="grow">
                <MemberName members={event.members} id={m.id} size="md" />
              </span>
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
