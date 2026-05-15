import { useMemo, useState } from "react";
import { ArrowUpDown, Search, Inbox } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { WeatherRow } from "@/lib/weather-data";

type SortKey = keyof WeatherRow;

export function DataTable({ rows }: { rows: WeatherRow[] }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "date",
    dir: "asc",
  });
  const [page, setPage] = useState(1);
  const pageSize = 25;
  // Hard cap on rendered rows for very large datasets
  const RENDER_CAP = 100;

  const filtered = useMemo(() => {
    const term = q.toLowerCase();
    const f = rows.filter((r) =>
      [r.date, r.condition, r.season].join(" ").toLowerCase().includes(term)
    );
    f.sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      const cmp = av > bv ? 1 : av < bv ? -1 : 0;
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return f;
  }, [rows, q, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const slice = filtered.slice(start, Math.min(start + pageSize, start + RENDER_CAP));

  const toggleSort = (key: SortKey) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));

  const cols: { key: SortKey; label: string }[] = [
    { key: "date", label: "Date" },
    { key: "temp", label: "Temp (°C)" },
    { key: "humidity", label: "Humidity (%)" },
    { key: "pressure", label: "Pressure" },
    { key: "wind", label: "Wind" },
    { key: "season", label: "Season" },
    { key: "condition", label: "Condition" },
  ];

  return (
    <div className="glass rounded-2xl p-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">Dataset</h3>
          <p className="text-xs text-muted-foreground">{filtered.length} records</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search…"
            className="pl-9 rounded-xl glass border-border/60"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {slice.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl glass grid place-items-center mb-3">
            <Inbox className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="font-medium">No matching rows</p>
          <p className="text-xs text-muted-foreground">Try a different search.</p>
        </div>
      ) : (
        <div className="overflow-auto rounded-xl max-h-[420px] border border-border/50">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 backdrop-blur bg-background/80">
              <tr>
                {cols.map((c) => (
                  <th
                    key={c.key}
                    onClick={() => toggleSort(c.key)}
                    className="text-left font-semibold px-4 py-3 cursor-pointer select-none whitespace-nowrap"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {c.label}
                      <ArrowUpDown className="h-3 w-3 opacity-60" />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slice.map((r, i) => (
                <tr key={r.date + i} className="border-t border-border/40 hover:bg-muted/40 transition">
                  <td className="px-4 py-2.5 font-mono text-xs">{r.date}</td>
                  <td className="px-4 py-2.5">{r.temp}</td>
                  <td className="px-4 py-2.5">{r.humidity}</td>
                  <td className="px-4 py-2.5">{r.pressure}</td>
                  <td className="px-4 py-2.5">{r.wind}</td>
                  <td className="px-4 py-2.5">
                    <span className="px-2 py-0.5 rounded-full text-xs gradient-primary text-white">{r.season}</span>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.condition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between mt-4">
        <p className="text-xs text-muted-foreground">
          Page {safePage} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg"
            disabled={safePage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg"
            disabled={safePage === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
