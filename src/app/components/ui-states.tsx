/**
 * Reusable UI State Components
 * ────────────────────────────
 * Loading skeletons, empty states, and error states for consistent UX.
 * Use these across all pages for a polished, integration-ready experience.
 */

import { AlertTriangle, Inbox, RefreshCw, Loader2, WifiOff, SearchX } from "lucide-react";
import type { ReactNode } from "react";

// ── Loading Spinner ──

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function LoadingSpinner({ size = "md", label }: LoadingSpinnerProps) {
  const sizeMap = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-10 h-10" };
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <Loader2 className={`${sizeMap[size]} animate-spin text-primary`} />
      {label && (
        <p className="text-muted-foreground" style={{ fontSize: "0.85rem" }}>
          {label}
        </p>
      )}
    </div>
  );
}

// ── Card Skeleton ──

interface SkeletonCardProps {
  count?: number;
  layout?: "grid" | "list";
}

export function SkeletonCards({ count = 4, layout = "grid" }: SkeletonCardProps) {
  return (
    <div className={layout === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" : "space-y-3"}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-card p-5 animate-pulse">
          <div className="flex items-start justify-between mb-3">
            <div className="h-3 w-20 bg-muted rounded" />
            <div className="h-8 w-8 bg-muted rounded-lg" />
          </div>
          <div className="h-8 w-16 bg-muted rounded mb-2" />
          <div className="h-2.5 w-24 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}

// ── Table Skeleton ──

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export function SkeletonTable({ rows = 5, columns = 5 }: SkeletonTableProps) {
  return (
    <div className="rounded-2xl bg-card overflow-hidden animate-pulse">
      {/* Header */}
      <div className="flex gap-4 p-4 border-b border-border bg-secondary/30">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-3 bg-muted rounded flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 p-4 border-b border-border last:border-0">
          {Array.from({ length: columns }).map((_, c) => (
            <div key={c} className="h-3 bg-muted/60 rounded flex-1" style={{ width: `${60 + Math.random() * 40}%` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Empty State ──

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
        {icon || <Inbox className="w-7 h-7 text-muted-foreground" />}
      </div>
      <h3 className="text-foreground mb-1" style={{ fontSize: "1.05rem" }}>
        {title}
      </h3>
      {description && (
        <p className="text-muted-foreground max-w-sm" style={{ fontSize: "0.85rem" }}>
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          style={{ fontSize: "0.85rem" }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// ── No Search Results ──

interface NoResultsProps {
  query: string;
  onClear?: () => void;
}

export function NoResults({ query, onClear }: NoResultsProps) {
  return (
    <EmptyState
      icon={<SearchX className="w-7 h-7 text-muted-foreground" />}
      title="No results found"
      description={`Nothing matches "${query}". Try adjusting your search or filters.`}
      action={onClear ? { label: "Clear search", onClick: onClear } : undefined}
    />
  );
}

// ── Error State ──

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  variant?: "inline" | "fullpage";
}

export function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  onRetry,
  variant = "inline",
}: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${variant === "fullpage" ? "py-24" : "py-12"} px-4`}>
      <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
        <AlertTriangle className="w-7 h-7 text-destructive" />
      </div>
      <h3 className="text-foreground mb-1" style={{ fontSize: "1.05rem" }}>
        {title}
      </h3>
      <p className="text-muted-foreground max-w-sm" style={{ fontSize: "0.85rem" }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent transition-colors flex items-center gap-2"
          style={{ fontSize: "0.85rem" }}
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      )}
    </div>
  );
}

// ── Offline State ──

export function OfflineState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mb-4">
        <WifiOff className="w-7 h-7 text-amber-600" />
      </div>
      <h3 className="text-foreground mb-1" style={{ fontSize: "1.05rem" }}>
        You're offline
      </h3>
      <p className="text-muted-foreground max-w-sm" style={{ fontSize: "0.85rem" }}>
        Check your internet connection and try again.
      </p>
    </div>
  );
}

// ── Inline Loading Bar (for table/list refreshes) ──

export function InlineLoadingBar() {
  return (
    <div className="w-full h-0.5 bg-muted overflow-hidden rounded-full">
      <div className="h-full bg-primary animate-[shimmer_1.5s_ease-in-out_infinite] w-1/3 rounded-full" />
    </div>
  );
}

// ── Confirmation Dialog ──

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-card rounded-2xl border border-border shadow-2xl p-6 max-w-md w-full mx-4">
        <h3 className="text-foreground mb-2" style={{ fontSize: "1.05rem" }}>
          {title}
        </h3>
        <p className="text-muted-foreground mb-6" style={{ fontSize: "0.85rem" }}>
          {description}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-accent transition-colors"
            style={{ fontSize: "0.85rem" }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg transition-opacity hover:opacity-90 ${
              variant === "danger"
                ? "bg-destructive text-destructive-foreground"
                : "bg-primary text-primary-foreground"
            }`}
            style={{ fontSize: "0.85rem" }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}