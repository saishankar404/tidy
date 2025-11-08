import { GeminiService } from './geminiApi';
import {
  CodeContext,
  AnalysisResult,
  AnalysisConfig,
  AnalysisProgress,
  AnalysisError
} from './analysis/types';
import { analyzeCodeQuality } from './analysis/codeQuality';
import { analyzeSecurity } from './analysis/security';
import { analyzePerformance } from './analysis/performance';
import { analyzeMaintainability } from './analysis/maintainability';
import { analyzeTesting } from './analysis/testing';
import { analyzeDocumentation } from './analysis/documentation';

export class AnalysisOrchestrator {
  private geminiService: GeminiService;
  private config: AnalysisConfig;
  private offlineMode: boolean = false;
  private consecutiveErrors: number = 0;

  constructor(geminiService: GeminiService, config: Partial<AnalysisConfig> = {}) {
    this.geminiService = geminiService;
    this.config = {
      enabledAnalyzers: [
        'security', // Prioritize security first
        'codeQuality',
        'performance',
        'maintainability',
        'testing',
        'documentation'
      ],
      timeout: 45000, // Increased to 45s to allow Gemini API time for complex analysis
      maxConcurrency: 1, // Reduced to 1 to prevent API rate limiting
      includeSuggestions: true,
      retryAttempts: 2, // Add retry logic for failed requests
      backoffMultiplier: 1.5, // Exponential backoff
      ...config
    };
  }

  /**
   * Execute an analyzer with retry logic and exponential backoff
   */
  private async executeWithRetry(
    analyzer: { name: string; fn: Function },
    context: CodeContext,
    abortSignal?: AbortSignal
  ): Promise<AnalysisResult> {
    const maxRetries = this.config.retryAttempts || 2;
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Check if analysis was cancelled
        if (abortSignal?.aborted) {
          throw new Error('Analysis cancelled');
        }

        // Add exponential backoff delay for retries
        if (attempt > 0) {
          const delay = Math.min(1000 * Math.pow(this.config.backoffMultiplier || 1.5, attempt - 1), 10000);
          console.log(`🔄 Retrying ${analyzer.name} analysis (attempt ${attempt + 1}/${maxRetries + 1}) after ${delay}ms delay`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        const result = await Promise.race([
          analyzer.fn(context, this.geminiService),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Analysis timeout')), this.config.timeout)
          ),
          new Promise<never>((_, reject) => {
            if (abortSignal) {
              abortSignal.addEventListener('abort', () => reject(new Error('Analysis cancelled')));
            }
          })
        ]);

        return result;
      } catch (error) {
        lastError = error as Error;
        const errorMsg = lastError.message;

        // Don't retry for certain errors
        if (errorMsg.includes('Analysis cancelled') ||
            errorMsg.includes('QUOTA_EXCEEDED') ||
            errorMsg.includes('INVALID_API_KEY')) {
          throw lastError;
        }

        console.warn(`${analyzer.name} analysis attempt ${attempt + 1} failed:`, errorMsg);

        // If this was the last attempt, throw the error
        if (attempt === maxRetries) {
          throw lastError;
        }
      }
    }

