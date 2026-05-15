import { useState, useRef } from "react";
import { Upload, FileSpreadsheet } from "lucide-react";
import { parseCSV, type WeatherRow } from "@/lib/weather-data";
import { toast } from "sonner";

export function UploadArea({ onLoaded }: { onLoaded: (rows: WeatherRow[]) => void }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }
    const text = await file.text();
    const rows = parseCSV(text);
    if (!rows.length) {
      toast.error("Couldn't parse data — check the CSV format");
      return;
    }
    onLoaded(rows);
    toast.success(`Loaded ${rows.length} rows from ${file.name}`);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files[0];
        if (f) handleFile(f);
      }}
      onClick={() => inputRef.current?.click()}
      className={`glass rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
        drag ? "border-primary scale-[1.01] shadow-glow" : "border-border/60 hover:border-primary/50"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <div className="mx-auto w-14 h-14 rounded-2xl gradient-primary grid place-items-center shadow-glow mb-3">
        {drag ? <FileSpreadsheet className="h-6 w-6 text-white" /> : <Upload className="h-6 w-6 text-white" />}
      </div>
      <p className="font-semibold">Drop your CSV here</p>
      <p className="text-sm text-muted-foreground mt-1">
        or click to browse · columns: date, temp, humidity, pressure, wind
      </p>
    </div>
  );
}
