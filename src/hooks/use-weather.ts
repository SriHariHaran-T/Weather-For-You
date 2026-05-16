import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { fetchLiveWeather, type WeatherBundle } from "@/lib/live-weather.functions";

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

  const runFetch = useCallback(
    async (input: { lat?: number; lon?: number; city?: string }, silent = false) => {
      setStatus("loading");
      setError("");
      try {
        const w = await fetchWeather({ data: input });
        setData(w);
        setStatus("ready");
        setNeedsManual(false);
        if (!silent) toast.success(`Weather loaded for ${w.current.city}`);
        return w;
      } catch (e: any) {
        const msg = e?.message || "Failed to fetch weather.";
        setError(msg);
        setStatus("error");
        if (!silent) toast.error(msg);
        throw e;
      }
    },
    [fetchWeather],
  );

  const loadFromIP = useCallback(
    (silent = false) => runFetch({}, silent).catch(() => undefined),
    [runFetch],
  );

  const loadFromCity = useCallback(
    (city: string) => runFetch({ city }, false).catch(() => undefined),
    [runFetch],
  );

  const detectAndLoad = useCallback(
    (silent = false) => {
      setError("");
      if (!("geolocation" in navigator)) {
        return loadFromIP(silent);
      }
      setStatus("locating");
      return new Promise<void>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            await runFetch(
              { lat: pos.coords.latitude, lon: pos.coords.longitude },
              silent,
            ).catch(async () => {
              await loadFromIP(silent);
            });
            resolve();
          },
          async (err) => {
            if (err.code === err.PERMISSION_DENIED) {
              if (!silent) toast.error("Location access denied — falling back to default city.");
              setNeedsManual(true);
              await runFetch({ city: DEFAULT_CITY }, true).catch(() => undefined);
            } else {
              await loadFromIP(silent);
            }
            resolve();
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 },
        );
      });
    },
    [loadFromIP, runFetch],
  );

  const refresh = useCallback(async () => {
    if (data?.current) {
      await runFetch({ lat: data.current.lat, lon: data.current.lon }, false).catch(
        () => undefined,
      );
    } else {
      await detectAndLoad(false);
    }
  }, [data, detectAndLoad, runFetch]);

  // initial load + auto-refresh
  useEffect(() => {
    void detectAndLoad(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (data?.current) {
        void runFetch({ lat: data.current.lat, lon: data.current.lon }, true);
      }
    }, REFRESH_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [data, runFetch]);

  return {
    status,
    error,
    data,
    needsManual,
    DEFAULT_CITY,
    refresh,
    loadFromCity,
    detectAndLoad,
  };
}
