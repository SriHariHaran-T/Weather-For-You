import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { WeatherRow } from "@/lib/weather-data";
import { GlassTooltip } from "./ChartTooltip";

const axis = { stroke: "var(--muted-foreground)", fontSize: 11 };
const grid = "var(--border)";

export function TempLineChart({ data }: { data: WeatherRow[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
        <defs>
          <linearGradient id="lineG" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--chart-1)" />
            <stop offset="100%" stopColor="var(--chart-2)" />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="day" {...axis} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis {...axis} tickLine={false} axisLine={false} />
        <Tooltip content={<GlassTooltip />} />
        <Line
          type="monotone"
          dataKey="temp"
          name="Temp °C"
          stroke="url(#lineG)"
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 5, fill: "var(--chart-1)" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function TempHistogram({ data }: { data: { range: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
        <defs>
          <linearGradient id="histG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-3)" />
            <stop offset="100%" stopColor="var(--chart-1)" />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="range" {...axis} tickLine={false} axisLine={false} />
        <YAxis {...axis} tickLine={false} axisLine={false} />
        <Tooltip content={<GlassTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
        <Bar dataKey="count" name="Days" fill="url(#histG)" radius={[8, 8, 0, 0]} animationDuration={900} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function HumidityScatter({ data }: { data: WeatherRow[] }) {
  const palette = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];
  const seasons = ["Winter", "Summer", "Monsoon", "Autumn"] as const;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
        <CartesianGrid stroke={grid} strokeDasharray="3 3" />
        <XAxis type="number" dataKey="temp" name="Temp" unit="°" {...axis} tickLine={false} axisLine={false} />
        <YAxis type="number" dataKey="humidity" name="Humidity" unit="%" {...axis} tickLine={false} axisLine={false} />
        <Tooltip content={<GlassTooltip />} cursor={{ strokeDasharray: "3 3" }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {seasons.map((s, i) => (
          <Scatter
            key={s}
            name={s}
            data={data.filter((d) => d.season === s)}
            fill={palette[i]}
            animationDuration={900}
          />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export function DailyBarChart({ data }: { data: WeatherRow[] }) {
  const slice = data.slice(-14);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={slice} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
        <defs>
          <linearGradient id="barG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-2)" />
            <stop offset="100%" stopColor="var(--chart-3)" />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="day" {...axis} tickLine={false} axisLine={false} />
        <YAxis {...axis} tickLine={false} axisLine={false} />
        <Tooltip content={<GlassTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
        <Bar dataKey="temp" name="Temp °C" fill="url(#barG)" radius={[8, 8, 0, 0]} animationDuration={900} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SeasonalPie({ data }: { data: { name: string; value: number }[] }) {
  const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip content={<GlassTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={3}
          label={({ name, value }) =>
            `${name} ${total ? ((Number(value) / total) * 100).toFixed(0) : 0}%`
          }
          labelLine={false}
          animationDuration={900}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} stroke="var(--card)" strokeWidth={2} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
