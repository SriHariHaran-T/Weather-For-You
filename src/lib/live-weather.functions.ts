import { createServerFn } from "@tanstack/react-start";
import type { WeatherRow } from "./weather-data";

export type LiveWeather = {
  city: string;
  country: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  wind: number;
  condition: string;
  description: string;
  icon: string;
  sunrise: number;
  sunset: number;
  source: "geolocation" | "city";
  lat: number;
  lon: number;
};

export type WeatherBundle = {
  current: LiveWeather;
  forecast: WeatherRow[];
};

const API_KEY_FALLBACK = "69755718a4daf50dfaa1d7dffc3f336b";

function seasonOf(monthIdx: number): WeatherRow["season"] {
  if ([11, 0, 1].includes(monthIdx)) return "Winter";
  if ([2, 3, 4].includes(monthIdx)) return "Summer";
  if ([5, 6, 7, 8].includes(monthIdx)) return "Monsoon";
  return "Autumn";
}

function getKey() {
  return process.env.OPENWEATHER_API_KEY || API_KEY_FALLBACK;
}

async function geocodeCity(city: string, key: string) {
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${key}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
  const j: any = await res.json();
  if (!Array.isArray(j) || j.length === 0) throw new Error(`City "${city}" not found`);
  return { lat: j[0].lat as number, lon: j[0].lon as number };
}

async function fetchCurrent(lat: number, lon: number, key: string) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${key}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Weather API error [${res.status}]: ${body.slice(0, 200)}`);
  }
  return res.json();
}

async function fetchForecast(lat: number, lon: number, key: string): Promise<WeatherRow[]> {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${key}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const j: any = await res.json();
  const list: any[] = Array.isArray(j?.list) ? j.list : [];
  return list.map((it) => {
    const d = new Date((it.dt ?? 0) * 1000);
    const m = d.getMonth();
    return {
      date: d.toISOString(),
      day: d.toLocaleDateString("en", { month: "short", day: "numeric", hour: "2-digit" }),
      temp: +Number(it.main?.temp ?? 0).toFixed(1),
      humidity: Math.round(it.main?.humidity ?? 0),
      pressure: Math.round(it.main?.pressure ?? 0),
      wind: +(Number(it.wind?.speed ?? 0) * 3.6).toFixed(1),
      season: seasonOf(m),
      condition: it.weather?.[0]?.main ?? "—",
    } satisfies WeatherRow;
  });
}

export const fetchLiveWeather = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { lat?: number; lon?: number; city?: string } | undefined) => data ?? {},
  )
  .handler(async ({ data }): Promise<WeatherBundle> => {
    const key = getKey();
    let lat = data?.lat;
    let lon = data?.lon;
    let source: LiveWeather["source"] = "geolocation";

    if (data?.city && (lat === undefined || lon === undefined)) {
      const g = await geocodeCity(data.city, key);
      lat = g.lat;
      lon = g.lon;
      source = "city";
    }
    if (lat === undefined || lon === undefined) {
      if (data?.city) {
        const g = await geocodeCity(data.city, key);
        lat = g.lat;
        lon = g.lon;
        source = "city";
      } else {
        throw new Error("Missing location coordinates. Enable location access or search by city.");
      }
    }

    try {
      const [j, forecast] = await Promise.all([
        fetchCurrent(lat, lon, key),
        fetchForecast(lat, lon, key),
      ]);

      const current: LiveWeather = {
        city: j.name ?? data?.city ?? "Unknown",
        country: j.sys?.country ?? "",
        temp: Math.round(j.main?.temp ?? 0),
        feelsLike: Math.round(j.main?.feels_like ?? 0),
        humidity: Math.round(j.main?.humidity ?? 0),
        pressure: Math.round(j.main?.pressure ?? 0),
        wind: Math.round((j.wind?.speed ?? 0) * 3.6),
        condition: j.weather?.[0]?.main ?? "—",
        description: j.weather?.[0]?.description ?? "",
        icon: j.weather?.[0]?.icon ?? "01d",
        sunrise: j.sys?.sunrise ?? 0,
        sunset: j.sys?.sunset ?? 0,
        source,
        lat,
        lon,
      };

      return { current, forecast };
    } catch (error) {
      console.error("Failed to fetch live weather:", error);
      throw new Error("Unable to load live weather data right now.");
    }
  });
