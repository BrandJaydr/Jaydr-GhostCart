# Configuration Memory - Jaydr GhostCart

## System Configuration

### Environment Configuration
```yaml
# Database Configuration
database:
  primary: postgresql://user:pass@localhost:5432/ghostcart
  cache: redis://localhost:6379
  timeseries: influxdb://localhost:8086/ghostcart
  warehouse: snowflake://account.snowflake.com/ghostcart

# Message Bus Configuration
message_bus:
  type: kafka  # or rabbitmq
  brokers:
    - kafka1:9092
    - kafka2:9092
    - kafka3:9092
  topics:
    - product_changes
    - price_updates
    - orders
    - marketplace_events

# API Gateway Configuration
api_gateway:
  rate_limiting:
    default: 1000 requests/hour
    premium: 10000 requests/hour
  authentication:
    jwt_secret: ${JWT_SECRET}
    token_expiry: 24h
```

### Marketplace API Configuration
```yaml
marketplaces:
  ebay:
    api_url: https://api.ebay.com
    app_id: ${EBAY_APP_ID}
    cert_id: ${EBAY_CERT_ID}
    webhook_url: https://ghostcart.com/webhooks/ebay
    
  amazon:
    api_url: https://sellingpartnerapi-na.amazon.com
    client_id: ${AMAZON_CLIENT_ID}
    client_secret: ${AMAZON_CLIENT_SECRET}
    refresh_token: ${AMAZON_REFRESH_TOKEN}
    
  facebook:
    api_url: https://graph.facebook.com
    app_id: ${FACEBOOK_APP_ID}
    app_secret: ${FACEBOOK_APP_SECRET}
    
  etsy:
    api_url: https://api.etsy.com
    api_key: ${ETSY_API_KEY}
    shared_secret: ${ETSY_SHARED_SECRET}
    
  shopify:
    api_url: https://{shop}.myshopify.com
    access_token: ${SHOPIFY_ACCESS_TOKEN}
```

### Service Configuration
```yaml
services:
  product_service:
    port: 3001
    replicas: 3
    resources:
      cpu: 500m
      memory: 512Mi
      
  listing_service:
    port: 3002
    replicas: 2
    resources:
      cpu: 1000m
      memory: 1Gi
      
  order_service:
    port: 3003
    replicas: 3
    resources:
      cpu: 500m
      memory: 512Mi
      
  price_service:
    port: 3004
    replicas: 2
    resources:
      cpu: 500m
      memory: 512Mi
```

## API Configuration

### REST API Endpoints
```yaml
# Product Management API
products:
  GET /api/v1/products:
    description: List products with pagination and filtering
    parameters:
      - page: integer
      - limit: integer
      - category: string
      - supplier: string
    responses:
      200: Product list with metadata
      401: Unauthorized
      
  POST /api/v1/products:
    description: Import new product from supplier URL
    body:
      url: string (required)
      supplier: string (required)
      category: string (optional)
    responses:
      201: Product created
      400: Invalid URL
      409: Product already exists

  GET /api/v1/products/{id}:
    description: Get product details
    parameters:
      - id: string (path)
    responses:
      200: Product details
      404: Product not found

  PUT /api/v1/products/{id}:
    description: Update product information
    parameters:
      - id: string (path)
    body:
      title: string
      description: string
      category: string
    responses:
      200: Product updated
      404: Product not found

# Listing Management API
listings:
  POST /api/v1/listings/generate:
    description: Generate AI-optimized listing
    body:
      product_id: string (required)
      marketplace: string (required)
      style: string (premium, budget, emotional)
    responses:
      200: Generated listing content
      400: Invalid parameters

  POST /api/v1/listings/publish:
    description: Publish listing to marketplace
    body:
      product_id: string (required)
      marketplace: string (required)
      listing_data: object (required)
    responses:
      202: Listing queued for publishing
      400: Invalid listing data

# Price Management API
prices:
  GET /api/v1/prices/monitor/{product_id}:
    description: Get price monitoring history
    parameters:
      - id: string (path)
      - days: integer (query)
    responses:
      200: Price history data
      404: Product not found

  POST /api/v1/prices/reprice:
    description: Trigger repricing for products
    body:
      product_ids: array<string>
      strategy: string
    responses:
      202: Repricing job queued
      400: Invalid strategy

# Order Management API
orders:
  GET /api/v1/orders:
    description: List orders with filtering
    parameters:
      - status: string
      - marketplace: string
      - date_from: string
      - date_to: string
    responses:
      200: Order list
      401: Unauthorized

  POST /api/v1/orders/{id}/fulfill:
    description: Fulfill order automatically
    parameters:
      - id: string (path)
    responses:
      202: Fulfillment queued
      404: Order not found
```

