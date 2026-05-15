import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string;
  unit?: string;
  icon: LucideIcon;
  gradient: "primary" | "warm" | "cool" | "rose" | "mint";
  trend?: string;
}

const gradientClass: Record<Props["gradient"], string> = {
  primary: "gradient-primary",
  warm: "gradient-warm",
  cool: "gradient-cool",
  rose: "gradient-rose",
  mint: "gradient-mint",
};

export function StatCard({ label, value, unit, icon: Icon, gradient, trend }: Props) {
  return (
    <div className="glass hover-lift rounded-2xl p-5 relative overflow-hidden animate-fade-in">
      <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full blur-2xl opacity-40 ${gradientClass[gradient]}`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold tracking-tight">{value}</span>
            {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
          </div>
          {trend && <p className="mt-2 text-xs text-muted-foreground">{trend}</p>}
        </div>
        <div className={`${gradientClass[gradient]} rounded-xl p-2.5 shadow-glow`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}
