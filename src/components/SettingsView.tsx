import { useState } from 'react';
import { eventCurrencies, eventRates, withMembers } from '../calc';
import { CURRENCIES, toNum } from '../format';
import type { Currency, Rounding, WarikanEvent } from '../types';
import KindField from './KindField';
import MembersEditor from './MembersEditor';
import NumberInput from './NumberInput';

type Props = { event: WarikanEvent; onChange: (e: WarikanEvent) => void };

const FOREIGN: Exclude<Currency, 'JPY'>[] = ['USD', 'KRW'];

export default function SettingsView({ event, onChange }: Props) {
  const rates = eventRates(event);
  const enabled = eventCurrencies(event);
  const [rateInput, setRateInput] = useState({ USD: String(rates.USD), KRW: String(rates.KRW) });

  const payers = new Set(event.items.map((i) => i.payerId));
  const usedCurrencies = new Set(event.items.map((i) => i.currency ?? 'JPY'));

  const setRate = (c: Exclude<Currency, 'JPY'>, v: string) => {
    setRateInput({ ...rateInput, [c]: v });
    const n = toNum(v);
    if (n != null && n > 0) onChange({ ...event, rates: { ...event.rates, [c]: n } });
  };

  const toggleCurrency = (c: Currency, on: boolean) =>
    onChange({ ...event, currencies: on ? [...enabled.filter((x) => x !== c), c] : enabled.filter((x) => x !== c) });

  return (
    <>
      <section className="card">
        <h2>イベント</h2>
        <label>
          イベント名
          <input value={event.name} onChange={(e) => onChange({ ...event, name: e.target.value })} />
        </label>
        <KindField value={event.kind} onChange={(kind) => onChange({ ...event, kind })} />
        <label>
          端数処理
          <select
            value={event.rounding}
            onChange={(e) => onChange({ ...event, rounding: Number(e.target.value) as Rounding })}
          >
            <option value={1}>1円単位</option>
            <option value={10}>10円単位</option>
            <option value={100}>100円単位</option>
          </select>
        </label>
      </section>

      <section className="card">
        <h2>メンバー</h2>
        <MembersEditor
          members={event.members}
          onChange={(members) => onChange(withMembers(event, members))}
          removeBlocker={(id) =>
            payers.has(id)
              ? `${event.members.find((m) => m.id === id)?.nickname}さんは立て替え者になっている項目があるため削除できません。先に項目を変更してください。`
              : null
          }
        />
      </section>

      <section className="card">
        <h2>通貨と為替レート</h2>
        <p className="muted">
          チェックした通貨が、支払い項目の金額欄の横に切り替えボタンとして出ます。精算はこのレートで円に換算します。
        </p>
        {FOREIGN.map((c) => (
          <div key={c} className="currency-setting">
            <label className="check">
              <input
                type="checkbox"
                checked={enabled.includes(c)}
                onChange={(e) => toggleCurrency(c, e.target.checked)}
              />
              {CURRENCIES[c].label}を使う
            </label>
            <label className="inline">
              <span>1{CURRENCIES[c].unit} ＝</span>
              <NumberInput value={rateInput[c]} onChange={(v) => setRate(c, v)} decimal />
              <span className="unit">円</span>
            </label>
            {!enabled.includes(c) && usedCurrencies.has(c) && (
              <p className="muted">※{CURRENCIES[c].label}の項目があるため、レートは引き続き精算に使われます。</p>
            )}
          </div>
        ))}
        <p className="muted">初期値（1ドル＝150円、1ウォン＝0.11円）は目安です。実際のレートに直してください。</p>
      </section>
    </>
  );
}
