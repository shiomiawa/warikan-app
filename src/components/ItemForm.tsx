import { useState } from 'react';
import { amountSplitDiff, gasolineDistance, itemAmount } from '../calc';
import { newId, toNum, yen } from '../format';
import type { Item, ItemKind, Split, WarikanEvent } from '../types';

type Props = {
  event: WarikanEvent;
  item: Item | null;
  onSave: (item: Item) => void;
  onCancel: () => void;
};

const str = (n: number | undefined) => (n == null ? '' : String(n));

const DORAPLA_URL = 'https://www.driveplaza.com/';

export default function ItemForm({ event, item, onSave, onCancel }: Props) {
  const { members } = event;
  const [kind, setKind] = useState<ItemKind>(item?.kind ?? 'normal');
  const [name, setName] = useState(item?.name ?? '');
  const [payerId, setPayerId] = useState(item?.payerId ?? members[0].id);
  const [amount, setAmount] = useState(item?.kind === 'normal' ? str(item.amount) : '');

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
  const [ratios, setRatios] = useState<Record<string, string>>(
    Object.fromEntries(
      members.map((m) => [m.id, initSplit?.mode === 'ratio' ? str(initSplit.ratios[m.id] ?? 0) : '1']),
    ),
  );
  const [amounts, setAmounts] = useState<Record<string, string>>(
    Object.fromEntries(
      members.map((m) => [m.id, initSplit?.mode === 'amount' ? str(initSplit.amounts[m.id] ?? 0) : '']),
    ),
  );

  const numMap = (m: Record<string, string>) =>
    Object.fromEntries(members.map((x) => [x.id, toNum(m[x.id] ?? '') ?? 0]));

  const build = (): Item => {
    const split: Split =
      mode === 'equal'
        ? { mode: 'equal' }
        : mode === 'ratio'
          ? { mode: 'ratio', ratios: numMap(ratios) }
          : { mode: 'amount', amounts: numMap(amounts) };
    return {
      id: item?.id ?? newId(),
      name: name.trim(),
      kind,
      payerId,
      amount: kind === 'normal' ? Math.round(toNum(amount) ?? 0) : 0,
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
  const total = itemAmount(preview);
  const diff = amountSplitDiff(preview);
  const ratioSum = Object.values(numMap(ratios)).reduce((a, b) => a + b, 0);

  const errors: string[] = [];
  if (!name.trim()) errors.push('項目名を入力してください');
  if (kind === 'normal' && (toNum(amount) ?? 0) <= 0) errors.push('金額を入力してください');
  if (kind === 'gasoline') {
    if (gasolineDistance(preview.gasoline!) <= 0) errors.push('走行距離を入力してください');
    if ((toNum(economy) ?? 0) <= 0) errors.push('燃費を入力してください');
    if ((toNum(unitPrice) ?? 0) <= 0) errors.push('ガソリン単価を入力してください');
  }
  if (mode === 'ratio' && ratioSum <= 0) errors.push('比率を1人以上に設定してください');
  if (mode === 'amount' && diff !== 0) errors.push(`負担額の合計が項目金額と合っていません（差：${yen(diff ?? 0)}）`);

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (errors.length === 0) onSave(build());
  };

  return (
    <form className="card" onSubmit={submit}>
      <h2>{item ? '項目を編集' : '項目を追加'}</h2>

      <label>
        種類
        <select value={kind} onChange={(ev) => setKind(ev.target.value as ItemKind)}>
          <option value="normal">通常（飲食・宿泊など）</option>
          <option value="gasoline">ガソリン代</option>
          <option value="etc">ETC</option>
        </select>
      </label>
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
        <label>
          金額（円）
          <input type="number" inputMode="numeric" min="0" value={amount} onChange={(ev) => setAmount(ev.target.value)} />
        </label>
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
            比率指定
          </label>
          <label>
            <input type="radio" checked={mode === 'amount'} onChange={() => setMode('amount')} />
            金額指定
          </label>
        </div>
        {mode === 'equal' && <p className="muted">全員で均等に割ります。</p>}
        {mode === 'ratio' && (
          <>
            <p className="muted">比率が0の人は対象外になります。</p>
            {members.map((m) => (
              <label key={m.id} className="inline">
                <span>{m.nickname}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={ratios[m.id]}
                  onChange={(ev) => setRatios({ ...ratios, [m.id]: ev.target.value })}
                />
              </label>
            ))}
          </>
        )}
        {mode === 'amount' && (
          <>
            <p className="muted">項目金額 {yen(total)} と合計が一致するように入力してください。</p>
            {members.map((m) => (
              <label key={m.id} className="inline">
                <span>{m.nickname}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={amounts[m.id]}
                  onChange={(ev) => setAmounts({ ...amounts, [m.id]: ev.target.value })}
                />
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
