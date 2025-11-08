import { GeminiService } from './geminiService.js';

export class AnalysisOrchestrator {
  constructor(geminiService, config = {}) {
    this.geminiService = geminiService;
    this.config = {
      enabledAnalyzers: [
        'security',
        'codeQuality',
        'performance',
        'maintainability',
        'testing',
        'documentation'
      ],
      timeout: 45000,
      maxConcurrency: 1,
      includeSuggestions: true,
      ...config
    };
  }

  async analyzeCode(context) {
    const { filePath, content, language, framework, projectStructure, dependencies } = context;

    try {
      // Use Gemini to perform comprehensive analysis
      const analysisResult = await this.geminiService.analyzeCode(content, language, {
        filePath,
        framework,
        projectStructure,
        dependencies
      });

      // Structure the response to match frontend expectations
      const results = [
        {
          type: 'security',
          title: 'Security Analysis',
          score: this.calculateSecurityScore(analysisResult.security),
          issues: analysisResult.security.issues.length,
          suggestions: analysisResult.security.issues.length,
          severity: analysisResult.security.severity,
          details: analysisResult.security.issues
        },
        {
          type: 'codeQuality',
          title: 'Code Quality',
          score: analysisResult.quality.score * 10, // Convert to 0-100 scale
          issues: analysisResult.quality.issues.length,
          suggestions: analysisResult.quality.issues.length,
          severity: 'medium',
          details: analysisResult.quality.issues
        },
        {
          type: 'performance',
          title: 'Performance',
          score: 75, // Default score
          issues: 0,
          suggestions: analysisResult.performance.suggestions.length,
          severity: 'low',
          details: analysisResult.performance.suggestions
        },
        {
          type: 'maintainability',
          title: 'Maintainability',
          score: analysisResult.maintainability.score * 10,
          issues: analysisResult.maintainability.improvements.length,
          suggestions: analysisResult.maintainability.improvements.length,
          severity: 'low',
          details: analysisResult.maintainability.improvements
        },
        {
          type: 'testing',
          title: 'Testing',
          score: 70, // Default score
          issues: 0,
          suggestions: 2,
          severity: 'medium',
          details: ['Consider adding unit tests', 'Add integration tests for critical paths']
        },
        {
          type: 'documentation',
          title: 'Documentation',
          score: 65, // Default score
          issues: 0,
          suggestions: 1,
          severity: 'low',
          details: ['Add JSDoc comments for public functions']
        }
      ];

      // Calculate overall summary
      const totalIssues = results.reduce((sum, r) => sum + r.issues, 0);
      const totalSuggestions = results.reduce((sum, r) => sum + r.suggestions, 0);
      const overallScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);

      const summary = {
        overallScore,
        totalIssues,
        totalSuggestions,
        analysisTime: Date.now() - Date.now(), // Placeholder
        overallSummary: this.generateOverallSummary(results)
      };

      return {
        results,
        errors: [],
        summary
      };

    } catch (error) {
      console.error('Analysis orchestrator error:', error);

      return {
        results: [],
        errors: [{
          type: 'analysis_error',
          message: error.message,
          severity: 'high'
        }],
        summary: {
          overallScore: 0,
          totalIssues: 1,
          totalSuggestions: 0,
          analysisTime: 0,
          overallSummary: 'Analysis failed due to an error'
        }
      };
    }
  }

  calculateSecurityScore(securityResult) {
    if (securityResult.issues.length === 0) return 100;
    if (securityResult.severity === 'high') return 30;
    if (securityResult.severity === 'medium') return 60;
    return 80;
  }

  generateOverallSummary(results) {
    const highIssues = results.filter(r => r.severity === 'high' && r.issues > 0).length;
    const mediumIssues = results.filter(r => r.severity === 'medium' && r.issues > 0).length;

    if (highIssues > 0) {
      return 'Critical issues found that need immediate attention';
    } else if (mediumIssues > 0) {
      return 'Some issues found that should be addressed';
    } else {
      return 'Code analysis completed successfully with minor suggestions';
    }
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
}