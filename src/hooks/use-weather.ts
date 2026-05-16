import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { fetchLiveWeather, type WeatherBundle } from "@/lib/live-weather.functions";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";

export type WeatherStatus = "idle" | "locating" | "loading" | "ready" | "error";

const REFRESH_MS = 10 * 60 * 1000;
const DEFAULT_CITY = "Madurai";

export function useWeather() {
  const [status, setStatus] = useState<WeatherStatus>("idle");
  const [data, setData] = useState<WeatherBundle | null>(null);
  const [error, setError] = useState<string>("");
  const [needsManual, setNeedsManual] = useState(false);
  const fetchWeather = useServerFn(fetchLiveWeather);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const location = useCurrentLocation();

  const runFetch = useCallback(
    async (input: { lat?: number; lon?: number; city?: string }, silent = false) => {
      setStatus("loading");
      setError("");
      try {
        const w = await fetchWeather({ data: input });
        setData(w);
        setStatus("ready");
        setNeedsManual(Boolean(input.city));
        if (!silent) toast.success(`Weather loaded for ${w.current.city}`);
        return w;
      } catch (e: any) {
        const msg = e?.message || "Failed to fetch weather.";
        setError(msg);
        setStatus("error");
        if (!silent) toast.error(msg);
        return null;
      }
    },
    [fetchWeather],
  );

  const loadFromCity = useCallback(
    async (city: string, silent = false) => {
      setNeedsManual(true);
      return runFetch({ city }, silent);
    },
    [runFetch],
  );

  const detectAndLoad = useCallback(
    async (silent = false) => {
      setError("");
      setNeedsManual(false);
      setStatus("locating");
      location.retry();
    },
    [location],
  );

  const refresh = useCallback(async () => {
    if (location.coords) {
      const result = await runFetch(
        { lat: location.coords.lat, lon: location.coords.lon },
        false,
      );
      if (result) toast.success("Weather refreshed successfully");
      return;
    }

    if (data?.current?.source === "city") {
      const result = await loadFromCity(data.current.city, true);
      if (result) toast.success("Weather refreshed successfully");
      return;
    }

    if (data?.current) {
      await runFetch({ lat: data.current.lat, lon: data.current.lon }, false).catch(
        () => undefined,
      );
    } else {
      detectAndLoad(false);
    }
  }, [data, detectAndLoad, loadFromCity, location.coords, runFetch]);

  useEffect(() => {
    if (location.loading) {
      setStatus("locating");
    }
  }, [location.loading]);

  useEffect(() => {
    if (!location.coords) return;
    void runFetch({ lat: location.coords.lat, lon: location.coords.lon }, true);
  }, [location.coords, runFetch]);

  useEffect(() => {
    if (location.loading || !location.error) return;

    setError(location.error);
    setNeedsManual(true);

    if (location.error.includes("denied")) {
      toast.error("Location access denied");
    }

    void loadFromCity(DEFAULT_CITY, true);
  }, [loadFromCity, location.error, location.loading]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (location.coords) {
        void runFetch({ lat: location.coords.lat, lon: location.coords.lon }, true);
      } else if (data?.current?.city) {
        void loadFromCity(data.current.city, true);
      }
    }, REFRESH_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [data, loadFromCity, location.coords, runFetch]);

  return {
    status,
    error,
    data,
    needsManual,
    DEFAULT_CITY,
    refresh,
    loadFromCity,
    detectAndLoad,
    retryLocation: location.retry,
    locationLoading: location.loading,
    locationError: location.error,
  };
}