### WebSocket API
```yaml
# Real-time Updates
websocket:
  endpoint: /ws
  authentication: JWT token required
  channels:
    - price_updates: Real-time price changes
    - order_status: Order status updates
    - inventory_changes: Stock level changes
    - system_alerts: System notifications

  events:
    price_change:
      data:
        product_id: string
        old_price: decimal
        new_price: decimal
        marketplace: string
        
    order_update:
      data:
        order_id: string
        status: string
        marketplace: string
        timestamp: datetime
```

## Integration Configuration

### Supplier Integration
```yaml
suppliers:
  amazon:
    scraping:
      interval: 6h
      user_agent: "GhostCart Bot 1.0"
      proxy_rotation: true
    api:
      access_key: ${AMAZON_ACCESS_KEY}
      secret_key: ${AMAZON_SECRET_KEY}
      
  aliexpress:
    scraping:
      interval: 12h
      browser: chrome_headless
      screenshot_verification: true
    api:
      app_key: ${ALIEXPRESS_APP_KEY}
      
  temu:
    scraping:
      interval: 8h
      browser: firefox_headless
      ip_rotation: true
    automation:
      selenium_grid: true
      captcha_solver: true
```

### Browser Automation Configuration
```yaml
browser_automation:
  selenium_grid:
    url: http://selenium-grid:4444
    browsers:
      - chrome
      - firefox
      - edge
    
  proxy_management:
    rotation_interval: 300s
    proxy_list:
      - type: residential
        provider: brightdata
      - type: datacenter
        provider: stormproxies
        
  captcha_solving:
    service: anticaptcha
    api_key: ${ANTICAPTCHA_API_KEY}
    timeout: 30s
```

## Security Configuration

### Multi-Tenancy Security
```yaml
security:
  multi_tenancy:
    row_level_security: true
    tenant_id_column: tenant_id
    default_tenant: default
    
  encryption:
    at_rest: AES-256
    in_transit: TLS-1.3
    key_management: AWS KMS
    
  authentication:
    jwt:
      algorithm: RS256
      expiry: 24h
      refresh_token_expiry: 7d
      
  rbac:
    roles:
      - owner: full_access
      - va: listing_management, order_fulfillment
      - listing_manager: listing_management
      - customer_support: order_view, customer_communication
      - accountant: analytics_view, financial_reports
```

### API Security
```yaml
api_security:
  rate_limiting:
    default: 1000/hour
    burst: 100
    per_tenant: true
    
  request_validation:
    schema_validation: true
    input_sanitization: true
    
  monitoring:
    request_logging: true
    security_headers: true
    cors: strict origins
```

## Monitoring Configuration

### Metrics Collection
```yaml
monitoring:
  prometheus:
    port: 9090
    scrape_interval: 15s
    metrics:
      - api_request_duration
      - job_success_rate
      - queue_depth
      - database_connections
      
  grafana:
    port: 3000
    dashboards:
      - system_overview
      - marketplace_performance
      - user_analytics
      
  alerting:
    rules:
      - api_error_rate > 5%
      - job_failure_rate > 10%
      - database_connection_pool > 80%
      - queue_depth > 1000
```

### Logging Configuration
```yaml
logging:
  level: INFO
  format: json
  outputs:
    - console
    - elasticsearch
    
  structured_fields:
    - timestamp
    - level
    - service
    - tenant_id
    - user_id
    - request_id
    - correlation_id
    
  retention:
    days: 30
    max_size: 100GB
```
