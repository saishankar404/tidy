import { AIReviewResponse } from './useAIReview';
import { AnalysisAPIClient } from './api/client';

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
  private apiClient: AnalysisAPIClient;
  private userId: string;
  private isOnline: boolean = true;

  constructor(userId: string) {
    this.userId = userId;
    this.apiClient = new AnalysisAPIClient();
    this.loadFromStorage();
    this.loadFromBackend();
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
            }))
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, MAX_HISTORY_ITEMS);
        }
      }
    } catch (error) {
      console.error('Failed to load analysis history from storage:', error);
      this.sessions = [];
    }
  }

  private async loadFromBackend(): Promise<void> {
    if (!this.isOnline) return;

    try {
      const response = await this.apiClient.getAnalysisHistory(this.userId, MAX_HISTORY_ITEMS);
      if (response && response.sessions) {
        // Merge with local data, preferring backend data
        const backendSessions = response.sessions.map((session: any) => ({
          ...session,
          timestamp: new Date(session.timestamp),
        }));

        // Combine and deduplicate by ID
        const combined = [...backendSessions];
        this.sessions.forEach(localSession => {
          if (!combined.find(s => s.id === localSession.id)) {
            combined.push(localSession);
          }
        });

        this.sessions = combined
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, MAX_HISTORY_ITEMS);

        // Update localStorage with merged data
        this.saveToStorage();
      }
    } catch (error) {
      console.warn('Failed to load analysis history from backend:', error);
      this.isOnline = false;
    }
  }

  private saveToStorage(): void {
    try {
      const serialized = JSON.stringify(this.sessions);
      localStorage.setItem(STORAGE_KEY, serialized);

      // Create backup
      localStorage.setItem(BACKUP_KEY, serialized);
    } catch (error) {
      console.error('Failed to save analysis history to storage:', error);
    }
  }

  async addSession(session: Omit<AnalysisSession, 'id' | 'fileName'>): Promise<void> {
    const newSession: AnalysisSession = {
      ...session,
      id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fileName: session.filePath.split('/').pop() || 'file',
    };

    // Add to local storage immediately
    this.sessions.unshift(newSession);
    this.sessions = this.sessions.slice(0, MAX_HISTORY_ITEMS);
    this.saveToStorage();

    // Try to sync with backend
    if (this.isOnline) {
      try {
        // Note: The backend API expects the session to be saved during analysis
        // So we don't need to call it again here
        console.log('Analysis session saved locally and will sync with backend');
      } catch (error) {
        console.warn('Failed to sync analysis session with backend:', error);
      }
    }
  }

  getAllSessions(): AnalysisSession[] {
    return [...this.sessions];
  }

  getSessionById(id: string): AnalysisSession | undefined {
    return this.sessions.find(session => session.id === id);
  }

  async deleteSession(id: string): Promise<boolean> {
    const index = this.sessions.findIndex(session => session.id === id);
    if (index === -1) return false;

    this.sessions.splice(index, 1);
    this.saveToStorage();

    // Try to delete from backend
    if (this.isOnline) {
      try {
        // Note: Backend deletion not fully implemented yet
        console.log('Session deleted locally');
      } catch (error) {
        console.warn('Failed to delete session from backend:', error);
      }
    }

    return true;
  }

  async clearAllHistory(): Promise<void> {
    this.sessions = [];
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(BACKUP_KEY);

    // Try to clear backend history
    if (this.isOnline) {
      try {
        // Note: Backend bulk deletion not fully implemented yet
        console.log('History cleared locally');
      } catch (error) {
        console.warn('Failed to clear history from backend:', error);
      }
    }
  }

  searchSessions(query: string): AnalysisSession[] {
    if (!query.trim()) return this.getAllSessions();

    const lowerQuery = query.toLowerCase();
    return this.sessions.filter(session =>
      session.fileName.toLowerCase().includes(lowerQuery) ||
      session.filePath.toLowerCase().includes(lowerQuery) ||
      session.summary.toLowerCase().includes(lowerQuery)
    );
  }

  setOnlineStatus(online: boolean): void {
    this.isOnline = online;
    if (online) {
      // Try to sync when coming back online
      this.loadFromBackend();
    }
  }
}

// Export singleton instance - will be initialized with user ID
let historyManager: AnalysisHistoryManager | null = null;

export const analysisHistory = {
  initialize: (userId: string) => {
    if (!historyManager) {
      historyManager = new AnalysisHistoryManager(userId);
    }
    return historyManager;
  },

  getInstance: () => {
    if (!historyManager) {
      throw new Error('Analysis history not initialized. Call initialize() first.');
    }
    return historyManager;
  }
};

// For backward compatibility, export methods that delegate to the instance
export const getAnalysisHistory = () => analysisHistory.getInstance();
export const addAnalysisSession = (session: Omit<AnalysisSession, 'id' | 'fileName'>) =>
  analysisHistory.getInstance().addSession(session);
export const getAllAnalysisSessions = () => analysisHistory.getInstance().getAllSessions();
export const deleteAnalysisSession = (id: string) => analysisHistory.getInstance().deleteSession(id);
export const clearAnalysisHistory = () => analysisHistory.getInstance().clearAllHistory();
export const searchAnalysisSessions = (query: string) => analysisHistory.getInstance().searchSessions(query);