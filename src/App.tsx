import { useEffect, useState } from 'react';
import { eventStartDate, sortEventsNewestFirst } from './calc';
import { EVENT_KINDS, eventIcon, formatDate, newId } from './format';
import { loadData, saveData } from './storage';
import type { AppSettings, Member, Rounding, WarikanEvent } from './types';
import EventView from './components/EventView';
import KindField from './components/KindField';
import MembersEditor from './components/MembersEditor';
import QuickSplitView from './components/QuickSplitView';
import SettingsView from './components/SettingsView';

const MAX_LISTED_EVENTS = 5;

/** 一覧に出す日付。今年なら「10/3(土)」、それ以外は年も付ける */
function eventDateLabel(date: string): string {
  const year = date.slice(0, 4);
  return year === String(new Date().getFullYear()) ? formatDate(date) : `${year}/${formatDate(date)}`;
}

const initialMembers = (): Member[] => [
  { id: newId(), nickname: 'メンバー1', avatar: 0 },
  { id: newId(), nickname: 'メンバー2', avatar: 1 },
];

export default function App() {
  const [data, setData] = useState(loadData);
  const [name, setName] = useState('');
  const [kind, setKind] = useState(EVENT_KINDS[0]);
  const [members, setMembers] = useState(initialMembers);
  const [rounding, setRounding] = useState<Rounding>(1);
  // 作成後に種類の入力欄を初期状態に戻すためのキー
  const [formKey, setFormKey] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showQuick, setShowQuick] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const sortedEvents = sortEventsNewestFirst(data.events);

  useEffect(() => saveData(data), [data]);

  const current = data.events.find((e) => e.id === data.currentId) ?? null;

  const createEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const ev: WarikanEvent = {
      id: newId(),
      name: name.trim(),
      kind,
      rounding,
      members: members.map((m, i) => ({ ...m, nickname: m.nickname.trim() || `メンバー${i + 1}` })),
      items: [],
    };
    setData({ ...data, events: [...data.events, ev], currentId: ev.id });
    setName('');
    setKind(EVENT_KINDS[0]);
    setMembers(initialMembers());
    setFormKey((k) => k + 1);
    setShowCreate(false);
  };

  const updateEvent = (ev: WarikanEvent) =>
    setData((d) => ({ ...d, events: d.events.map((x) => (x.id === ev.id ? ev : x)) }));
  const updateSettings = (settings: AppSettings) => setData((d) => ({ ...d, settings }));

  if (current) {
    // 通貨・レートはアプリ全体の設定を使う
    const withSettings = { ...current, rates: data.settings.rates, currencies: data.settings.currencies };
    return (
      <EventView
        event={withSettings}
        settings={data.settings}
        onChange={updateEvent}
        onChangeSettings={updateSettings}
        onBack={() => setData({ ...data, currentId: null })}
      />
    );
  }

  if (showQuick) {
    return (
      <QuickSplitView
        onBack={() => setShowQuick(false)}
        paypayLink={data.settings.paypayLink ?? ''}
        onChangePaypayLink={(paypayLink) => updateSettings({ ...data.settings, paypayLink })}
      />
    );
  }

  if (showSettings) {
    return (
      <main>
        <div className="topbar">
          <button className="link back" onClick={() => setShowSettings(false)}>
            ← トップへ
          </button>
        </div>
        <h1>⚙️ 設定</h1>
        <SettingsView settings={data.settings} onChange={(settings) => setData({ ...data, settings })} />
        <button className="primary wide" onClick={() => setShowSettings(false)}>
          完了
        </button>
      </main>
    );
  }

  return (
    <main>
      <header className="hero">
        <div>
          <h1>✈️ 割り勘アプリ</h1>
          <p>立て替えをまとめてスッキリ精算</p>
        </div>
        <button className="edit-button" onClick={() => setShowSettings(true)}>
          ⚙️ 設定
        </button>
      </header>

      <button className="quick-button" onClick={() => setShowQuick(true)}>
        ⚡ クイック割り勘
      </button>

      {/* イベントがあるときは作成フォームを畳んで、一覧をすぐ見られるようにする */}
      {showCreate || data.events.length === 0 ? (
        <section className="card">
          <div className="card-head">
            <h2>イベントを作成</h2>
            {data.events.length > 0 && (
              <button type="button" className="link" onClick={() => setShowCreate(false)}>
                閉じる
              </button>
            )}
          </div>
          <form onSubmit={createEvent} key={formKey}>
            <div className="form-grid">
              <label className="name-field">
                イベント名
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="例：箱根旅行" />
              </label>
              <KindField value={kind} onChange={setKind} />
              <label>
                端数処理
                <select value={rounding} onChange={(e) => setRounding(Number(e.target.value) as Rounding)}>
                  <option value={1}>1円単位</option>
                  <option value={10}>10円単位</option>
                  <option value={100}>100円単位</option>
                </select>
              </label>
            </div>
            <MembersEditor members={members} onChange={setMembers} />
            <button type="submit" className="primary wide" disabled={!name.trim()}>
              作成する
            </button>
          </form>
        </section>
      ) : (
        <button className="primary wide new-event" onClick={() => setShowCreate(true)}>
          ＋ 新しいイベントを作成
        </button>
      )}

      {data.events.length > 0 && (
        <section className="card">
          <h2>イベント一覧</h2>
          <ul className="list">
            {(showAllEvents ? sortedEvents : sortedEvents.slice(0, MAX_LISTED_EVENTS)).map((ev) => (
              <li key={ev.id}>
                <div className="grow">
                  <div className="event-title">
                    <button className="link" onClick={() => setData({ ...data, currentId: ev.id })}>
                      {eventIcon(ev.kind)} {ev.name}
                    </button>
                    {eventStartDate(ev) && <span className="event-date">{eventDateLabel(eventStartDate(ev)!)}</span>}
                  </div>
                  <div className="muted">
                    {ev.kind}・{ev.members.length}人・{ev.items.length}項目
                  </div>
                </div>
                <button
                  className="danger"
                  onClick={() => {
                    if (confirm(`「${ev.name}」を削除しますか？`))
                      setData({ ...data, events: data.events.filter((x) => x.id !== ev.id), currentId: null });
                  }}
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
          {sortedEvents.length > MAX_LISTED_EVENTS && (
            <button className="link more" onClick={() => setShowAllEvents(!showAllEvents)}>
              {showAllEvents ? '新しい5件だけ表示' : `すべて表示（ほか${sortedEvents.length - MAX_LISTED_EVENTS}件）`}
            </button>
          )}
        </section>
      )}
    </main>
  );
}
