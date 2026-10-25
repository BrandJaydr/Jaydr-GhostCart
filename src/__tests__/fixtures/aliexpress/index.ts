import fullResponse from './full.json' with { type: 'json' };
import emptyResponse from './empty.json' with { type: 'json' };
import errorResponse from './error.json' with { type: 'json' };

export interface AliExpressSearchProduct {
  product_id: number;
  product_title: string;
  product_main_image_url: string;
  product_small_image_urls?: {
    string: string[];
  };
  target_sale_price: string;
  target_sale_price_currency: string;
  target_original_price?: string;
  target_original_price_currency?: string;
  evaluate_rate?: string;
  volume?: number;
  shop_id?: number;
  first_level_category_id?: number;
  first_level_category_name?: string;
  second_level_category_id?: number;
  second_level_category_name?: string;
  ship_to_days?: string;
  sale_price?: string;
  sale_price_currency?: string;
}

export interface AliExpressSearchSuccessResponse {
  aliexpress_ds_text_search_response: {
    rsp_code: number;
    rsp_msg: string;
    result: {
      total_page: number;
      total_record_count: number;
      current_page_no: number;
      current_record_count: number;
      products: {
        selection_search_product: AliExpressSearchProduct[];
      };
    };
  };
}

export interface AliExpressErrorResponse {
  error_response: {
    code: string;
    msg: string;
    sub_code?: string;
    sub_msg?: string;
    request_id: string;
  };
}

export type AliExpressSearchApiResponse = AliExpressSearchSuccessResponse | AliExpressErrorResponse;

export const aliexpressFullSearchFixture: AliExpressSearchSuccessResponse = fullResponse as AliExpressSearchSuccessResponse;
export const aliexpressEmptySearchFixture: AliExpressSearchSuccessResponse = emptyResponse as AliExpressSearchSuccessResponse;
export const aliexpressErrorSearchFixture: AliExpressErrorResponse = errorResponse as AliExpressErrorResponse;

const aliexpressFixtures = {
  full: aliexpressFullSearchFixture,
  empty: aliexpressEmptySearchFixture,
  error: aliexpressErrorSearchFixture,
};

export default aliexpressFixtures;
