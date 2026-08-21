# eBay Integration Ecosystem & Capabilities Research

This document outlines the entire eBay developer API suite, highlighting capabilities, authorization requirements, and potential value-added integrations for the GhostCart ecosystem.

---

## 1. Inventory API vs. Trading API (Listing & Catalog Management)

eBay has two primary APIs for managing listings. Understanding their differences is key to our architecture:

### A. Inventory API (Modern RESTful) — *Active Selection*
- **Aesthetic/Tech:** Modern JSON/REST API.
- **Model:** SKU-based. You create `Inventory Items` (defined by SKU), assign them to location inventories, create `Offers` (price, marketplace, policies), and publish them.
- **Pros:**
  - Standard HTTP REST interface.
  - Clean separation of product details (images, title, description) from listing details (price, shipping policies).
  - Handles variations (size, color) cleanly as product groups.
- **Ecosystem Fit:** Best for automated dropshipping catalog syncing because it matches the SKU-centric databases of modern e-commerce systems.

### B. Trading API (Legacy XML/SOAP)
- **Aesthetic/Tech:** Legacy XML over HTTPS.
- **Model:** ItemID-based. Every listing is independent, created via `AddItem` or modified via `ReviseItem`.
- **Pros:**
  - Exposes 100% of eBay legacy features.
  - Needed for manual auction-style listings, or for shops still relying on legacy software.
- **Ecosystem Fit:** Avoid using for primary listing automation, but keep as a fallback wrapper if we need to retrieve historical listings that do not have SKU mappings.

---

## 2. The eBay Sell API Suite: Capabilities & Opportunities

Beyond simple publishing, the eBay Sell API suite offers rich features we can integrate to build an enterprise-grade seller workspace:

### A. Fulfillment API (Order & Shipment Automation)
- **Primary Endpoint:** `/sell/fulfillment/v1/order`
- **Capabilities:**
  - Retrieve details of all sold items, buyer shipping addresses, and transaction payments.
  - Mark orders as shipped and upload tracking numbers (`POST /sell/fulfillment/v1/order/{orderId}/shipping_fulfillment`).
  - Handle cancellations, refund requests, and return disputes.
- **Ecosystem Fit (CRM / Order Automation):**
  - **Auto-Fulfillment:** Automatically capture eBay sales, check supplier availability in GhostCart, calculate cost of goods (COGS), purchase the item from the supplier (e.g. CSV or direct API), and post the tracking code back to eBay.
  - **Customer CRM:** Bring buyer info (names, addresses, order history) into GhostCart's database to build customer profile records.

### B. Account API (Business Policy Automation)
- **Primary Endpoints:**
  - `/sell/account/v1/fulfillment_policy` (Shipping profiles)
  - `/sell/account/v1/return_policy` (Return parameters)
  - `/sell/account/v1/payment_policy` (Payment types)
- **Capabilities:**
  - Programmatically query the seller's pre-configured shipping, payment, and return profiles.
  - Assign policies to listings automatically based on weight, dimensions, and product category.
- **Ecosystem Fit:** Simplifies the Listing Draft Editor. Instead of forcing sellers to manually configure complex shipping fees for every listing, GhostCart can fetch policy profiles and let them select from a simple dropdown.

### C. Marketing API (Sales & Traffic Drivers)
- **Primary Endpoints:**
  - `/sell/marketing/v1/ad_campaign` (Promoted Listings)
  - `/sell/marketing/v1/item_promotion` (Markdown sales, volume pricing)
- **Capabilities:**
  - Sponsor listings programmatically to increase search visibility.
  - Set bid percentages dynamically (e.g. bid 5% ad rate) based on product profit margins.
  - Set up bulk discounts (e.g. "Buy 2, Get 10% Off") to increase average order value.
- **Ecosystem Fit:** Add a **Marketing Control Panel** in GhostCart. The system can inspect product margins, suggest optimal ad rates, and toggle promotions directly from the dashboard.

### D. Analytics & Recommendation API (Seller Intelligence)
- **Primary Endpoints:**
  - `/sell/analytics/v1/traffic_report` (Impressions, click-through-rates)
  - `/sell/analytics/v1/profile` (Seller standards status)
- **Capabilities:**
  - Pull performance metrics: how many users viewed a listing vs. purchased it.
  - Retrieve search optimization recommendations directly from eBay (e.g., "Add brand attribute to SKU-101 to boost rankings").
- **Ecosystem Fit:** Feeds the GhostCart **Performance Analytics** dashboard. Tells merchants which items are selling, which are stale, and where pricing/descriptions need adjustment.

### E. Feed API (Bulk Data Operations)
- **Primary Endpoint:** `/sell/feed/v1/task`
- **Capabilities:**
  - Bulk upload and download inventory files (CSV/TSV formats) with up to 100,000 items in a single async job.
  - Fetch active listings reports.
- **Ecosystem Fit:** Indispensable for large-scale dropshippers. Instead of hitting API rate limits with thousands of individual HTTP calls, GhostCart can upload a daily CSV inventory batch using Feed tasks.

---

## 3. High-Value Integrations Roadmap

Based on this API landscape, we can design several powerful features for the GhostCart CRM and operations dashboard:

```
┌────────────────────────────────────────────────────────┐
│ GhostCart Seller Workspace                             │
│                                                        │
│  ┌──────────────────────┐    ┌──────────────────────┐  │
│  │ Order Automator      │    │ Smart Repricer       │  │
│  │ (Fulfillment API)    │    │ (Inventory API)      │  │
│  │  - Track sales       │    │  - Real-time stock   │  │
│  │  - Auto-buy COGS     │    │  - Margin guards     │  │
│  └──────────────────────┘    └──────────────────────┘  │
│  ┌──────────────────────┐    ┌──────────────────────┐  │
│  │ CRM & Chat Hub       │    │ Ad Manager           │  │
│  │ (Fulfillment API)    │    │ (Marketing API)      │  │
│  │  - Contact profiles   │    │  - Auto-bid campaigns│  │
│  │  - Order statuses    │    │  - Promoted items    │  │
│  └──────────────────────┘    └──────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

1. **CRM Profile Linkage:** Automatically extract customer details from eBay orders and sync them to a unified CRM contacts database, separating customers from wholesale suppliers.
2. **Dynamic Ad Rates:** Connect the Repricing Engine to the Marketing API. If a product's profit margin is high (e.g. > 30%), automatically allocate a higher ad rate to boost sales. If margin drops, lower the ad rate.
3. **Automated Order Dispatch:** When a buyer purchases an item on eBay:
   - Capture transaction via webhook.
   - Enqueue a background order task on Layer 3 BullMQ.
   - Order dispatcher executes supplier purchasing, retrieves tracking, and updates the eBay order status automatically.
