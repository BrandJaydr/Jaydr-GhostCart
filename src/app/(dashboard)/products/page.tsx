'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { Upload, Search } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Spinner } from '@/components/ui/Spinner';
import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@heroui/react';

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

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Load initial state from URL query parameters
  const initialTab = (searchParams.get('tab') || 'all') as 'all' | 'pending_review' | 'approved' | 'rejected';
  const initialSearch = searchParams.get('search') || '';
  const initialPage = Number(searchParams.get('page') || '1');

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedTab, setSelectedTab] = useState<'all' | 'pending_review' | 'approved' | 'rejected'>(initialTab);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Retrieve products from API (fetches default limit)
      // To perform thorough client-side search/filter/pagination, we query a higher limit
      const res = await fetch('/api/products?limit=100');
      if (!res.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await res.json();
      
      const productsData = Array.isArray(data) ? data : (data.data || []);
      const formattedProducts = productsData.map((p: Record<string, unknown>) => ({
        id: String(p.id || ''),
        title: String(p.title || p.name || 'Unknown Product'),
        sourceUrl: String(p.sourceUrl || p.source_url || ''),
        adapter: String(p.adapter || p.supplier || 'Unknown Supplier'),
        supplierPriceCents: Number(p.supplierPriceCents || p.supplier_price_cents || 0),
        reviewStatus: (p.reviewStatus || p.review_status || 'pending_review') as 'pending_review' | 'approved' | 'rejected',
        imageUrl: p.imageUrl || p.primaryImageUrl ? String(p.imageUrl || p.primaryImageUrl) : undefined,
        confidenceScore: Number(p.confidenceScore || p.confidence || 90)
      }));
      setProducts(formattedProducts);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching products.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Sync state back to URL query parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedTab !== 'all') params.set('tab', selectedTab);
    if (searchQuery) params.set('search', searchQuery);
    if (currentPage > 1) params.set('page', currentPage.toString());

    const queryString = params.toString();
    router.replace(`${pathname}${queryString ? `?${queryString}` : ''}`);
  }, [selectedTab, searchQuery, currentPage, pathname, router]);

  // Reset page count on filter/search changes
  const handleTabChange = (tab: 'all' | 'pending_review' | 'approved' | 'rejected') => {
    setSelectedTab(tab);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Filter Products
  const filteredProducts = products.filter(product => {
    const matchesTab = selectedTab === 'all' || product.reviewStatus === selectedTab;
    const matchesSearch = 
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.adapter.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Pagination Logic
  const itemsPerPage = 12;
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px] bg-[#f3f1ef]">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-[#f3f1ef] min-h-screen">
        <ErrorState 
          title="Failed to load products" 
          message={error} 
          onRetry={fetchProducts} 
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6 min-h-screen bg-[#f3f1ef]" aria-label="Products Library">
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
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-3 rounded-xl border border-[#e0dbd8] shadow-sm">
            <div className="flex gap-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {(['all', 'pending_review', 'approved', 'rejected'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    selectedTab === tab 
                      ? 'bg-[#f3f1ef] text-[#791228]' 
                      : 'text-muted-foreground hover:bg-gray-50'
                  }`}
                >
                  {tab === 'all' ? 'All' : tab.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-8 pr-3 py-1.5 w-full sm:w-60 text-sm border border-[#e0dbd8] rounded-lg focus:outline-none focus:border-[#791228] focus:ring-1 focus:ring-[#791228] bg-transparent text-[#0d0d0d]"
                />
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedProducts.map((product) => (
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
            <div className="py-20 text-center text-muted-foreground bg-white border border-[#e0dbd8] rounded-xl shadow-sm">
              No products found matching your search criteria.
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-[#e0dbd8]/50 pt-6 mt-4 gap-4">
              <span className="text-sm text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{Math.min(totalItems, (currentPage - 1) * itemsPerPage + 1)}</span> to{' '}
                <span className="font-semibold text-foreground">{Math.min(totalItems, currentPage * itemsPerPage)}</span> of{' '}
                <span className="font-semibold text-foreground">{totalItems}</span> products
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="bordered"
                  className="border-[#e0dbd8] hover:bg-gray-50 h-9 rounded-lg"
                  onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex gap-1 overflow-x-auto max-w-[200px] sm:max-w-none">
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <Button
                      key={idx}
                      size="sm"
                      variant={currentPage === idx + 1 ? 'solid' : 'bordered'}
                      className={`w-9 h-9 min-w-9 p-0 rounded-lg ${
                        currentPage === idx + 1 
                          ? 'bg-[#791228] text-white font-semibold shadow' 
                          : 'border-[#e0dbd8] hover:bg-gray-50 text-foreground'
                      }`}
                      onPress={() => setCurrentPage(idx + 1)}
                    >
                      {idx + 1}
                    </Button>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="bordered"
                  className="border-[#e0dbd8] hover:bg-gray-50 h-9 rounded-lg"
                  onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
