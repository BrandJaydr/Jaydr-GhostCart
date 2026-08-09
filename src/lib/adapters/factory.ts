import type { ISupplierAdapter } from './supplier.interface';
import { mockAdapter } from './mock.adapter';
import { csvAdapter } from './csv.adapter';

/**
 * Adapter Registry / Factory — Stage 2
 *
 * Resolves an `ISupplierAdapter` implementation by its `adapterId`.
 * The application layer (worker, API routes) depends only on this factory —
 * never on a concrete adapter directly. This isolates vendor payloads from
 * the domain layer (Production Blueprint §6.2 — Adapter Pattern).
 *
 * Stage 2: registers the first real authorized adapters:
 *   - `csv`  — user-provided CSV catalog feed
 *   - `mock` — kept as a dev fixture (never used in production flows)
 */
const adapters = new Map<string, ISupplierAdapter>([
  ['mock', mockAdapter],
  ['csv', csvAdapter],
]);

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
