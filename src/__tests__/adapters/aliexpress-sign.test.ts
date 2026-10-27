import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

/**
 * Expected AliExpress Open Platform HMAC-SHA256 signature calculation algorithm:
 * 1. Exclude signature parameter ('sign').
 * 2. Sort parameter keys alphabetically (ASCII byte order).
 * 3. Concatenate key and value for each parameter: key1value1key2value2...
 * 4. Compute HMAC-SHA256 hex digest using app secret key (uppercase result).
 */
export function calculateAliExpressSignature(params: Record<string, string>, appSecret: string): string {
  const sortedKeys = Object.keys(params)
    .filter((key) => key !== 'sign')
    .sort();

  let queryStr = '';
  for (const key of sortedKeys) {
    queryStr += `${key}${params[key]}`;
  }

  return crypto
    .createHmac('sha256', appSecret)
    .update(queryStr, 'utf8')
    .digest('hex')
    .toUpperCase();
}

describe('AliExpress Open Platform HMAC-SHA256 Signer (GC-201 Test Support)', () => {
  it('calculates expected signature for known parameters and dummy secret', () => {
    const dummyAppSecret = 'test_app_secret_12345';
    const params: Record<string, string> = {
      app_key: '12345678',
      method: 'aliexpress.ds.text.search',
      timestamp: '1700000000000',
      sign_method: 'sha256',
      countryCode: 'US',
      pageSize: '20',
      pageNo: '1',
    };

    // Concatenated string:
    // app_key12345678countryCodeUSmethodaliexpress.ds.text.searchpageNo1pageSize20sign_methodsha256timestamp1700000000000
    const expectedConcatenated =
      'app_key12345678countryCodeUSmethodaliexpress.ds.text.searchpageNo1pageSize20sign_methodsha256timestamp1700000000000';
    const expectedSignature = crypto
      .createHmac('sha256', dummyAppSecret)
      .update(expectedConcatenated, 'utf8')
      .digest('hex')
      .toUpperCase();

    const resultSignature = calculateAliExpressSignature(params, dummyAppSecret);

    expect(resultSignature).toBe(expectedSignature);
    expect(resultSignature).toMatch(/^[0-9A-F]{64}$/);
  });

  it('ignores any pre-existing sign parameter when building signature', () => {
    const dummyAppSecret = 'secret_abc';
    const paramsWithSign: Record<string, string> = {
      b_param: 'valueB',
      a_param: 'valueA',
      sign: 'OLD_SIGNATURE_TO_BE_IGNORED',
    };

    const signatureWithoutSign = calculateAliExpressSignature(
      { b_param: 'valueB', a_param: 'valueA' },
      dummyAppSecret
    );
    const signatureWithSign = calculateAliExpressSignature(paramsWithSign, dummyAppSecret);

    expect(signatureWithSign).toBe(signatureWithoutSign);
  });

  it('correctly handles parameters with special characters or numbers', () => {
    const dummyAppSecret = 'secret_xyz';
    const params: Record<string, string> = {
      search_text: 'bluetooth earbuds & headphones',
      price_min: '10.50',
    };

    const signature = calculateAliExpressSignature(params, dummyAppSecret);
    expect(signature).toBeDefined();
    expect(typeof signature).toBe('string');
    expect(signature.length).toBe(64);
  });
});
