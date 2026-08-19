/**
 * AI Client Abstraction Layer
 *
 * Provides a unified interface for interacting with AI models.
 * Supports self-hosted models (Ollama/vLLM) with cloud API fallback.
 *
 * @agent:forge Set up self-hosted AI infrastructure (Ollama or vLLM)
 * @agent:oracle Add tests for AI client with mock responses
 */

export interface AIModelConfig {
  provider: 'ollama' | 'vllm' | 'cloud';
  baseUrl?: string;
  model: string;
  apiKey?: string;
  timeout?: number;
}

export interface AIResponse {
  content: string;
  model: string;
  tokensUsed?: number;
  cached: boolean;
}

export interface RewriteRequest {
  title: string;
  description: string;
  marketplace?: string;
  style?: 'emotional' | 'luxury' | 'budget' | 'premium' | 'neutral';
  keywords?: string[];
}

export interface AnalysisRequest {
  title: string;
  description: string;
  attributes?: Record<string, unknown>;
  images?: string[];
}

export interface AnalysisResponse {
  materialComposition: string;
  qualityScore: number;
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    reasons: string[];
  };
  marketPotential: {
    score: number;
    category: string;
    seasonalFactors: string[];
  };
}

/**
 * AI Client for self-hosted and cloud models
 */
export class AIClient {
  private config: AIModelConfig;
  private cache: Map<string, { response: AIResponse; timestamp: number }> = new Map();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes for L1 cache

  constructor(config: AIModelConfig) {
    this.config = config;
  }

  /**
   * Generate a listing rewrite using AI
   */
  async rewriteListing(request: RewriteRequest): Promise<AIResponse> {
    const cacheKey = this.generateCacheKey('rewrite', request);
    const cached = this.getFromCache(cacheKey);
    if (cached) return { ...cached, cached: true };

    const prompt = this.buildRewritePrompt(request);
    const response = await this.callAI(prompt);

    this.setCache(cacheKey, response);
    return { ...response, cached: false };
  }

  /**
   * Analyze product for materials, quality, and market potential
   */
  async analyzeProduct(request: AnalysisRequest): Promise<AnalysisResponse> {
    const prompt = this.buildAnalysisPrompt(request);
    const response = await this.callAI(prompt);

    // Parse structured response
    return this.parseAnalysisResponse(response.content);
  }

