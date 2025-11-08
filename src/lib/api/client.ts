import { AnalyzeRequest, AnalyzeResponse, ChatRequest, ChatResponse, HealthResponse } from './types';

export class AnalysisAPIClient {
  private baseUrl: string;

  constructor(baseUrl = import.meta.env.VITE_API_BASE_URL || '/api') {
    this.baseUrl = baseUrl;
  }

  async analyzeCode(request: AnalyzeRequest): Promise<AnalyzeResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Analysis failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Client - Analysis error:', error);
      throw error;
    }
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Chat failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Client - Chat error:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<HealthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/../health`);
      return await response.json();
    } catch (error) {
      console.error('API Client - Health check error:', error);
      return {
        status: 'unhealthy',
        version: 'unknown',
        timestamp: new Date().toISOString()
      };
    }
  }

  // User management methods
  async getUserSettings(userId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/user/${userId}`);
      if (!response.ok) {
        throw new Error(`Failed to get user settings: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API Client - Get user settings error:', error);
      throw error;
    }
  }

  async updateUserSettings(userId: string, settings: any) {
    try {
      const response = await fetch(`${this.baseUrl}/user/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      });

      if (!response.ok) {
        throw new Error(`Failed to update user settings: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Client - Update user settings error:', error);
      throw error;
    }
  }

  // Analysis history methods
  async getAnalysisHistory(userId: string, limit = 50) {
    try {
      const response = await fetch(`${this.baseUrl}/analysis-history/user/${userId}?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`Failed to get analysis history: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API Client - Get analysis history error:', error);
      throw error;
    }
  }

  async getAnalysisSession(sessionId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/analysis-history/${sessionId}`);
      if (!response.ok) {
        throw new Error(`Failed to get analysis session: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API Client - Get analysis session error:', error);
      throw error;
    }
  }
}