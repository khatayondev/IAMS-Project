/**
 * Custom Hooks
 * ────────────
 * Reusable hooks for data fetching, debouncing, and UI patterns.
 * These hooks are designed to work with the API client layer.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { ApiResponse } from "../types/api";

// ── useAsync: Generic async operation hook ──

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useAsync<T>(
  asyncFn: () => Promise<ApiResponse<T>>,
  deps: any[] = [],
  immediate = true
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const result = await asyncFn();
      if (result.success) {
        setState({ data: result.data, loading: false, error: null });
      } else {
        setState({ data: null, loading: false, error: result.message || "Request failed" });
      }
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }, deps);

  useEffect(() => {
    if (immediate) execute();
  }, [execute, immediate]);

  return { ...state, refetch: execute };
}

// ── useDebounce: Debounce a value (for search inputs) ──

export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

// ── useLocalStorage: In-memory state helper ──

export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(defaultValue);

  return [value, setValue];
}

// ── useMediaQuery: Responsive breakpoint hook ──

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

export const useIsMobile = () => useMediaQuery("(max-width: 767px)");
export const useIsTablet = () => useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
export const useIsDesktop = () => useMediaQuery("(min-width: 1024px)");

// ── useClickOutside: Close dropdowns/modals on outside click ──

export function useClickOutside(ref: React.RefObject<HTMLElement | null>, callback: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        callback();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, callback]);
}

// ── usePagination: Client-side pagination ──

interface PaginationOptions {
  pageSize?: number;
}

export function usePagination<T>(items: T[], options: PaginationOptions = {}) {
  const { pageSize = 10 } = options;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // Reset to page 1 when items change
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [items.length, totalPages]);

  const paginatedItems = items.slice((page - 1) * pageSize, page * pageSize);

  return {
    items: paginatedItems,
    page,
    totalPages,
    total: items.length,
    setPage,
    nextPage: () => setPage((p) => Math.min(p + 1, totalPages)),
    prevPage: () => setPage((p) => Math.max(p - 1, 1)),
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

// ── useToastAction: Execute async action with toast feedback ──

import { toast } from "sonner";

export function useToastAction() {
  const [loading, setLoading] = useState(false);

  const execute = useCallback(
    async <T>(
      action: () => Promise<ApiResponse<T>>,
      options?: { successMessage?: string; errorMessage?: string }
    ): Promise<ApiResponse<T> | null> => {
      setLoading(true);
      try {
        const result = await action();
        if (result.success) {
          toast.success(options?.successMessage || result.message || "Action completed");
        } else {
          toast.error(options?.errorMessage || result.message || "Action failed");
        }
        return result;
      } catch (err) {
        toast.error(options?.errorMessage || (err as Error).message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { execute, loading };
}
