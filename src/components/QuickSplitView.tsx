import { useState } from 'react';
import { quickSplit } from '../calc';
import { toNum, yen } from '../format';
import type { Rounding } from '../types';
import { rangeWarning } from '../checks';
import { withPaypayLink } from '../share';
import { playBuzzer } from '../sound';
import FieldWarning from './FieldWarning';
import NumberInput from './NumberInput';
import PaypayQr from './PaypayQr';
import ShareButtons from './ShareButtons';

type Props = { onBack: () => void; paypayLink: string; onChangePaypayLink: (link: string) => void };

const MIN_PEOPLE = 2;
const MAX_PEOPLE = 50;
const ROUNDINGS: Rounding[] = [1, 10, 100];

/** イベントを作らずに、その場で1回だけ割り勘する画面(保存しない) */
export default function QuickSplitView({ onBack, paypayLink, onChangePaypayLink }: Props) {
  const [people, setPeople] = useState(2);
  const [total, setTotal] = useState('');
  const [rounding, setRounding] = useState<Rounding>(1);

  const amount = toNum(total) ?? 0;
  const result = quickSplit(amount, people, rounding);
  const same = result != null && result.perPerson === result.organizer;

  const setPeopleClamped = (n: number) => setPeople(Math.max(MIN_PEOPLE, Math.min(MAX_PEOPLE, n)));

  const text = result
    ? withPaypayLink([
        `【割り勘】合計 ${yen(amount)}・${people}人`,
        same
          ? `1人あたり ${yen(result.perPerson)}`
          : `1人あたり ${yen(result.perPerson)}（幹事は ${yen(result.organizer)}）`,
      ].join('\n'), paypayLink)
    : '';

  return (
    <main>
      <div className="topbar">
        <button className="link back" onClick={onBack}>
          ← トップへ
        </button>
      </div>
      <h1>⚡ クイック割り勘</h1>
      <p className="muted subtitle">その場で1回だけ割り勘します（保存はしません）</p>

      <section className="card">
        <div className="stepper">
          <span className="field-label">合計人数</span>
          <button type="button" aria-label="1人減らす" disabled={people <= MIN_PEOPLE} onClick={() => setPeopleClamped(people - 1)}>
            −
          </button>
          <NumberInput
            className="people-input"
            value={String(people)}
            onChange={(v) => setPeople(Number(v) || 0)}
            onBlur={() => setPeopleClamped(people)}
            aria-label="合計人数"
          />
          <span className="unit">人</span>
          <button type="button" aria-label="1人増やす" disabled={people >= MAX_PEOPLE} onClick={() => setPeopleClamped(people + 1)}>
            ＋
          </button>
        </div>

        <label className="inline quick-total">
          <span>合計金額</span>
          <NumberInput
            value={total}
            onChange={setTotal}
            placeholder="0"
            autoFocus
            onBlur={(e) => rangeWarning('quickTotal', toNum(e.currentTarget.value)) && playBuzzer()}
          />
          <span className="unit">円</span>
        </label>
        <FieldWarning message={rangeWarning('quickTotal', amount)} />

        <div className="stepper">
          <span className="field-label">端数処理</span>
          <div className="currency-switch" role="radiogroup" aria-label="端数処理">
            {ROUNDINGS.map((r) => (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={rounding === r}
                className={rounding === r ? 'on' : ''}
                onClick={() => setRounding(r)}
              >
                {r}円
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="card highlight quick-result">
        <div className="muted">1人あたり</div>
        <div className="quick-amount">{result ? yen(result.perPerson) : '—'}</div>
        {result && !same && (
          <>
            <p className="quick-organizer">
              幹事は <strong>{yen(result.organizer)}</strong>（端数を負担）
            </p>
            <p className="muted">
              {yen(result.perPerson)} × {people - 1}人 ＋ 幹事 {yen(result.organizer)} ＝ {yen(amount)}
            </p>
          </>
        )}
        {!result && <p className="muted">合計金額を入れると計算します。</p>}
        {result && (
          <>
            <PaypayQr link={paypayLink} onChange={onChangePaypayLink} />
            <ShareButtons text={text} />
          </>
        )}
      </section>
    </main>
  );
}
