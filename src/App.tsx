import { useEffect, useState } from 'react';
import { EVENT_KINDS, OTHER, eventIcon, newId } from './format';
import { loadData, saveData } from './storage';
import type { Rounding, WarikanEvent } from './types';
import EventView from './components/EventView';

export default function App() {
  const [data, setData] = useState(loadData);
  const [name, setName] = useState('');
  const [kindChoice, setKindChoice] = useState(EVENT_KINDS[0]);
  const [customKind, setCustomKind] = useState('');
  const [rounding, setRounding] = useState<Rounding>(1);

  useEffect(() => saveData(data), [data]);

  const current = data.events.find((e) => e.id === data.currentId) ?? null;

  const createEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const kind = kindChoice === OTHER ? customKind.trim() || OTHER : kindChoice;
    const ev: WarikanEvent = { id: newId(), name: name.trim(), kind, rounding, members: [], items: [] };
    setData({ events: [...data.events, ev], currentId: ev.id });
    setName('');
    setCustomKind('');
  };

  const updateEvent = (ev: WarikanEvent) =>
    setData((d) => ({ ...d, events: d.events.map((x) => (x.id === ev.id ? ev : x)) }));

  if (current) {
    return (
      <EventView
        event={current}
        onChange={updateEvent}
        onBack={() => setData({ ...data, currentId: null })}
      />
    );
  }

  return (
    <main>
      <header className="hero">
        <h1>✈️ 割り勘アプリ</h1>
        <p>旅行も飲み会も、立て替えをまとめてスッキリ精算</p>
      </header>
      <section className="card">
        <h2>イベントを作成</h2>
        <form onSubmit={createEvent}>
          <label>
            イベント名
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="例：箱根旅行" />
          </label>
          <label>
            種類
            <select value={kindChoice} onChange={(e) => setKindChoice(e.target.value)}>
              {EVENT_KINDS.map((k) => (
                <option key={k} value={k}>
                  {eventIcon(k)} {k}
                </option>
              ))}
              <option value={OTHER}>🎉 その他（自由入力）</option>
            </select>
          </label>
          {kindChoice === OTHER && (
            <label>
              種類名
              <input value={customKind} onChange={(e) => setCustomKind(e.target.value)} placeholder="例：卒業旅行、忘年会" />
            </label>
          )}
          <label>
            端数処理
            <select value={rounding} onChange={(e) => setRounding(Number(e.target.value) as Rounding)}>
              <option value={1}>1円単位</option>
              <option value={10}>10円単位</option>
              <option value={100}>100円単位</option>
            </select>
          </label>
          <button type="submit" className="primary wide" disabled={!name.trim()}>
            作成する
          </button>
        </form>
      </section>

      {data.events.length > 0 && (
        <section className="card">
          <h2>イベント一覧</h2>
          <ul className="list">
            {data.events.map((ev) => (
              <li key={ev.id}>
                <div className="grow">
                  <button className="link" onClick={() => setData({ ...data, currentId: ev.id })}>
                    {eventIcon(ev.kind)} {ev.name}
                  </button>
                  <div className="muted">
                    {ev.kind}・{ev.members.length}人・{ev.items.length}項目
                  </div>
                </div>
                <button
                  className="danger"
                  onClick={() => {
                    if (confirm(`「${ev.name}」を削除しますか？`))
                      setData({ events: data.events.filter((x) => x.id !== ev.id), currentId: null });
                  }}
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
