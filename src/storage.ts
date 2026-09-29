import type { AppSettings, WarikanEvent } from './types';

const KEY = 'warikan-app:v1';

export type AppData = { events: WarikanEvent[]; currentId: string | null; settings: AppSettings };

const defaultSettings = (): AppSettings => ({ rates: {}, currencies: ['USD', 'KRW'], gasolineModes: [] });

const empty = (): AppData => ({ events: [], currentId: null, settings: defaultSettings() });

/**
 * 設定がまだない古いデータは、以前イベントごとに持っていた通貨・レートを引き継ぐ
 * (レートを入れていた最初のイベントのもの)。
 */
function migrateSettings(events: WarikanEvent[]): AppSettings {
  const withRates = events.find((e) => e.rates && Object.keys(e.rates).length > 0);
  const withCurrencies = events.find((e) => e.currencies);
  return {
    ...defaultSettings(),
    rates: withRates?.rates ?? {},
    currencies: withCurrencies?.currencies ?? ['USD', 'KRW'],
  };
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const data = JSON.parse(raw) as Partial<AppData>;
    if (!Array.isArray(data.events)) return empty();
    return {
      events: data.events,
      currentId: data.currentId ?? null,
      settings: data.settings ? { ...defaultSettings(), ...data.settings } : migrateSettings(data.events),
    };
  } catch {
    // 保存データが壊れている・使えない場合は空の状態で始める
    return empty();
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // 容量超過やプライベートモードでは保存を諦める
  }
}
