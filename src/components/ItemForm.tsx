import { useState } from 'react';
import {
  amountSplitDiff,
  equalPercents,
  eventCurrencies,
  eventRates,
  gasolineDistance,
  itemAmount,
  itemOriginalAmount,
  sortItemsNewestFirst,
  toPercents,
  tollEstimate,
} from '../calc';
import {
  CURRENCIES,
  ITEM_CATEGORIES,
  OTHER,
  itemLabel,
  itemTitle,
  memberColor,
  money,
  newId,
  normalizeNumber,
  roundTo,
  toNum,
  today,
  yen,
} from '../format';
import { googleMapsRouteUrl, routeDistance } from '../route';
import { amountKey, odometerWarning, rangeWarning } from '../checks';
import { playBuzzer, playCoinSound } from '../sound';
import type { AppSettings, Currency, GasolineMode, Item, ItemKind, Split, WarikanEvent } from '../types';
import FieldWarning from './FieldWarning';
import MemberName from './MemberName';
import NumberInput from './NumberInput';
import SplitEditor, { percentTotal } from './SplitEditor';

type Props = {
  event: WarikanEvent;
  gasolineModes: AppSettings['gasolineModes'];
  item: Item | null;
  onSave: (item: Item) => void;
  onCancel: () => void;
};

const str = (n: number | undefined) => (n == null ? '' : String(n));

const unique = (list: (string | undefined)[]): string[] =>
  [...new Set(list.map((s) => s?.trim() ?? '').filter(Boolean))];

// 種類の選択肢。通常項目はカテゴリ名、ガソリン・高速代は専用の値
const GASOLINE = '__gasoline';
const TOLL = '__etc';

function initChoice(item: Item | null): string {
  if (!item) return ITEM_CATEGORIES[0];
  if (item.kind === 'gasoline') return GASOLINE;
  if (item.kind === 'etc') return TOLL;
  return item.category && ITEM_CATEGORIES.includes(item.category) ? item.category : OTHER;
}

/** 入力を終えたとき(フォーカスが外れたとき)に、注意があれば「ぶっぶー」を鳴らす */
const buzzOn = (check: (value: number | undefined) => string | null) => (ev: React.FocusEvent<HTMLInputElement>) => {
  if (check(toNum(normalizeNumber(ev.currentTarget.value, true)))) playBuzzer();
};

const GAS_MODE_LABELS: Record<GasolineMode, string> = {
  map: '地図で距離を調べる',
  distance: '距離を直接入力',
  odometer: 'メーターから計算',
};

type RouteMsg ={ target: 'gas' | 'toll'; text: string; error?: boolean };

