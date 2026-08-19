import type { Metadata } from 'next';
import ListingDraftClient from './client';

export const metadata: Metadata = {
  title: 'Listing Draft',
};

export default function ListingDraftPage({ params }: { params: { id: string } }) {
  return <ListingDraftClient listingId={params.id} />;
}
