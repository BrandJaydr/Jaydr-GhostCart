import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  eBayClient,
  type ListingItem,
  type OAuthToken,
} from '../../lib/adapters/ebay/ebay-client';

function jsonResponse(payload: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
    text: async () => '',
  } as Response;
}

const item: ListingItem = {
  title: 'Test item',
  description: 'Test description',
  category: '12345',
  condition: 'NEW',
  startPrice: 19.99,
  currency: 'USD',
  quantity: 1,
  pictureURLs: [],
  duration: 'Days_30',
  listingType: 'FixedPrice',
};

describe('eBayClient.addListing (GC-121-B2)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('publishes the offer at the documented offer-scoped URL', async () => {
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock
      .mockResolvedValueOnce(jsonResponse({}))
      .mockResolvedValueOnce(jsonResponse({ offerId: 'offer-123' }))
      .mockResolvedValueOnce(
        jsonResponse({ itemId: 'item-456', viewItemURL: 'https://ebay.com/item' }),
      );
    vi.stubGlobal('fetch', fetchMock);

    const client = new eBayClient({
      appId: 'dummy-app',
      certId: 'dummy-cert',
      devId: 'dummy-dev',
      ruName: 'dummy-ru-name',
      environment: 'sandbox',
    });
    const token: OAuthToken = {
      accessToken: 'dummy-access-token',
      refreshToken: 'dummy-refresh-token',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      tokenType: 'Application Access Token',
    };
    client.setToken(token);

    const result = await client.addListing(item);

    expect(result.itemId).toBe('item-456');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const [publishUrl, init] = fetchMock.mock.calls[2];
    expect(publishUrl).toBe(
      'https://api.sandbox.ebay.com/sell/inventory/v1/offer/offer-123/publish',
    );
    expect(init?.method).toBe('POST');
    expect(init?.body).toBeUndefined();
  });
});
