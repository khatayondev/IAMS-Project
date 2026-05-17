import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  highlight?: boolean;
}

export function StatCard({ title, value, subtitle, icon, highlight }: StatCardProps) {
  return (
    <div
      className={`rounded-2xl p-5 transition-all duration-200 hover:shadow-[0_2px_12px_rgba(11,94,215,0.08)] ${
        highlight
          ? "bg-primary text-primary-foreground"
          : "bg-card"
      }`}
    >
      <div className="flex items-start justify-between">
        <p style={{ fontSize: "0.8rem", fontWeight: 500 }} className={highlight ? "text-primary-foreground/80" : "text-muted-foreground"}>
          {title}
        </p>
        <div className={`p-1.5 rounded-lg ${highlight ? "bg-white/20" : "bg-white dark:bg-white/10"}`}>
          {icon || <ArrowUpRight className="w-4 h-4" />}
        </div>
      </div>
      <p className="mt-2" style={{ fontSize: "2rem", lineHeight: 1.1, fontWeight: 600 }}>{value}</p>
      {subtitle && (
        <p style={{ fontSize: "0.75rem" }} className={`mt-1.5 ${highlight ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
