import { useState } from 'react';
import { EVENT_KINDS, OTHER, eventIcon } from '../format';

type Props = { value: string; onChange: (kind: string) => void };

/** イベントの種類。「その他」を選ぶと自由に入力できる */
export default function KindField({ value, onChange }: Props) {
  const [choice, setChoice] = useState(EVENT_KINDS.includes(value) ? value : OTHER);
  const [custom, setCustom] = useState(EVENT_KINDS.includes(value) || value === OTHER ? '' : value);

  return (
    <>
      <label>
        種類
        <select
          value={choice}
          onChange={(e) => {
            setChoice(e.target.value);
            onChange(e.target.value === OTHER ? custom.trim() || OTHER : e.target.value);
          }}
        >
          {EVENT_KINDS.map((k) => (
            <option key={k} value={k}>
              {eventIcon(k)} {k}
            </option>
          ))}
          <option value={OTHER}>🎉 その他（自由入力）</option>
        </select>
      </label>
      {choice === OTHER && (
        <label>
          種類名
          <input
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value);
              onChange(e.target.value.trim() || OTHER);
            }}
            placeholder="例：卒業旅行、忘年会"
          />
        </label>
      )}
    </>
  );
}
