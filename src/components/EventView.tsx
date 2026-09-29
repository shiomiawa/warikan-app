import { useState } from 'react';
import type { WarikanEvent } from '../types';
import MembersTab from './MembersTab';
import ItemsTab from './ItemsTab';
import ResultTab from './ResultTab';

type Tab = 'members' | 'items' | 'result';

type Props = {
  event: WarikanEvent;
  onChange: (e: WarikanEvent) => void;
  onBack: () => void;
};

export default function EventView({ event, onChange, onBack }: Props) {
  const [tab, setTab] = useState<Tab>(event.members.length < 2 ? 'members' : 'items');

  return (
    <main>
      <button className="link back" onClick={onBack}>
        ← イベント一覧へ
      </button>
      <h1>{event.name}</h1>
      <nav className="tabs">
        <button className={tab === 'members' ? 'active' : ''} onClick={() => setTab('members')}>
          メンバー
        </button>
        <button className={tab === 'items' ? 'active' : ''} onClick={() => setTab('items')}>
          支払い項目
        </button>
        <button className={tab === 'result' ? 'active' : ''} onClick={() => setTab('result')}>
          精算結果
        </button>
      </nav>
      {tab === 'members' && <MembersTab event={event} onChange={onChange} onNext={() => setTab('items')} />}
      {tab === 'items' && <ItemsTab event={event} onChange={onChange} onSettle={() => setTab('result')} />}
      {tab === 'result' && <ResultTab event={event} />}
    </main>
  );
}
