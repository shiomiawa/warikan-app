import { useState } from 'react';
import { TIERS, equalPercents, tierPercents, type Tier } from '../calc';
import { memberColor, memberInitial, yen } from '../format';
import type { Member, Split } from '../types';
import MemberName from './MemberName';
import NumberInput from './NumberInput';

export const SPLIT_LABELS: Record<Split['mode'], string> = { equal: '均等割り', ratio: '比率指定（%）', amount: '金額指定' };

export const percentTotal = (percents: Record<string, number>, ids: string[]): number =>
  ids.reduce((a, id) => a + (percents[id] ?? 0), 0);

type Props = {
  members: Member[];
  mode: Split['mode'];
  onModeChange: (mode: Split['mode']) => void;
  percents: Record<string, number>;
  onPercentsChange: (percents: Record<string, number>) => void;
  amounts: Record<string, string>;
  onAmountsChange: (amounts: Record<string, string>) => void;
  /** 比率の目安の金額に使う合計(円) */
  totalYen: number;
  /** 金額指定の説明に出す合計(項目の通貨で表示した文字) */
  totalLabel: string;
  unit: string;
  decimal: boolean;
};

/** 負担の割り方(均等割り・比率指定・金額指定)。普段は均等割りで折りたたんでおく */
export default function SplitEditor({
  members,
  mode,
  onModeChange,
  percents,
  onPercentsChange,
  amounts,
  onAmountsChange,
  totalYen,
  totalLabel,
  unit,
  decimal,
}: Props) {
  const [open, setOpen] = useState(false);
  const ids = members.map((m) => m.id);
  const sum = percentTotal(percents, ids);
  const color = (id: string) => memberColor(members, id);

  // ワンタップ傾斜で選んだ段階。%を手で動かしたら選択を外す(null)
  const [tiers, setTiers] = useState<Record<string, Tier> | null>(null);

  /** 合計が100%を超えないように、1人の%を設定する */
  const setPercent = (id: string, value: number) => {
    const others = sum - (percents[id] ?? 0);
    const v = Math.max(0, Math.min(Math.round(value) || 0, 100 - others));
    setTiers(null);
    onPercentsChange({ ...percents, [id]: v });
  };

  /** 1人の段階(多め・ふつう・少なめ・なし)を選び、全員の%を決め直す */
  const setTier = (id: string, tier: Tier) => {
    const next = { ...Object.fromEntries(ids.map((x) => [x, 'normal' as Tier])), ...tiers, [id]: tier };
    setTiers(next);
    onPercentsChange(tierPercents(next, ids));
  };

  return (
    <details className="split" open={open} onToggle={(ev) => setOpen(ev.currentTarget.open)}>
      <summary>
        負担の割り方：<strong>{SPLIT_LABELS[mode]}</strong>
        {!open && <span className="muted">（タップで変更）</span>}
      </summary>
      <div className="radios">
        {(Object.keys(SPLIT_LABELS) as Split['mode'][]).map((m) => (
          <label key={m}>
            <input type="radio" checked={mode === m} onChange={() => onModeChange(m)} />
            {SPLIT_LABELS[m]}
          </label>
        ))}
      </div>
      {mode === 'equal' && <p className="muted">全員で均等に割ります。</p>}
      {mode === 'ratio' && (
        <>
          <div className="gauge" role="img" aria-label={`合計${sum}%`}>
            {members.map((m) =>
              (percents[m.id] ?? 0) > 0 ? (
                <div
                  key={m.id}
                  className="gauge-seg"
                  style={{ width: `${percents[m.id]}%`, background: color(m.id) }}
                  title={`${m.nickname} ${percents[m.id]}%`}
                >
                  {percents[m.id] >= 6 ? memberInitial(m.nickname) : ''}
                </div>
              ) : null,
            )}
          </div>
          <div className="gauge-total">
            <span className={sum === 100 ? 'ok' : 'ng'}>合計 {sum}% / 100%</span>
            <button
              type="button"
              onClick={() => {
                setTiers(null);
                onPercentsChange(equalPercents(ids));
              }}
            >
              均等にする
            </button>
          </div>
          <p className="muted">「多め・ふつう・少なめ・なし」をタップすると%が自動で決まります。細かくはスライダーで調整できます（合計100%まで）。</p>
          {members.map((m) => (
            <div key={m.id} className="pct-block">
              <div className="pct-head">
                <MemberName members={members} id={m.id} />
                <div className="tier-chips" role="radiogroup" aria-label={`${m.nickname}の負担`}>
                  {TIERS.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      role="radio"
                      aria-checked={tiers?.[m.id] === t.key}
                      className={tiers?.[m.id] === t.key ? 'on' : ''}
                      onClick={() => setTier(m.id, t.key)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            <div className="pct-row">
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={percents[m.id] ?? 0}
                onChange={(ev) => setPercent(m.id, Number(ev.target.value))}
                style={{ accentColor: color(m.id) }}
                aria-label={`${m.nickname}の比率`}
              />
              <NumberInput
                className="pct-input"
                value={String(percents[m.id] ?? 0)}
                onChange={(v) => setPercent(m.id, Number(v))}
              />
              <span className="unit">%</span>
              <span className="pct-yen">{yen(Math.round((totalYen * (percents[m.id] ?? 0)) / 100))}</span>
            </div>
            </div>
          ))}
          <p className="muted">金額は目安です。実際は端数処理をしてから決まります。</p>
        </>
      )}
      {mode === 'amount' && (
        <>
          <p className="muted">合計 {totalLabel} と一致するように入力してください。</p>
          {members.map((m) => (
            <label key={m.id} className="inline">
              <span>
                <MemberName members={members} id={m.id} />
              </span>
              <NumberInput
                value={amounts[m.id] ?? ''}
                onChange={(v) => onAmountsChange({ ...amounts, [m.id]: v })}
                decimal={decimal}
              />
              <span className="unit">{unit}</span>
            </label>
          ))}
        </>
      )}
    </details>
  );
}
