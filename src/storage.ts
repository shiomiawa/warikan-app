import type { WarikanEvent } from './types';

const KEY = 'warikan-app:v1';

export type AppData = { events: WarikanEvent[]; currentId: string | null };

const empty: AppData = { events: [], currentId: null };

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    const data = JSON.parse(raw) as AppData;
    if (!Array.isArray(data.events)) return empty;
    return { events: data.events, currentId: data.currentId ?? null };
  } catch {
    // 保存データが壊れている・使えない場合は空の状態で始める
    return empty;
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // 容量超過やプライベートモードでは保存を諦める
  }
}
