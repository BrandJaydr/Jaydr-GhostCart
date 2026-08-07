import type { ISupplierAdapter } from './supplier.interface';
import { mockAdapter } from './mock.adapter';

/**
 * Adapter Registry / Factory — Stage 1
 *
 * Resolves an `ISupplierAdapter` implementation by its `adapterId`.
 * The application layer (worker, API routes) depends only on this factory —
 * never on a concrete adapter directly. This isolates vendor payloads from
 * the domain layer (Production Blueprint §6.2 — Adapter Pattern).
 *
 * Stage 1: ships with the `mock` adapter (fixture data).
 * Stage 2+: @agent:atlas Register real adapter instances here (csv, ebay-catalog,
 *           etc.) — see `Docs/CHECK LIST AND FAQ.md` §Frontend UI Component Tree
 *           and `tasks/todo.md` Stage 2 handoff.
 *
 * TODO: @agent:atlas Move to a declarative config-driven registry once the
 *       second supplier integration lands (Stage 2).
 */
const adapters = new Map<string, ISupplierAdapter>([['mock', mockAdapter]]);

/** Resolve a supplier adapter by its `adapterId` (e.g. 'mock', 'csv'). */
export function getSupplierAdapter(
  adapterId: string,
): ISupplierAdapter | undefined {
  return adapters.get(adapterId);
}

/** List all registered adapter IDs (for diagnostics / adapter selection UI). */
export function listSupplierAdapters(): string[] {
  return Array.from(adapters.keys());
}
