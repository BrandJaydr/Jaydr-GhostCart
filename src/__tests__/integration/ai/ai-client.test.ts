/**
 * AI Client Integration Tests
 *
 * Tests AI client with mock responses and cache layer.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIClient, type AIModelConfig } from '@/lib/ai/ai-client';

describe('AI Client', () => {
  let aiClient: AIClient;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    const config: AIModelConfig = {
      provider: 'ollama',
      baseUrl: 'http://localhost:11434',
      model: 'gemma:2b',
    };

    aiClient = new AIClient(config);
  });

  describe('rewriteListing', () => {
    it('should generate listing rewrite', async () => {
      const mockResponse = {
        response: JSON.stringify({
          title: 'Optimized Title',
          description: 'Optimized description',
        }),
        eval_count: 100,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await aiClient.rewriteListing({
        title: 'Original Title',
        description: 'Original description',
        marketplace: 'ebay',
        style: 'premium',
      });

      expect(result.content).toContain('Optimized');
      expect(result.model).toBe('gemma:2b');
      expect(result.tokensUsed).toBe(100);
      expect(result.cached).toBe(false);
    });

    it('should use cached response on second call', async () => {
      const mockResponse = {
        response: JSON.stringify({
          title: 'Cached Title',
          description: 'Cached description',
        }),
        eval_count: 50,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const request = {
        title: 'Test Title',
        description: 'Test description',
      };

      // First call - not cached
      const result1 = await aiClient.rewriteListing(request);
      expect(result1.cached).toBe(false);

      // Second call - cached
      const result2 = await aiClient.rewriteListing(request);
      expect(result2.cached).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only called once
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      await expect(
        aiClient.rewriteListing({
          title: 'Test',
          description: 'Test',
        }),
      ).rejects.toThrow('Ollama API error');
    });
  });

  describe('analyzeProduct', () => {
    it('should analyze product and return structured data', async () => {
      const mockResponse = {
        response: JSON.stringify({
          materialComposition: 'Cotton 100%',
          qualityScore: 85,
          riskAssessment: {
            level: 'low',
            reasons: [],
          },
          marketPotential: {
            score: 75,
            category: 'Clothing',
            seasonalFactors: [],
          },
        }),
        eval_count: 150,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await aiClient.analyzeProduct({
        title: 'Test Product',
        description: 'Test description',
      });

      expect(result.materialComposition).toBe('Cotton 100%');
      expect(result.qualityScore).toBe(85);
      expect(result.riskAssessment.level).toBe('low');
      expect(result.marketPotential.score).toBe(75);
    });

    it('should handle malformed AI responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'Invalid JSON response',
        }),
      });

      const result = await aiClient.analyzeProduct({
        title: 'Test',
        description: 'Test',
      });

      // Should return fallback data
      expect(result.qualityScore).toBe(50);
      expect(result.riskAssessment.level).toBe('medium');
    });
  });

  describe('healthCheck', () => {
    it('should return true when AI service is healthy', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: 'OK' }),
      });

      const result = await aiClient.healthCheck();
      expect(result).toBe(true);
    });

    it('should return false when AI service is unhealthy', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Service unavailable'));

      const result = await aiClient.healthCheck();
      expect(result).toBe(false);
    });
  });

  describe('cache management', () => {
    it('should clear cache on request', async () => {
      const mockResponse = {
        response: JSON.stringify({ title: 'Test', description: 'Test' }),
        eval_count: 50,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const request = { title: 'Test', description: 'Test' };

      await aiClient.rewriteListing(request);
      aiClient.clearCache();

      const result = await aiClient.rewriteListing(request);
      expect(result.cached).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(2); // Called again after clear
    });
  });
});
