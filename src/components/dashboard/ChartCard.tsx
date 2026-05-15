import { useRef, type ReactNode } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  title: string;
  description?: string;
  children: ReactNode;
  exportName?: string;
  action?: ReactNode;
}

export function ChartCard({ title, description, children, exportName, action }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    const node = ref.current?.querySelector("svg");
    if (!node) return;
    const svgString = new XMLSerializer().serializeToString(node);
    const svg = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svg);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const rect = (node as SVGSVGElement).getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0, rect.width, rect.height);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${exportName ?? title}.png`;
        a.click();
      });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className="glass rounded-2xl p-5 animate-fade-in hover-lift">
      <div className="flex items-start justify-between mb-4 gap-2">
        <div>
          <h3 className="font-semibold tracking-tight">{title}</h3>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {action}
          <Button variant="ghost" size="sm" onClick={handleExport} className="h-8 gap-1.5 rounded-lg">
            <Download className="h-3.5 w-3.5" /> PNG
          </Button>
        </div>
      </div>
      <div ref={ref} className="w-full h-[280px]">
        {children}
      </div>
    </div>
  );
}
