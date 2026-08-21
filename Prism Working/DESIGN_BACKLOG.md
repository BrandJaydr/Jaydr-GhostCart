# GhostCart Design Backlog & Integration Research

This document captures forward-looking design considerations, integration API research (marketplaces, messaging), CRM specifications, and the interactive Product Table Editor requirements.

---

## 1. Marketplace Integration Research

### Facebook Marketplace (Meta Catalog API)
- **API Model:** Direct Facebook Marketplace publishing is limited to select Meta commerce partners. The standard automated route is the **Meta Catalog API** via the Graph API.
- **Protocol:** REST over HTTPS (Meta Graph API).
- **Authentication:** OAuth 2.0 (Meta Login for Business), requiring a System User Access Token and Business Manager authorization.
- **Core Entities:**
  - `Catalog` (`/PMS_ID/items_batch`): Batched product uploads.
  - `Product Item` (`/PRODUCT_ITEM_ID`): Update price, stock, availability.
- **Integration Strategy:** Synchronize GhostCart product listings to a Meta Catalog, which then populates Facebook Shops and Marketplace listings.

### Etsy Open API v3
- **API Model:** RESTful JSON API with full listing and taxonomy support.
- **Protocol:** HTTP REST with OAuth 2.0 (Authorization Code Flow with PKCE).
- **Core Endpoints:**
  - `Create Listing`: `POST /v3/application/shops/{shop_id}/listings` (creates draft listings).
  - `Update Inventory`: `PUT /v3/application/shops/{shop_id}/listings/{listing_id}/inventory` (sets price and quantity).
- **Integration Strategy:** Draft listings are pushed to Etsy and require merchant activation, keeping within safe review guardrails.

### TikTok Shop Open API
- **API Model:** TikTok Shop Seller Center Partner Platform API.
- **Protocol:** RESTful API.
- **Authentication:** OAuth 2.0 (Seller authorization via TikTok Shop Partner Center).
- **Core Endpoints:**
  - `Upload Product`: `POST /api/products/upload_product` (requires category mapping, images, attributes).
  - `Update Price/Stock`: `PUT /api/products/stocks` and `PUT /api/products/prices`.
- **Integration Strategy:** Direct API publishing using Seller Center tokens, allowing real-time inventory updates and price checks.

---

## 2. Customer & Supplier Communication (CRM & Messaging APIs)

### CRM Chat Module Architecture
To act as a central communication bridge between customers and suppliers:
- **UI Structure:**
  - Dual-pane layout: **Contacts list** on the left, **Active chat conversation** on the right.
  - Contacts are strictly divided into **Customers** and **Suppliers** tabs.
  - Both tabs utilize server-side pagination to handle thousands of records without memory bloat.
- **Data Model:**
  - `chats`: Represents a conversation thread linked to a tenant.
  - `chat_messages`: Individual messages with metadata (`sender_type` = customer/supplier/operator).
  - `contacts`: Unified customer/supplier metadata with paginated query support.

### Messaging Connectors Research
1. **WhatsApp Business Cloud API:**
   - **Protocol:** Meta-hosted REST API.
   - **Send Messages:** `POST /v17.0/{phone_number_id}/messages` (requires approved message templates for outbound notifications; allows free-form text within a 24-hour customer care window).
   - **Inbound Messages:** Configured via Meta Webhooks (JSON payloads carrying message content, media, and sender profile).
2. **Telegram Bot API:**
   - **Protocol:** HTTP REST with polling/webhook options.
   - **Send Messages:** `POST https://api.telegram.org/bot<token>/sendMessage`.
   - **Integration Strategy:** Lightweight Telegram bots can receive customer requests and forward them to the CRM, supporting inline keyboards for quick action buttons.

---

## 3. Product Table Editor Specification (Inline Editing)

To guarantee users can verify and adjust catalog data prior to exporting, the CSV Editor page will house an **Interactive Product Table**:

### Editing Mechanics (Inline Edit Mode)
- **Click-to-Edit Cells:** Double-clicking or clicking an edit icon on a table cell (e.g., Price, Title, SKU) transforms the static text into an input field (focused automatically).
- **Keyboard Navigation:**
  - Pressing `Enter` saves the cell and moves focus to the row below.
  - Pressing `Tab` saves and moves focus to the adjacent cell to the right.
  - Pressing `Escape` discards changes and restores the previous value.
- **Input Validation:** Zod schema validation triggers on cell change:
  - Prices must be positive numbers with up to 2 decimal places.
  - SKU must be unique and alphanumeric.

### Action Buttons
- **Row Actions:**
  - `Add Row`: Injects a blank row at the bottom of the visible set.
  - `Delete Row`: Removes the row from the local array state.
- **Global Actions:**
  - `Bulk Price Adjustment`: Opens a dropdown to increase/decrease all prices by a percentage or dollar amount.
  - `Export CSV`: Generates the properly formatted CSV and downloads it.
  - `Import to GhostCart`: Batches the local table records and posts them to `POST /api/products`, showing progress.

---

## 4. Design TODO Backlog

### Phase 1 — Infrastructure & Connections
- [x] Fix TopNav linter warning and add mobile sidebar menu toggle button.
- [x] Create approved implementation brief.
- [x] Reconcile and deprecate contradictory shadcn instructions.
- [x] Create interactive settings marketplaces connect & test validation dashboard.

### Phase 2 — Operational Studio & CSV Editor
- [ ] Implement **AI Media Studio** (`/dashboard/studio`) with ComfyUI-style endless SVG nodes canvas.
- [ ] Implement **Interactive CSV Table Editor** (`/dashboard/products/editor`) with inline click-to-edit fields, row modifiers, and CSV exporting.

### Phase 3 — CRM & Paginated Communication
- [ ] Design database tables for `contacts`, `chats`, and `chat_messages`.
- [ ] Build API endpoints for paginated contact lists: `GET /api/crm/contacts?type=customer` and `GET /api/crm/contacts?type=supplier`.
- [ ] Build CRM Chat UI shell with separate paginated tabs.
- [ ] Setup WhatsApp Business Cloud API webhook endpoints and Telegram bot receiver.

### Phase 4 — Expanded Marketplace Channels
- [ ] Build second supplier adapter contract.
- [ ] Add Etsy Open API v3 connector (OAuth 2.0 + listing submit).
- [ ] Add TikTok Shop product and inventory sync API connector.
- [ ] Add Facebook Meta Catalog batch uploader.
