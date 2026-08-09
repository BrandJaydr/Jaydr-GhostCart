// Temporary end-to-end test: enqueue a product.import job for the running worker.
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis('redis://localhost:6379', { maxRetriesPerRequest: null });
const q = new Queue('product.import', { connection });

await q.add(
  'product.import',
  {
    url: 'https://example.com/e2e-test-product',
    supplierId: 'mock',
    tenantId: '00000000-0000-0000-0000-000000000001',
    idempotencyKey: 'archivist-e2e-test',
  },
  { jobId: 'archivist-e2e-test' },
);

console.log('enqueued archivist-e2e-test');
await q.close();
await connection.quit();
process.exit(0);
