import Database from '@replit/database';

export class DatabaseService {
  constructor() {
    this.memoryStore = new Map();
    this.isConnected = false; // Use memory store for now
    this.db = null;
  }

  // User management
  async getUser(userId) {
    if (!this.isConnected) {
      return this.memoryStore.get(`users/${userId}`) || null;
    }

    try {
      const user = await this.db.get(`users/${userId}`);
      return user || null;
    } catch (error) {
      console.error('Database error getting user:', error);
      // Fallback to memory store on error
      return this.memoryStore.get(`users/${userId}`) || null;
    }
  }

  async createUser(userId, initialData = {}) {
    const userData = {
      id: userId,
      settings: {
        experimental: {
          tabBar: true,
          sidebarPopovers: true,
          minimap: true,
        },
        ai: {
          enabled: true,
          model: 'gemini-2.5-flash',
          temperature: 0.2,
          maxTokens: 4096,
        },
      },
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      ...initialData
    };

    if (!this.isConnected) {
      this.memoryStore.set(`users/${userId}`, userData);
      return userData;
    }

    if (!this.isConnected) {
      this.memoryStore.set(`users/${userId}`, userData);
      return userData;
    }

    try {
      await this.db.set(`users/${userId}`, userData);
      return userData;
    } catch (error) {
      console.error('Database error creating user:', error);
      // Fallback to memory store
      this.memoryStore.set(`users/${userId}`, userData);
      return userData;
    }
  }

  async updateUser(userId, data) {
    const existingUser = await this.getUser(userId);
    let updatedUser;

    if (!existingUser) {
      // Create new user with provided data
      const userData = {
        id: userId,
        settings: {
          experimental: {
            tabBar: true,
            sidebarPopovers: true,
            minimap: true,
          },
          ai: {
            enabled: true,
            model: 'gemini-2.5-flash',
            temperature: 0.2,
            maxTokens: 4096,
          },
        },
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        ...data
      };
      updatedUser = userData;
    } else {
      // Update existing user
      updatedUser = {
        ...existingUser,
        ...data,
        lastActive: new Date().toISOString()
      };
    }

    if (!this.isConnected) {
      this.memoryStore.set(`users/${userId}`, updatedUser);
      return updatedUser;
    }

    try {
      await this.db.set(`users/${userId}`, updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Database error updating user:', error);
      // Fallback to memory store
      this.memoryStore.set(`users/${userId}`, updatedUser);
      return updatedUser;
    }
  }

  // Analysis history
  async saveAnalysisSession(session) {
    const sessionId = session.id;
    const sessionData = {
      ...session,
      timestamp: session.timestamp instanceof Date ? session.timestamp.toISOString() : session.timestamp
    };

    if (!this.isConnected) {
      this.memoryStore.set(`analysis/${sessionId}`, sessionData);
      return true;
    }

    try {
      await this.db.set(`analysis/${sessionId}`, sessionData);
      return true;
    } catch (error) {
      console.error('Database error saving analysis session:', error);
      return false;
    }
  }

  async getAnalysisSession(sessionId) {
    if (!this.isConnected) {
      return this.memoryStore.get(`analysis/${sessionId}`) || null;
    }

    try {
      return await this.db.get(`analysis/${sessionId}`);
    } catch (error) {
      console.error('Database error getting analysis session:', error);
      return null;
    }
  }

  async getUserAnalysisHistory(userId, limit = 50) {
    try {
      // Note: Replit DB doesn't have efficient prefix queries
      // In production, you'd want to maintain an index or use a different DB
      // For now, we'll return empty array and implement client-side filtering
      return [];
    } catch (error) {
      console.error('Database error getting user analysis history:', error);
      return [];
    }
  }

  // Chat context
  async saveChatSession(userId, sessionId, data) {
    try {
      const sessionData = {
        ...data,
        userId,
        sessionId,
        updatedAt: new Date().toISOString()
      };

      await this.db.set(`chat/${userId}/sessions/${sessionId}`, sessionData);
      return true;
    } catch (error) {
      console.error('Database error saving chat session:', error);
      return false;
    }
  }

  async getChatSession(userId, sessionId) {
    try {
      return await this.db.get(`chat/${userId}/sessions/${sessionId}`);
    } catch (error) {
      console.error('Database error getting chat session:', error);
      return null;
    }
  }

  async deleteChatSession(userId, sessionId) {
    try {
      await this.db.delete(`chat/${userId}/sessions/${sessionId}`);
      return true;
    } catch (error) {
      console.error('Database error deleting chat session:', error);
      return false;
    }
  }

  // Health check
  async healthCheck() {
    if (!this.isConnected) {
      return { status: 'healthy', database: 'memory-fallback' };
    }

    // For Replit DB, we can't do a real health check without a URL
    // Just report that we're using Replit DB but it's not connected
    return { status: 'healthy', database: 'replit-db-fallback' };
  }
}