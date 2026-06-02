// Reusable skeleton / shimmer loading primitives.
// All components use Tailwind's animate-pulse for the shimmer effect.

// ── Primitive ──────────────────────────────────────────────────────────────────

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className = "", style }: SkeletonProps) {
  return (
    <div
      className={`bg-muted/60 dark:bg-muted/40 rounded animate-pulse ${className}`}
      style={style}
    />
  );
}

// ── Stat card row ─────────────────────────────────────────────────────────────
// Matches the 4-column StatCard grid used across most pages.

export function SkeletonStatCards({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card rounded-2xl p-4 flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Table skeleton ────────────────────────────────────────────────────────────
// Matches the bg-card table with column headers + rows used in users, audit, grades, etc.

export function SkeletonTable({
  rows = 6,
  cols = 5,
  showFilters = true,
}: {
  rows?: number;
  cols?: number;
  showFilters?: boolean;
}) {
  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex gap-3 flex-wrap">
          <Skeleton className="h-9 w-56 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      )}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* header */}
        <div className="border-b border-border bg-muted/30 flex gap-4 px-4 py-3">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-3 rounded" style={{ width: `${60 + (i % 3) * 20}px` }} />
          ))}
        </div>
        {/* rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0">
            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
            {Array.from({ length: cols - 1 }).map((_, j) => (
              <Skeleton
                key={j}
                className="h-3 rounded flex-1"
                style={{ maxWidth: `${80 + ((i + j) % 4) * 25}px` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Card grid skeleton ────────────────────────────────────────────────────────
// Matches 2 or 3 column card grids (departments, companies, terms, etc.)

export function SkeletonCardGrid({
  cards = 6,
  cols = 2,
}: {
  cards?: number;
  cols?: number;
}) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-${cols} gap-4`}>
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="bg-card border border-border/50 rounded-2xl p-5 space-y-4">
          <div className="flex items-start gap-3">
            <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
              <div className="flex gap-1.5 mt-1">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-border/50 grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Skeleton className="h-2.5 w-10" />
              <Skeleton className="h-3.5 w-20" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-2.5 w-10" />
              <Skeleton className="h-3.5 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── List skeleton ─────────────────────────────────────────────────────────────
// Matches simple stacked list items (logbook entries, assignments, supervisor cards, etc.)

export function SkeletonList({
  rows = 5,
  avatar = true,
}: {
  rows?: number;
  avatar?: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl divide-y divide-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4">
          {avatar && <Skeleton className="w-10 h-10 rounded-full shrink-0" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 rounded" style={{ width: `${120 + (i % 3) * 40}px` }} />
            <Skeleton className="h-3 rounded w-32" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );
}

// ── Dashboard skeleton ────────────────────────────────────────────────────────
// Matches the header + stat cards + charts + table layout used in dashboard pages.

export function SkeletonDashboard({ statCount = 5 }: { statCount?: number }) {
  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-3.5 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>

      {/* stat cards */}
      <SkeletonStatCards count={statCount} />

      {/* charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-2xl p-5 space-y-4">
          <Skeleton className="h-4 w-40" />
          <div className="h-48 flex items-end gap-3 px-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton
                key={i}
                className="flex-1 rounded-t"
                style={{ height: `${30 + Math.sin(i) * 40 + 40}%` }}
              />
            ))}
          </div>
        </div>
        <div className="bg-card rounded-2xl p-5 space-y-4">
          <Skeleton className="h-4 w-32" />
          <div className="flex items-center justify-center h-48">
            <Skeleton className="w-36 h-36 rounded-full" />
          </div>
        </div>
      </div>

      {/* table */}
      <SkeletonTable rows={5} cols={5} showFilters={false} />
    </div>
  );
}

// ── Table body rows skeleton ──────────────────────────────────────────────────
// Renders <tr> elements — drop directly inside <tbody> in place of loading message.

export function SkeletonTableRows({
  rows = 5,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-border last:border-0">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div
                className="h-3 bg-muted/60 dark:bg-muted/40 rounded animate-pulse"
                style={{ width: j === 0 ? "120px" : `${50 + ((i + j) % 4) * 18}px` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ── Inline page header skeleton ───────────────────────────────────────────────
// Just the title + subtitle + optional action button — used at the top of content pages.

export function SkeletonPageHeader({ showAction = true }: { showAction?: boolean }) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-3.5 w-64" />
      </div>
      {showAction && <Skeleton className="h-9 w-32 rounded-xl" />}
    </div>
  );
}

// ── Tab bar skeleton ──────────────────────────────────────────────────────────

export function SkeletonTabs({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-9 rounded-lg shrink-0" style={{ width: `${60 + (i % 3) * 20}px` }} />
      ))}
    </div>
  );
}

// ── Detail / form card skeleton ───────────────────────────────────────────────
// Used for detail panels, grading forms, config forms.

export function SkeletonFormCard({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
      <Skeleton className="h-5 w-36" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}
