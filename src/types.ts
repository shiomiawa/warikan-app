export type Member = {
  id: string;
  nickname: string;
  avatar?: number; // 色の番号(名前の頭文字のバッジと文字の色)。未設定なら並び順
  paypayLink?: string; // この人のPayPay受け取りリンク(1人ずつ送る文に添える)。未設定なら前に同じ名前で入れたもの
};

export type Split =
  | { mode: 'equal' }
  | { mode: 'ratio'; ratios: Record<string, number> } // memberId → パーセント(合計100、0は対象外)
  | { mode: 'amount'; amounts: Record<string, number> }; // memberId → 負担額(項目の通貨)

export type Gasoline = {
  inputMode: 'odometer' | 'distance' | 'map';
  odoStart?: number;
  odoEnd?: number;
  distanceKm?: number; // 直接入力の距離。地図のときは片道の距離
  from?: string; // 地図: 出発地
  to?: string; // 地図: 目的地
  roundTrip?: boolean; // 地図: 往復なら2倍
  fuelEconomy: number;
  unitPrice: number;
};

/** 高速代(画面では「高速代」、データ上は etc のまま) */
export type Etc = {
  mode?: 'manual' | 'auto'; // 手入力 / 自動計算(距離から料金式で計算)
  amount?: number; // 手入力の金額
  distanceKm?: number; // 自動計算に使う高速道路の距離
  entryIc: string;
  exitIc: string;
  passedAt: string;
  vehicleClass: string;
  discount: string;
  estimated?: number; // 旧データ(概算額)
  confirmed?: number; // 旧データ(確定額)
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
  date?: string; // 支払った日(YYYY-MM-DD)
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
  currencies?: Currency[]; // 使う外貨(省略時は米ドル・韓国ウォンの両方)
  members: Member[];
  items: Item[];
  paidTransfers?: string[]; // 精算済にした送金(transferKey)
};

export type GasolineMode = Gasoline['inputMode'];

/** アプリ全体の設定(トップページの ⚙️ 設定) */
export type AppSettings = {
  rates: Partial<Rates>; // 為替レート(1通貨単位あたりの円)
  currencies: Currency[]; // 使う外貨
  gasolineModes: Exclude<GasolineMode, 'map'>[]; // 地図のほかに使うガソリン代の距離の入れ方
  paypayLink?: string; // 幹事のPayPay受け取りリンク(QRにして表示・共有文に添える)
  paypayQrImage?: string; // 幹事のPayPay受け取りQRコードのスクショ(縮めた data URL。そのまま表示する)
  paypayLinks?: Record<string, string>; // メンバーの名前 → PayPay受け取りリンク(次のイベントでも引き継ぐ)
};

export type Transfer ={ from: string; to: string; amount: number };
