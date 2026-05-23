# Architect Memory - Jaydr GhostCart

## Core Architecture Decisions

### Event-Driven Architecture
- **Message Bus**: Kafka or RabbitMQ for real-time event processing
- **Event Types**: Product changes, price updates, orders, marketplace webhooks
- **Background Workers**: Subscribe to topics for non-blocking processing
- **Critical for**: Real-time sync across thousands of listings

### Microservices Architecture
- **API Gateway**: Single entry point with rate limiting, auth, routing
- **Service Discovery**: Dynamic service location via Consul/Kubernetes DNS
- **Circuit Breakers**: Prevent cascading failures between services
- **Communication**: Async via message bus, sync via gRPC/REST with fallbacks

### Data Architecture
- **OLTP**: PostgreSQL for transactional data
- **Cache**: Redis for hot paths (pricing, sessions, rate limits)
- **Time-Series**: InfluxDB for price history and metrics
- **Analytics Warehouse**: Snowflake/BigQuery for BI (separate from production)
- **ETL**: Airflow for data pipeline orchestration

### Multi-Tenancy Security
- **Row-Level Security**: Every query filtered by tenant_id
- **Encrypted Fields**: API keys, bank information stored encrypted
- **Audit Trail**: Immutable log of all changes with who/what/when/why
- **RBAC**: Role-based access control for team collaboration

## Service Architecture

### Core Services
1. **Product Service**: Catalog management, research engine, supplier integration
2. **Listing Service**: AI-powered listing generation, marketplace-specific optimization
3. **Order Service**: Order processing, fulfillment automation, tracking
4. **Price Service**: Price monitoring, auto-repricing, margin calculations
5. **Store Service**: Multi-store management, marketplace account health
6. **Analytics Service**: Business intelligence, reporting, performance metrics
7. **CRM Service**: Customer lifecycle, segmentation, churn prediction

### Supporting Services
- **Authentication Service**: User management, JWT tokens, session handling
- **Notification Service**: Email, SMS, in-app alerts
- **File Service**: Image processing, document storage (S3)
- **Job Scheduler**: Temporal/Airflow for distributed job execution
- **Webhook Receiver**: Process marketplace webhooks with validation

## Marketplace Integration Architecture

### Adapter Pattern
Each marketplace requires custom adapter:
- **eBay**: REST API + HTTP notifications + polling fallback
- **Amazon**: SP-API with strict rate limits and event subscriptions
- **Facebook**: Graph API for catalog sync
- **Etsy**: REST API + webhook signatures
- **Shopify**: REST + GraphQL + webhook subscriptions

### Integration Challenges
- **Rate Limit Management**: Prevent API throttling
- **Credential Refresh**: Automatic token rotation
- **Webhook Verification**: Signature validation
- **Error Handling**: Retry logic with exponential backoff
- **State Reconciliation**: Periodic sync to ensure consistency

## Scaling Architecture

### Horizontal Scaling
- **Containerized Services**: Docker with Kubernetes orchestration
- **Load Balancing**: Distribute traffic across service instances
- **Database Sharding**: Partition by seller_id or store_id

### Performance Optimization
- **Caching Strategy**: Redis for hot data, CDN for static assets
- **Batch Processing**: Nightly aggregation, daytime real-time queries
- **Background Queues**: Separate intensive work from request flow

## Observability Architecture

### Monitoring Stack
- **Metrics**: Prometheus + Grafana for system metrics
- **Logging**: ELK stack for centralized log management
- **Tracing**: Jaeger/Datadog for distributed tracing
- **Alerting**: Threshold-based notifications for system health

### Key Metrics
- API response times and error rates
- Job success/failure rates
- Queue depth and processing times
- Database connection pool health
- Marketplace API latency and availability
