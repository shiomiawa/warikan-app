import { useState } from 'react';
import { amountSplitDiff, equalPercents, itemShares, quickSplit } from '../calc';
import { AVATARS, roundTo, toNum, yen } from '../format';
import type { Item, Member, Rounding, Split, WarikanEvent } from '../types';
import { rangeWarning } from '../checks';
import { withPaypayLink } from '../share';
import { playBuzzer } from '../sound';
import FieldWarning from './FieldWarning';
import MemberName from './MemberName';
import NumberInput from './NumberInput';
import PaypayQr from './PaypayQr';
import ShareButtons from './ShareButtons';
import SplitEditor, { percentTotal } from './SplitEditor';

type Props = { onBack: () => void; paypayLink: string; onChangePaypayLink: (link: string) => void };

const MIN_PEOPLE = 2;
const MAX_PEOPLE = 50;
const ROUNDINGS: Rounding[] = [1, 10, 100];

/** 名前を入れなくてよいように、1人目を幹事(立て替えた人)、ほかを「2人目」「3人目」…とする */
const quickMembers = (n: number): Member[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `q${i + 1}`,
    nickname: i === 0 ? '幹事' : `${i + 1}人目`,
    avatar: i % AVATARS.length,
  }));

/** イベントを作らずに、その場で1回だけ割り勘する画面(保存しない) */
export default function QuickSplitView({ onBack, paypayLink, onChangePaypayLink }: Props) {
  const [people, setPeople] = useState(2);
  const [total, setTotal] = useState('');
  const [rounding, setRounding] = useState<Rounding>(1);
  const [mode, setMode] = useState<Split['mode']>('equal');
  const [percents, setPercents] = useState<Record<string, number>>(() => equalPercents(['q1', 'q2']));
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  const members = quickMembers(people);
  const ids = members.map((m) => m.id);
  const amount = toNum(total) ?? 0;

  const setPeopleClamped = (n: number) => {
    const next = Math.max(MIN_PEOPLE, Math.min(MAX_PEOPLE, n));
    setPeople(next);
    // 人数が変わったら比率は均等からやり直す
    if (next !== people) setPercents(equalPercents(quickMembers(next).map((m) => m.id)));
  };

  // 均等割り: 1人あたりと幹事の負担
  const equal = mode === 'equal' ? quickSplit(amount, people, rounding) : null;

  // 比率指定・金額指定: 支払い項目と同じ計算(端数は幹事に寄せる)
  const split: Split =
    mode === 'ratio'
      ? { mode: 'ratio', ratios: Object.fromEntries(ids.map((id) => [id, percents[id] ?? 0])) }
      : mode === 'amount'
        ? { mode: 'amount', amounts: Object.fromEntries(ids.map((id) => [id, roundTo(toNum(amounts[id] ?? '') ?? 0, 0)])) }
        : { mode: 'equal' };
  const item: Item = { id: 'quick', name: '', kind: 'normal', payerId: 'q1', amount, split };
  const event: WarikanEvent = { id: 'quick', name: '', kind: '', rounding, members, items: [item] };
  const splitError =
    mode === 'ratio' && percentTotal(percents, ids) !== 100
      ? `比率の合計を100%にしてください（残り${100 - percentTotal(percents, ids)}%）`
      : mode === 'amount' && amountSplitDiff(item) !== 0
        ? `負担額の合計が合計金額と合っていません（差：${yen(amountSplitDiff(item) ?? 0)}）`
        : null;
  const shares = mode !== 'equal' && amount > 0 && !splitError ? itemShares(item, event) : null;

  const text = equal
    ? withPaypayLink(
        [
          `【割り勘】合計 ${yen(amount)}・${people}人`,
          equal.perPerson === equal.organizer
            ? `1人あたり ${yen(equal.perPerson)}`
            : `1人あたり ${yen(equal.perPerson)}（幹事は ${yen(equal.organizer)}）`,
        ].join('\n'),
        paypayLink,
      )
    : shares
      ? withPaypayLink(
          [`【割り勘】合計 ${yen(amount)}・${people}人`, ...members.map((m) => `${m.nickname}：${yen(shares[m.id])}`)].join('\n'),
          paypayLink,
        )
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

      <section className="card quick-form">
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

        <SplitEditor
          members={members}
          mode={mode}
          onModeChange={setMode}
          percents={percents}
          onPercentsChange={setPercents}
          amounts={amounts}
          onAmountsChange={setAmounts}
          totalYen={amount}
          totalLabel={yen(amount)}
          unit="円"
          decimal={false}
        />
        {splitError && amount > 0 && <p className="route-error">{splitError}</p>}
      </section>

      <section className="card highlight quick-result">
        {mode === 'equal' ? (
          <>
            <div className="muted">1人あたり</div>
            <div className="quick-amount">{equal ? yen(equal.perPerson) : '—'}</div>
            {equal && equal.perPerson !== equal.organizer && (
              <>
                <p className="quick-organizer">
                  幹事は <strong>{yen(equal.organizer)}</strong>（端数を負担）
                </p>
                <p className="muted">
                  {yen(equal.perPerson)} × {people - 1}人 ＋ 幹事 {yen(equal.organizer)} ＝ {yen(amount)}
                </p>
              </>
            )}
          </>
        ) : (
          <>
            <div className="muted">それぞれの負担額</div>
            {shares ? (
              <ul className="quick-shares">
                {members.map((m) => (
                  <li key={m.id}>
                    <MemberName members={members} id={m.id} />
                    <strong>{yen(shares[m.id])}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="quick-amount">—</div>
            )}
          </>
        )}
        {!amount && <p className="muted">合計金額を入れると計算します。</p>}
        {text && (
          <>
            <PaypayQr link={paypayLink} onChange={onChangePaypayLink} />
            <ShareButtons text={text} />
          </>
        )}
      </section>
    </main>
  );
}