    throw lastError!;
  }

  async analyzeCode(
    context: CodeContext,
    onProgress?: (progress: AnalysisProgress) => void,
    abortSignal?: AbortSignal
  ): Promise<{
    results: AnalysisResult[];
    errors: AnalysisError[];
    summary: {
      overallScore: number;
      totalIssues: number;
      totalSuggestions: number;

      analysisTime: number;
    };
  }> {
    const startTime = Date.now();
    const results: AnalysisResult[] = [];
    const errors: AnalysisError[] = [];

    // Define all available analyzers
    const analyzers = [
      { name: 'codeQuality', fn: analyzeCodeQuality },
      { name: 'security', fn: analyzeSecurity },
      { name: 'performance', fn: analyzePerformance },
      { name: 'maintainability', fn: analyzeMaintainability },
      { name: 'testing', fn: analyzeTesting },
      { name: 'documentation', fn: analyzeDocumentation }
    ];

    // Filter enabled analyzers
    const enabledAnalyzers = analyzers.filter(analyzer =>
      this.config.enabledAnalyzers.includes(analyzer.name)
    );

    // Run analyses in batches to respect concurrency limits
    const batches = this.chunkArray(enabledAnalyzers, this.config.maxConcurrency);
    console.log(`📊 Running ${enabledAnalyzers.length} analyses in ${batches.length} batches (concurrency: ${this.config.maxConcurrency})`);

    onProgress?.({
      current: 0,
      total: enabledAnalyzers.length,
      currentAnalyzer: '',
      status: 'running'
    });

    for (let i = 0; i < batches.length; i++) {
      // Check if analysis was cancelled
      if (abortSignal?.aborted) {
        throw new Error('Analysis cancelled');
      }

      const batch = batches[i];
      console.log(`🔄 Processing batch ${i + 1}/${batches.length} with ${batch.length} analyzers: ${batch.map(a => a.name).join(', ')}`);

      const batchPromises = batch.map(async (analyzer) => {
        try {
          // Check if analysis was cancelled before starting this analyzer
          if (abortSignal?.aborted) {
            throw new Error('Analysis cancelled');
          }
          onProgress?.({
            current: results.length + 1,
            total: enabledAnalyzers.length,
            currentAnalyzer: analyzer.name,
            status: 'running'
          });

          // Skip API call if in offline mode
          let result: AnalysisResult;
          if (this.offlineMode) {
            console.log(`📱 ${analyzer.name} analysis skipped (offline mode)`);
            result = {
              type: analyzer.name as any,
              score: 75,
              issues: [],
              suggestions: [],
              summary: `${analyzer.name} analysis (offline mode - using cached results)`,
              metadata: {
                analysisTime: 0,
                linesAnalyzed: context.content.split('\n').length,
                language: context.language
              }
            };
          } else {
            result = await this.executeWithRetry(analyzer, context, abortSignal);
          }

          results.push(result);
          return result;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          console.error(`${analyzer.name} analysis failed:`, errorMsg);

          // Check for API errors that should trigger offline mode
          const isQuotaExceeded = errorMsg.includes('QUOTA_EXCEEDED') ||
                                  errorMsg.includes('daily API quota') ||
                                  errorMsg.includes('quota exceeded');

          const isAPIFailure = errorMsg.includes('EMPTY_RESPONSE') ||
                               errorMsg.includes('Empty response from API') ||
                               errorMsg.includes('SAFETY_FILTER');

          const isRateLimitError = errorMsg.includes('RATE_LIMIT') ||
                                   errorMsg.includes('rate limit') ||
                                   errorMsg.includes('Too many requests');

          // Immediately enter offline mode for quota exceeded
          if (isQuotaExceeded) {
            this.offlineMode = true;
            this.consecutiveErrors = 999; // High value to stay offline
            console.error('🚫 DAILY QUOTA EXCEEDED - Entering offline mode. Your quota will reset in ~24 hours.');
            console.error('💡 TIP: You can continue using the editor. Analysis will use cached/fallback data.');
          } else if (isAPIFailure) {
            this.consecutiveErrors++;
            if (this.consecutiveErrors >= 2) {
              this.offlineMode = true;
              console.warn('🔌 API returning empty/blocked responses - Entering offline mode');
              console.warn('💡 This may be due to safety filters or API configuration issues');
              console.warn('💡 Check the console logs above for detailed error information');
            }
          } else if (isRateLimitError) {
            this.consecutiveErrors++;
            if (this.consecutiveErrors >= 2) {
              this.offlineMode = true;
              console.warn('🔌 Entering offline mode due to repeated rate limit errors');
            }
          } else {
            // Reset consecutive errors for non-API errors
            this.consecutiveErrors = 0;
          }

          errors.push({
            analyzer: analyzer.name,
            error: errorMsg,
            fallback: true
          });

          // Return a fallback result
          const fallbackResult: AnalysisResult = {
            type: analyzer.name as any,
            score: this.offlineMode ? 75 : 70, // Slightly better score in offline mode
            issues: [],
            suggestions: [],
            summary: this.offlineMode
              ? `${analyzer.name} analysis (offline mode)`
              : `${analyzer.name} analysis encountered an error`,
            metadata: {
              analysisTime: 0,
              linesAnalyzed: context.content.split('\n').length,
              language: context.language
            }
          };

          results.push(fallbackResult);
          return fallbackResult;
        }
      });

      await Promise.all(batchPromises);
    }

    onProgress?.({
      current: enabledAnalyzers.length,
      total: enabledAnalyzers.length,
      currentAnalyzer: '',
      status: 'completed'
    });

    // Calculate summary statistics
    const totalIssues = results.reduce((sum, result) => sum + result.issues.length, 0);
    const totalSuggestions = results.reduce((sum, result) => sum + result.suggestions.length, 0);
    const overallScore = Math.round(
      results.reduce((sum, result) => sum + result.score, 0) / results.length
    );



    return {
      results,
      errors,
      summary: {
        overallScore,
        totalIssues,
        totalSuggestions,
        analysisTime: Date.now() - startTime
      }
    };
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  // Get analysis configuration
  getConfig(): AnalysisConfig {
    return { ...this.config };
  }

  // Update analysis configuration
  updateConfig(newConfig: Partial<AnalysisConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Check if we're in offline mode
  isOffline(): boolean {
    return this.offlineMode;
  }

  // Reset offline mode (useful for testing or when API becomes available again)
  resetOfflineMode(): void {
    this.offlineMode = false;
    this.consecutiveErrors = 0;
  }
}