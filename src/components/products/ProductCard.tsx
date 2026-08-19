/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { ExternalLink } from 'lucide-react';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface ProductCardProps {
  id: string;
  title: string;
  imageUrl?: string;
  supplierPriceCents: number;
  adapter: string;
  reviewStatus: 'pending_review' | 'approved' | 'rejected';
  confidenceScore?: number;
  sourceUrl?: string;
}

/**
 * 🏗️ Forge Scaffold: ProductCard
 * Clean floating grid card template.
 * @agent:atlas - Implement image fallback, actions dropdown, and accurate currency formatting.
 */
export function ProductCard({
  title,
  imageUrl,
  supplierPriceCents,
  adapter,
  reviewStatus,
  confidenceScore = 90,
  sourceUrl
}: ProductCardProps) {
  // TODO(@agent:atlas): Refine actual formatting rules and currency localization
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(supplierPriceCents / 100);

  return (
    <div className="flex flex-col bg-white rounded-xl shadow-sm border border-[#e0dbd8] overflow-hidden hover:shadow-md transition-shadow">
      {/* Image Area */}
      <div className="relative aspect-square bg-[#f3f1ef] flex items-center justify-center p-4">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="object-contain w-full h-full mix-blend-multiply" />
        ) : (
          <div className="text-muted-foreground text-sm">No Image</div>
        )}
        <div className="absolute top-3 left-3">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <StatusBadge state={reviewStatus as any} />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-col p-4 flex-1">
        <div className="flex justify-between items-start mb-2 gap-2">
          <h4 className="font-semibold text-sm line-clamp-2" title={title}>{title}</h4>
          <span className="font-bold text-[#791228] whitespace-nowrap">{formattedPrice}</span>
        </div>

        <div className="text-xs text-muted-foreground mb-4">
          Supplier: {adapter}
        </div>

        <div className="mt-auto flex items-center justify-between pt-3 border-t border-[#f3f1ef]">
          <ConfidenceIndicator score={confidenceScore} />
          
          {sourceUrl && (
            <a 
              href={sourceUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#791228] hover:bg-[#f3f1ef] p-1.5 rounded-md transition-colors"
              title="View on Supplier Site"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
