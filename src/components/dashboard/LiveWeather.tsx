import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  MapPin,
  RefreshCw,
  Droplets,
  Wind,
  Thermometer,
  AlertCircle,
  Loader2,
  CloudOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchLiveWeather, type LiveWeather } from "@/lib/live-weather.functions";

type Status = "idle" | "locating" | "loading" | "ready" | "error";

export function LiveWeatherCard() {
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<LiveWeather | null>(null);
  const [error, setError] = useState<string>("");
  const fetchWeather = useServerFn(fetchLiveWeather);

  const loadFromIP = useCallback(async () => {
    setStatus("loading");
    try {
      const w = await fetchWeather({ data: {} });
      setData(w);
      setStatus("ready");
    } catch (e: any) {
      setStatus("error");
      setError(e?.message || "Failed to fetch weather.");
    }
  }, [fetchWeather]);

  const load = useCallback(() => {
    setError("");
    if (!("geolocation" in navigator)) {
      void loadFromIP();
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setStatus("loading");
        try {
          const w = await fetchWeather({
            data: { lat: pos.coords.latitude, lon: pos.coords.longitude },
          });
          setData(w);
          setStatus("ready");
        } catch (e: any) {
          // fall back to IP-based lookup on any API error
          await loadFromIP();
          if (e?.message) setError(e.message);
        }
      },
      () => {
        // permission denied or unavailable → use IP-based lookup
        void loadFromIP();
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 },
    );
  }, [fetchWeather, loadFromIP]);

  useEffect(() => {
    load();
  }, [load]);

  const iconUrl = data ? `https://openweathermap.org/img/wn/${data.icon}@4x.png` : "";

  return (
    <section className="glass-strong rounded-3xl p-6 sm:p-7 relative overflow-hidden animate-fade-in">
      {/* gradient backdrop */}
      <div className="absolute inset-0 pointer-events-none opacity-90">
        <div className="absolute -top-24 -left-16 w-80 h-80 rounded-full gradient-cool blur-3xl opacity-40" />
        <div className="absolute -bottom-24 -right-12 w-80 h-80 rounded-full gradient-primary blur-3xl opacity-40" />
      </div>

      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full glass mb-3">
            <MapPin className="h-3 w-3" /> Live · {data?.source === "ip" ? "approx. location" : "your location"}
          </div>

          {status === "locating" || status === "loading" ? (
            <div className="flex items-center gap-3 py-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {status === "locating" ? "Detecting your location…" : "Fetching live weather…"}
              </p>
            </div>
          ) : status === "error" ? (
            <div className="flex items-start gap-3 py-2 max-w-md">
              <div className="rounded-xl bg-destructive/15 p-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="font-semibold">Live weather unavailable</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          ) : data ? (
            <>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
                {data.city}
                {data.country && (
                  <span className="text-muted-foreground font-medium">, {data.country}</span>
                )}
              </h2>
              <p className="text-sm text-muted-foreground capitalize mt-0.5">{data.description}</p>

              <div className="flex items-end gap-4 mt-4">
                <div className="flex items-center">
                  {iconUrl && (
                    <img
                      src={iconUrl}
                      alt={data.condition}
                      width={96}
                      height={96}
                      className="h-24 w-24 -ml-3 drop-shadow-lg animate-fade-in"
                    />
                  )}
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-bold tracking-tight text-gradient">
                        {data.temp}
                      </span>
                      <span className="text-xl text-muted-foreground font-semibold">°C</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Feels like {data.feelsLike}°C · {data.condition}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 py-2">
              <CloudOff className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No weather loaded yet.</p>
            </div>
          )}
        </div>

        {/* Right column: stats + refresh */}
        <div className="flex flex-col gap-3 sm:items-end">
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={status === "locating" || status === "loading"}
            className="rounded-xl glass gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${status === "locating" || status === "loading" ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          {data && status === "ready" && (
            <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full sm:w-auto">
              <Stat icon={Droplets} label="Humidity" value={`${data.humidity}%`} />
              <Stat icon={Wind} label="Wind" value={`${data.wind} km/h`} />
              <Stat icon={Thermometer} label="Feels" value={`${data.feelsLike}°`} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Droplets;
  label: string;
  value: string;
}) {
  return (
    <div className="glass rounded-xl px-3 py-2 text-center min-w-[90px]">
      <Icon className="h-4 w-4 mx-auto text-primary" />
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
