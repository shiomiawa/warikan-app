import { useState } from 'react';
import { etcStatus, itemAmount } from '../calc';
import { yen } from '../format';
import type { Item, WarikanEvent } from '../types';
import ItemForm from './ItemForm';

type Props = { event: WarikanEvent; onChange: (e: WarikanEvent) => void; onSettle: () => void };

const kindLabel = { normal: '通常', gasoline: 'ガソリン', etc: 'ETC' } as const;
const etcLabel = { none: '未入力', estimated: '概算', confirmed: '確定' } as const;
const splitLabel = { equal: '均等割り', ratio: '比率指定', amount: '金額指定' } as const;

export default function ItemsTab({ event, onChange, onSettle }: Props) {
  // null=フォーム非表示、'new'=追加、Item=編集
  const [editing, setEditing] = useState<Item | 'new' | null>(null);
  const nick = (id: string) => event.members.find((m) => m.id === id)?.nickname ?? '?';

  if (event.members.length < 2) {
    return (
      <section className="card">
        <p className="muted">先にメンバーを2人以上登録してください。</p>
      </section>
    );
  }

  if (editing) {
    return (
      <ItemForm
        event={event}
        item={editing === 'new' ? null : editing}
        onCancel={() => setEditing(null)}
        onSave={(item) => {
          const exists = event.items.some((i) => i.id === item.id);
          onChange({
            ...event,
            items: exists ? event.items.map((i) => (i.id === item.id ? item : i)) : [...event.items, item],
          });
          setEditing(null);
        }}
      />
    );
  }

  return (
    <section className="card">
      <h2>支払い項目</h2>
      <button className="primary wide" onClick={() => setEditing('new')}>
        ＋ 項目を追加
      </button>
      {event.items.length === 0 ? (
        <p className="muted">まだ項目がありません。</p>
      ) : (
        <ul className="list items">
          {event.items.map((item) => (
            <li key={item.id}>
              <div className="grow">
                <strong>{item.name}</strong>
                <span className="tag">{kindLabel[item.kind]}</span>
                {item.kind === 'etc' && item.etc && (
                  <span className={`tag etc-${etcStatus(item.etc)}`}>{etcLabel[etcStatus(item.etc)]}</span>
                )}
                <div className="muted">
                  {yen(itemAmount(item))}・{nick(item.payerId)}が立て替え・{splitLabel[item.split.mode]}
                </div>
              </div>
              <button onClick={() => setEditing(item)}>編集</button>
              <button
                className="danger"
                onClick={() => {
                  if (confirm(`「${item.name}」を削除しますか？`))
                    onChange({ ...event, items: event.items.filter((i) => i.id !== item.id) });
                }}
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      )}
      {event.items.length > 0 && (
        <button className="primary wide" onClick={onSettle}>
          精算する
        </button>
      )}
    </section>
  );
}
