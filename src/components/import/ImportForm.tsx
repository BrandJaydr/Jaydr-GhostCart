'use client';

import { useState } from 'react';
import { Sparkles, FileSpreadsheet, Link2, CheckCircle2, Upload } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type SourceType = 'mock' | 'csv' | 'url';

export default function ImportForm() {
  const [sourceType, setSourceType] = useState<SourceType>('mock');
  const [sourceUrl, setSourceUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ id: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setImportResult(null);
    setIsImporting(true);

    try {
      const adapter = sourceType === 'mock' ? 'mock' : sourceType;
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sourceUrl, adapter }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to import product');
      }

      setImportResult({ id: data.data.id });
    } catch (err: any) {
      setError(err.message || 'An error occurred during import');
    } finally {
      setIsImporting(false);
    }
  };

  const options = [
    {
      id: 'mock',
      icon: Sparkles,
      label: 'Mock Product',
      description: 'Test with fixture data',
    },
    {
      id: 'csv',
      icon: FileSpreadsheet,
      label: 'CSV Upload',
      description: 'Import from CSV file',
    },
    {
      id: 'url',
      icon: Link2,
      label: 'Product URL',
      description: 'Paste supplier URL',
    },
  ];

  return (
    <div className="max-w-3xl">
      {importResult ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 flex flex-col items-center justify-center text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" />
          <h3 className="text-lg font-medium text-emerald-900 mb-2">Product imported successfully!</h3>
          <p className="text-emerald-700 mb-6">The product has been imported and is ready for review.</p>
          <Link href={`/products/${importResult.id}/review`} passHref legacyBehavior>
            <Button variant="primary">Review Product</Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <label className="block text-sm font-medium text-neutral-700">Source Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {options.map((option) => {
                const Icon = option.icon;
                const isSelected = sourceType === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSourceType(option.id as SourceType)}
                    className={`flex flex-col items-center p-4 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'ring-2 ring-primary-500 border-primary-500 bg-primary-50'
                        : 'border border-neutral-200 bg-white hover:border-neutral-300'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mb-3 ${isSelected ? 'text-primary-600' : 'text-neutral-500'}`} />
                    <span className={`font-medium ${isSelected ? 'text-primary-900' : 'text-neutral-900'}`}>
                      {option.label}
                    </span>
                    <span className={`text-xs mt-1 text-center ${isSelected ? 'text-primary-700' : 'text-neutral-500'}`}>
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            {sourceType === 'url' && (
              <Input
                label="Product URL"
                placeholder="https://supplier.example.com/product/12345"
                required
                value={sourceUrl}
                onChange={(e: any) => setSourceUrl(e.target.value)}
              />
            )}

            {sourceType === 'csv' && (
              <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Upload className="w-5 h-5 text-sky-500 mt-0.5 mr-3 flex-shrink-0" />
                  <p className="text-sm text-sky-800">
                    CSV import is available through the API. Use <code>POST /api/products</code> with adapter: csv
                  </p>
                </div>
              </div>
            )}
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
              disabled={sourceType === 'url' && !sourceUrl.trim()}
            >
              Import Product
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
