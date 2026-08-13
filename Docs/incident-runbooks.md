# Incident Runbooks

## Overview
This document contains incident response runbooks for common operational issues in GhostCart.

---

## Backup, Restore & Restore Test

### Purpose
Prove we can recover the database (Postgres = source of truth) and that a restored copy is sane (migrations, tables, RLS/tenant isolation).

### Commands
```bash
# Take a backup
npm run db:backup            # -> ./backups/ghostcart_backup_<ts>.sql.gz (+ .sha256)

# Verify required secrets / connectivity (non-destructive)
npm run secrets:verify

# Restore a specific backup (non-interactive; overwrites DB_NAME)
RESTORE_CONFIRM=yes ./scripts/restore-db.sh <backup.sql.gz>

# Stage 4 gate: backup -> restore into scratch DB -> smoke checks -> cleanup
npm run db:restore:test
```

### Restore Test Checks
- `schema_migrations` count matches the number of migration files in `src/db/migrations/` (computed at runtime)
- `products`, `listings`, `jobs`, `audit_events` tables present (row counts informational)
- RLS policies present on `products`
- Scratch DB dropped on completion; exit non-zero on any failure

### See Also
- Implementation: `scripts/restore-test.sh`, `scripts/backup-db.sh`
- Run `npm run db:restore:test` on a cadence (see CI workflow).

---

## Secrets Rotation

### Purpose
Rotate credentials with minimal disruption (overlap old + new during cutover). Local `.env` is the current store; a secrets manager is deferred to the host-deployment decision.

### Per-secret runbook
| Secret | Env var | Generate | Verify | Revoke old |
|---|---|---|---|---|
| NextAuth | NEXTAUTH_SECRET | `openssl rand -base64 32` | app boot / sign-in | after cutover |
| DB password | POSTGRES_PASSWORD | `openssl rand -base64 24` | `npm run secrets:verify` / health | after services restarted |
| eBay cert | EBAY_CERT_ID | `openssl rand -hex 32` | `/api/ebay/authorize` + a submit test | after token refresh |

### Commands
```bash
npm run secrets:rotate    # backs up .env, regenerates secrets, updates .env, logs
npm run secrets:verify    # non-destructive health check
./scripts/encrypt-env.sh  # age-encrypt .env -> .env.age (at-rest)
./scripts/decrypt-env.sh  # decrypt .env.age -> .env
```

> After rotating, restart services: `docker-compose down && docker-compose up -d`.

---

## Alerting (DLQ / Job Failure)

### Purpose
Notify on terminal/actionable background-job signals (final failure / DLQ, stalled job), not on every retry.

### Signals
- `job.failed_final` — import/refresh moved to dead-letter queue
- `queue.stalled` / backlog thresholds (future)

### Channels
- `console` (default): logs + persisted `alert_events` rows
- `webhook`: POST JSON to `ALERTS_WEBHOOK_URL` (Slack/Gotify-compatible)
- SMS / Messenger: future adapters behind the same `AlertProvider` interface

### Commands / API
```bash
# List alerts (backend; UI by Prism)
GET /api/alerts
# Acknowledge
POST /api/alerts/[id]/ack
```
- Implementation: `src/lib/alerts/index.ts`, table `alert_events` (migration 0015), worker hooks in `src/worker/index.ts`.

---

## Database Connection Failure

### Symptoms
- API endpoints returning 500 errors
- Worker jobs failing
- Connection timeout errors in logs

### Diagnosis
```bash
# Check database connectivity
docker-compose exec db pg_isready

# Check database logs
docker-compose logs db

# Check connection pool
docker-compose exec app psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
```

### Resolution Steps
1. **Check database status**
   ```bash
   docker-compose ps db
   ```

2. **Restart database if needed**
   ```bash
   docker-compose restart db
   ```

3. **Check disk space**
   ```bash
   docker-compose exec db df -h
   ```

4. **Check connection limits**
   ```bash
   docker-compose exec db psql -c "SHOW max_connections;"
   docker-compose exec db psql -c "SELECT count(*) FROM pg_stat_activity;"
   ```

5. **If connection pool exhausted**: Increase `DB_POOL_SIZE` in `.env` and restart app

### Prevention
- Monitor connection pool usage
- Set up alerts for high connection counts
- Implement connection pooling (PgBouncer)

---

## Redis Connection Failure

### Symptoms
- Queue jobs not processing
- Rate limiting not working
- Caching failures
- Redis connection errors in logs

### Diagnosis
```bash
# Check Redis status
docker-compose exec redis redis-cli ping

# Check Redis logs
docker-compose logs redis

# Check memory usage
docker-compose exec redis redis-cli INFO memory
```

