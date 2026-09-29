export type Member = { id: string; nickname: string };

export type Split =
  | { mode: 'equal' }
  | { mode: 'ratio'; ratios: Record<string, number> } // memberId → パーセント(合計100、0は対象外)
  | { mode: 'amount'; amounts: Record<string, number> }; // memberId → 負担額(項目の通貨)

export type Gasoline = {
  inputMode: 'odometer' | 'distance';
  odoStart?: number;
  odoEnd?: number;
  distanceKm?: number;
  fuelEconomy: number;
  unitPrice: number;
};

export type Etc = {
  entryIc: string;
  exitIc: string;
  passedAt: string;
  vehicleClass: string;
  discount: string;
  estimated?: number;
  confirmed?: number;
};

export type ItemKind = 'normal' | 'gasoline' | 'etc';

export type Currency = 'JPY' | 'USD' | 'KRW';

/** 1通貨単位あたりの円 */
export type Rates = Record<Currency, number>;

export type Item = {
  id: string;
  name: string;
  kind: ItemKind;
  category?: string; // 通常項目の種類(食事・宿泊・自由入力など)
  payerId: string;
  currency?: Currency; // 通常項目の通貨(省略時は円)
  amount: number; // 通常項目の金額(currency の単位。ガソリン・ETCは計算で決まる)
  split: Split;
  gasoline?: Gasoline;
  etc?: Etc;
};

export type Rounding = 1 | 10 | 100;

export type WarikanEvent = {
  id: string;
  name: string;
  kind: string;
  rounding: Rounding;
  rates?: Partial<Rates>;
  members: Member[];
  items: Item[];
};

export type Transfer = { from: string; to: string; amount: number };
