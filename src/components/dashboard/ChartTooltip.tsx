import type { TooltipProps } from "recharts";

export function GlassTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl px-3 py-2 text-xs">
      {label !== undefined && <p className="font-semibold mb-1">{String(label)}</p>}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">{p.value}</span>
        </p>
      ))}
    </div>
  );
}
