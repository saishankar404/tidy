import { CodeSnippet, SnippetFilters } from './types';

const STORAGE_KEY = 'code_snippets_v1';
const MAX_SNIPPETS = 100;

class SnippetStorageManager {
  private snippets: CodeSnippet[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.snippets = parsed
            .filter((snippet: any) => this.validateSnippet(snippet))
            .map((snippet: any) => ({
              ...snippet,
              createdAt: new Date(snippet.createdAt),
              lastUsed: snippet.lastUsed ? new Date(snippet.lastUsed) : undefined,
            }))
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, MAX_SNIPPETS);
        }
      }
    } catch (error) {
      console.error('Failed to load snippets from storage:', error);
      this.snippets = [];
    }
  }

  private saveToStorage(): void {
    try {
      const serialized = JSON.stringify(this.snippets);
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch (error) {
      console.error('Failed to save snippets to storage:', error);
    }
  }

  private validateSnippet(snippet: any): boolean {
    return !!(
      snippet &&
      typeof snippet.id === 'string' &&
      typeof snippet.title === 'string' &&
      typeof snippet.code === 'string' &&
      typeof snippet.language === 'string' &&
      Array.isArray(snippet.tags) &&
      typeof snippet.category === 'string' &&
      typeof snippet.source === 'string' &&
      snippet.createdAt &&
      typeof snippet.usageCount === 'number'
    );
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  saveSnippet(snippetData: Omit<CodeSnippet, 'id' | 'createdAt' | 'usageCount'>): CodeSnippet {
    const snippet: CodeSnippet = {
      ...snippetData,
      id: this.generateId(),
      createdAt: new Date(),
      usageCount: 0,
    };

    this.snippets.unshift(snippet); // Add to beginning

    // Keep only the most recent snippets
    if (this.snippets.length > MAX_SNIPPETS) {
      this.snippets = this.snippets.slice(0, MAX_SNIPPETS);
    }

    this.saveToStorage();
    return snippet;
  }

  getSnippets(filters?: SnippetFilters): CodeSnippet[] {
    let filtered = [...this.snippets];

    if (filters) {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(snippet =>
          snippet.title.toLowerCase().includes(searchLower) ||
          snippet.description.toLowerCase().includes(searchLower) ||
          snippet.code.toLowerCase().includes(searchLower) ||
          snippet.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      if (filters.category) {
        filtered = filtered.filter(snippet => snippet.category === filters.category);
      }

      if (filters.tags && filters.tags.length > 0) {
        filtered = filtered.filter(snippet =>
          filters.tags!.some(tag => snippet.tags.includes(tag))
        );
      }

      if (filters.language) {
        filtered = filtered.filter(snippet => snippet.language === filters.language);
      }

      if (filters.source) {
        filtered = filtered.filter(snippet => snippet.source === filters.source);
      }

      // Sort
      const sortBy = filters.sortBy || 'createdAt';
      const sortOrder = filters.sortOrder || 'desc';

      filtered.sort((a, b) => {
        let aValue: any, bValue: any;

        switch (sortBy) {
          case 'title':
            aValue = a.title.toLowerCase();
            bValue = b.title.toLowerCase();
            break;
          case 'lastUsed':
            aValue = a.lastUsed?.getTime() || 0;
            bValue = b.lastUsed?.getTime() || 0;
            break;
          case 'usageCount':
            aValue = a.usageCount;
            bValue = b.usageCount;
            break;
          case 'createdAt':
          default:
            aValue = a.createdAt.getTime();
            bValue = b.createdAt.getTime();
            break;
        }

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }

    return filtered;
  }

  getSnippetById(id: string): CodeSnippet | null {
    return this.snippets.find(snippet => snippet.id === id) || null;
  }

  updateSnippet(id: string, updates: Partial<CodeSnippet>): boolean {
    const index = this.snippets.findIndex(snippet => snippet.id === id);
    if (index !== -1) {
      this.snippets[index] = { ...this.snippets[index], ...updates };
      this.saveToStorage();
      return true;
    }
    return false;
  }

  incrementUsage(id: string): boolean {
    const snippet = this.snippets.find(s => s.id === id);
    if (snippet) {
      snippet.usageCount++;
      snippet.lastUsed = new Date();
      this.saveToStorage();
      return true;
    }
    return false;
  }

  deleteSnippet(id: string): boolean {
    const index = this.snippets.findIndex(snippet => snippet.id === id);
    if (index !== -1) {
      this.snippets.splice(index, 1);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  clearAllSnippets(): void {
    this.snippets = [];
    this.saveToStorage();
  }

  getStats() {
    const total = this.snippets.length;
    const byCategory = this.snippets.reduce((acc, snippet) => {
      acc[snippet.category] = (acc[snippet.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostUsed = this.snippets
      .filter(s => s.usageCount > 0)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5);

    const recent = this.snippets.slice(0, 5);

    return {
      total,
      byCategory,
      mostUsed,
      recent,
    };
  }

  exportSnippets(): string {
    return JSON.stringify(this.snippets, null, 2);
  }

  importSnippets(jsonData: string): { success: number; failed: number } {
    try {
      const imported = JSON.parse(jsonData);
      if (!Array.isArray(imported)) {
        throw new Error('Invalid format');
      }

      let success = 0;
      let failed = 0;

      for (const item of imported) {
        if (this.validateSnippet(item)) {
          // Check if snippet with this ID already exists
          const existingIndex = this.snippets.findIndex(s => s.id === item.id);
          if (existingIndex !== -1) {
            // Update existing
            this.snippets[existingIndex] = {
              ...item,
              createdAt: new Date(item.createdAt),
              lastUsed: item.lastUsed ? new Date(item.lastUsed) : undefined,
            };
          } else {
            // Add new
            this.snippets.push({
              ...item,
              createdAt: new Date(item.createdAt),
              lastUsed: item.lastUsed ? new Date(item.lastUsed) : undefined,
            });
          }
          success++;
        } else {
          failed++;
        }
      }

      // Sort and limit
      this.snippets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      this.snippets = this.snippets.slice(0, MAX_SNIPPETS);
      this.saveToStorage();

      return { success, failed };
    } catch (error) {
      console.error('Failed to import snippets:', error);
      return { success: 0, failed: 1 };
    }
  }
}

// Export singleton instance
export const snippetStorage = new SnippetStorageManager();