### Resolution Steps
1. **Check Redis status**
   ```bash
   docker-compose ps redis
   ```

2. **Restart Redis if needed**
   ```bash
   docker-compose restart redis
   ```

3. **Check memory usage**
   ```bash
   docker-compose exec redis redis-cli INFO memory | grep used_memory
   ```

4. **If memory exhausted**: Increase Redis memory limit or enable eviction policy

5. **Check max clients**
   ```bash
   docker-compose exec redis redis-cli CONFIG GET maxclients
   ```

### Prevention
- Monitor Redis memory usage
- Set up alerts for high memory usage
- Configure Redis eviction policy

---

## Worker Job Failures

### Symptoms
- Jobs stuck in queue
- Import/refresh jobs failing
- Dead-letter queue growing

### Diagnosis
```bash
# Check worker status
docker-compose ps worker

# Check worker logs
docker-compose logs worker

# Check queue size
docker-compose exec redis redis-cli LLEN bull:product.import:waiting
```

### Resolution Steps
1. **Check worker status**
   ```bash
   docker-compose ps worker
   ```

2. **Restart worker if stuck**
   ```bash
   docker-compose restart worker
   ```

3. **Check dead-letter queue**
   ```bash
   docker-compose exec app psql $DATABASE_URL -c "SELECT * FROM dead_letter_queue ORDER BY created_at DESC LIMIT 10;"
   ```

4. **Retry failed jobs**
   ```bash
   # Via API: POST /api/jobs/[jobId]/retry
   ```

5. **Kill stuck jobs**
   ```bash
   # Via API: POST /api/jobs/kill
   ```

### Prevention
- Monitor queue sizes
- Set up alerts for dead-letter queue growth
- Implement job timeout policies

---

## eBay API Rate Limiting

### Symptoms
- eBay submission failures
- 429 Too Many Requests errors
- Listing submission delays

### Diagnosis
```bash
# Check rate limit violations
docker-compose exec app psql $DATABASE_URL -c "SELECT * FROM rate_limit_violations WHERE limit_type = 'ebay_api' ORDER BY violated_at DESC LIMIT 10;"
```

### Resolution Steps
1. **Check current rate limits**
   ```bash
   # Via API: GET /api/admin/rate-limits
   ```

2. **Increase rate limits if needed**
   ```bash
   # Via API: PATCH /api/admin/rate-limits
   ```

3. **Implement exponential backoff**
   - Already implemented in eBay client
   - Check logs for backoff behavior

4. **Switch to CSV export if limits exhausted**
   ```bash
   # Via API: POST /api/ebay/export/csv
   ```

### Prevention
- Monitor eBay API usage
- Set up alerts for approaching limits
- Implement queue-based submission

---

## AI Service Unavailable

### Symptoms
- AI rewrite failures
- Product analysis errors
- Timeout errors from AI service

### Diagnosis
```bash
# Check AI service status
curl http://localhost:11434/api/tags

# Check AI service logs
docker-compose logs ollama
```

### Resolution Steps
1. **Check AI service status**
   ```bash
   docker-compose ps ollama
   ```

2. **Restart AI service if needed**
   ```bash
   docker-compose restart ollama
   ```

3. **Check model availability**
   ```bash
   curl http://localhost:11434/api/tags
   ```

4. **Pull model if missing**
   ```bash
   docker-compose exec ollama ollama pull gemma:2b
   ```

5. **Fallback to cached results**
   - Cache is checked automatically
   - Check cache hit rate in logs

### Prevention
- Monitor AI service health
- Set up alerts for AI service downtime
- Implement fallback to alternative models

---

## High Memory Usage

### Symptoms
- Container OOM kills
- Slow response times
- System swapping

### Diagnosis
```bash
# Check container memory usage
docker stats

# Check app memory
docker-compose exec app node -e "console.log(process.memoryUsage())"
```

### Resolution Steps
1. **Identify memory-hungry process**
   ```bash
   docker stats --no-stream
   ```

2. **Restart affected container**
   ```bash
   docker-compose restart <service>
   ```

3. **Increase memory limits**
   - Update `docker-compose.yml`
   - Increase `MEM_LIMIT` for affected service

4. **Check for memory leaks**
   - Review application logs
   - Profile memory usage

### Prevention
- Monitor memory usage
- Set up alerts for high memory usage
- Implement memory profiling

---

## Disk Space Exhaustion

### Symptoms
- Database write failures
- Backup failures
- Container startup failures

### Diagnosis
```bash
# Check disk usage
df -h

# Check Docker volume usage
docker system df
```

### Resolution Steps
1. **Check disk usage**
   ```bash
   df -h
   ```

