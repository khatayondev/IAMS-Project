interface HistoryItem {
  status: string;
  timestamp: string;
  description: string;
  actor: string;
}

interface ApplicationHistoryProps {
  history: HistoryItem[];
}

export function ApplicationHistory({ history }: ApplicationHistoryProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <h3>Timeline Log</h3>
      <div className="relative border-l-2 border-border pl-4 ml-2 space-y-4">
        {history.map((h, i) => (
          <div key={i} className="relative">
            <span className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-border border-2 border-card" />
            <div style={{ fontSize: "0.8rem" }}>
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">{h.status}</p>
                <span className="text-muted-foreground text-xs" style={{ fontSize: "0.7rem" }}>
                  {h.timestamp}
                </span>
              </div>
              <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.75rem" }}>
                {h.description} · <span className="font-medium">{h.actor}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