export default function ItemForm({ event, gasolineModes, item, onSave, onCancel }: Props) {
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
  const color = (id: string) => memberColor(members, id);
  const [payerId, setPayerId] = useState(item?.payerId ?? members[0].id);
  const [currency, setCurrency] = useState<Currency>(item?.currency ?? 'JPY');
  const [amount, setAmount] = useState(item?.kind === 'normal' ? str(item.amount) : '');
  const rates = eventRates(event);
  // 円と、設定で使うことにした外貨(編集中の項目の通貨は設定で外していても出す)
  const currencyOptions = (Object.keys(CURRENCIES) as Currency[]).filter(
    (c) => c === 'JPY' || c === item?.currency || eventCurrencies(event).includes(c),
  );

  // 手入力を減らすため、新しい項目は同じ種類の直近の項目から燃費・単価・車種などを引き継ぐ
  const recent = sortItemsNewestFirst(event.items);
  const lastGas = item ? undefined : recent.find((i) => i.kind === 'gasoline')?.gasoline;
  const lastToll = item ? undefined : recent.find((i) => i.kind === 'etc')?.etc;
  // 入力候補(一度入れた地名・IC・種類名)
  const places = unique(event.items.flatMap((i) => [i.gasoline?.from, i.gasoline?.to]));
  const ics = unique(event.items.flatMap((i) => [i.etc?.entryIc, i.etc?.exitIc]));
  const customCategories = unique(
    event.items.map((i) => (i.kind === 'normal' && !ITEM_CATEGORIES.includes(i.category ?? '') ? i.category : '')),
  ).filter((c) => c !== OTHER);

  // ガソリン
  const g = item?.gasoline;
  const [gMode, setGMode] = useState<GasolineMode>(g?.inputMode ?? 'map');
  // 地図は常に使える。ほかの入れ方は設定で有効にしたときだけ(編集中の項目の入れ方は出す)
  const gasModeOptions = (['map', 'distance', 'odometer'] as GasolineMode[]).filter(
    (m) => m === 'map' || m === g?.inputMode || gasolineModes.includes(m as Exclude<GasolineMode, 'map'>),
  );
  const [odoStart, setOdoStart] = useState(str(g?.odoStart));
  const [odoEnd, setOdoEnd] = useState(str(g?.odoEnd));
  const [distance, setDistance] = useState(str(g?.distanceKm));
  const [gFrom, setGFrom] = useState(g?.from ?? '');
  const [gTo, setGTo] = useState(g?.to ?? '');
  const [roundTrip, setRoundTrip] = useState(g?.roundTrip ?? lastGas?.roundTrip ?? false);
  const [economy, setEconomy] = useState(str(g?.fuelEconomy ?? lastGas?.fuelEconomy));
  const [unitPrice, setUnitPrice] = useState(str(g?.unitPrice ?? lastGas?.unitPrice));

  // 高速代
  const e = item?.etc ?? (lastToll && { ...lastToll, amount: undefined, distanceKm: undefined, entryIc: '', exitIc: '', passedAt: '' });
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

  // 負担の割り方(普段は均等割りで、折りたたんでおく)
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
  const percentSum = percentTotal(percents, ids);


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
      playBuzzer();
      setRouteMsg({
        target,
        text: err instanceof Error ? err.message : '距離を調べられませんでした',
        error: true,
      });
    } finally {
      setBusy(false);
    }
  };

  /** 入口IC・出口ICの距離を調べ、料金式で計算した高速代を金額欄に入れる */
  const calcToll = () =>
    findDistance('toll', entryIc, exitIc, (km) => {
      setTollDistance(km);
      const toll = tollEstimate(Number(km), vehicleClass, discount);
      setTollAmount(String(toll));
      if (rangeWarning('toll', toll)) playBuzzer();
    });

  /** 車種・割引を変えたら、計算済みの距離から高速代を計算し直す */
  const changeTollOption = (nextClass: string, nextDiscount: string) => {
    setVehicleClass(nextClass);
    setDiscount(nextDiscount);
    const km = toNum(tollDistance);
    if (tollMode === 'auto' && km && km > 0) setTollAmount(String(tollEstimate(km, nextClass, nextDiscount)));
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
              amount: toNum(tollAmount),
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

  // 通常の値から大きく外れた入力の注意(保存は止めない)
  const amountWarn = kind === 'normal' ? rangeWarning(amountKey(currency), toNum(amount)) : null;
  const distanceWarn = rangeWarning('distance', toNum(distance));
  const odometerWarn = odometerWarning(toNum(odoStart), toNum(odoEnd));
  const economyWarn = rangeWarning('fuelEconomy', toNum(economy));
  const unitPriceWarn = rangeWarning('unitPrice', toNum(unitPrice));
  const tollWarn = rangeWarning('toll', toNum(tollAmount));
  // 今の種類・距離の入れ方で表示している欄の注意だけ
  const activeWarnings = (
    kind === 'normal'
      ? [amountWarn]
      : kind === 'etc'
        ? [tollWarn]
        : [gMode === 'odometer' ? odometerWarn : distanceWarn, economyWarn, unitPriceWarn]
  ).filter((w): w is string => !!w);

  const preview = build();
  const original = itemOriginalAmount(preview);
  const total = itemAmount(preview, rates);
  const diff = amountSplitDiff(preview);

  const errors: string[] = [];
  if (!date) errors.push('日付を選んでください');
  if (kind === 'normal' && (toNum(amount) ?? 0) <= 0) errors.push('金額を入力してください');
  if (kind === 'gasoline') {
    if (gasolineDistance(preview.gasoline!) <= 0)
      errors.push(gMode === 'map' ? '「距離を調べる」を押すか、距離を入力してください' : '走行距離を入力してください');
    if ((toNum(economy) ?? 0) <= 0) errors.push('燃費を入力してください');
    if ((toNum(unitPrice) ?? 0) <= 0) errors.push('ガソリン単価を入力してください');
  }
  if (kind === 'etc' && (toNum(tollAmount) ?? 0) <= 0)
    errors.push(tollMode === 'auto' ? '「自動で計算する」を押すか、高速代を入力してください' : '高速代を入力してください');
  if (mode === 'ratio' && percentSum !== 100) errors.push(`比率の合計を100%にしてください（残り${100 - percentSum}%）`);
  if (mode === 'amount' && diff !== 0)
    errors.push(`負担額の合計が項目金額と合っていません（差：${money(diff ?? 0, itemCur)}）`);

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (errors.length > 0) return;
    // 入力欄から離れずに保存を押した場合も、大きく外れた値があれば知らせて確認する
    if (activeWarnings.length > 0) {
      playBuzzer();
      if (!confirm(`${activeWarnings.join('\n')}\n\nこのまま保存しますか？`)) return;
    }
    playCoinSound();
    onSave(build());
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
            list="custom-categories"
          />
          <datalist id="custom-categories">
            {customCategories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
      )}
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
              <NumberInput value={amount} onChange={setAmount} decimal={decimals > 0} placeholder="0" onBlur={buzzOn((v) => rangeWarning(amountKey(currency), v))} />
              {currencyOptions.length > 1 && (
              <div className="currency-switch" role="radiogroup" aria-label="通貨">
                {currencyOptions.map((c) => (
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
              )}
            </div>
            <FieldWarning message={amountWarn} />
          </div>
          {currency !== 'JPY' && (
            <p className="calc">
              {money(original, currency)} → 精算額 <strong>{yen(total)}</strong>
              <span className="muted">（1{CURRENCIES[currency].unit}＝{rates[currency]}円・レートは⚙️設定で変更）</span>
            </p>
          )}
        </>
      )}

      {kind === 'gasoline' && (
        <fieldset>
          <legend>ガソリン代</legend>
          {gasModeOptions.length > 1 && (
            <div className="radios">
              {gasModeOptions.map((m) => (
                <label key={m}>
                  <input type="radio" checked={gMode === m} onChange={() => setGMode(m)} />
                  {GAS_MODE_LABELS[m]}
                </label>
              ))}
            </div>
          )}
          {gMode === 'map' && (
            <>
              <label>
                出発地
                <input value={gFrom} onChange={(ev) => setGFrom(ev.target.value)} placeholder="例：東京駅" list="places" />
              </label>
              <label>
                目的地
                <input value={gTo} onChange={(ev) => setGTo(ev.target.value)} placeholder="例：箱根湯本駅" list="places" />
              </label>
              <datalist id="places">
                {places.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
              {gFrom.trim() && gTo.trim() && (
                <button type="button" className="swap" onClick={() => { setGFrom(gTo); setGTo(gFrom); }}>
                  ⇅ 出発地と目的地を入れ替え
                </button>
              )}
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
                <NumberInput value={distance} onChange={setDistance} decimal onBlur={buzzOn((v) => rangeWarning('distance', v))} />
                <span className="unit">km</span>
              </label>
              <FieldWarning message={distanceWarn} />
              <label className="check">
                <input type="checkbox" checked={roundTrip} onChange={(ev) => setRoundTrip(ev.target.checked)} />
                往復（距離を2倍にする）
              </label>
            </>
          )}
          {gMode === 'distance' && (
            <label className="inline">
              <span>走行距離</span>
              <NumberInput value={distance} onChange={setDistance} decimal onBlur={buzzOn((v) => rangeWarning('distance', v))} />
              <span className="unit">km</span>
            </label>
          )}
          {gMode === 'distance' && <FieldWarning message={distanceWarn} />}
          {gMode === 'odometer' && (
            <>
              <label className="inline">
                <span>出発時</span>
                <NumberInput value={odoStart} onChange={setOdoStart} decimal onBlur={buzzOn((v) => odometerWarning(v, toNum(odoEnd)))} />
                <span className="unit">km</span>
              </label>
              <label className="inline">
                <span>到着時</span>
                <NumberInput value={odoEnd} onChange={setOdoEnd} decimal onBlur={buzzOn((v) => odometerWarning(toNum(odoStart), v))} />
                <span className="unit">km</span>
              </label>
              <FieldWarning message={odometerWarn} />
            </>
          )}
          <label className="inline">
            <span>燃費</span>
            <NumberInput value={economy} onChange={setEconomy} decimal onBlur={buzzOn((v) => rangeWarning('fuelEconomy', v))} />
            <span className="unit">km/L</span>
          </label>
          <FieldWarning message={economyWarn} />
          <label className="inline">
            <span>ガソリン単価</span>
            <NumberInput value={unitPrice} onChange={setUnitPrice} decimal onBlur={buzzOn((v) => rangeWarning('unitPrice', v))} />
            <span className="unit">円/L</span>
          </label>
          <FieldWarning message={unitPriceWarn} />
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
          {tollMode === 'auto' && (
            <>
              <label>
                入口IC
                <input value={entryIc} onChange={(ev) => setEntryIc(ev.target.value)} placeholder="例：東京IC" list="ics" />
              </label>
              <label>
                出口IC
                <input value={exitIc} onChange={(ev) => setExitIc(ev.target.value)} placeholder="例：御殿場IC" list="ics" />
              </label>
              <datalist id="ics">
                {ics.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
              {entryIc.trim() && exitIc.trim() && (
                <button type="button" className="swap" onClick={() => { setEntryIc(exitIc); setExitIc(entryIc); }}>
                  ⇅ 入口と出口を入れ替え（帰り道）
                </button>
              )}
              <label>
                車種区分
                <select value={vehicleClass} onChange={(ev) => changeTollOption(ev.target.value, discount)}>
                  <option>軽自動車等</option>
                  <option>普通車</option>
                  <option>中型車</option>
                  <option>大型車</option>
                  <option>特大車</option>
                </select>
              </label>
              <label>
                割引
                <select value={discount} onChange={(ev) => changeTollOption(vehicleClass, ev.target.value)}>
                  <option>なし</option>
                  <option value="休日割引">休日割引（30%引き）</option>
                  <option value="深夜割引">深夜割引（30%引き）</option>
                </select>
              </label>
              <div className="route-actions">
                <button type="button" className="primary" disabled={busy} onClick={calcToll}>
                  🧮 自動で計算する
                </button>
                {entryIc.trim() && exitIc.trim() && (
                  <a href={googleMapsRouteUrl(entryIc, exitIc)} target="_blank" rel="noreferrer">
                    Googleマップで確認
                  </a>
                )}
              </div>
              {routeNote('toll')}
            </>
          )}
          <label className="inline">
            <span>高速代</span>
            <NumberInput value={tollAmount} onChange={setTollAmount} placeholder="0" onBlur={buzzOn((v) => rangeWarning('toll', v))} />
            <span className="unit">円</span>
          </label>
          <FieldWarning message={tollWarn} />
          {tollMode === 'auto' && (
            <p className="muted">
              自動で計算した金額は、NEXCOの料金の計算式（距離・車種・長距離割引）による目安です。首都高などの都市高速や、一部の区間の特別料金は含みません。金額は直接直せます。
            </p>
          )}
          <label>
            通過日時（任意）
            <input type="datetime-local" value={passedAt} onChange={(ev) => setPassedAt(ev.target.value)} />
          </label>
        </fieldset>
      )}

      <label>
        詳細（任意）
        <input
          value={name}
          onChange={(ev) => setName(ev.target.value)}
          placeholder={`空欄なら「${itemTitle({ ...preview, name: '' })}」`}
        />
      </label>

      <SplitEditor
        members={members}
        mode={mode}
        onModeChange={setMode}
        percents={percents}
        onPercentsChange={setPercents}
        amounts={amounts}
        onAmountsChange={setAmounts}
        totalYen={total}
        totalLabel={money(original, itemCur)}
        unit={CURRENCIES[itemCur].unit}
        decimal={decimals > 0}
      />

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
