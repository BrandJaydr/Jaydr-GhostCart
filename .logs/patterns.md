# Patterns Log - Jaydr GhostCart

## Event-Driven Patterns
- **All marketplace interactions as events**: Orders, messages, returns, warnings → message bus
- **Real-time sync via pub/sub**: Product changes, price updates, inventory changes
- **Background workers subscribe to topics**: React to events without blocking

## Microservice Communication Patterns
- **API Gateway pattern**: Single entry point with rate limiting, auth, routing
- **Circuit breaker pattern**: Prevent cascading failures between services
- **Service discovery**: Dynamic service location via Consul/Kubernetes DNS
- **Async communication via message bus**: Non-blocking service updates

## Data Architecture Patterns
- **Separate OLTP and analytics**: PostgreSQL for transactions, warehouse for analytics
- **Time-series for price history**: InfluxDB for tracking price trends
- **Cache hot paths**: Redis for real-time pricing, user sessions, rate limits
- **ETL orchestration**: Airflow for data pipeline management

## Multi-Tenancy Patterns
- **Row-level security**: Every query filtered by tenant_id
- **Encrypted sensitive fields**: API keys, bank information
- **Audit trail**: Immutable log of who changed what and when
- **Role-based access control**: Owner, VA, listing manager, accountant roles

## Marketplace Integration Patterns
- **Adapter pattern per marketplace**: eBay, Amazon, Facebook, Etsy, Shopify
- **Webhook + polling fallback**: Real-time updates with periodic reconciliation
- **Rate limit management**: Prevent API throttling
- **Credential rotation**: Automatic token refresh

## Observability Patterns
- **Structured logging**: Searchable by seller ID, service, time range
- **Metrics collection**: API response times, job success rates, queue depth
- **Distributed tracing**: Follow requests through service chain
- **Alerting on thresholds**: Failure rates, latency, missed schedules

## Scaling Patterns
- **Horizontal scaling**: Load balancer + containerized services
- **Database sharding**: Partition by seller_id or store_id
- **Batch processing**: Nightly aggregation, daytime real-time queries
- **Background job queues**: Separate time-intensive work from request flow
