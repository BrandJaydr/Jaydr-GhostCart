/**
 * Alerting module — Jaydr GhostCart (Stage 4 ops hardening)
 *
 * Ops-focused alerts. Any background/terminal signal (final job failure / DLQ
 * write, stalled job, rate-limit threshold) is normalized into an `AlertEvent`,
 * persisted to the `alert_events` table, and fanned out to enabled channels via
 * `AlertProvider`s (console, webhook/Slack/Gotify). SMS / Messenger adapters can
 * be added here later behind the same interface — this remains ops-only.
 *
 * Configuration (env):
 *   ALERTS_CHANNELS       comma-separated provider ids, default "console"
 *   ALERTS_WEBHOOK_URL    URL to POST JSON alerts (Slack/Gotify-compatible)
 *   ALERTS_SEVERITY_MIN   minimum severity to deliver ("info"|"warning"|"critical")
 *
 * Design rule: alert on terminal/actionable signals only, never on every retry.
 */

import { db } from '@/lib/db/index';

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertStatus = 'new' | 'acknowledged' | 'resolved';

const SEVERITY_RANK: Record<AlertSeverity, number> = {
  info: 0,
  warning: 1,
  critical: 2,
};

export interface AlertEvent {
  tenantId?: string | null;
  alertType: string;
  severity: AlertSeverity;
  message: string;
  payload?: Record<string, unknown>;
  channel?: string;
  createdAt?: Date;
}

export interface AlertProvider {
  readonly id: string;
  send(event: AlertEvent): Promise<boolean>;
}

/** Console/log provider — zero dependencies, always safe. */
export class ConsoleAlertProvider implements AlertProvider {
  readonly id = 'console';
  async send(event: AlertEvent): Promise<boolean> {
    console.warn(
      `[alert:${event.severity}] ${event.alertType}: ${event.message}`,
      event.payload ?? {},
    );
    return true;
  }
}

/** Webhook provider — POST JSON to Slack/Gotify/Slack-compatible endpoints. */
export class WebhookAlertProvider implements AlertProvider {
  readonly id = 'webhook';
  private readonly url: string;

  constructor(url: string) {
    this.url = url;
  }

  async send(event: AlertEvent): Promise<boolean> {
    if (!this.url) return false;
    try {
      const body = {
        alert_type: event.alertType,
        severity: event.severity,
        message: event.message,
        payload: event.payload ?? {},
        tenant_id: event.tenantId ?? null,
        created_at: (event.createdAt ?? new Date()).toISOString(),
      };
      const res = await fetch(this.url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      return res.ok;
    } catch (err) {
      console.error('[alerts] webhook delivery failed:', (err as Error).message);
      return false;
    }
  }
}

/** Build the enabled provider set from ALERTS_CHANNELS. */
export function resolveProviders(env = process.env): AlertProvider[] {
  const channels = (env.ALERTS_CHANNELS ?? 'console')
    .split(',')
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);

  const providers: AlertProvider[] = [];
  for (const ch of channels) {
    if (ch === 'webhook') {
      if (env.ALERTS_WEBHOOK_URL) providers.push(new WebhookAlertProvider(env.ALERTS_WEBHOOK_URL));
      else console.error('[alerts] webhook channel configured but ALERTS_WEBHOOK_URL is missing');
    } else if (ch === 'console') {
      providers.push(new ConsoleAlertProvider());
    } else {
      console.error(`[alerts] unknown channel "${ch}" ignored`);
    }
  }
  return providers;
}

/** Whether an event clears the configured minimum severity threshold. */
export function isBelowThreshold(event: AlertEvent, env = process.env): boolean {
  const min = (env.ALERTS_SEVERITY_MIN ?? 'warning') as AlertSeverity;
  return SEVERITY_RANK[event.severity] < SEVERITY_RANK[min];
}

/**
 * Persist an alert to `alert_events` and deliver to enabled providers.
 * Returns the inserted row id, or null if persistence failed.
 */
export async function notify(
  event: AlertEvent,
  opts: { providers?: AlertProvider[]; persist?: boolean; env?: NodeJS.ProcessEnv } = {},
): Promise<string | null> {
  const providers = opts.providers ?? resolveProviders(opts.env ?? process.env);
  const createdAt = event.createdAt ?? new Date();
  const full: AlertEvent = { ...event, createdAt };

  let id: string | null = null;
  if (opts.persist !== false) {
    try {
      const result = await db.query<{ id: string }>(
        `INSERT INTO alert_events (tenant_id, alert_type, severity, message, payload, channel, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'new', $7)
         RETURNING id`,
        [
          event.tenantId ?? null,
          event.alertType,
          event.severity,
          event.message,
          JSON.stringify(event.payload ?? {}),
          providers.map((p) => p.id).join(','),
          createdAt,
        ],
      );
      id = result.rows[0].id;
    } catch (err) {
      console.error('[alerts] failed to persist alert:', (err as Error).message);
    }
  }

  if (!isBelowThreshold(full, opts.env ?? process.env)) {
    await Promise.all(
      providers.map(async (p) => {
        try {
          await p.send(full);
        } catch (err) {
          console.error(`[alerts] provider ${p.id} errored:`, (err as Error).message);
        }
      }),
    );
  } else {
    console.debug(`[alerts] "${event.severity}" below ALERTS_SEVERITY_MIN; recorded only`);
  }

  return id;
}

/** Mark an alert acknowledged. */
export async function acknowledge(id: string): Promise<boolean> {
  try {
    const result = await db.query(
      `UPDATE alert_events
         SET status = 'acknowledged', read_at = now()
       WHERE id = $1 AND status = 'new'`,
      [id],
    );
    return (result.rowCount ?? 0) > 0;
  } catch (err) {
    console.error('[alerts] acknowledge error:', (err as Error).message);
    return false;
  }
}
