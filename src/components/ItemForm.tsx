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
  memberAvatar,
  money,
  newId,
  roundTo,
  toNum,
  today,
  yen,
} from '../format';
import { googleMapsRouteUrl, routeDistance } from '../route';
import { playCoinSound } from '../sound';
import type { Currency, Item, ItemKind, Rates, Split, WarikanEvent } from '../types';
import MemberName from './MemberName';
import NumberInput from './NumberInput';

type Props = {
  event: WarikanEvent;
  item: Item | null;
  onSave: (item: Item, rates: Rates) => void;
  onCancel: () => void;
};

const str = (n: number | undefined) => (n == null ? '' : String(n));

// 種類の選択肢。通常項目はカテゴリ名、ガソリン・高速代は専用の値
const GASOLINE = '__gasoline';
const TOLL = '__etc';

function initChoice(item: Item | null): string {
  if (!item) return ITEM_CATEGORIES[0];
  if (item.kind === 'gasoline') return GASOLINE;
  if (item.kind === 'etc') return TOLL;
  return item.category && ITEM_CATEGORIES.includes(item.category) ? item.category : OTHER;
}

type RouteMsg = { target: 'gas' | 'toll'; text: string; error?: boolean };

export default function ItemForm({ event, item, onSave, onCancel }: Props) {
  const { members } = event;
  const ids = members.map((m) => m.id);
  const [choice, setChoice] = useState(() => initChoice(item));
  const [customCategory, setCustomCategory] = useState(
    item?.kind === 'normal' && item.category && !ITEM_CATEGORIES.includes(item.category) && item.category !== OTHER
      ? item.category
      : '',
  );
  const kind: ItemKind = choice === GASOLINE ? 'gasoline' : choice === TOLL ? 'etc' : 'normal';

  const [date, setDate] = useState(item ? (item.date ?? '') : today());
  const [name, setName] = useState(item?.name ?? '');
  const color = (id: string) => memberAvatar(members, id).color;
  const [payerId, setPayerId] = useState(item?.payerId ?? members[0].id);
  const [currency, setCurrency] = useState<Currency>(item?.currency ?? 'JPY');
  const [amount, setAmount] = useState(item?.kind === 'normal' ? str(item.amount) : '');
  const initRates = eventRates(event);
  const [rateInput, setRateInput] = useState({ USD: str(initRates.USD), KRW: str(initRates.KRW) });

  // ガソリン
  const g = item?.gasoline;
  const [gMode, setGMode] = useState<'odometer' | 'distance' | 'map'>(g?.inputMode ?? 'map');
  const [odoStart, setOdoStart] = useState(str(g?.odoStart));
  const [odoEnd, setOdoEnd] = useState(str(g?.odoEnd));
  const [distance, setDistance] = useState(str(g?.distanceKm));
  const [gFrom, setGFrom] = useState(g?.from ?? '');
  const [gTo, setGTo] = useState(g?.to ?? '');
  const [roundTrip, setRoundTrip] = useState(g?.roundTrip ?? false);
  const [economy, setEconomy] = useState(str(g?.fuelEconomy));
  const [unitPrice, setUnitPrice] = useState(str(g?.unitPrice));

  // 高速代
  const e = item?.etc;
  const [tollMode, setTollMode] = useState<'manual' | 'auto'>(e?.mode ?? 'manual');
  const [tollAmount, setTollAmount] = useState(str(e?.amount ?? e?.confirmed ?? e?.estimated));
  const [tollDistance, setTollDistance] = useState(str(e?.distanceKm));
  const [entryIc, setEntryIc] = useState(e?.entryIc ?? '');
  const [exitIc, setExitIc] = useState(e?.exitIc ?? '');
  const [passedAt, setPassedAt] = useState(e?.passedAt ?? '');
  const [vehicleClass, setVehicleClass] = useState(e?.vehicleClass ?? '普通車');
  const [discount, setDiscount] = useState(e?.discount ?? 'なし');

  // 地図から距離を調べる
  const [routeMsg, setRouteMsg] = useState<RouteMsg | null>(null);
  const [busy, setBusy] = useState(false);

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

  const findDistance = async (target: RouteMsg['target'], from: string, to: string, set: (km: string) => void) => {
    if (!from.trim() || !to.trim()) {
      setRouteMsg({ target, text: '出発地と目的地の両方を入力してください', error: true });
      return;
    }
    setBusy(true);
    setRouteMsg({ target, text: '距離を調べています…' });
    try {
      const r = await routeDistance(from, to);
      set(String(r.km));
      setRouteMsg({ target, text: `${r.from} → ${r.to}：片道 ${r.km}km（車のルート）` });
    } catch (err) {
      setRouteMsg({
        target,
        text: err instanceof Error ? err.message : '距離を調べられませんでした',
        error: true,
      });
    } finally {
      setBusy(false);
    }
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
      date: date || undefined,
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
              from: gFrom.trim() || undefined,
              to: gTo.trim() || undefined,
              roundTrip,
              fuelEconomy: toNum(economy) ?? 0,
              unitPrice: toNum(unitPrice) ?? 0,
            }
          : undefined,
      etc:
        kind === 'etc'
          ? {
              mode: tollMode,
              amount: tollMode === 'manual' ? toNum(tollAmount) : undefined,
              distanceKm: toNum(tollDistance),
              entryIc,
              exitIc,
              passedAt,
              vehicleClass,
              discount,
            }
          : undefined,
    };
  };

  const preview = build();
  const original = itemOriginalAmount(preview);
  const total = itemAmount(preview, rates);
  const diff = amountSplitDiff(preview);

  const errors: string[] = [];
  if (!date) errors.push('日付を選んでください');
  if (!name.trim()) errors.push('項目名を入力してください');
  if (kind === 'normal' && (toNum(amount) ?? 0) <= 0) errors.push('金額を入力してください');
  if (itemCur !== 'JPY' && (toNum(rateInput[itemCur]) ?? 0) <= 0) errors.push('為替レートを入力してください');
  if (kind === 'gasoline') {
    if (gasolineDistance(preview.gasoline!) <= 0)
      errors.push(gMode === 'map' ? '「距離を調べる」を押すか、距離を入力してください' : '走行距離を入力してください');
    if ((toNum(economy) ?? 0) <= 0) errors.push('燃費を入力してください');
    if ((toNum(unitPrice) ?? 0) <= 0) errors.push('ガソリン単価を入力してください');
  }
  if (kind === 'etc') {
    if (tollMode === 'manual' && (toNum(tollAmount) ?? 0) <= 0) errors.push('高速代を入力してください');
    if (tollMode === 'auto' && (toNum(tollDistance) ?? 0) <= 0)
      errors.push('「距離を調べる」を押すか、高速道路の距離を入力してください');
  }
  if (mode === 'ratio' && percentSum !== 100) errors.push(`比率の合計を100%にしてください（残り${100 - percentSum}%）`);
  if (mode === 'amount' && diff !== 0)
    errors.push(`負担額の合計が項目金額と合っていません（差：${money(diff ?? 0, itemCur)}）`);

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (errors.length > 0) return;
    playCoinSound();
    onSave(build(), rates);
  };

  const routeNote = (target: RouteMsg['target']) =>
    routeMsg?.target === target && <p className={routeMsg.error ? 'route-error' : 'muted'}>{routeMsg.text}</p>;

  return (
    <form className="card" onSubmit={submit}>
      <h2>{item ? '項目を編集' : '項目を追加'}</h2>

      <label>
        📅 日付
        <input type="date" value={date} onChange={(ev) => setDate(ev.target.value)} />
      </label>
      <label>
        種類
        <select value={choice} onChange={(ev) => setChoice(ev.target.value)}>
          {ITEM_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {itemLabel({ ...preview, kind: 'normal', category: c })}
            </option>
          ))}
          <option value={GASOLINE}>⛽ ガソリン代</option>
          <option value={TOLL}>🛣️ 高速代</option>
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
          placeholder={kind === 'gasoline' ? '例：ガソリン代' : kind === 'etc' ? '例：往路の高速代' : '例：ホテル'}
        />
      </label>
      <div className="field">
        <span className="field-label">立て替え者</span>
        <div className="payer-chips" role="radiogroup" aria-label="立て替え者">
          {members.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={payerId === m.id}
              className={`payer-chip${payerId === m.id ? ' selected' : ''}`}
              style={payerId === m.id ? { borderColor: color(m.id), background: `${color(m.id)}1a` } : undefined}
              onClick={() => setPayerId(m.id)}
            >
              <MemberName members={members} id={m.id} />
            </button>
          ))}
        </div>
      </div>

      {kind === 'normal' && (
        <>
          <div className="field">
            <span className="field-label">金額（{CURRENCIES[currency].unit}）</span>
            <div className="amount-row">
              <NumberInput value={amount} onChange={setAmount} decimal={decimals > 0} placeholder="0" />
              <div className="currency-switch" role="radiogroup" aria-label="通貨">
                {(Object.keys(CURRENCIES) as Currency[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={currency === c}
                    className={currency === c ? 'on' : ''}
                    onClick={() => setCurrency(c)}
                  >
                    {CURRENCIES[c].unit}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {currency !== 'JPY' && (
            <>
              <label className="inline">
                <span>1{CURRENCIES[currency].unit} ＝</span>
                <NumberInput
                  value={rateInput[currency]}
                  onChange={(v) => setRateInput({ ...rateInput, [currency]: v })}
                  decimal
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
              <input type="radio" checked={gMode === 'map'} onChange={() => setGMode('map')} />
              地図で距離を調べる
            </label>
            <label>
              <input type="radio" checked={gMode === 'distance'} onChange={() => setGMode('distance')} />
              距離を直接入力
            </label>
            <label>
              <input type="radio" checked={gMode === 'odometer'} onChange={() => setGMode('odometer')} />
              オドメーターから計算
            </label>
          </div>
          {gMode === 'map' && (
            <>
              <label>
                出発地
                <input value={gFrom} onChange={(ev) => setGFrom(ev.target.value)} placeholder="例：東京駅" />
              </label>
              <label>
                目的地
                <input value={gTo} onChange={(ev) => setGTo(ev.target.value)} placeholder="例：箱根湯本駅" />
              </label>
              <div className="route-actions">
                <button
                  type="button"
                  className="primary"
                  disabled={busy}
                  onClick={() => findDistance('gas', gFrom, gTo, setDistance)}
                >
                  🗺️ 距離を調べる
                </button>
                {gFrom.trim() && gTo.trim() && (
                  <a href={googleMapsRouteUrl(gFrom, gTo)} target="_blank" rel="noreferrer">
                    Googleマップで確認
                  </a>
                )}
              </div>
              {routeNote('gas')}
              <label className="inline">
                <span>片道の距離</span>
                <NumberInput value={distance} onChange={setDistance} decimal />
                <span className="unit">km</span>
              </label>
              <label className="check">
                <input type="checkbox" checked={roundTrip} onChange={(ev) => setRoundTrip(ev.target.checked)} />
                往復（距離を2倍にする）
              </label>
            </>
          )}
          {gMode === 'distance' && (
            <label className="inline">
              <span>走行距離</span>
              <NumberInput value={distance} onChange={setDistance} decimal />
              <span className="unit">km</span>
            </label>
          )}
          {gMode === 'odometer' && (
            <>
              <label className="inline">
                <span>出発時</span>
                <NumberInput value={odoStart} onChange={setOdoStart} decimal />
                <span className="unit">km</span>
              </label>
              <label className="inline">
                <span>到着時</span>
                <NumberInput value={odoEnd} onChange={setOdoEnd} decimal />
                <span className="unit">km</span>
              </label>
            </>
          )}
          <label className="inline">
            <span>燃費</span>
            <NumberInput value={economy} onChange={setEconomy} decimal />
            <span className="unit">km/L</span>
          </label>
          <label className="inline">
            <span>ガソリン単価</span>
            <NumberInput value={unitPrice} onChange={setUnitPrice} decimal />
            <span className="unit">円/L</span>
          </label>
          <p className="calc">
            走行距離 {gasolineDistance(preview.gasoline!)}km ÷ 燃費 × 単価 ＝ <strong>{yen(total)}</strong>
          </p>
        </fieldset>
      )}

      {kind === 'etc' && (
        <fieldset>
          <legend>高速代</legend>
          <div className="radios">
            <label>
              <input type="radio" checked={tollMode === 'manual'} onChange={() => setTollMode('manual')} />
              手入力
            </label>
            <label>
              <input type="radio" checked={tollMode === 'auto'} onChange={() => setTollMode('auto')} />
              自動計算
            </label>
          </div>
          {tollMode === 'manual' ? (
            <label className="inline">
              <span>高速代</span>
              <NumberInput value={tollAmount} onChange={setTollAmount} placeholder="0" />
              <span className="unit">円</span>
            </label>
          ) : (
            <>
              <label>
                入口IC
                <input value={entryIc} onChange={(ev) => setEntryIc(ev.target.value)} placeholder="例：東京IC" />
              </label>
              <label>
                出口IC
                <input value={exitIc} onChange={(ev) => setExitIc(ev.target.value)} placeholder="例：御殿場IC" />
              </label>
              <div className="route-actions">
                <button
                  type="button"
                  className="primary"
                  disabled={busy}
                  onClick={() => findDistance('toll', entryIc, exitIc, setTollDistance)}
                >
                  🗺️ 距離を調べる
                </button>
                {entryIc.trim() && exitIc.trim() && (
                  <a href={googleMapsRouteUrl(entryIc, exitIc)} target="_blank" rel="noreferrer">
                    Googleマップで確認
                  </a>
                )}
              </div>
              {routeNote('toll')}
              <label className="inline">
                <span>高速道路の距離</span>
                <NumberInput value={tollDistance} onChange={setTollDistance} decimal />
                <span className="unit">km</span>
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
                割引
                <select value={discount} onChange={(ev) => setDiscount(ev.target.value)}>
                  <option>なし</option>
                  <option value="休日割引">休日割引（30%引き）</option>
                  <option value="深夜割引">深夜割引（30%引き）</option>
                </select>
              </label>
              <p className="calc">
                自動計算の高速代：<strong>{yen(total)}</strong>
              </p>
              <p className="muted">
                NEXCOの料金の計算式（距離・車種・長距離割引）で出した目安です。首都高などの都市高速や、一部の区間の特別料金は含みません。
              </p>
            </>
          )}
          <label>
            通過日時（任意）
            <input type="datetime-local" value={passedAt} onChange={(ev) => setPassedAt(ev.target.value)} />
          </label>
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
              {members.map((m) =>
                (percents[m.id] ?? 0) > 0 ? (
                  <div
                    key={m.id}
                    className="gauge-seg"
                    style={{ width: `${percents[m.id]}%`, background: color(m.id) }}
                    title={`${m.nickname} ${percents[m.id]}%`}
                  >
                    {percents[m.id] >= 6 ? memberAvatar(members, m.id).emoji : ''}
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
            {members.map((m) => (
              <div key={m.id} className="pct-row">
                <span className="pct-name">
                  <MemberName members={members} id={m.id} />
                </span>
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
                <span>
                  <MemberName members={members} id={m.id} />
                </span>
                <NumberInput
                  value={amounts[m.id]}
                  onChange={(v) => setAmounts({ ...amounts, [m.id]: v })}
                  decimal={decimals > 0}
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
      {((kind === 'gasoline' && gMode === 'map') || (kind === 'etc' && tollMode === 'auto')) && (
        <p className="attribution">地図の距離: © OpenStreetMap contributors / OSRM</p>
      )}
    </form>
  );
}
