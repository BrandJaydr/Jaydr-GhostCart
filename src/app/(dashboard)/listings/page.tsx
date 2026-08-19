'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileEdit, ExternalLink } from 'lucide-react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Tabs, Tab } from '@heroui/react';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Spinner } from '@/components/ui/Spinner';

interface Listing {
  id: string;
  title: string;
  marketplace: string;
  sellingPrice: number;
  marginPercent?: number;
  state: 'draft' | 'ready_for_review' | 'queued' | 'submitted' | 'published' | 'failed';
}

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('all');

  const fetchListings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/listings');
      if (!res.ok) {
        throw new Error('Failed to fetch listings');
      }
      const data = await res.json();
      const listingsData = Array.isArray(data) ? data : (data.data || []);
      setListings(listingsData);
    } catch (err: any) {
      // Graceful failure as requested
      setListings([]);
      setError(null); 
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const filteredListings = listings.filter(listing => {
    if (selectedTab === 'all') return true;
    return listing.state === selectedTab;
  });

  const getStateColor = (state: string) => {
    switch (state) {
      case 'published': return 'success';
      case 'ready_for_review': return 'warning';
      case 'queued':
      case 'submitted': return 'primary';
      case 'failed': return 'danger';
      case 'draft':
      default: return 'default';
    }
  };

  const getMarginColorClass = (margin?: number) => {
    if (margin === undefined) return '';
    if (margin > 20) return 'text-green-600 font-medium';
    if (margin > 10) return 'text-yellow-600 font-medium';
    return 'text-red-600 font-medium';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

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
          title="Failed to load listings" 
          message={error} 
          onRetry={fetchListings} 
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      <PageHeader 
        title="Listings" 
        subtitle="Manage your marketplace listing drafts"
      />

      {listings.length === 0 ? (
        <EmptyState 
          title="No listings yet" 
          description="Import and approve a product to create your first listing draft"
        />
      ) : (
        <div className="flex flex-col gap-4">
          <Tabs 
            selectedKey={selectedTab} 
            onSelectionChange={(key) => setSelectedTab(key as string)}
            aria-label="Listing State Filters"
            variant="underlined"
            classNames={{
              tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
              cursor: "w-full bg-primary",
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-primary"
            }}
          >
            <Tab key="all" title="All" />
            <Tab key="draft" title="Draft" />
            <Tab key="ready_for_review" title="Ready for Review" />
            <Tab key="queued" title="Queued" />
            <Tab key="submitted" title="Submitted" />
            <Tab key="published" title="Published" />
            <Tab key="failed" title="Failed" />
          </Tabs>

          <Table aria-label="Listings table" className="w-full">
            <TableHeader>
              <TableColumn>Title</TableColumn>
              <TableColumn>Marketplace</TableColumn>
              <TableColumn>Price</TableColumn>
              <TableColumn>Margin</TableColumn>
              <TableColumn>State</TableColumn>
              <TableColumn>Actions</TableColumn>
            </TableHeader>
            <TableBody emptyContent={"No listings found for this filter."} items={filteredListings}>
              {(listing) => (
                <TableRow key={listing.id}>
                  <TableCell>
                    <span className="font-medium">{listing.title || 'Untitled Listing'}</span>
                  </TableCell>
                  <TableCell>{listing.marketplace || 'Unknown'}</TableCell>
                  <TableCell>{listing.sellingPrice ? formatPrice(listing.sellingPrice) : '-'}</TableCell>
                  <TableCell>
                    {listing.marginPercent !== undefined ? (
                      <span className={getMarginColorClass(listing.marginPercent)}>
                        {listing.marginPercent.toFixed(1)}%
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" color={getStateColor(listing.state) as any} variant="flat">
                      {listing.state.replace(/_/g, ' ')}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Link 
                      href={`/listings/${listing.id}/draft`}
                      className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                    >
                      <FileEdit className="w-4 h-4 mr-1" />
                      Edit Draft
                    </Link>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
