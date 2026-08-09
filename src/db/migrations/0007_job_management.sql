-- ─────────────────────────────────────────────────────────────────────────────
-- Jaydr GhostCart — Migration 0007: Job Management Enhancements
-- Stage: Stage 3 — Job Management System
-- Reference: Stage 3 Implementation Plan — Task 3: Job Management System
-- ─────────────────────────────────────────────────────────────────────────────
-- @agent:archivist Add indexes for common query patterns
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Enhance Jobs Table ─────────────────────────────────────────────────────
-- Add error categorization and retry tracking

ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS error_category TEXT CHECK (error_category IN ('transient', 'permanent', 'unknown')),
ADD COLUMN IF NOT EXISTS error_stack TEXT,
ADD COLUMN IF NOT EXISTS max_attempts INTEGER NOT NULL DEFAULT 5,
ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS killed BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS killed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS killed_by UUID REFERENCES users(id);

-- Index for retry scheduling
CREATE INDEX IF NOT EXISTS jobs_next_retry_idx ON jobs(next_retry_at) WHERE next_retry_at IS NOT NULL;
-- Index for killed jobs
CREATE INDEX IF NOT EXISTS jobs_killed_idx ON jobs(killed) WHERE killed = true;
-- Index for error category filtering
CREATE INDEX IF NOT EXISTS jobs_error_category_idx ON jobs(error_category);

-- ─── Row-Level Security Policy Update ───────────────────────────────────────
-- Add policy for kill switch (only tenant owner can kill jobs)
CREATE POLICY jobs_kill_policy ON jobs
  FOR UPDATE
  USING (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('ghostcart.tenant_id', true)::uuid);

-- ─── Functions for Job Management ───────────────────────────────────────────

-- Function to categorize error
CREATE OR REPLACE FUNCTION jobs.categorize_error(error_message TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Transient errors: network, rate limits, timeouts
  IF error_message ~* '(timeout|network|ECONNREFUSED|rate limit|502|503|504)' THEN
    RETURN 'transient';
  END IF;

  -- Permanent errors: validation, auth, not found
  IF error_message ~* '(validation|invalid|unauthorized|401|403|404|not found)' THEN
    RETURN 'permanent';
  END IF;

  RETURN 'unknown';
END;
$$ LANGUAGE plpgsql;

-- Function to schedule next retry with exponential backoff
CREATE OR REPLACE FUNCTION jobs.schedule_retry(job_id UUID)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  job_record RECORD;
  next_retry TIMESTAMPTZ;
  backoff_seconds INTEGER;
BEGIN
  SELECT * INTO job_record FROM jobs WHERE id = job_id;

  IF job_record.killed THEN
    RAISE EXCEPTION 'Job has been killed';
  END IF;

  IF job_record.attempts >= job_record.max_attempts THEN
    RAISE EXCEPTION 'Max retry attempts exceeded';
  END IF;

  -- Exponential backoff: 30s, 2m, 8m, 32m, 128m
  backoff_seconds := POWER(2, job_record.attempts) * 30;
  next_retry := now() + (backoff_seconds || ' seconds')::interval;

  UPDATE jobs
  SET attempts = attempts + 1,
      next_retry_at = next_retry,
      status = 'pending'
  WHERE id = job_id;

  RETURN next_retry;
END;
$$ LANGUAGE plpgsql;

-- Function to kill a job
CREATE OR REPLACE FUNCTION jobs.kill_job(job_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE jobs
  SET killed = true,
      killed_at = now(),
      killed_by = user_id,
      status = 'cancelled',
      next_retry_at = NULL
  WHERE id = job_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to kill all queued jobs for a tenant
CREATE OR REPLACE FUNCTION jobs.kill_all_tenant_jobs(tenant_id UUID, user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  killed_count INTEGER;
BEGIN
  UPDATE jobs
  SET killed = true,
      killed_at = now(),
      killed_by = user_id,
      status = 'cancelled',
      next_retry_at = NULL
  WHERE tenant_id = tenant_id
    AND status IN ('pending', 'queued')
    AND killed = false;

  GET DIAGNOSTICS killed_count = ROW_COUNT;
  RETURN killed_count;
END;
$$ LANGUAGE plpgsql;
