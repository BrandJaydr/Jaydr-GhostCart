'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Chip, Textarea, Divider } from '@heroui/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { Sparkles, Save, Download, Send, DollarSign } from 'lucide-react';

interface ListingDraftClientProps {
  listingId: string;
}

export default function ListingDraftClient({ listingId }: ListingDraftClientProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [costPriceCents, setCostPriceCents] = useState(0);
  const [state, setState] = useState('draft');
  const [lastUpdated, setLastUpdated] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isRewritingTitle, setIsRewritingTitle] = useState(false);
  const [isRewritingDesc, setIsRewritingDesc] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [marginResult, setMarginResult] = useState<{ percent: number; amount: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await fetch(`/api/listings/${listingId}`);
        if (!res.ok) throw new Error('Failed to fetch listing');
        const data = await res.json();
        const listing = data.data || data;
        
        setTitle(listing.title || '');
        setDescription(listing.description || '');
        setSellingPrice(listing.sellingPrice || 0);
        setCostPriceCents(listing.product?.supplierPriceCents || 0);
        setState(listing.state || 'draft');
        setLastUpdated(listing.updatedAt ? new Date(listing.updatedAt).toLocaleString() : new Date().toLocaleString());
        
        if (listing.marginPercent !== undefined) {
          setMarginResult({
            percent: listing.marginPercent,
            amount: listing.marginAmount || 0
          });
        }
      } catch (err: any) {
        setError(err.message || 'Error loading listing');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchListing();
  }, [listingId]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, sellingPrice })
      });
      if (!res.ok) throw new Error('Failed to save draft');
      setLastUpdated(new Date().toLocaleString());
      showToast('success', 'Draft saved successfully');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRewriteTitle = async () => {
    setIsRewritingTitle(true);
    try {
      const res = await fetch('/api/ai/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: title, type: 'title' })
      });
      if (!res.ok) throw new Error('Failed to rewrite title');
      const data = await res.json();
      setTitle(data.rewrittenText || data.data?.rewrittenText || title);
      showToast('success', 'Title rewritten successfully');
    } catch (err: any) {
      showToast('error', 'Failed to rewrite title');
    } finally {
      setIsRewritingTitle(false);
    }
  };

  const handleRewriteDesc = async () => {
    setIsRewritingDesc(true);
    try {
      const res = await fetch('/api/ai/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: description, type: 'description' })
      });
      if (!res.ok) throw new Error('Failed to rewrite description');
      const data = await res.json();
      setDescription(data.rewrittenText || data.data?.rewrittenText || description);
      showToast('success', 'Description rewritten successfully');
    } catch (err: any) {
      showToast('error', 'Failed to rewrite description');
    } finally {
      setIsRewritingDesc(false);
    }
  };

  const handleCalculateMargin = async () => {
    setIsCalculating(true);
    try {
      const res = await fetch('/api/listings/calculate-margin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellingPrice, costPriceCents })
      });
      if (!res.ok) throw new Error('Failed to calculate margin');
      const data = await res.json();
      setMarginResult({
        percent: data.marginPercent || data.data?.marginPercent || 0,
        amount: data.marginAmount || data.data?.marginAmount || 0
      });
    } catch (err: any) {
      showToast('error', 'Failed to calculate margin');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      window.location.href = `/api/ebay/export/csv?listingId=${listingId}`;
    } catch (err) {
      showToast('error', 'Failed to export CSV');
    }
  };

  const handleSubmitEbay = async () => {
    if (!window.confirm('Are you sure you want to submit this listing to eBay?')) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/ebay/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId })
      });
      if (!res.ok) throw new Error('Failed to submit');
      setState('submitted');
      showToast('success', 'Submitted to eBay successfully');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to submit to eBay');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center min-h-[400px]"><Spinner /></div>;
  }

  if (error) {
    return <div className="p-6"><ErrorState title="Error Loading Draft" message={error} onRetry={() => window.location.reload()} /></div>;
  }

  const getStateColor = (s: string) => {
    switch (s) {
      case 'published': return 'success';
      case 'ready_for_review': return 'warning';
      case 'queued': case 'submitted': return 'primary';
      case 'failed': return 'danger';
      case 'draft': default: return 'default';
    }
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-background pb-20">
      {/* Toast Messages */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-md shadow-lg text-white ${toastMessage.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toastMessage.text}
        </div>
      )}

      <div className="p-6 max-w-4xl mx-auto w-full flex flex-col gap-8">
        {/* Status Bar */}
        <div className="flex items-center justify-between bg-surface p-4 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Status:</span>
            <Chip color={getStateColor(state) as any} variant="flat">{state.replace(/_/g, ' ')}</Chip>
          </div>
          <div className="text-sm text-muted-foreground">
            Last updated: {lastUpdated}
          </div>
        </div>

        {/* Title Section */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold">Listing Title</label>
          <div className="flex gap-2 items-start">
            <div className="flex-1">
              <Input 
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                placeholder="Enter listing title"
                className="w-full"
              />
              <div className="text-xs text-muted-foreground mt-1 text-right">
                {title.length}/80 characters
              </div>
            </div>
              <Button 
                variant="ghost" 
                onClick={handleRewriteTitle}
                disabled={isRewritingTitle || !title}
              >
                {isRewritingTitle ? <Spinner size="sm" /> : <Sparkles className="w-4 h-4 mr-2" />}
              AI Rewrite
            </Button>
          </div>
        </div>

        {/* Description Section */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold">Description</label>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleRewriteDesc}
                disabled={isRewritingDesc || !description}
              >
                {isRewritingDesc ? <Spinner size="sm" /> : <Sparkles className="w-4 h-4 mr-2" />}
              AI Rewrite
            </Button>
          </div>
          <Textarea 
            value={description}
            onValueChange={setDescription}
            placeholder="Enter full item description..."
            minRows={8}
            variant="bordered"
            className="w-full"
          />
          <div className="text-xs text-muted-foreground text-right">
            {description.length} characters
          </div>
        </div>

        {/* Pricing Section */}
        <Card className="shadow-sm border border-border bg-surface">
          <CardHeader className="font-semibold text-lg pb-0 pt-4 px-6">Pricing Strategy</CardHeader>
          <CardBody className="gap-6 px-6 pb-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-muted-foreground">Selling Price ($)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input 
                    type="number"
                    step="0.01"
                    min="0"
                    value={String(sellingPrice)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSellingPrice(parseFloat(e.target.value) || 0)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-muted-foreground">Source Cost ($)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input 
                    type="number"
                    value={String(costPriceCents / 100)}
                    disabled
                    className="pl-9 bg-muted/50"
                  />
                </div>
              </div>
            </div>

            <Divider />

            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                onClick={handleCalculateMargin}
                disabled={isCalculating || !sellingPrice || !costPriceCents}
              >
                {isCalculating ? <Spinner size="sm" /> : null}
                Calculate Margin
              </Button>
              
              {marginResult && (
                <div className="flex flex-col items-end">
                  <span className="text-sm text-muted-foreground">Estimated Margin</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${marginResult.percent > 20 ? 'text-green-600' : marginResult.percent > 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {marginResult.percent.toFixed(1)}%
                    </span>
                    <span className="text-sm text-muted-foreground">
                      (${marginResult.amount.toFixed(2)})
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Actions Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button variant="ghost" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? <Spinner size="sm" /> : <Save className="w-4 h-4 mr-2" />}
              Save Draft
            </Button>
                        <Button 
                variant="primary"
                onClick={handleSubmitEbay}
                disabled={isSubmitting || state === 'submitted' || state === 'published'}
              >
                {isSubmitting ? <Spinner size="sm" /> : <Send className="w-4 h-4 mr-2" />}
              Submit to eBay
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
