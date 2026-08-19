import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, redact, runWithCorrelationId, getCorrelationId } from '../lib/logger';

describe('Structured Logger', () => {
  let consoleSpy: any;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('redact', () => {
    it('should redact sensitive keys in flat objects', () => {
      const input = {
        username: 'john_doe',
        password: 'super_secret_password',
        accessToken: 'oauth_access_token_123',
        normalField: 'hello',
      };

      const result = redact(input) as any;

      expect(result.username).toBe('john_doe');
      expect(result.password).toBe('[REDACTED]');
      expect(result.accessToken).toBe('[REDACTED]');
      expect(result.normalField).toBe('hello');
    });

    it('should redact sensitive keys recursively in nested objects', () => {
      const input = {
        id: 1,
        config: {
          client_id: 'client_id_val',
          client_secret: 'client_secret_val',
          nested: {
            token: 'inner_token',
          },
        },
      };

      const result = redact(input) as any;

      expect(result.id).toBe(1);
      expect(result.config.client_id).toBe('[REDACTED]');
      expect(result.config.client_secret).toBe('[REDACTED]');
      expect(result.config.nested.token).toBe('[REDACTED]');
    });

    it('should handle arrays and null/undefined values correctly', () => {
      expect(redact(null)).toBeNull();
      expect(redact(undefined)).toBeUndefined();
      expect(redact('simple string')).toBe('simple string');

      const arrInput = [
        { name: 'Alice', token: 'token1' },
        { name: 'Bob', password: 'pass' },
      ];

      const result = redact(arrInput) as any;
      expect(result[0].name).toBe('Alice');
      expect(result[0].token).toBe('[REDACTED]');
      expect(result[1].name).toBe('Bob');
      expect(result[1].password).toBe('[REDACTED]');
    });
  });

  describe('correlationId', () => {
    it('should retrieve undefined correlationId outside run context', () => {
      expect(getCorrelationId()).toBeUndefined();
    });

    it('should store and retrieve correlation ID using AsyncLocalStorage', () => {
      runWithCorrelationId('test-correlation-123', () => {
        expect(getCorrelationId()).toBe('test-correlation-123');

        // Nested call
        runWithCorrelationId('nested-456', () => {
          expect(getCorrelationId()).toBe('nested-456');
        });

        // Verifies storage restores back to parent context
        expect(getCorrelationId()).toBe('test-correlation-123');
      });
    });
  });

  describe('logger methods', () => {
    it('should log output with categories and correct formatting', () => {
      logger.info('auth', 'User logged in successfully');
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0][0];
      expect(output).toContain('[INFO]');
      expect(output).toContain('[AUTH]');
      expect(output).toContain('User logged in successfully');
    });

    it('should include metadata with redacted properties', () => {
      logger.warn('ebay', 'Listing sync warning', {
        listingId: 'ebay_123',
        accessToken: 'secret_token_val',
      });

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0][0];
      expect(output).toContain('[WARN]');
      expect(output).toContain('[EBAY]');
      expect(output).toContain('Listing sync warning');
      expect(output).toContain('listingId');
      expect(output).toContain('[REDACTED]');
      expect(output).not.toContain('secret_token_val');
    });
  });
});
