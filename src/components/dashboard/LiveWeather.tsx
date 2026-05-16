import { useState } from "react";
import {
  MapPin,
  RefreshCw,
  Droplets,
  Wind,
  Thermometer,
  Gauge,
  AlertCircle,
  Loader2,
  CloudOff,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { useWeather } from "@/hooks/use-weather";

type WeatherCtx = ReturnType<typeof useWeather>;

export function LiveWeatherCard({ ctx }: { ctx: WeatherCtx }) {
  const { status, data, error, needsManual, DEFAULT_CITY, refresh, loadFromCity } = ctx;
  const [city, setCity] = useState("");

  const current = data?.current;
  const iconUrl = current ? `https://openweathermap.org/img/wn/${current.icon}@4x.png` : "";
  const busy = status === "locating" || status === "loading";
  const sourceLabel =
    current?.source === "ip"
      ? "approx. location"
      : current?.source === "city"
        ? "manual city"
        : "your location";

  return (
    <section className="glass-strong rounded-3xl p-6 sm:p-7 relative overflow-hidden animate-fade-in">
      <div className="absolute inset-0 pointer-events-none opacity-90">
        <div className="absolute -top-24 -left-16 w-80 h-80 rounded-full gradient-cool blur-3xl opacity-40" />
        <div className="absolute -bottom-24 -right-12 w-80 h-80 rounded-full gradient-primary blur-3xl opacity-40" />
      </div>

      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full glass mb-3">
            <MapPin className="h-3 w-3" /> Live · {sourceLabel}
          </div>

          {busy && !current ? (
            <div className="flex items-center gap-3 py-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {status === "locating" ? "Detecting your location…" : "Fetching live weather…"}
              </p>
            </div>
          ) : status === "error" && !current ? (
            <div className="flex items-start gap-3 py-2 max-w-md">
              <div className="rounded-xl bg-destructive/15 p-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="font-semibold">Live weather unavailable</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          ) : current ? (
            <>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
                {current.city}
                {current.country && (
                  <span className="text-muted-foreground font-medium">, {current.country}</span>
                )}
              </h2>
              <p className="text-sm text-muted-foreground capitalize mt-0.5">
                {current.description}
              </p>

              <div className="flex items-end gap-4 mt-4">
                <div className="flex items-center">
                  {iconUrl && (
                    <img
                      src={iconUrl}
                      alt={current.condition}
                      width={96}
                      height={96}
                      className="h-24 w-24 -ml-3 drop-shadow-lg animate-fade-in"
                    />
                  )}
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-bold tracking-tight text-gradient">
                        {current.temp}
                      </span>
                      <span className="text-xl text-muted-foreground font-semibold">°C</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Feels like {current.feelsLike}°C · {current.condition}
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

        <div className="flex flex-col gap-3 sm:items-end">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={busy}
            className="rounded-xl glass gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {current && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full sm:w-auto">
              <Stat icon={Droplets} label="Humidity" value={`${current.humidity}%`} />
              <Stat icon={Wind} label="Wind" value={`${current.wind} km/h`} />
              <Stat icon={Gauge} label="Pressure" value={`${current.pressure} hPa`} />
              <Stat icon={Thermometer} label="Feels" value={`${current.feelsLike}°`} />
            </div>
          )}
        </div>
      </div>

      {needsManual && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const c = city.trim() || DEFAULT_CITY;
            void loadFromCity(c);
          }}
          className="relative mt-5 flex gap-2 max-w-md"
        >
          <div className="flex-1 relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={`Search city (default: ${DEFAULT_CITY})`}
              className="pl-9 rounded-xl glass"
            />
          </div>
          <Button type="submit" disabled={busy} className="rounded-xl">
            Search
          </Button>
        </form>
      )}
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
