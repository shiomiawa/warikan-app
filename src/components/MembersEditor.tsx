import { MAX_MEMBERS, avatarIndex, freeAvatar, memberAvatar, newId } from '../format';
import type { Member } from '../types';
import { Avatar } from './MemberName';

export const MIN_MEMBERS = 2;

type Props = {
  members: Member[];
  onChange: (members: Member[]) => void;
  /** 削除できない理由(立て替え者など)。削除できるなら null */
  removeBlocker?: (id: string) => string | null;
};

const defaultName = (n: number) => `メンバー${n}`;

/** 人数の増減と、各メンバーの名前の変更。アバター(動物と色)は自動で割り当てる */
export default function MembersEditor({ members, onChange, removeBlocker = () => null }: Props) {
  // 古いデータはアバター番号が並び順なので、増減でずれないよう今の番号を固定してから変更する
  const fixed = () => members.map((m, i) => ({ ...m, avatar: avatarIndex(m, i) }));

  const add = () => {
    if (members.length >= MAX_MEMBERS) return;
    const list = fixed();
    onChange([...list, { id: newId(), nickname: defaultName(list.length + 1), avatar: freeAvatar(list) }]);
  };

  const remove = (id: string) => {
    if (members.length <= MIN_MEMBERS) return;
    const reason = removeBlocker(id);
    if (reason) {
      alert(reason);
      return;
    }
    onChange(fixed().filter((m) => m.id !== id));
  };

  const rename = (id: string, nickname: string) =>
    onChange(members.map((m) => (m.id === id ? { ...m, nickname } : m)));

  return (
    <div className="members-editor">
      <div className="stepper">
        <span className="field-label">メンバー</span>
        <button
          type="button"
          aria-label="1人減らす"
          disabled={members.length <= MIN_MEMBERS}
          onClick={() => remove(members[members.length - 1].id)}
        >
          −
        </button>
        <strong className="stepper-value">{members.length}人</strong>
        <button type="button" aria-label="1人増やす" disabled={members.length >= MAX_MEMBERS} onClick={add}>
          ＋
        </button>
        <span className="muted">
          （{MIN_MEMBERS}〜{MAX_MEMBERS}人）
        </span>
      </div>
      <ul className="member-rows">
        {members.map((m, i) => (
          <li key={m.id}>
            <Avatar avatar={memberAvatar(members, m.id)} size="sm" />
            <input
              value={m.nickname}
              style={{ color: memberAvatar(members, m.id).color }}
              onChange={(e) => rename(m.id, e.target.value)}
              onBlur={(e) => {
                if (!e.target.value.trim()) rename(m.id, defaultName(i + 1));
              }}
              placeholder={defaultName(i + 1)}
              aria-label={`${i + 1}人目の名前`}
            />
            <button
              type="button"
              className="icon-button"
              aria-label={`${m.nickname}を削除`}
              disabled={members.length <= MIN_MEMBERS}
              onClick={() => remove(m.id)}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
