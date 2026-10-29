import { createHmac } from 'node:crypto';

export type SignableParam = string | number | boolean | null | undefined;
export type SignableParams = Readonly<Record<string, SignableParam>>;

/**
 * Build the AliExpress Open Platform canonical parameter string.
 *
 * Parameter names are sorted lexicographically and concatenated with their
 * values without separators. The existing signature parameter is excluded.
 * Nullish values are omitted; empty strings and zero are retained.
 *
 * This function is deliberately pure: it performs no I/O and reads no env.
 */
export function canonicalizeParams(params: SignableParams): string {
  return Object.keys(params)
    .filter((key) => key !== 'sign' && params[key] !== null && params[key] !== undefined)
    .sort()
    .map((key) => `${key}${String(params[key])}`)
    .join('');
}

/**
 * Sign canonical AliExpress parameters with HMAC-SHA256.
 * Returns the hexadecimal digest in uppercase, as expected by the platform.
 */
export function sign(params: SignableParams, secret: string): string {
  if (!secret) {
    throw new Error('AliExpress app secret must not be empty');
  }

  return createHmac('sha256', secret)
    .update(canonicalizeParams(params), 'utf8')
    .digest('hex')
    .toUpperCase();
}
