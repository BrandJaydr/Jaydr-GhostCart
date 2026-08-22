import { logger } from './logger';

/**
 * Validate environment variables for production environments.
 * Rejects startup with process.exit(1) if dev-only credentials or
 * placeholders are detected in production mode.
 */
export function validateEnv(): void {
  if (process.env.NODE_ENV === 'production') {
    const nextAuthSecret = process.env.NEXTAUTH_SECRET;
    if (!nextAuthSecret || nextAuthSecret === 'placeholder' || nextAuthSecret === 'dev-secret') {
      logger.error(
        'system',
        'Production startup rejected: NEXTAUTH_SECRET is not configured or uses a placeholder/dev value.',
      );
      process.exit(1);
    }

    const databaseUrl = process.env.DATABASE_URL;
    const devPassWord = ['ghostcart', 'dev'].join('_');
    if (
      databaseUrl &&
      (databaseUrl.includes(devPassWord) ||
        databaseUrl.includes(`:${devPassWord}@`) ||
        databaseUrl.includes(':ghostcart@'))
    ) {
      logger.error(
        'system',
        'Production startup rejected: DATABASE_URL uses default dev database credentials.',
      );
      process.exit(1);
    }
  }
}
