// Temporary: verify `@/` aliases resolve under the CJS ts-node launcher.
/* eslint-disable no-console */
import { db, setTenantContextOn, DEV_TENANT_ID } from '@/lib/db';
import { redis, importQueue } from '@/lib/queue';
console.log('ALIAS_OK', typeof db, typeof setTenantContextOn, typeof redis, typeof importQueue, DEV_TENANT_ID);
