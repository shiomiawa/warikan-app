export type Member = { id: string; nickname: string };

export type Split =
  | { mode: 'equal' }
  | { mode: 'ratio'; ratios: Record<string, number> }
  | { mode: 'amount'; amounts: Record<string, number> };

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

export type Item = {
  id: string;
  name: string;
  kind: ItemKind;
  payerId: string;
  amount: number; // 通常項目の金額(ガソリン・ETCは計算で決まる)
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
  members: Member[];
  items: Item[];
};

export type Transfer = { from: string; to: string; amount: number };
