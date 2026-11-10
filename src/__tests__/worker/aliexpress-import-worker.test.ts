import {describe,it,expect,vi} from 'vitest';
import type {Job} from 'bullmq';

const {mockAliExpressImport,mockDbQuery,mockClientQuery} = vi.hoisted(()=>({
  mockAliExpressImport:vi.fn(),
  mockDbQuery:vi.fn(),
  mockClientQuery:vi.fn(),
}));

vi.mock('bullmq',()=>({
  Worker:class {
    name:string;
    processFn:(job:Job)=>Promise<unknown>;
    constructor(name:string,processor:(job:Job)=>Promise<unknown>){this.name=name;this.processFn=processor;}
    on(){return this;}
  },
}));

vi.mock('../../lib/adapters/aliexpress/search',()=>({
  AliExpressSearchClient:class {
    importProductUrl(url:string){return mockAliExpressImport(url);}
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

import {importWorker} from '../../worker/index.js';
import {getSupplierAdapter} from '../../lib/adapters/factory.js';
import {aliexpressProductDetailFixture} from '../fixtures/aliexpress';

describe('AliExpress product.import worker integration',()=>{
  it('routes a fixture-backed AliExpress job through the registered factory adapter',async()=>{
    mockAliExpressImport.mockResolvedValue(aliexpressProductDetailFixture);
    mockClientQuery.mockResolvedValue({rows:[],rowCount:0});
    const url='https://www.aliexpress.com/item/1005007429636284.html';
    const job={
      id:'fixture-aliexpress-import-1',
      data:{url,supplierId:'aliexpress',tenantId:'tenant-fixture',idempotencyKey:'fixture-aliexpress-import-1'},
    } as unknown as Job;

    expect(importWorker.name).toBe('product.import');
    expect(getSupplierAdapter('aliexpress')?.adapterId).toBe('aliexpress');
    const result=await (importWorker as unknown as {processFn:(job:Job)=>Promise<unknown>}).processFn(job);

    expect(mockAliExpressImport).toHaveBeenCalledWith(url);
    expect(result).toMatchObject({productId:'aliexpress_1005007429636284',persisted:true});
    expect(mockClientQuery).toHaveBeenCalledWith('BEGIN');
    expect(mockClientQuery).toHaveBeenCalledWith('COMMIT');
  });
});
