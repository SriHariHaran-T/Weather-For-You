import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import {
  generateWeatherData,
  buildHistogram,
  buildSeasonal,
  type WeatherRow,
} from "@/lib/weather-data";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import {
  TempLineChart,
  TempHistogram,
  HumidityScatter,
  DailyBarChart,
  SeasonalPie,
} from "@/components/dashboard/Charts";
import { DataTable } from "@/components/dashboard/DataTable";
import { UploadArea } from "@/components/dashboard/UploadArea";
import { CardSkeleton, ChartSkeleton } from "@/components/dashboard/Skeletons";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Weather Dataset Analysis — Interactive Dashboard" },
      {
        name: "description",
        content:
          "Interactive weather data visualization dashboard with charts, histograms, and CSV upload.",
      },
      { property: "og:title", content: "Weather Dataset Analysis" },
      {
        property: "og:description",
        content: "Interactive weather data visualization dashboard.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { theme, toggle } = useTheme();
  const [rows, setRows] = useState<WeatherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setRows(generateWeatherData(60));
      setLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  const stats = useMemo(() => {
    if (!rows.length) return null;
    const temps = rows.map((r) => r.temp);
    const hums = rows.map((r) => r.humidity);
    return {
      max: Math.max(...temps),
      min: Math.min(...temps),
      avg: temps.reduce((a, b) => a + b, 0) / temps.length,
      hum: hums.reduce((a, b) => a + b, 0) / hums.length,
    };
  }, [rows]);

  const histogram = useMemo(() => buildHistogram(rows), [rows]);
  const seasonal = useMemo(() => buildSeasonal(rows), [rows]);

  const reset = () => {
    setLoading(true);
    setTimeout(() => {
      setRows(generateWeatherData(60));
      setLoading(false);
    }, 400);
  };

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
        {/* Header */}
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
            <Button variant="ghost" size="icon" onClick={reset} className="rounded-xl" title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggle} className="rounded-xl" title="Toggle theme">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </header>

        <div className="px-4 lg:px-6 py-6 space-y-6">
          {/* Hero */}
          <section className="glass-strong rounded-3xl p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute inset-0 opacity-60 pointer-events-none">
              <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full gradient-primary blur-3xl opacity-30" />
              <div className="absolute -bottom-20 -right-10 w-72 h-72 rounded-full gradient-rose blur-3xl opacity-30" />
            </div>
            <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full glass mb-3">
                  <Sparkles className="h-3 w-3" /> Live demo dataset · {rows.length || 60} days
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Explore your weather data, <span className="text-gradient">beautifully</span>
                </h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-xl">
                  Charts, distributions, and trends — all in one glassy dashboard. Upload a CSV
                  to analyze your own readings.
                </p>
              </div>
            </div>
          </section>

          {/* Stats */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {loading || !stats ? (
              <>
                <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
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
                  trend="Coldest day recorded"
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

          {/* Charts */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {loading ? (
              <>
                <ChartSkeleton /><ChartSkeleton /><ChartSkeleton /><ChartSkeleton />
              </>
            ) : (
              <>
                <ChartCard
                  title="Temperature trend"
                  description="Daily temperature changes over the period"
                  exportName="temperature-trend"
                >
                  <TempLineChart data={rows} />
                </ChartCard>

                <ChartCard
                  title="Temperature distribution"
                  description="How frequently each temperature range occurred"
                  exportName="temperature-histogram"
                >
                  <TempHistogram data={histogram} />
                </ChartCard>

                <ChartCard
                  title="Humidity vs Temperature"
                  description="Scatter colored by season"
                  exportName="humidity-vs-temp"
                >
                  <HumidityScatter data={rows} />
                </ChartCard>

                <ChartCard
                  title="Daily temperature"
                  description="Last 14 days"
                  exportName="daily-temperature"
                >
                  <DailyBarChart data={rows} />
                </ChartCard>

                <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <ChartCard
                    title="Seasonal contributions"
                    description="Average temperature by season"
                    exportName="seasonal"
                  >
                    <SeasonalPie data={seasonal} />
                  </ChartCard>
                  <div className="lg:col-span-2">
                    <UploadArea onLoaded={setRows} />
                  </div>
                </div>
              </>
            )}
          </section>

          {/* Table */}
          <section>
            {loading ? <ChartSkeleton /> : <DataTable rows={rows} />}
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
