/**
 * GhostCart API Client
 *
 * Typed fetch wrapper that attaches the auth token, handles errors uniformly,
 * and supports both JSON and multipart/form-data requests.
 *
 * All commands use this client — never call fetch() directly.
 */

import { requireConfig } from './config.js';
import { color } from './ui/theme.js';

export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  data?: T;
  error?: string;
  details?: unknown;
  pagination?: { page: number; limit: number; total: number };
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  method: string,
  path: string,
  opts: {
    body?: unknown;
    formData?: FormData;
    token?: string;
  } = {},
): Promise<ApiResponse<T>> {
  const cfg = requireConfig();
  const token = opts.token ?? cfg.token;
  const url   = `${cfg.baseUrl}${path}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  let body: string | FormData | undefined;

  if (opts.formData) {
    // Let fetch set Content-Type with boundary for multipart
    body = opts.formData;
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }

  let response: Response;
  try {
    response = await fetch(url, { method, headers, body });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(
      `\n  ${color.error('✗')} Cannot reach GhostCart server at ${color.muted(cfg.baseUrl)}\n` +
      `  ${color.muted(msg)}\n`,
    );
    process.exit(1);
  }

  let json: ApiResponse<T>;
  try {
    json = await response.json() as ApiResponse<T>;
  } catch {
    console.error(`\n  ${color.error('✗')} Server returned non-JSON response (HTTP ${response.status})\n`);
    process.exit(1);
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      json.error ?? `HTTP ${response.status}`,
      json.details,
    );
  }

  return json;
}

export const api = {
  get:    <T>(path: string) => request<T>('GET', path),
  post:   <T>(path: string, body: unknown) => request<T>('POST', path, { body }),
  delete: <T>(path: string) => request<T>('DELETE', path),
  upload: <T>(path: string, formData: FormData) =>
    request<T>('POST', path, { formData }),

  /** Login with raw token (before config is saved) */
  loginPost: (baseUrl: string, body: { email: string; password: string }) =>
    fetch(`${baseUrl}/api/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    }),
};
