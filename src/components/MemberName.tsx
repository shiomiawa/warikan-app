import { memberColor, memberInitial } from '../format';
import type { Member } from '../types';

type BadgeProps = { nickname: string; color: string; size?: 'sm' | 'md' | 'lg' };

/** メンバーの色の丸に、白い頭文字(仮の名前は番号) */
export function MemberBadge({ nickname, color, size = 'md' }: BadgeProps) {
  const initial = memberInitial(nickname);
  return (
    <span
      className={`member-badge member-badge-${size}${initial.length > 1 ? ' member-badge-long' : ''}`}
      style={{ background: color }}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}

type Props = { members: Member[]; id: string; size?: 'sm' | 'md' | 'lg' };

/** 頭文字のバッジと、バッジと同じ色のニックネーム */
export default function MemberName({ members, id, size = 'sm' }: Props) {
  const color = memberColor(members, id);
  const nickname = members.find((m) => m.id === id)?.nickname ?? '?';
  return (
    <span className="member-name" style={{ color }}>
      <MemberBadge nickname={nickname} color={color} size={size} />
      {nickname}
    </span>
  );
}
