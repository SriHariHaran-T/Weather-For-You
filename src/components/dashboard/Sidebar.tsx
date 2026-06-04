import { LayoutDashboard, BarChart3, Database, LineChart, CloudSun } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "charts", label: "Charts", icon: BarChart3 },
  { id: "dataset", label: "Dataset", icon: Database },
  { id: "analytics", label: "Analytics", icon: LineChart },
];

export function Sidebar({
  active,
  onChange,
  open,
}: {
  active: string;
  onChange: (id: string) => void;
  open: boolean;
}) {
  const handleClick = (id: string) => {
    onChange(id);
    if (typeof window === "undefined") return;
    const el = document.getElementById(`section-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <aside
      className={cn(
        "fixed lg:sticky top-0 left-0 z-40 h-screen w-64 shrink-0 transition-transform duration-300",
        "lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="m-3 h-[calc(100vh-1.5rem)] glass-strong rounded-2xl p-4 flex flex-col">
        <div className="flex items-center gap-2.5 px-2 pb-5 border-b border-border/50">
          <div className="gradient-primary rounded-xl p-2 shadow-glow">
            <CloudSun className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">Weather</p>
            <p className="text-xs text-muted-foreground">Analytics</p>
          </div>
        </div>

        <nav className="flex-1 mt-4 space-y-1">
          {items.map((it) => {
            const Icon = it.icon;
            const isActive = active === it.id;
            return (
              <button
                key={it.id}
                onClick={() => handleClick(it.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "gradient-primary text-white shadow-glow"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {it.label}
              </button>
            );
          })}
        </nav>

        <div className="glass rounded-xl p-3 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground mb-1">Pro tip</p>
          Upload a CSV in the Dataset tab to analyze your own data.
        </div>
      </div>
    </aside>
  );
}
