import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";
import { useStore } from "@/lib/store";
import { isBackendOnline } from "@/lib/authService";
import { CloudOff, Cloud, Loader2 } from "lucide-react";

/**
 * Shows whether the dashboard is reading from the live Express API or from
 * local mock data. Being explicit here keeps the demo honest.
 */
export function ApiStatus({ compact = false }: { compact?: boolean }) {
  void useStore();
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    isBackendOnline().then((v) => alive && setOnline(v));
    return () => { alive = false; };
  }, []);

  const state = online === null ? "checking" : online ? "live" : "demo";

  if (compact) {
    return (
      <span
        title={state === "live" ? "Connected to the EventSphere API" : state === "demo" ? "API offline — showing mock data" : "Checking API"}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10.5px] font-bold uppercase tracking-wide",
          state === "live" ? "bg-emerald-50 text-emerald-700" : state === "demo" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"
        )}
      >
        {state === "checking" ? <Loader2 className="size-3 animate-spin" /> : state === "live" ? <Cloud className="size-3" /> : <CloudOff className="size-3" />}
        {state === "live" ? "API" : state === "demo" ? "Demo" : "…"}
      </span>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-xl px-3 py-2 text-[11.5px] font-semibold",
        state === "live" ? "bg-emerald-50 text-emerald-800" : state === "demo" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600"
      )}
    >
      {state === "checking" ? <Loader2 className="size-4 shrink-0 animate-spin" /> : state === "live" ? <Cloud className="size-4 shrink-0" /> : <CloudOff className="size-4 shrink-0" />}
      <span className="min-w-0">
        {state === "live" ? "Live data from MongoDB" : state === "demo" ? "Mock data — API offline" : "Checking connection…"}
        {state === "demo" && <span className="block text-[10.5px] font-medium opacity-75">Run the API: cd server && npm run dev</span>}
      </span>
    </div>
  );
}

export default ApiStatus;
