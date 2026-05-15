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
};

export const fetchLiveWeather = createServerFn({ method: "POST" })
  .inputValidator((data: { lat: number; lon: number }) => {
    if (typeof data?.lat !== "number" || typeof data?.lon !== "number") {
      throw new Error("Invalid coordinates");
    }
    if (Math.abs(data.lat) > 90 || Math.abs(data.lon) > 180) {
      throw new Error("Coordinates out of range");
    }
    return data;
  })
  .handler(async ({ data }): Promise<LiveWeather> => {
    const key = process.env.OPENWEATHER_API_KEY;
    if (!key) throw new Error("OPENWEATHER_API_KEY is not configured");

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${data.lat}&lon=${data.lon}&units=metric&appid=${key}`;
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
      wind: Math.round((j.wind?.speed ?? 0) * 3.6), // m/s → km/h
      condition: j.weather?.[0]?.main ?? "—",
      description: j.weather?.[0]?.description ?? "",
      icon: j.weather?.[0]?.icon ?? "01d",
      sunrise: j.sys?.sunrise ?? 0,
      sunset: j.sys?.sunset ?? 0,
    };
  });
