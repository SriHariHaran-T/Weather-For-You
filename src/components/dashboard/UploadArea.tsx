import { useRef, useState } from "react";
import { Upload, FileSpreadsheet, Loader2, AlertCircle } from "lucide-react";
import { parseCSVAsync, MAX_CSV_BYTES, type WeatherRow } from "@/lib/weather-data";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

const MB = 1024 * 1024;

export function UploadArea({ onLoaded }: { onLoaded: (rows: WeatherRow[]) => void }) {
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<"reading" | "parsing" | null>(null);
  const [error, setError] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError("");
    if (!file.name.toLowerCase().endsWith(".csv")) {
      const msg = "Please upload a .csv file.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (file.size > MAX_CSV_BYTES) {
      const msg = `File is ${(file.size / MB).toFixed(1)}MB — limit is ${MAX_CSV_BYTES / MB}MB.`;
      setError(msg);
      toast.error(msg);
      return;
    }

    setBusy(true);
    setProgress(0);
    setStage("reading");
    try {
      const text = await readFileWithProgress(file, (p) => setProgress(Math.round(p * 30)));
      setStage("parsing");
      const rows = await parseCSVAsync(text, (p) => setProgress(30 + Math.round(p * 0.7)));
      if (!rows.length) {
        const msg = "No valid rows found. Expected columns: date, temp, humidity, pressure, wind.";
        setError(msg);
        toast.error(msg);
        return;
      }
      onLoaded(rows);
      toast.success(`Loaded ${rows.length.toLocaleString()} rows from ${file.name}`);
    } catch (e: any) {
      const msg = e?.message || "Failed to parse CSV.";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
      setStage(null);
      setProgress(0);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        if (busy) return;
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        if (busy) return;
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files[0];
        if (f) handleFile(f);
      }}
      onClick={() => !busy && inputRef.current?.click()}
      className={`glass rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
        busy ? "cursor-wait opacity-90" : "cursor-pointer"
      } ${
        drag ? "border-primary scale-[1.01] shadow-glow" : "border-border/60 hover:border-primary/50"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      <div className="mx-auto w-14 h-14 rounded-2xl gradient-primary grid place-items-center shadow-glow mb-3">
        {busy ? (
          <Loader2 className="h-6 w-6 text-white animate-spin" />
        ) : drag ? (
          <FileSpreadsheet className="h-6 w-6 text-white" />
        ) : (
          <Upload className="h-6 w-6 text-white" />
        )}
      </div>

      {busy ? (
        <div className="max-w-sm mx-auto">
          <p className="font-semibold">
            {stage === "reading" ? "Reading file…" : "Parsing rows…"}
          </p>
          <p className="text-xs text-muted-foreground mb-3">{progress}%</p>
          <Progress value={progress} />
        </div>
      ) : (
        <>
          <p className="font-semibold">Drop your CSV here</p>
          <p className="text-sm text-muted-foreground mt-1">
            or click to browse · max {MAX_CSV_BYTES / MB}MB · columns: date, temp, humidity, pressure, wind
          </p>
        </>
      )}

      {error && !busy && (
        <div className="mt-4 inline-flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-1.5">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </div>
      )}
    </div>
  );
}

function readFileWithProgress(file: File, onProgress: (pct: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
