import { useState } from 'react';
import {
  amountSplitDiff,
  equalPercents,
  eventRates,
  gasolineDistance,
  itemAmount,
  itemOriginalAmount,
  toPercents,
} from '../calc';
import {
  CURRENCIES,
  ITEM_CATEGORIES,
  OTHER,
  itemLabel,
  memberColor,
  money,
  newId,
  roundTo,
  toNum,
  yen,
} from '../format';
import type { Currency, Item, ItemKind, Rates, Split, WarikanEvent } from '../types';

type Props = {
  event: WarikanEvent;
  item: Item | null;
  onSave: (item: Item, rates: Rates) => void;
  onCancel: () => void;
};

const str = (n: number | undefined) => (n == null ? '' : String(n));

const DORAPLA_URL = 'https://www.driveplaza.com/';

// 種類の選択肢。通常項目はカテゴリ名、ガソリン・ETCは専用の値
const GASOLINE = '__gasoline';
const ETC = '__etc';

function initChoice(item: Item | null): string {
  if (!item) return ITEM_CATEGORIES[0];
  if (item.kind === 'gasoline') return GASOLINE;
  if (item.kind === 'etc') return ETC;
  return item.category && ITEM_CATEGORIES.includes(item.category) ? item.category : OTHER;
}

export default function ItemForm({ event, item, onSave, onCancel }: Props) {
  const { members } = event;
  const ids = members.map((m) => m.id);
  const [choice, setChoice] = useState(() => initChoice(item));
  const [customCategory, setCustomCategory] = useState(
    item?.kind === 'normal' && item.category && !ITEM_CATEGORIES.includes(item.category) && item.category !== OTHER
      ? item.category
      : '',
  );
  const kind: ItemKind = choice === GASOLINE ? 'gasoline' : choice === ETC ? 'etc' : 'normal';

  const [name, setName] = useState(item?.name ?? '');
  const [payerId, setPayerId] = useState(item?.payerId ?? members[0].id);
  const [currency, setCurrency] = useState<Currency>(item?.currency ?? 'JPY');
  const [amount, setAmount] = useState(item?.kind === 'normal' ? str(item.amount) : '');
  const initRates = eventRates(event);
  const [rateInput, setRateInput] = useState({ USD: str(initRates.USD), KRW: str(initRates.KRW) });

  // ガソリン
  const g = item?.gasoline;
  const [gMode, setGMode] = useState<'odometer' | 'distance'>(g?.inputMode ?? 'distance');
  const [odoStart, setOdoStart] = useState(str(g?.odoStart));
  const [odoEnd, setOdoEnd] = useState(str(g?.odoEnd));
  const [distance, setDistance] = useState(str(g?.distanceKm));
  const [economy, setEconomy] = useState(str(g?.fuelEconomy));
  const [unitPrice, setUnitPrice] = useState(str(g?.unitPrice));

  // ETC
  const e = item?.etc;
  const [entryIc, setEntryIc] = useState(e?.entryIc ?? '');
  const [exitIc, setExitIc] = useState(e?.exitIc ?? '');
  const [passedAt, setPassedAt] = useState(e?.passedAt ?? '');
  const [vehicleClass, setVehicleClass] = useState(e?.vehicleClass ?? '普通車');
  const [discount, setDiscount] = useState(e?.discount ?? 'なし');
  const [estimated, setEstimated] = useState(str(e?.estimated));
  const [confirmed, setConfirmed] = useState(str(e?.confirmed));

  // 負担の割り方
  const initSplit = item?.split;
  const [mode, setMode] = useState<Split['mode']>(initSplit?.mode ?? 'equal');
  const [percents, setPercents] = useState<Record<string, number>>(() =>
    initSplit?.mode === 'ratio' ? toPercents(initSplit.ratios, ids) : equalPercents(ids),
  );
  const [amounts, setAmounts] = useState<Record<string, string>>(
    Object.fromEntries(
      members.map((m) => [m.id, initSplit?.mode === 'amount' ? str(initSplit.amounts[m.id] ?? 0) : '']),
    ),
  );

  const itemCur: Currency = kind === 'normal' ? currency : 'JPY';
  const decimals = CURRENCIES[itemCur].decimals;
  const percentSum = ids.reduce((a, id) => a + (percents[id] ?? 0), 0);

  /** 合計が100%を超えないように、1人の%を設定する */
  const setPercent = (id: string, value: number) => {
    const others = percentSum - (percents[id] ?? 0);
    const v = Math.max(0, Math.min(Math.round(value) || 0, 100 - others));
    setPercents({ ...percents, [id]: v });
  };

  const rates: Rates = {
    ...initRates,
    USD: toNum(rateInput.USD) ?? initRates.USD,
    KRW: toNum(rateInput.KRW) ?? initRates.KRW,
  };

  const build = (): Item => {
    const split: Split =
      mode === 'equal'
        ? { mode: 'equal' }
        : mode === 'ratio'
          ? { mode: 'ratio', ratios: Object.fromEntries(ids.map((id) => [id, percents[id] ?? 0])) }
          : {
              mode: 'amount',
              amounts: Object.fromEntries(ids.map((id) => [id, roundTo(toNum(amounts[id] ?? '') ?? 0, decimals)])),
            };
    return {
      id: item?.id ?? newId(),
      name: name.trim(),
      kind,
      category: kind === 'normal' ? (choice === OTHER ? customCategory.trim() || OTHER : choice) : undefined,
      payerId,
      currency: kind === 'normal' ? currency : undefined,
      amount: kind === 'normal' ? roundTo(toNum(amount) ?? 0, decimals) : 0,
      split,
      gasoline:
        kind === 'gasoline'
          ? {
              inputMode: gMode,
              odoStart: toNum(odoStart),
              odoEnd: toNum(odoEnd),
              distanceKm: toNum(distance),
              fuelEconomy: toNum(economy) ?? 0,
              unitPrice: toNum(unitPrice) ?? 0,
            }
          : undefined,
      etc:
        kind === 'etc'
          ? {
              entryIc,
              exitIc,
              passedAt,
              vehicleClass,
              discount,
              estimated: toNum(estimated),
              confirmed: toNum(confirmed),
            }
          : undefined,
    };
  };

  const preview = build();
  const original = itemOriginalAmount(preview);
  const total = itemAmount(preview, rates);
  const diff = amountSplitDiff(preview);

  const errors: string[] = [];
  if (!name.trim()) errors.push('項目名を入力してください');
  if (kind === 'normal' && (toNum(amount) ?? 0) <= 0) errors.push('金額を入力してください');
  if (itemCur !== 'JPY' && (toNum(rateInput[itemCur]) ?? 0) <= 0) errors.push('為替レートを入力してください');
  if (kind === 'gasoline') {
    if (gasolineDistance(preview.gasoline!) <= 0) errors.push('走行距離を入力してください');
    if ((toNum(economy) ?? 0) <= 0) errors.push('燃費を入力してください');
    if ((toNum(unitPrice) ?? 0) <= 0) errors.push('ガソリン単価を入力してください');
  }
  if (mode === 'ratio' && percentSum !== 100) errors.push(`比率の合計を100%にしてください（残り${100 - percentSum}%）`);
  if (mode === 'amount' && diff !== 0)
    errors.push(`負担額の合計が項目金額と合っていません（差：${money(diff ?? 0, itemCur)}）`);

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (errors.length === 0) onSave(build(), rates);
  };

  return (
    <form className="card" onSubmit={submit}>
      <h2>{item ? '項目を編集' : '項目を追加'}</h2>

      <label>
        種類
        <select value={choice} onChange={(ev) => setChoice(ev.target.value)}>
          {ITEM_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {itemLabel({ ...preview, kind: 'normal', category: c })}
            </option>
          ))}
          <option value={GASOLINE}>⛽ ガソリン代</option>
          <option value={ETC}>🛣️ ETC</option>
          <option value={OTHER}>✏️ その他（自由入力）</option>
        </select>
      </label>
      {choice === OTHER && (
        <label>
          種類名
          <input
            value={customCategory}
            onChange={(ev) => setCustomCategory(ev.target.value)}
            placeholder="例：お土産、レンタカー、チップ"
          />
        </label>
      )}
      <label>
        項目名
        <input
          value={name}
          onChange={(ev) => setName(ev.target.value)}
          placeholder={kind === 'gasoline' ? '例：ガソリン代' : kind === 'etc' ? '例：往路ETC' : '例：ホテル'}
        />
      </label>
      <label>
        立て替え者
        <select value={payerId} onChange={(ev) => setPayerId(ev.target.value)}>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nickname}
            </option>
          ))}
        </select>
      </label>

      {kind === 'normal' && (
        <>
          <label>
            通貨
            <select value={currency} onChange={(ev) => setCurrency(ev.target.value as Currency)}>
              {(Object.keys(CURRENCIES) as Currency[]).map((c) => (
                <option key={c} value={c}>
                  {CURRENCIES[c].label}
                </option>
              ))}
            </select>
          </label>
          <label>
            金額（{CURRENCIES[currency].unit}）
            <input
              type="number"
              inputMode={decimals > 0 ? 'decimal' : 'numeric'}
              min="0"
              step={decimals > 0 ? '0.01' : '1'}
              value={amount}
              onChange={(ev) => setAmount(ev.target.value)}
            />
          </label>
          {currency !== 'JPY' && (
            <>
              <label className="inline">
                <span>1{CURRENCIES[currency].unit} ＝</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={rateInput[currency]}
                  onChange={(ev) => setRateInput({ ...rateInput, [currency]: ev.target.value })}
                />
                <span className="unit">円</span>
              </label>
              <p className="muted">
                為替レートは、このイベントの{CURRENCIES[currency].label}の項目すべてに使われます。初期値は目安なので、実際のレートに直してください。
              </p>
              <p className="calc">
                {money(original, currency)} → 精算額 <strong>{yen(total)}</strong>
              </p>
            </>
          )}
        </>
      )}

      {kind === 'gasoline' && (
        <fieldset>
          <legend>ガソリン代</legend>
          <div className="radios">
            <label>
              <input type="radio" checked={gMode === 'distance'} onChange={() => setGMode('distance')} />
              距離を直接入力
            </label>
            <label>
              <input type="radio" checked={gMode === 'odometer'} onChange={() => setGMode('odometer')} />
              オドメーターから計算
            </label>
          </div>
          {gMode === 'distance' ? (
            <label>
              走行距離（km）
              <input type="number" inputMode="decimal" min="0" value={distance} onChange={(ev) => setDistance(ev.target.value)} />
            </label>
          ) : (
            <>
              <label>
                出発時のオドメーター（km）
                <input type="number" inputMode="decimal" min="0" value={odoStart} onChange={(ev) => setOdoStart(ev.target.value)} />
              </label>
              <label>
                到着時のオドメーター（km）
                <input type="number" inputMode="decimal" min="0" value={odoEnd} onChange={(ev) => setOdoEnd(ev.target.value)} />
              </label>
            </>
          )}
          <label>
            燃費（km/L）
            <input type="number" inputMode="decimal" min="0" step="0.1" value={economy} onChange={(ev) => setEconomy(ev.target.value)} />
          </label>
          <label>
            ガソリン単価（円/L）
            <input type="number" inputMode="decimal" min="0" value={unitPrice} onChange={(ev) => setUnitPrice(ev.target.value)} />
          </label>
          <p className="calc">
            走行距離 {gasolineDistance(preview.gasoline!)}km ÷ 燃費 × 単価 ＝ <strong>{yen(total)}</strong>
          </p>
        </fieldset>
      )}

      {kind === 'etc' && (
        <fieldset>
          <legend>ETC</legend>
          <label>
            入口IC
            <input value={entryIc} onChange={(ev) => setEntryIc(ev.target.value)} />
          </label>
          <label>
            出口IC
            <input value={exitIc} onChange={(ev) => setExitIc(ev.target.value)} />
          </label>
          <label>
            通過日時
            <input type="datetime-local" value={passedAt} onChange={(ev) => setPassedAt(ev.target.value)} />
          </label>
          <label>
            車種区分
            <select value={vehicleClass} onChange={(ev) => setVehicleClass(ev.target.value)}>
              <option>軽自動車等</option>
              <option>普通車</option>
              <option>中型車</option>
              <option>大型車</option>
              <option>特大車</option>
            </select>
          </label>
          <label>
            適用割引
            <select value={discount} onChange={(ev) => setDiscount(ev.target.value)}>
              <option>なし</option>
              <option>深夜割引</option>
              <option>休日割引</option>
              <option>その他</option>
            </select>
          </label>
          <label>
            概算額（円）
            <input type="number" inputMode="numeric" min="0" value={estimated} onChange={(ev) => setEstimated(ev.target.value)} />
          </label>
          <p className="muted">
            概算額は{' '}
            <a href={DORAPLA_URL} target="_blank" rel="noreferrer">
              NEXCOの料金検索（ドラぷら）
            </a>{' '}
            で調べられます。
          </p>
          <label>
            確定額（円）
            <input type="number" inputMode="numeric" min="0" value={confirmed} onChange={(ev) => setConfirmed(ev.target.value)} />
          </label>
          <p className="calc">
            精算に使う金額：<strong>{yen(total)}</strong>（確定額があれば確定額、なければ概算額）
          </p>
        </fieldset>
      )}

      <fieldset>
        <legend>負担の割り方</legend>
        <div className="radios">
          <label>
            <input type="radio" checked={mode === 'equal'} onChange={() => setMode('equal')} />
            均等割り
          </label>
          <label>
            <input type="radio" checked={mode === 'ratio'} onChange={() => setMode('ratio')} />
            比率指定（%）
          </label>
          <label>
            <input type="radio" checked={mode === 'amount'} onChange={() => setMode('amount')} />
            金額指定
          </label>
        </div>
        {mode === 'equal' && <p className="muted">全員で均等に割ります。</p>}
        {mode === 'ratio' && (
          <>
            <div className="gauge" role="img" aria-label={`合計${percentSum}%`}>
              {members.map((m, i) =>
                (percents[m.id] ?? 0) > 0 ? (
                  <div
                    key={m.id}
                    className="gauge-seg"
                    style={{ width: `${percents[m.id]}%`, background: memberColor(i) }}
                    title={`${m.nickname} ${percents[m.id]}%`}
                  >
                    {percents[m.id] >= 12 ? m.nickname : ''}
                  </div>
                ) : null,
              )}
            </div>
            <div className="gauge-total">
              <span className={percentSum === 100 ? 'ok' : 'ng'}>合計 {percentSum}% / 100%</span>
              <button type="button" onClick={() => setPercents(equalPercents(ids))}>
                均等にする
              </button>
            </div>
            <p className="muted">合計は100%までです。0%の人は対象外になります。</p>
            {members.map((m, i) => (
              <div key={m.id} className="pct-row">
                <span className="dot" style={{ background: memberColor(i) }} />
                <span className="pct-name">{m.nickname}</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={percents[m.id] ?? 0}
                  onChange={(ev) => setPercent(m.id, Number(ev.target.value))}
                  style={{ accentColor: memberColor(i) }}
                  aria-label={`${m.nickname}の比率`}
                />
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="100"
                  className="pct-input"
                  value={percents[m.id] ?? 0}
                  onChange={(ev) => setPercent(m.id, Number(ev.target.value))}
                />
                <span className="unit">%</span>
                <span className="pct-yen">{yen(Math.round((total * (percents[m.id] ?? 0)) / 100))}</span>
              </div>
            ))}
            <p className="muted">金額は目安です。実際は端数処理をしてから決まります。</p>
          </>
        )}
        {mode === 'amount' && (
          <>
            <p className="muted">項目金額 {money(original, itemCur)} と合計が一致するように入力してください。</p>
            {members.map((m) => (
              <label key={m.id} className="inline">
                <span>{m.nickname}</span>
                <input
                  type="number"
                  inputMode={decimals > 0 ? 'decimal' : 'numeric'}
                  min="0"
                  step={decimals > 0 ? '0.01' : '1'}
                  value={amounts[m.id]}
                  onChange={(ev) => setAmounts({ ...amounts, [m.id]: ev.target.value })}
                />
                <span className="unit">{CURRENCIES[itemCur].unit}</span>
              </label>
            ))}
          </>
        )}
      </fieldset>

      {errors.length > 0 && (
        <ul className="errors">
          {errors.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )}
      <div className="row">
        <button type="button" onClick={onCancel}>
          キャンセル
        </button>
        <button type="submit" className="primary" disabled={errors.length > 0}>
          保存
        </button>
      </div>
    </form>
  );
}