  /**
   * Health check for AI service
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.callAI('Respond with "OK" only.');
      return true;
    } catch {
      return false;
    }
  }

  private async callAI(prompt: string): Promise<AIResponse> {
    const { provider, baseUrl, model, apiKey, timeout = 30000 } = this.config;

    if (provider === 'ollama') {
      return this.callOllama(baseUrl || 'http://localhost:11434', model, prompt, timeout);
    } else if (provider === 'vllm') {
      return this.callVLLM(baseUrl || 'http://localhost:8000', model, prompt, timeout);
    } else {
      return this.callCloudAPI(model, apiKey!, prompt, timeout);
    }
  }

  private async callOllama(baseUrl: string, model: string, prompt: string, timeout: number): Promise<AIResponse> {
    try {
      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
        }),
        signal: AbortSignal.timeout(timeout),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        content: data.response,
        model,
        tokensUsed: data.eval_count,
        cached: false,
      };
    } catch (err) {
      if (err instanceof Error && err.message.includes('Ollama API error')) {
        throw err;
      }
      throw new Error(`Ollama API error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private async callVLLM(baseUrl: string, model: string, prompt: string, timeout: number): Promise<AIResponse> {
    try {
      const response = await fetch(`${baseUrl}/v1/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          max_tokens: 1000,
        }),
        signal: AbortSignal.timeout(timeout),
      });

      if (!response.ok) {
        throw new Error(`vLLM API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        content: data.choices[0].text,
        model,
        tokensUsed: data.usage?.total_tokens,
        cached: false,
      };
    } catch (err) {
      if (err instanceof Error && err.message.includes('vLLM API error')) {
        throw err;
      }
      throw new Error(`vLLM API error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private async callCloudAPI(_model: string, _apiKey: string, _prompt: string, _timeout: number): Promise<AIResponse> {
    // Fallback to cloud API (e.g., OpenAI, Anthropic)
    // @agent:forge Implement cloud API integration as fallback
    throw new Error('Cloud API fallback not yet implemented');
  }

  private buildRewritePrompt(request: RewriteRequest): string {
    const { title, description, marketplace, style = 'neutral', keywords } = request;

    let prompt = `Rewrite the following product listing for ${marketplace || 'general marketplace'}.\n\n`;
    prompt += `Original Title: ${title}\n`;
    prompt += `Original Description: ${description}\n\n`;

    if (keywords && keywords.length > 0) {
      prompt += `Include these SEO keywords: ${keywords.join(', ')}\n`;
    }

    prompt += `Style: ${style}\n\n`;
    prompt += `Provide:\n1. Rewritten title (optimized for SEO)\n2. Rewritten description (engaging, clear)\n\n`;
    prompt += `Format as JSON:\n{\n  "title": "...",\n  "description": "..."\n}`;

    return prompt;
  }

  private buildAnalysisPrompt(request: AnalysisRequest): string {
    const { title, description, attributes, images } = request;

    let prompt = `Analyze this product for materials, quality, and market potential.\n\n`;
    prompt += `Title: ${title}\n`;
    prompt += `Description: ${description}\n`;

    if (attributes) {
      prompt += `Attributes: ${JSON.stringify(attributes)}\n`;
    }

    if (images && images.length > 0) {
      prompt += `Images: ${images.length} images available\n`;
    }

    prompt += `\nProvide analysis as JSON:\n`;
    prompt += `{\n`;
    prompt += `  "materialComposition": "...",\n`;
    prompt += `  "qualityScore": 0-100,\n`;
    prompt += `  "riskAssessment": {\n`;
    prompt += `    "level": "low|medium|high",\n`;
    prompt += `    "reasons": ["..."]\n`;
    prompt += `  },\n`;
    prompt += `  "marketPotential": {\n`;
    prompt += `    "score": 0-100,\n`;
    prompt += `    "category": "...",\n`;
    prompt += `    "seasonalFactors": ["..."]\n`;
    prompt += `  }\n`;
    prompt += `}`;

    return prompt;
  }

  private parseAnalysisResponse(content: string): AnalysisResponse {
    try {
      return JSON.parse(content);
    } catch {
      // Fallback parsing if AI doesn't return valid JSON
      return {
        materialComposition: 'Unknown',
        qualityScore: 50,
        riskAssessment: { level: 'medium', reasons: ['Unable to parse AI response'] },
        marketPotential: { score: 50, category: 'Unknown', seasonalFactors: [] },
      };
    }
  }

  private generateCacheKey(operation: string, request: unknown): string {
    return `${operation}:${JSON.stringify(request)}`;
  }

  private getFromCache(key: string): AIResponse | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.response;
  }

  private setCache(key: string, response: AIResponse): void {
    this.cache.set(key, { response, timestamp: Date.now() });
  }

  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Singleton AI client instance
 * @agent:forge Configure based on environment variables
 */
let aiClientInstance: AIClient | null = null;

export function getAIClient(): AIClient {
  if (!aiClientInstance) {
    const provider = (process.env.AI_PROVIDER as 'ollama' | 'vllm' | 'cloud') || 'ollama';
    const baseUrl = process.env.AI_BASE_URL;
    const model = process.env.AI_MODEL || 'gemma:2b';
    const apiKey = process.env.AI_API_KEY;

    aiClientInstance = new AIClient({
      provider,
      baseUrl,
      model,
      apiKey,
      timeout: 30000,
    });
  }

  return aiClientInstance;
}
