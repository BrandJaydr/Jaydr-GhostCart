/**
 * eBay API Client with OAuth 2.0 Authentication
 *
 * Handles OAuth 2.0 token management and eBay Trading API calls.
 * Supports both Sandbox and Production environments.
 *
 * @agent:forge Set up eBay Developer credentials guide
 * @agent:oracle Add tests for OAuth flow and API calls
 */

export interface eBayConfig {
  appId: string;
  certId: string;
  devId: string;
  ruName: string;
  environment: 'sandbox' | 'production';
}

export interface OAuthToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  tokenType: string;
}

export interface ListingItem {
  title: string;
  description: string;
  category: string;
  condition: string;
  startPrice: number;
  currency: string;
  quantity: number;
  pictureURLs: string[];
  duration: string;
  listingType: string;
}

export interface eBayListingResponse {
  itemId: string;
  startTime: Date;
  endTime: Date;
  viewItemURL: string;
}

/**
 * eBay API Client
 */
export class eBayClient {
  private config: eBayConfig;
  private token: OAuthToken | null = null;
  private baseUrl: string;

  constructor(config: eBayConfig) {
    this.config = config;
    this.baseUrl =
      config.environment === 'sandbox'
        ? 'https://api.sandbox.ebay.com'
        : 'https://api.ebay.com';
  }

  /**
   * Get OAuth authorization URL for user consent
   */
  getAuthorizationUrl(state: string): string {
    const scopes = [
      'https://api.ebay.com/oauth/api_scope',
      'https://api.ebay.com/oauth/api_scope/sell.marketing.readonly',
      'https://api.ebay.com/oauth/api_scope/sell.marketing',
      'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
      'https://api.ebay.com/oauth/api_scope/sell.inventory',
      'https://api.ebay.com/oauth/api_scope/sell.account.readonly',
      'https://api.ebay.com/oauth/api_scope/sell.account',
      'https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly',
      'https://api.ebay.com/oauth/api_scope/sell.fulfillment',
    ];

    const authUrl = new URL(
      `${this.baseUrl}/identity/v1/authorize2`,
    );
    authUrl.searchParams.set('client_id', this.config.appId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', this.config.ruName);
    authUrl.searchParams.set('scope', scopes.join(' '));
    authUrl.searchParams.set('state', state);

    return authUrl.toString();
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<OAuthToken> {
    const tokenUrl = `${this.baseUrl}/identity/v1/oauth2/token`;

    const credentials = Buffer.from(
      `${this.config.appId}:${this.config.certId}`,
    ).toString('base64');

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.config.ruName,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code for token: ${error}`);
    }

    const data = await response.json();

    this.token = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
      tokenType: data.token_type,
    };

    return this.token;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<OAuthToken> {
    const tokenUrl = `${this.baseUrl}/identity/v1/oauth2/token`;

    const credentials = Buffer.from(
      `${this.config.appId}:${this.config.certId}`,
    ).toString('base64');

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh token: ${error}`);
    }

    const data = await response.json();

    this.token = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
      tokenType: data.token_type,
    };

    return this.token;
  }

  /**
   * Set token from storage (e.g., database)
   */
  setToken(token: OAuthToken): void {
    this.token = token;
  }

  /**
   * Get current access token, refresh if needed
   */
  async getAccessToken(): Promise<string> {
    if (!this.token) {
      throw new Error('No token available. Please authorize first.');
    }

    // Check if token needs refresh (5 minute buffer)
    if (this.token.expiresAt.getTime() < Date.now() + 5 * 60 * 1000) {
      this.token = await this.refreshAccessToken(this.token.refreshToken);
    }

    return this.token.accessToken;
  }

  /**
   * Submit a listing to eBay
   */
  async addListing(item: ListingItem): Promise<eBayListingResponse> {
    const accessToken = await this.getAccessToken();
    const apiUrl = `${this.baseUrl}/sell/inventory/v1/inventory_item`;

    // First create inventory item
    const inventoryItem = {
      availability: {
        shipToLocationAvailability: [
          {
            quantity: item.quantity,
          },
        ],
      },
      condition: item.condition,
      description: item.description,
      product: {
        title: item.title,
        aspects: {
          Brand: ['Unbranded'],
        },
        imageUrls: item.pictureURLs,
      },
    };

    const sku = `sku-${Date.now()}`;

    const inventoryResponse = await fetch(`${apiUrl}/${sku}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Language': 'en-US',
      },
      body: JSON.stringify(inventoryItem),
    });

    if (!inventoryResponse.ok) {
      const error = await inventoryResponse.text();
      throw new Error(`Failed to create inventory item: ${error}`);
    }

    // Then create offer
    const offerUrl = `${this.baseUrl}/sell/inventory/v1/offer`;
    const offer = {
      sku,
      marketplaceId: this.config.environment === 'sandbox' ? 'EBAY_US' : 'EBAY_US',
      format: 'FIXED_PRICE',
      availableQuantity: item.quantity,
      price: {
        value: item.startPrice.toString(),
        currency: item.currency,
      },
      listingPolicies: {
        fulfillmentPolicyId: 'default',
        paymentPolicyId: 'default',
        returnPolicyId: 'default',
      },
    };

    const offerResponse = await fetch(offerUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Language': 'en-US',
      },
      body: JSON.stringify(offer),
    });

    if (!offerResponse.ok) {
      const error = await offerResponse.text();
      throw new Error(`Failed to create offer: ${error}`);
    }

    const offerData = await offerResponse.json();

    // Finally publish the offer
    const publishUrl = `${this.baseUrl}/sell/inventory/v1/publish_offer`;
    const publishResponse = await fetch(publishUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Language': 'en-US',
      },
      body: JSON.stringify({
        offerId: offerData.offerId,
      }),
    });

    if (!publishResponse.ok) {
      const error = await publishResponse.text();
      throw new Error(`Failed to publish offer: ${error}`);
    }

    const publishData = await publishResponse.json();

    return {
      itemId: publishData.itemId,
      startTime: new Date(),
      endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
      viewItemURL: publishData.viewItemURL || '',
    };
  }

  /**
   * Get listing status
   */
  async getListingStatus(itemId: string): Promise<any> {
    const accessToken = await this.getAccessToken();
    const apiUrl = `${this.baseUrl}/sell/inventory/v1/inventory_item/${itemId}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Language': 'en-US',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get listing status: ${error}`);
    }

    return await response.json();
  }

  /**
   * Health check for eBay API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/sell/metadata/v1/marketplace`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Singleton eBay client instance
 * @agent:forge Configure based on environment variables
 */
let ebayClientInstance: eBayClient | null = null;

export function getEBayClient(): eBayClient {
  if (!ebayClientInstance) {
    const config: eBayConfig = {
      appId: process.env.EBAY_APP_ID || '',
      certId: process.env.EBAY_CERT_ID || '',
      devId: process.env.EBAY_DEV_ID || '',
      ruName: process.env.EBAY_RU_NAME || '',
      environment: (process.env.EBAY_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
    };

    if (!config.appId || !config.certId || !config.devId || !config.ruName) {
      throw new Error('Missing eBay configuration. Please set EBay environment variables.');
    }

    ebayClientInstance = new eBayClient(config);
  }

  return ebayClientInstance;
}
