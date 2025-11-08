import { AIReviewResponse } from './useAIReview';

export interface AnalysisSession {
  id: string;
  timestamp: Date;
  filePath: string;
  fileName: string;
  summary: string;
  suggestionsCount: number;
  issuesCount: number;
  score: number;
  fullResults: AIReviewResponse;
}

const STORAGE_KEY = 'analysis_history_v2'; // Versioned for future migrations
const MAX_HISTORY_ITEMS = 50;
const BACKUP_KEY = 'analysis_history_backup';

class AnalysisHistoryManager {
  private sessions: AnalysisSession[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      let stored = localStorage.getItem(STORAGE_KEY);

      // Try backup if main storage fails
      if (!stored) {
        stored = localStorage.getItem(BACKUP_KEY);
        if (stored) {
          console.log('🔄 Loading from backup due to missing main data');
        }
      }

      if (stored) {
        const parsed = JSON.parse(stored);

        // Validate data structure
        if (Array.isArray(parsed)) {
          // Convert timestamp strings back to Date objects and validate
          this.sessions = parsed
            .filter((session: any) => {
              // Basic validation
              return session &&
                     typeof session.id === 'string' &&
                     typeof session.filePath === 'string' &&
                     session.timestamp;
            })
            .map((session: any) => ({
              ...session,
              timestamp: new Date(session.timestamp),
              // Add version if missing (for migration)
              version: session.version || '1.0'
            }))
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()) // Sort by timestamp desc
            .slice(0, MAX_HISTORY_ITEMS); // Limit to max items
        } else {
          console.warn('Invalid history data structure, starting fresh');
          this.sessions = [];
        }
      }
    } catch (error) {
      console.error('Failed to load analysis history:', error);

      // Try to recover from backup
      try {
        const backup = localStorage.getItem(BACKUP_KEY);
        if (backup) {
          console.log('🔄 Attempting recovery from backup');
          this.sessions = JSON.parse(backup)
            .slice(0, MAX_HISTORY_ITEMS)
            .map((session: any) => ({
              ...session,
              timestamp: new Date(session.timestamp)
            }));
        } else {
          this.sessions = [];
        }
      } catch (recoveryError) {
        console.error('Failed to recover from backup:', recoveryError);
        this.sessions = [];
      }
    }
  }

  private saveToStorage(): void {
    try {
      const serialized = JSON.stringify(this.sessions);

      // Create backup before saving
      const existing = localStorage.getItem(STORAGE_KEY);
      if (existing) {
        localStorage.setItem(BACKUP_KEY, existing);
      }

      // Save new data
      localStorage.setItem(STORAGE_KEY, serialized);

      // Clear backup on successful save
      localStorage.removeItem(BACKUP_KEY);

    } catch (error) {
      console.error('Failed to save analysis history:', error);

      // Attempt recovery from backup
      try {
        const backup = localStorage.getItem(BACKUP_KEY);
        if (backup) {
          console.log('🔄 Restoring from backup due to save failure');
          localStorage.setItem(STORAGE_KEY, backup);
          // Re-parse backup data
          this.sessions = JSON.parse(backup).map((session: any) => ({
            ...session,
            timestamp: new Date(session.timestamp)
          }));
        }
      } catch (recoveryError) {
        console.error('Failed to recover from backup:', recoveryError);
      }
    }
  }

  saveAnalysis(filePath: string, results: AIReviewResponse): void {
    try {
      const session: AnalysisSession = {
        id: this.generateUniqueId(),
        timestamp: new Date(),
        filePath,
        fileName: this.extractFileName(filePath),
        summary: results.summary,
        suggestionsCount: results.codeSuggestions?.length || 0,
        issuesCount: results.changesSummary?.length || 0,
        score: this.calculateOverallScore(results),
        fullResults: results,
        version: '2.0' // Current version
      };

      // Validate session data before saving
      if (!this.validateSession(session)) {
        console.error('Invalid session data, skipping save');
        return;
      }

      this.sessions.unshift(session); // Add to beginning

      // Keep only the most recent items
      if (this.sessions.length > MAX_HISTORY_ITEMS) {
        this.sessions = this.sessions.slice(0, MAX_HISTORY_ITEMS);
      }

      this.saveToStorage();

    } catch (error) {
      console.error('Failed to save analysis session:', error);
      // Don't throw - we don't want to break the analysis flow
    }
  }

  private generateUniqueId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractFileName(filePath: string): string {
    return filePath.split('/').pop() || filePath;
  }

  private validateSession(session: AnalysisSession): boolean {
    return !!(
      session.id &&
      session.filePath &&
      session.fileName &&
      typeof session.score === 'number' &&
      session.timestamp instanceof Date &&
      !isNaN(session.timestamp.getTime())
    );
  }

  getAllSessions(): AnalysisSession[] {
    return [...this.sessions];
  }

  getSessionById(id: string): AnalysisSession | null {
    return this.sessions.find(session => session.id === id) || null;
  }

  deleteSession(id: string): boolean {
    const index = this.sessions.findIndex(session => session.id === id);
    if (index !== -1) {
      this.sessions.splice(index, 1);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  clearAllHistory(): void {
    this.sessions = [];
    this.saveToStorage();
  }

  private calculateOverallScore(results: AIReviewResponse): number {
    // Calculate a simple overall score based on suggestions and issues
    const totalSuggestions = results.codeSuggestions.length;
    const totalIssues = results.changesSummary.length;

    // Base score of 100, reduce based on issues and suggestions
    let score = 100;
    score -= totalIssues * 5; // 5 points per issue
    score -= totalSuggestions * 2; // 2 points per suggestion

    return Math.max(0, Math.min(100, score));
  }

  searchSessions(query: string): AnalysisSession[] {
    const lowercaseQuery = query.toLowerCase();
    return this.sessions.filter(session =>
      session.fileName.toLowerCase().includes(lowercaseQuery) ||
      session.summary.toLowerCase().includes(lowercaseQuery) ||
      session.filePath.toLowerCase().includes(lowercaseQuery)
    );
  }

  getSessionsByFile(filePath: string): AnalysisSession[] {
    return this.sessions.filter(session => session.filePath === filePath);
  }

  getRecentSessions(limit: number = 10): AnalysisSession[] {
    return this.sessions.slice(0, limit);
  }
}

// Export singleton instance
export const analysisHistory = new AnalysisHistoryManager();