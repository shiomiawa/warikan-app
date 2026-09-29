import { useState } from 'react';
import { eventIcon } from '../format';
import type { AppSettings, WarikanEvent } from '../types';
import EventEditView from './EventEditView';
import ItemsTab from './ItemsTab';
import ResultTab from './ResultTab';

type View = 'items' | 'result' | 'edit';

type Props = {
  event: WarikanEvent;
  settings: AppSettings;
  onChange: (e: WarikanEvent) => void;
  onBack: () => void;
};

export default function EventView({ event, settings, onChange, onBack }: Props) {
  const [view, setView] = useState<View>(event.members.length < 2 ? 'edit' : 'items');
  const [lastTab, setLastTab] = useState<'items' | 'result'>('items');

  const openEdit = () => setView('edit');
  const closeEdit = () => setView(lastTab);
  const openTab = (tab: 'items' | 'result') => {
    setLastTab(tab);
    setView(tab);
  };

  return (
    <main>
      <div className="topbar">
        {view === 'edit' ? (
          <button className="link back" onClick={closeEdit} disabled={event.members.length < 2}>
            ← 戻る
          </button>
        ) : (
          <button className="link back" onClick={onBack}>
            ← イベント一覧へ
          </button>
        )}
        {view !== 'edit' && (
          <button className="edit-button" onClick={openEdit}>
            ✏️ 編集
          </button>
        )}
      </div>
      <h1>
        {eventIcon(event.kind)} {event.name}
      </h1>
      <p className="muted subtitle">
        {event.kind}・{event.members.length}人
      </p>

      {view === 'edit' ? (
        <>
          <h2 className="view-title">✏️ イベントの編集</h2>
          <EventEditView event={event} onChange={onChange} />
          <button className="primary wide" onClick={closeEdit} disabled={event.members.length < 2}>
            完了
          </button>
        </>
      ) : (
        <>
          <nav className="tabs">
            <button className={view === 'items' ? 'active' : ''} onClick={() => openTab('items')}>
              支払い項目
            </button>
            <button className={view === 'result' ? 'active' : ''} onClick={() => openTab('result')}>
              精算結果
            </button>
          </nav>
          {view === 'items' && (
            <ItemsTab
              event={event}
              settings={settings}
              onChange={onChange}
              onSettle={() => openTab('result')}
              onOpenEdit={openEdit}
            />
          )}
          {view === 'result' && <ResultTab event={event} />}
        </>
      )}
    </main>
  );
}
