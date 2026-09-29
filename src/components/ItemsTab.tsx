import { Fragment, useState } from 'react';
import { eventRates, itemAmount, itemCurrency, itemOriginalAmount, sortItemsNewestFirst } from '../calc';
import { formatDate, itemLabel, money, yen } from '../format';
import type { Item, WarikanEvent } from '../types';
import ItemForm from './ItemForm';
import MemberName from './MemberName';

type Props = {
  event: WarikanEvent;
  onChange: (e: WarikanEvent) => void;
  onSettle: () => void;
  onOpenSettings: () => void;
};

const splitLabel = { equal: '均等割り', ratio: '比率指定', amount: '金額指定' } as const;

export default function ItemsTab({ event, onChange, onSettle, onOpenSettings }: Props) {
  // null=フォーム非表示、'new'=追加、Item=編集
  const [editing, setEditing] = useState<Item | 'new' | null>(null);
  const rates = eventRates(event);
  const sorted = sortItemsNewestFirst(event.items);

  if (event.members.length < 2) {
    return (
      <section className="card">
        <p className="muted">先に設定でメンバーを2人以上登録してください。</p>
        <button className="primary wide" onClick={onOpenSettings}>
          ⚙️ 設定を開く
        </button>
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
          {sorted.map((item, i) => {
            const currency = itemCurrency(item);
            const newDay = i === 0 || sorted[i - 1].date !== item.date;
            return (
              <Fragment key={item.id}>
              {newDay && <li className="date-head">📅 {formatDate(item.date)}</li>}
              <li>
                <div className="grow">
                  <strong>{item.name}</strong>
                  <span className="tag">{itemLabel(item)}</span>
                  {item.kind === 'etc' && item.etc && (
                    <span className={`tag toll-${item.etc.mode === 'auto' ? 'auto' : 'manual'}`}>
                      {item.etc.mode === 'auto' ? '自動計算（目安）' : '手入力'}
                    </span>
                  )}
                  <div className="item-meta">
                    <MemberName members={event.members} id={item.payerId} />
                    <span className="muted">が立て替え</span>
                    <strong className="item-amount">
                      {currency === 'JPY'
                        ? yen(itemAmount(item, rates))
                        : `${money(itemOriginalAmount(item), currency)}（${yen(itemAmount(item, rates))}）`}
                    </strong>
                  </div>
                  <div className="muted">{splitLabel[item.split.mode]}</div>
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
              </Fragment>
            );
          })}
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
