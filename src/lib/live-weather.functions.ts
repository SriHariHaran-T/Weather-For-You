import { createServerFn } from "@tanstack/react-start";

export type LiveWeather = {
  city: string;
  country: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  wind: number;
  condition: string;
  description: string;
  icon: string;
  sunrise: number;
  sunset: number;
  source: "geolocation" | "ip";
};

async function resolveIpLocation(): Promise<{ lat: number; lon: number } | null> {
  try {
    const res = await fetch("https://ipapi.co/json/", {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const j: any = await res.json();
    if (typeof j?.latitude === "number" && typeof j?.longitude === "number") {
      return { lat: j.latitude, lon: j.longitude };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export const fetchLiveWeather = createServerFn({ method: "POST" })
  .inputValidator((data: { lat?: number; lon?: number } | undefined) => {
    const d = data ?? {};
    if (d.lat !== undefined && d.lon !== undefined) {
      if (typeof d.lat !== "number" || typeof d.lon !== "number") {
        throw new Error("Invalid coordinates");
      }
      if (Math.abs(d.lat) > 90 || Math.abs(d.lon) > 180) {
        throw new Error("Coordinates out of range");
      }
    }
    return d;
  })
  .handler(async ({ data }): Promise<LiveWeather> => {
    const key = process.env.OPENWEATHER_API_KEY;
    if (!key) throw new Error("OPENWEATHER_API_KEY is not configured");

    let lat = data?.lat;
    let lon = data?.lon;
    let source: "geolocation" | "ip" = "geolocation";

    if (lat === undefined || lon === undefined) {
      const ip = await resolveIpLocation();
      if (!ip) throw new Error("Couldn't determine your location automatically.");
      lat = ip.lat;
      lon = ip.lon;
      source = "ip";
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${key}`;
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Weather API error [${res.status}]: ${body.slice(0, 200)}`);
    }
    const j: any = await res.json();
    return {
      city: j.name ?? "Unknown",
      country: j.sys?.country ?? "",
      temp: Math.round(j.main?.temp ?? 0),
      feelsLike: Math.round(j.main?.feels_like ?? 0),
      humidity: Math.round(j.main?.humidity ?? 0),
      wind: Math.round((j.wind?.speed ?? 0) * 3.6),
      condition: j.weather?.[0]?.main ?? "—",
      description: j.weather?.[0]?.description ?? "",
      icon: j.weather?.[0]?.icon ?? "01d",
      sunrise: j.sys?.sunrise ?? 0,
      sunset: j.sys?.sunset ?? 0,
      source,
    };
  });
