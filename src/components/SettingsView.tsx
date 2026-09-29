import { useState } from 'react';
import { DEFAULT_RATES } from '../calc';
import { CURRENCIES, toNum } from '../format';
import type { AppSettings, Currency, GasolineMode } from '../types';
import { rateKey, rangeWarning } from '../checks';
import { playBuzzer } from '../sound';
import FieldWarning from './FieldWarning';
import NumberInput from './NumberInput';

type Props = { settings: AppSettings; onChange: (s: AppSettings) => void };

const FOREIGN: Exclude<Currency, 'JPY'>[] = ['USD', 'KRW'];

const GAS_MODES: { mode: Exclude<GasolineMode, 'map'>; label: string; note: string }[] = [
  { mode: 'distance', label: '距離を直接入力', note: '走行距離(km)を自分で入れる' },
  { mode: 'odometer', label: 'メーター（オドメーター）から計算', note: '出発時と到着時のメーターの数字を入れる' },
];

/** アプリ全体の設定(トップページの ⚙️ 設定) */
export default function SettingsView({ settings, onChange }: Props) {
  const rates = { ...DEFAULT_RATES, ...settings.rates };
  const [rateInput, setRateInput] = useState({ USD: String(rates.USD), KRW: String(rates.KRW) });

  const setRate = (c: Exclude<Currency, 'JPY'>, v: string) => {
    setRateInput({ ...rateInput, [c]: v });
    const n = toNum(v);
    if (n != null && n > 0) onChange({ ...settings, rates: { ...settings.rates, [c]: n } });
  };

  const toggleCurrency = (c: Currency, on: boolean) => {
    const list = settings.currencies.filter((x) => x !== c);
    onChange({ ...settings, currencies: on ? [...list, c] : list });
  };

  const toggleGasMode = (m: Exclude<GasolineMode, 'map'>, on: boolean) => {
    const list = settings.gasolineModes.filter((x) => x !== m);
    onChange({ ...settings, gasolineModes: on ? [...list, m] : list });
  };

  return (
    <>
      <section className="card">
        <h2>通貨と為替レート</h2>
        <p className="muted">
          チェックした通貨が、支払い項目の金額欄の横に切り替えボタンとして出ます。精算はこのレートで円に換算します（すべてのイベント共通）。
        </p>
        {FOREIGN.map((c) => (
          <div key={c} className="currency-setting">
            <label className="check">
              <input
                type="checkbox"
                checked={settings.currencies.includes(c)}
                onChange={(e) => toggleCurrency(c, e.target.checked)}
              />
              {CURRENCIES[c].label}を使う
            </label>
            <label className="inline">
              <span>1{CURRENCIES[c].unit} ＝</span>
              <NumberInput
                value={rateInput[c]}
                onChange={(v) => setRate(c, v)}
                decimal
                onBlur={(e) => rangeWarning(rateKey(c), toNum(e.currentTarget.value)) && playBuzzer()}
              />
              <span className="unit">円</span>
            </label>
            <FieldWarning message={rangeWarning(rateKey(c), toNum(rateInput[c]))} />
          </div>
        ))}
        <p className="muted">初期値（1ドル＝150円、1ウォン＝0.11円）は目安です。実際のレートに直してください。</p>
      </section>

      <section className="card">
        <h2>ガソリン代の距離の入れ方</h2>
        <p className="muted">
          ふだんは「地図で距離を調べる」を使います。ほかの入れ方も使いたいときはチェックしてください。
        </p>
        <label className="check">
          <input type="checkbox" checked disabled />
          地図で距離を調べる（標準）
        </label>
        {GAS_MODES.map(({ mode, label, note }) => (
          <label key={mode} className="check">
            <input
              type="checkbox"
              checked={settings.gasolineModes.includes(mode)}
              onChange={(e) => toggleGasMode(mode, e.target.checked)}
            />
            <span>
              {label}
              <span className="muted">（{note}）</span>
            </span>
          </label>
        ))}
      </section>
    </>
  );
}
