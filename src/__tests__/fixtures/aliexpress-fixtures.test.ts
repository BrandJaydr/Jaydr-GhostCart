import { describe, it, expect } from 'vitest';
import fixtures, {
  aliexpressFullSearchFixture,
  aliexpressEmptySearchFixture,
  aliexpressErrorSearchFixture,
  type AliExpressSearchSuccessResponse,
  type AliExpressErrorResponse,
} from './aliexpress';

describe('AliExpress ds.text.search Fixtures (GC-T1)', () => {
  it('exports valid default object containing all fixtures', () => {
    expect(fixtures.full).toBeDefined();
    expect(fixtures.empty).toBeDefined();
    expect(fixtures.error).toBeDefined();
  });

  it('validates full search response fixture structure and fields', () => {
    const res: AliExpressSearchSuccessResponse = aliexpressFullSearchFixture;
    expect(res.aliexpress_ds_text_search_response.rsp_code).toBe(200);
    expect(res.aliexpress_ds_text_search_response.rsp_msg).toBe('call success');

    const result = res.aliexpress_ds_text_search_response.result;
    expect(result.total_record_count).toBeGreaterThan(0);
    expect(result.products.selection_search_product.length).toBe(2);

    const firstProduct = result.products.selection_search_product[0];
    expect(firstProduct.product_id).toBe(1005007429636284);
    expect(firstProduct.product_title).toContain('Wireless Bluetooth Earbuds');
    expect(firstProduct.target_sale_price).toBe('12.99');
    expect(firstProduct.target_sale_price_currency).toBe('USD');
    expect(firstProduct.product_main_image_url).toBeTruthy();
    expect(firstProduct.product_small_image_urls?.string.length).toBeGreaterThan(0);
    expect(firstProduct.evaluate_rate).toBe('96.5%');
    expect(firstProduct.volume).toBe(1520);
  });

  it('validates empty search response fixture structure', () => {
    const res: AliExpressSearchSuccessResponse = aliexpressEmptySearchFixture;
    expect(res.aliexpress_ds_text_search_response.rsp_code).toBe(200);
    expect(res.aliexpress_ds_text_search_response.result.total_record_count).toBe(0);
    expect(res.aliexpress_ds_text_search_response.result.products.selection_search_product).toEqual([]);
  });

  it('validates error response fixture structure', () => {
    const res: AliExpressErrorResponse = aliexpressErrorSearchFixture;
    expect(res.error_response).toBeDefined();
    expect(res.error_response.code).toBe('15');
    expect(res.error_response.sub_code).toBe('isv.invalid-parameter:session-expired');
    expect(res.error_response.request_id).toBeTruthy();
  });
});
