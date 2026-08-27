'use client';

import { useEffect, useState } from 'react';
import { Link2, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface SupplierOption {
  id: string;
  adapterId: string;
  name: string;
}

interface ImportResult {
  jobId: string;
  status: string;
}

/**
 * ImportProduct by URL from a configured supplier connection.
 *
 * @agent:investigator Fix 1 (ERR-022) - This form previously posted
 * { sourceUrl, adapter } and read data.id, which never matched the
 * product.import contract. It now posts { url, supplierId, idempotencyKey }
 * to align with ProductImportSchema and consumes data.jobId (202 boundary).
 * supplierId is a suppliers-row UUID from GET /api/suppliers.
 */
export default function ImportForm() {
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [suppliersError, setSuppliersError] = useState<string | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/suppliers');
        const data = await res.json();
        if (!active) return;
        if (!res.ok || !data.success) {
          setSuppliersError(data.error || 'Failed to load suppliers');
        } else {
          setSuppliers(data.data ?? []);
          // Prefer the `html` adapter (universal product-page scraper) so a
          // pasted URL actually imports; fall back to the first supplier.
          const htmlSupplier = data.data?.find(
            (s: SupplierOption) => s.adapterId === 'html',
          );
          if (htmlSupplier) {
            setSelectedSupplierId(htmlSupplier.id);
          } else if (data.data?.length) {
            setSelectedSupplierId(data.data[0].id);
          }
        }
      } catch {
        if (active) setSuppliersError('Failed to load suppliers');
      } finally {
        if (active) setSuppliersLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setImportResult(null);
    setIsImporting(true);
    try {
      const idempotencyKey = crypto.randomUUID();
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sourceUrl, supplierId: selectedSupplierId, idempotencyKey }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to import product');
      }
      setImportResult({ jobId: data.data.jobId, status: data.data.status || 'queued' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during import');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="max-w-3xl">
      {importResult ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 flex flex-col items-center justify-center text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" />
          <h3 className="text-lg font-medium text-emerald-900 mb-2">Import queued</h3>
          <p className="text-emerald-700 mb-1">
            The product is being processed in the background.
          </p>
          <p className="text-xs text-emerald-600 mb-6">Job ID: {importResult.jobId}</p>
          <Link href="/products" passHref legacyBehavior>
            <Button variant="primary">View Products</Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {suppliersLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading suppliers
            </div>
          ) : suppliersError ? (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4" /> {suppliersError}
            </div>
          ) : suppliers.length === 0 ? (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              <AlertCircle className="w-4 h-4" />
              No suppliers configured. Add a supplier to import products.
            </div>
          ) : (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-neutral-700">Supplier</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {suppliers.map((supplier) => {
                  const isSelected = selectedSupplierId === supplier.id;
                  return (
                    <button
                      key={supplier.id}
                      type="button"
                      onClick={() => setSelectedSupplierId(supplier.id)}
                      className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'ring-2 ring-primary-500 border-primary-500 bg-primary-50'
                          : 'border-neutral-200 bg-white hover:border-neutral-300'
                      }`}
                    >
                      <span className={`font-medium ${isSelected ? 'text-primary-900' : 'text-neutral-900'}`}>
                        {supplier.name}
                      </span>
                      <span className="text-xs mt-1 text-neutral-500">
                        Adapter: {supplier.adapterId}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Product URL"
              placeholder="https://supplier.example.com/product/12345"
              required
              value={sourceUrl}
              onValueChange={setSourceUrl}
              startContent={<Link2 className="w-4 h-4 text-muted-foreground" />}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="pt-4 border-t border-neutral-200">
            <Button
              type="submit"
              variant="primary"
              isLoading={isImporting}
              disabled={!sourceUrl.trim() || !selectedSupplierId || isImporting}
            >
              Import Product
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}