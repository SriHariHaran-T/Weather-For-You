import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useDeferredValue, useMemo, useState } from "react";
import {
  Thermometer,
  ThermometerSun,
  ThermometerSnowflake,
  Droplets,
  Moon,
  Sun,
  Menu,
  X,
  Sparkles,
  RefreshCw,
  Inbox,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { useWeather } from "@/hooks/use-weather";
import {
  buildHistogram,
  buildSeasonal,
  downsampleRows,
  CHART_MAX_POINTS,
  type WeatherRow,
} from "@/lib/weather-data";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { DataTable } from "@/components/dashboard/DataTable";
import { UploadArea } from "@/components/dashboard/UploadArea";
import { LiveWeatherCard } from "@/components/dashboard/LiveWeather";
import { CardSkeleton, ChartSkeleton } from "@/components/dashboard/Skeletons";

const Charts = {
  TempLineChart: lazy(() =>
    import("@/components/dashboard/Charts").then((m) => ({ default: m.TempLineChart })),
  ),
  TempHistogram: lazy(() =>
    import("@/components/dashboard/Charts").then((m) => ({ default: m.TempHistogram })),
  ),
  HumidityScatter: lazy(() =>
    import("@/components/dashboard/Charts").then((m) => ({ default: m.HumidityScatter })),
  ),
  DailyBarChart: lazy(() =>
    import("@/components/dashboard/Charts").then((m) => ({ default: m.DailyBarChart })),
  ),
  SeasonalPie: lazy(() =>
    import("@/components/dashboard/Charts").then((m) => ({ default: m.SeasonalPie })),
  ),
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Weather Dataset Analysis — Interactive Dashboard" },
      {
        name: "description",
        content:
          "Real-time weather analytics dashboard with live charts, distributions, and CSV upload.",
      },
      { property: "og:title", content: "Weather Dataset Analysis" },
      {
        property: "og:description",
        content: "Real-time weather analytics dashboard.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { theme, toggle } = useTheme();
  const weather = useWeather();
  const [uploadedRows, setUploadedRows] = useState<WeatherRow[] | null>(null);
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Live forecast drives the dashboard unless the user uploads a CSV
  const liveRows = weather.data?.forecast ?? [];
  const rows = uploadedRows ?? liveRows;
  const usingUpload = uploadedRows !== null;

  const loading =
    !usingUpload && (weather.status === "locating" || weather.status === "loading") && !rows.length;

  const deferredRows = useDeferredValue(rows);

  const stats = useMemo(() => {
    if (!rows.length) return null;
    let max = -Infinity;
    let min = Infinity;
    let tSum = 0;
    let hSum = 0;
    for (const r of rows) {
      if (r.temp > max) max = r.temp;
      if (r.temp < min) min = r.temp;
      tSum += r.temp;
      hSum += r.humidity;
    }
    return { max, min, avg: tSum / rows.length, hum: hSum / rows.length };
  }, [rows]);

  const chartRows = useMemo(() => downsampleRows(deferredRows), [deferredRows]);
  const histogram = useMemo(() => buildHistogram(deferredRows), [deferredRows]);
  const seasonal = useMemo(() => buildSeasonal(deferredRows), [deferredRows]);
  const downsampled = deferredRows.length > CHART_MAX_POINTS;

  const reset = () => {
    setUploadedRows(null);
    void weather.refresh();
  };

  const datasetLabel = usingUpload
    ? "CSV upload"
    : weather.data
      ? `${weather.data.current.city} · live forecast`
      : "Loading…";

  return (
    <div className="min-h-screen flex w-full">
      <Sidebar
        active={active}
        onChange={(id) => {
          setActive(id);
          setSidebarOpen(false);
        }}
        open={sidebarOpen}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 px-4 lg:px-6 pt-4">
          <div className="glass-strong rounded-2xl px-4 py-3 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden rounded-xl"
              onClick={() => setSidebarOpen((o) => !o)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate">
                <span className="text-gradient">Weather Dataset Analysis</span>
              </h1>
              <p className="text-xs text-muted-foreground truncate">
                Interactive weather data visualization dashboard
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={reset}
              className="rounded-xl"
              title="Refresh live weather"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              className="rounded-xl"
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </header>

        <div className="px-4 lg:px-6 py-6 space-y-6">
          <div id="section-dashboard" className="scroll-mt-24" />
          <LiveWeatherCard ctx={weather} />

          <section className="glass-strong rounded-3xl p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute inset-0 opacity-60 pointer-events-none">
              <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full gradient-primary blur-3xl opacity-30" />
              <div className="absolute -bottom-20 -right-10 w-72 h-72 rounded-full gradient-rose blur-3xl opacity-30" />
            </div>
            <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full glass mb-3">
                  <Sparkles className="h-3 w-3" /> Dataset · {datasetLabel}
                  {rows.length > 0 && (
                    <span className="ml-1 text-muted-foreground">
                      · {rows.length.toLocaleString()} points
                    </span>
                  )}
                  {downsampled && (
                    <span className="ml-1 text-muted-foreground">
                      · charts downsampled to {CHART_MAX_POINTS}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Real-time weather, <span className="text-gradient">beautifully analyzed</span>
                </h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-xl">
                  Charts driven by live OpenWeatherMap forecast data for your location. Upload a CSV
                  to analyze your own readings instead.
                </p>
                {usingUpload && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setUploadedRows(null)}
                    className="px-0 mt-1 h-auto"
                  >
                    Switch back to live data
                  </Button>
                )}
              </div>
            </div>
          </section>

          <section id="section-analytics" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 scroll-mt-24">
            {loading || !stats ? (
              <>
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </>
            ) : (
              <>
                <StatCard
                  label="Highest Temperature"
                  value={stats.max.toFixed(1)}
                  unit="°C"
                  icon={ThermometerSun}
                  gradient="warm"
                  trend="Peak across the period"
                />
                <StatCard
                  label="Average Temperature"
                  value={stats.avg.toFixed(1)}
                  unit="°C"
                  icon={Thermometer}
                  gradient="primary"
                  trend="Mean of all readings"
                />
                <StatCard
                  label="Lowest Temperature"
                  value={stats.min.toFixed(1)}
                  unit="°C"
                  icon={ThermometerSnowflake}
                  gradient="cool"
                  trend="Coldest forecast slot"
                />
                <StatCard
                  label="Average Humidity"
                  value={stats.hum.toFixed(0)}
                  unit="%"
                  icon={Droplets}
                  gradient="mint"
                  trend="Mean relative humidity"
                />
              </>
            )}
          </section>

          {loading ? (
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartSkeleton />
              <ChartSkeleton />
              <ChartSkeleton />
              <ChartSkeleton />
            </section>
          ) : rows.length === 0 ? (
            <EmptyState onUploaded={setUploadedRows} />
          ) : (
            <Suspense
              fallback={
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <ChartSkeleton />
                  <ChartSkeleton />
                  <ChartSkeleton />
                  <ChartSkeleton />
                </section>
              }
            >
              <section id="section-charts" className="grid grid-cols-1 lg:grid-cols-2 gap-4 scroll-mt-24">
                <ChartCard
                  title="Temperature trend"
                  description={`Forecast temperature${downsampled ? " (averaged buckets)" : ""}`}
                  exportName="temperature-trend"
                >
                  <Charts.TempLineChart data={chartRows} />
                </ChartCard>

                <ChartCard
                  title="Temperature distribution"
                  description="How frequently each temperature range appears"
                  exportName="temperature-histogram"
                >
                  <Charts.TempHistogram data={histogram} />
                </ChartCard>

                <ChartCard
                  title="Humidity vs Temperature"
                  description="Scatter colored by season"
                  exportName="humidity-vs-temp"
                >
                  <Charts.HumidityScatter data={chartRows} />
                </ChartCard>

                <ChartCard
                  title="Daily temperature"
                  description="Last 14 forecast points"
                  exportName="daily-temperature"
                >
                  <Charts.DailyBarChart data={chartRows} />
                </ChartCard>

                <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <ChartCard
                    title="Seasonal contributions"
                    description="Average temperature by season"
                    exportName="seasonal"
                  >
                    <Charts.SeasonalPie data={seasonal} />
                  </ChartCard>
                  <div className="lg:col-span-2">
                    <UploadArea onLoaded={setUploadedRows} />
                  </div>
                </div>
              </section>
            </Suspense>
          )}

          <section id="section-dataset" className="scroll-mt-24">
            {loading ? <ChartSkeleton /> : rows.length === 0 ? null : <DataTable rows={rows} />}
          </section>

          <footer className="text-center text-xs text-muted-foreground py-6">
            Weather Dataset Analysis · Built with React, Tailwind &amp; Recharts
          </footer>
        </div>
      </main>

      <Toaster />
    </div>
  );
}

function EmptyState({ onUploaded }: { onUploaded: (rows: WeatherRow[]) => void }) {
  return (
    <section className="glass rounded-3xl p-8 text-center animate-fade-in">
      <div className="mx-auto w-14 h-14 rounded-2xl glass grid place-items-center mb-3">
        <Inbox className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg">No dataset loaded</h3>
      <p className="text-sm text-muted-foreground mb-5">
        Live weather is unavailable. Upload a CSV to start analyzing your weather data.
      </p>
      <div className="max-w-md mx-auto">
        <UploadArea onLoaded={onUploaded} />
      </div>
    </section>
  );
}
