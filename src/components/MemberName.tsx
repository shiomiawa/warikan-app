import { AVATARS, memberAvatar } from '../format';
import type { Member } from '../types';

type AvatarProps = { avatar: (typeof AVATARS)[number]; size?: 'sm' | 'md' | 'lg' };

/** 淡い色の丸に動物の絵文字(枠線がメンバーの色) */
export function Avatar({ avatar, size = 'md' }: AvatarProps) {
  return (
    <span
      className={`avatar avatar-${size}`}
      style={{ background: `${avatar.color}1f`, borderColor: avatar.color }}
      aria-hidden="true"
    >
      {avatar.emoji}
    </span>
  );
}

type Props = { members: Member[]; id: string; size?: 'sm' | 'md' | 'lg' };

/** アバターと、アバターと同じ色のニックネーム */
export default function MemberName({ members, id, size = 'sm' }: Props) {
  const avatar = memberAvatar(members, id);
  const nickname = members.find((m) => m.id === id)?.nickname ?? '?';
  return (
    <span className="member-name" style={{ color: avatar.color }}>
      <Avatar avatar={avatar} size={size} />
      {nickname}
    </span>
  );
}
