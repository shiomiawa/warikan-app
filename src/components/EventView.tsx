import { useState } from 'react';
import { eventIcon } from '../format';
import type { WarikanEvent } from '../types';
import ItemsTab from './ItemsTab';
import ResultTab from './ResultTab';
import SettingsView from './SettingsView';

type View = 'items' | 'result' | 'settings';

type Props = {
  event: WarikanEvent;
  onChange: (e: WarikanEvent) => void;
  onBack: () => void;
};

export default function EventView({ event, onChange, onBack }: Props) {
  const [view, setView] = useState<View>(event.members.length < 2 ? 'settings' : 'items');
  const [lastTab, setLastTab] = useState<'items' | 'result'>('items');

  const openSettings = () => setView('settings');
  const closeSettings = () => setView(lastTab);
  const openTab = (tab: 'items' | 'result') => {
    setLastTab(tab);
    setView(tab);
  };

  return (
    <main>
      <div className="topbar">
        {view === 'settings' ? (
          <button className="link back" onClick={closeSettings} disabled={event.members.length < 2}>
            ← 戻る
          </button>
        ) : (
          <button className="link back" onClick={onBack}>
            ← イベント一覧へ
          </button>
        )}
        <button
          className={`icon-button settings-button${view === 'settings' ? ' active' : ''}`}
          onClick={view === 'settings' ? closeSettings : openSettings}
          aria-label="設定"
          title="設定"
        >
          ⚙️
        </button>
      </div>
      <h1>
        {eventIcon(event.kind)} {event.name}
      </h1>
      <p className="muted subtitle">
        {event.kind}・{event.members.length}人
      </p>

      {view === 'settings' ? (
        <>
          <h2 className="view-title">⚙️ 設定</h2>
          <SettingsView event={event} onChange={onChange} />
          <button className="primary wide" onClick={closeSettings} disabled={event.members.length < 2}>
            設定を閉じる
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
            <ItemsTab event={event} onChange={onChange} onSettle={() => openTab('result')} onOpenSettings={openSettings} />
          )}
          {view === 'result' && <ResultTab event={event} />}
        </>
      )}
    </main>
  );
}
