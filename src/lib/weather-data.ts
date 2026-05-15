export type WeatherRow = {
  date: string;
  day: string;
  temp: number;
  humidity: number;
  pressure: number;
  wind: number;
  season: "Winter" | "Summer" | "Monsoon" | "Autumn";
  condition: string;
};

const conditions = ["Sunny", "Cloudy", "Rainy", "Stormy", "Clear", "Foggy", "Windy"];

function seasonOf(monthIdx: number): WeatherRow["season"] {
  if ([11, 0, 1].includes(monthIdx)) return "Winter";
  if ([2, 3, 4].includes(monthIdx)) return "Summer";
  if ([5, 6, 7, 8].includes(monthIdx)) return "Monsoon";
  return "Autumn";
}

// Deterministic pseudo-random
function rand(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function generateWeatherData(days = 60): WeatherRow[] {
  const start = new Date(2025, 0, 1);
  const out: WeatherRow[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const m = d.getMonth();
    const baseTemp = 15 + Math.sin((i / days) * Math.PI * 2) * 12;
    const temp = +(baseTemp + (rand(i + 1) - 0.5) * 8).toFixed(1);
    const humidity = +(45 + (rand(i + 7) - 0.5) * 50 + (m >= 5 && m <= 8 ? 15 : 0)).toFixed(1);
    const pressure = +(1000 + (rand(i + 13) - 0.5) * 30).toFixed(1);
    const wind = +(5 + rand(i + 21) * 25).toFixed(1);
    out.push({
      date: d.toISOString().slice(0, 10),
      day: d.toLocaleDateString("en", { month: "short", day: "numeric" }),
      temp,
      humidity: Math.max(10, Math.min(100, humidity)),
      pressure,
      wind,
      season: seasonOf(m),
      condition: conditions[Math.floor(rand(i + 33) * conditions.length)],
    });
  }
  return out;
}

export function buildHistogram(rows: WeatherRow[], bins = 8) {
  if (!rows.length) return [];
  const temps = rows.map((r) => r.temp);
  const min = Math.floor(Math.min(...temps));
  const max = Math.ceil(Math.max(...temps));
  const step = (max - min) / bins || 1;
  const buckets = Array.from({ length: bins }, (_, i) => ({
    range: `${(min + i * step).toFixed(0)}–${(min + (i + 1) * step).toFixed(0)}°`,
    count: 0,
  }));
  for (const t of temps) {
    const idx = Math.min(bins - 1, Math.floor((t - min) / step));
    buckets[idx].count++;
  }
  return buckets;
}

export function buildSeasonal(rows: WeatherRow[]) {
  const map = new Map<string, { sum: number; n: number }>();
  for (const r of rows) {
    const cur = map.get(r.season) ?? { sum: 0, n: 0 };
    cur.sum += r.temp;
    cur.n++;
    map.set(r.season, cur);
  }
  return Array.from(map.entries()).map(([season, v]) => ({
    name: season,
    value: +(v.sum / v.n).toFixed(1),
  }));
}

export function parseCSV(text: string): WeatherRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const idx = (k: string) => headers.findIndex((h) => h.includes(k));
  const di = idx("date");
  const ti = idx("temp");
  const hi = idx("humid");
  const pi = idx("press");
  const wi = idx("wind");
  return lines.slice(1).map((line, i) => {
    const cols = line.split(",");
    const dateStr = di >= 0 ? cols[di] : new Date(2025, 0, i + 1).toISOString().slice(0, 10);
    const d = new Date(dateStr);
    return {
      date: dateStr,
      day: isNaN(d.getTime())
        ? `Day ${i + 1}`
        : d.toLocaleDateString("en", { month: "short", day: "numeric" }),
      temp: +parseFloat(cols[ti] ?? "0"),
      humidity: +parseFloat(cols[hi] ?? "50"),
      pressure: +parseFloat(cols[pi] ?? "1013"),
      wind: +parseFloat(cols[wi] ?? "10"),
      season: seasonOf(isNaN(d.getTime()) ? 0 : d.getMonth()),
      condition: "Imported",
    };
  });
}
