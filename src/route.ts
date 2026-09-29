// 地名から車のルート距離を調べる。
// 地名の検索は OpenStreetMap の Nominatim、ルートは OSRM の公開サーバーを使う(どちらもAPIキー不要)。
// Nominatim は1秒に1回までの利用規約があるため、ボタンを押したときだけ呼び出す。

type Place = { name: string; lat: string; lon: string };

async function searchPlace(query: string): Promise<Place | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=ja&q=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('地名の検索に失敗しました。時間をおいて試してください');
  const list = (await res.json()) as Place[];
  return list[0] ?? null;
}

/** 「〇〇IC」「〇〇インター」などの言い方の違いも試す */
async function geocode(query: string): Promise<Place> {
  const q = query.trim();
  const variants = [q];
  if (/IC$/i.test(q)) variants.push(q.replace(/IC$/i, 'インターチェンジ'));
  if (/インター(チェンジ)?$/.test(q)) variants.push(q.replace(/インター(チェンジ)?$/, 'IC'));
  for (const v of variants) {
    const place = await searchPlace(v);
    if (place) return place;
  }
  throw new Error(`「${q}」が見つかりませんでした。駅名・施設名・住所などで試してください`);
}

export type RouteResult = { km: number; from: string; to: string };

/** 車での片道の距離(km、小数1桁) */
export async function routeDistance(from: string, to: string): Promise<RouteResult> {
  const a = await geocode(from);
  const b = await geocode(to);
  const url = `https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=false`;
  const res = await fetch(url);
  const data = (await res.json().catch(() => null)) as { code?: string; routes?: { distance: number }[] } | null;
  if (!res.ok || data?.code !== 'Ok' || !data.routes?.length) {
    throw new Error('車のルートが見つかりませんでした。出発地・目的地を変えて試してください');
  }
  return { km: Math.round(data.routes[0].distance / 100) / 10, from: a.name || from, to: b.name || to };
}

/** 確認用に Google マップのルート検索を開くURL */
export const googleMapsRouteUrl = (from: string, to: string): string =>
  `https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}`;
