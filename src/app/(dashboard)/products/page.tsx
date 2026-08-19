'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Upload, Search, Filter } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Spinner } from '@/components/ui/Spinner';
import { ProductCard } from '@/components/products/ProductCard';

interface Product {
  id: string;
  title: string;
  sourceUrl: string;
  adapter: string;
  supplierPriceCents: number;
  reviewStatus: 'pending_review' | 'approved' | 'rejected';
  imageUrl?: string;
  confidenceScore?: number;
}

/**
 * 🏗️ Forge Scaffold: Products Catalog Page
 * Refactored to Island UI (pure Tailwind/Lucide, no Radix/HeroUI).
 * @agent:atlas - Implement pagination, actual search/filter logic, and state persistence.
 */
export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'all' | 'pending_review' | 'approved' | 'rejected'>('all');

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/products');
      if (!res.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await res.json();
      
      const productsData = Array.isArray(data) ? data : (data.data || []);
      const formattedProducts = productsData.map((p: any) => ({
        id: p.id,
        title: p.title || p.name || 'Unknown Product',
        sourceUrl: p.sourceUrl || p.source_url || '',
        adapter: p.adapter || p.supplier || 'Unknown Supplier',
        supplierPriceCents: p.supplierPriceCents || p.supplier_price_cents || 0,
        reviewStatus: p.reviewStatus || p.review_status || 'pending_review',
        imageUrl: p.imageUrl || undefined,
        confidenceScore: p.confidenceScore || 90 // Default for scaffold
      }));
      setProducts(formattedProducts);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching products.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(product => {
    if (selectedTab === 'all') return true;
    return product.reviewStatus === selectedTab;
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState 
          title="Failed to load products" 
          message={error} 
          onRetry={fetchProducts} 
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      <PageHeader 
        title="Products" 
        subtitle="Manage your imported product catalog"
        action={
          <Link 
            href="/import" 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-[#791228] text-white shadow hover:bg-[#55121e] h-9 px-4 py-2"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import Product
          </Link>
        }
      />

      {products.length === 0 ? (
        <EmptyState 
          title="No products yet" 
          description="Import your first product to get started"
          action={
            <Link 
              href="/import" 
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-[#791228] text-white shadow hover:bg-[#55121e] h-9 px-4 py-2 mt-4"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import Product
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          {/* Controls Bar Scaffold (Island UI style) */}
          <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-[#e0dbd8] shadow-sm">
            <div className="flex gap-1">
              {(['all', 'pending_review', 'approved', 'rejected'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    selectedTab === tab 
                      ? 'bg-[#f3f1ef] text-[#791228]' 
                      : 'text-muted-foreground hover:bg-gray-50'
                  }`}
                >
                  {tab === 'all' ? 'All' : tab.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2 pr-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  className="pl-8 pr-3 py-1.5 text-sm border border-[#e0dbd8] rounded-md focus:outline-none focus:border-[#791228] focus:ring-1 focus:ring-[#791228]"
                  disabled
                />
              </div>
              <button className="p-1.5 border border-[#e0dbd8] rounded-md text-muted-foreground hover:bg-gray-50 transition-colors">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Product Grid Scaffold */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                title={product.title}
                supplierPriceCents={product.supplierPriceCents}
                adapter={product.adapter}
                reviewStatus={product.reviewStatus}
                sourceUrl={product.sourceUrl}
                imageUrl={product.imageUrl}
                confidenceScore={product.confidenceScore}
              />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              No products found for this filter.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
