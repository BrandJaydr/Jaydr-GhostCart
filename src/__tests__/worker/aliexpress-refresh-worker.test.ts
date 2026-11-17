import {describe,it,expect,vi} from 'vitest';
import type {Job} from 'bullmq';

const {mockFetchDetail,mockDbQuery,mockClientQuery} = vi.hoisted(()=>({
  mockFetchDetail:vi.fn(),
  mockDbQuery:vi.fn(),
  mockClientQuery:vi.fn(),
}));

vi.mock('bullmq',()=>({
  Worker:class {
    name:string;
    processFn:(job:Job)=>Promise<unknown>;
    constructor(name:string,processor:(job:Job)=>Promise<unknown>){this.name=name;this.processFn=processor;}
    on(){return this;}
    close(){return Promise.resolve();}
  },
}));

vi.mock('../../lib/adapters/aliexpress/search',()=>({
  AliExpressSearchClient:class {
    getProductDetail(id:string){return mockFetchDetail(id);}
    importProductUrl(url:string){return mockFetchDetail(url);}
    searchText(){return Promise.resolve({products:[],total:0,raw:{}});}
  },
  AliExpressSearchError:class extends Error {},
  extractAliExpressProductId:(url:string)=>url.match(/item\/(\d+)/)?.[1]??'1005007429636284',
}));

vi.mock('../../lib/db/index.js',()=>({
  db:{
    connect:vi.fn(async()=>({query:mockClientQuery,release:vi.fn()})),
    query:mockDbQuery,
  },
  setTenantContextOn:vi.fn(async()=>undefined),
  withTenant:vi.fn(),
}));

vi.mock('../../lib/queue/index.js',()=>({redis:{}}));
vi.mock('../../lib/alerts/index.js',()=>({notify:vi.fn().mockResolvedValue(undefined)}));
vi.mock('../../worker/scheduler.js',()=>({processScheduledRefreshes:vi.fn().mockResolvedValue(undefined)}));
vi.mock('../../lib/adapters/ebay/ebay-client.js',()=>({getEBayClient:vi.fn()}));
vi.mock('../../lib/adapters/ebay/listing-mapper.js',()=>({mapListingDraftToEBayListing:vi.fn(),validateEBayListing:vi.fn()}));

import {refreshWorker} from '../../worker/index.js';
import {getSupplierAdapter} from '../../lib/adapters/factory.js';
import {aliexpressProductDetailFixture} from '../fixtures/aliexpress';

const DB_PRODUCT_ID='0c9d1e2f-3a4b-5c6d-7e8f-9a0b1c2d3e4f';
const SUPPLIER_PRODUCT_ID='1005007429636284';
const TENANT='tenant-fixture';

describe('AliExpress product.refresh worker integration (GC-206)',()=>{
  it('resolves the supplier product id from identifiers and updates price/stock history',async()=>{
    mockFetchDetail.mockResolvedValue(aliexpressProductDetailFixture);
    // First db.query: current product row (change-detection + identifiers).
    // Later db.query calls: log_price_change / log_stock_change / last_refreshed_at / audit.
    mockDbQuery
      .mockResolvedValueOnce({
        rowCount:1,
        rows:[{supplier_price_cents:4210,current_stock:1,identifiers:{product_id:SUPPLIER_PRODUCT_ID}}],
      })
      .mockResolvedValue({rowCount:1,rows:[{history_id:1,changed:true}]});
    mockClientQuery.mockResolvedValue({rows:[],rowCount:0});

    expect(refreshWorker.name).toBe('product.refresh');
    expect(getSupplierAdapter('aliexpress')?.adapterId).toBe('aliexpress');
    const job={
      id:'fixture-aliexpress-refresh-1',
      data:{productId:DB_PRODUCT_ID,tenantId:TENANT,supplierId:'aliexpress',refreshType:'both'},
    } as unknown as Job;

    const result=await (refreshWorker as unknown as {processFn:(job:Job)=>Promise<unknown>}).processFn(job);

    // The adapter must receive the supplier product id from identifiers — not the DB UUID.
    expect(mockFetchDetail).toHaveBeenCalledWith(SUPPLIER_PRODUCT_ID);
    expect(mockFetchDetail.mock.calls.some(([id])=>id===DB_PRODUCT_ID)).toBe(false);

    // Persist ran inside a transaction.
    expect(mockClientQuery).toHaveBeenCalledWith('BEGIN');
    expect(mockClientQuery).toHaveBeenCalledWith('COMMIT');

    // Price + stock change history logged against the DB product id.
    const priceLog=mockDbQuery.mock.calls.find(([sql])=>String(sql).includes('log_price_change'));
    expect(priceLog).toBeDefined();
    expect(priceLog?.[1]).toEqual([DB_PRODUCT_ID,4210,expect.any(Number),'scheduled',null]);
    const stockLog=mockDbQuery.mock.calls.find(([sql])=>String(sql).includes('log_stock_change'));
    expect(stockLog).toBeDefined();
    expect(stockLog?.[1]).toEqual([DB_PRODUCT_ID,expect.anything(),expect.anything(),'scheduled',null]);

    expect(result).toMatchObject({productId:DB_PRODUCT_ID,persisted:true,priceChanged:true,stockChanged:true});
  });

  it('falls back to the job product id when identifiers carry no supplier id',async()=>{
    mockFetchDetail.mockResolvedValue(aliexpressProductDetailFixture);
    mockDbQuery
      .mockResolvedValueOnce({
        rowCount:1,
        rows:[{supplier_price_cents:null,current_stock:null,identifiers:{}}],
      })
      .mockResolvedValue({rowCount:1,rows:[{history_id:1,changed:true}]});
    mockClientQuery.mockResolvedValue({rows:[],rowCount:0});

    const job={
      id:'fixture-aliexpress-refresh-2',
      data:{productId:`aliexpress_${SUPPLIER_PRODUCT_ID}`,tenantId:TENANT,supplierId:'aliexpress',refreshType:'both'},
    } as unknown as Job;

    const result=await (refreshWorker as unknown as {processFn:(job:Job)=>Promise<unknown>}).processFn(job);
    expect(mockFetchDetail).toHaveBeenCalledWith(SUPPLIER_PRODUCT_ID);
    expect(result).toMatchObject({persisted:true});
  });
});
