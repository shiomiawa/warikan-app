import type { InputHTMLAttributes } from 'react';
import { normalizeNumber } from '../format';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  value: string;
  onChange: (value: string) => void;
  decimal?: boolean;
};

/**
 * 数字の入力欄。増減の矢印は出さず、全角で入力しても半角にそろえる。
 * スマートフォンでは数字のキーボードが開く。
 */
export default function NumberInput({ value, onChange, decimal = false, ...rest }: Props) {
  const normalize = (v: string) => normalizeNumber(v, decimal);
  return (
    <input
      {...rest}
      type="text"
      inputMode={decimal ? 'decimal' : 'numeric'}
      autoComplete="off"
      value={value}
      // 日本語入力の変換中は触らず、確定したときに半角へそろえる
      onChange={(e) => onChange((e.nativeEvent as InputEvent).isComposing ? e.target.value : normalize(e.target.value))}
      onCompositionEnd={(e) => onChange(normalize(e.currentTarget.value))}
      onBlur={(e) => onChange(normalize(e.currentTarget.value))}
    />
  );
}