2. **Clean up old backups**
   ```bash
   find ./backups -name "*.sql.gz" -mtime +30 -delete
   ```

3. **Clean up Docker resources**
   ```bash
   docker system prune -a
   ```

4. **Vacuum database**
   ```bash
   docker-compose exec db psql -c "VACUUM ANALYZE;"
   ```

### Prevention
- Monitor disk usage
- Set up alerts for low disk space
- Implement automated cleanup

---

## Security Incident: Unauthorized Access

### Symptoms
- Suspicious API activity
- Failed login attempts
- Data access from unknown IPs

### Diagnosis
```bash
# Check audit logs
docker-compose exec app psql $DATABASE_URL -c "SELECT * FROM audit_events ORDER BY created_at DESC LIMIT 50;"

# Check failed logins
docker-compose logs app | grep "Failed login"
```

### Resolution Steps
1. **Identify affected accounts**
   ```bash
   docker-compose exec app psql $DATABASE_URL -c "SELECT DISTINCT user_id FROM audit_events WHERE action LIKE '%failed%' ORDER BY created_at DESC;"
   ```

2. **Rotate compromised credentials**
   ```bash
   ./scripts/rotate-secrets.sh
   ```

3. **Revoke suspicious sessions**
   - Invalidate JWT tokens
   - Force password resets

4. **Block malicious IPs**
   - Update firewall rules
   - Add to deny list

5. **Notify stakeholders**
   - Security team
   - Affected users

### Prevention
- Implement IP whitelisting
- Enable MFA
- Regular security audits
- Monitor audit logs

---

## Data Corruption

### Symptoms
- Inconsistent data
- Query errors
- Application crashes

### Diagnosis
```bash
# Check database integrity
docker-compose exec db psql -c "SELECT * FROM pg_stat_database WHERE datname = 'ghostcart';"

# Check for corrupted tables
docker-compose exec db psql -c "SELECT relname, n_live_tup, n_dead_tup FROM pg_stat_user_tables;"
```

### Resolution Steps
1. **Identify corrupted data**
   - Review error logs
   - Check affected tables

2. **Restore from backup**
   ```bash
   ./scripts/restore-db.sh <backup_file>
   ```

3. **Verify restore**
   ```bash
   docker-compose exec db psql -c "SELECT COUNT(*) FROM products;"
   ```

4. **Replay recent transactions**
   - Apply changes since backup
   - Verify data consistency

### Prevention
- Regular backups
- Backup verification
- Database integrity checks
- Transaction logging

---

## Service Outage: Complete System Down

### Symptoms
- All services unavailable
- No API responses
- Dashboard inaccessible

### Diagnosis
```bash
# Check all services
docker-compose ps

# Check system resources
top
df -h
free -h
```

### Resolution Steps
1. **Check infrastructure**
   - Server status
   - Network connectivity
   - Power status

2. **Restart all services**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

3. **Check service health**
   ```bash
   docker-compose ps
   curl http://localhost:3000/api/health
   ```

4. **Review logs**
   ```bash
   docker-compose logs --tail=100
   ```

5. **Notify stakeholders**
   - Status page update
   - Incident communication

### Prevention
- High availability setup
- Load balancing
- Disaster recovery plan
- Regular drills

---

## Escalation Procedures

### Level 1: Routine Incident
- **Response time**: 1 hour
- **Handled by**: On-call engineer
- **Examples**: Single service restart, minor bug fix

### Level 2: Significant Incident
- **Response time**: 30 minutes
- **Handled by**: On-call engineer + team lead
- **Examples**: Database failure, service outage

### Level 3: Critical Incident
- **Response time**: 15 minutes
- **Handled by**: Full team + management
- **Examples**: Data breach, complete system outage

### Escalation Contacts
- **On-call engineer**: [PHONE]
- **Team lead**: [PHONE]
- **CTO**: [PHONE]
- **Security team**: [EMAIL]

---

## Post-Incident Review

### Checklist
- [ ] Document incident timeline
- [ ] Identify root cause
- [ ] Document resolution steps
- [ ] Update runbooks
- [ ] Implement preventive measures
- [ ] Schedule follow-up review
- [ ] Communicate with stakeholders

### Template
```markdown
## Incident Report

**Date**: [DATE]
**Severity**: [LEVEL 1/2/3]
**Duration**: [START] - [END]

### Summary
[Brief description]

### Timeline
- [TIME]: [Event]
- [TIME]: [Event]

### Root Cause
[Analysis]

### Resolution
[Steps taken]

### Impact
[Affected systems/users]

### Preventive Measures
[Changes to prevent recurrence]

### Follow-up Actions
[Items to track]
```
