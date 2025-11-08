import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AnalysisAPIClient } from './api/client';
import { analysisHistory } from './analysisHistory';

interface Settings {
  experimental: {
    tabBar: boolean;
    sidebarPopovers: boolean;
    minimap: boolean;
  };
  ai: {
    enabled: boolean;
    apiKey: string;
    model: 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gemini-2.0-flash' | 'gemini-pro';
    temperature: number;
    maxTokens: number;
  };
}

const defaultSettings: Settings = {
  experimental: {
    tabBar: true,
    sidebarPopovers: true,
    minimap: true,
  },
  ai: {
    enabled: true,
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
    model: 'gemini-2.5-flash',
    temperature: 0.2, // Lower for faster, more deterministic completions
    maxTokens: 4096, // Higher limit for analysis tasks (can be adjusted per task)
  },
};

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  userId: string;
  isLoading: boolean;
  error: string | null;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Generate a user ID for anonymous users
const generateUserId = () => {
  const stored = localStorage.getItem('user_id');
  if (stored) return stored;

  const newId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('user_id', newId);
  return newId;
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [userId] = useState<string>(generateUserId);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const apiClient = new AnalysisAPIClient();

  // Load settings from backend on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Initialize analysis history with user ID
        analysisHistory.initialize(userId);

        // Try to load from backend first
        const userData = await apiClient.getUserSettings(userId);
        if (userData && userData.settings) {
          setSettings({ ...defaultSettings, ...userData.settings });
        }
      } catch (backendError) {
        console.warn('Failed to load settings from backend, using localStorage:', backendError);

        // Initialize analysis history even if backend fails
        analysisHistory.initialize(userId);

        // Fallback to localStorage
        try {
          const stored = localStorage.getItem('editor-settings');
          if (stored) {
            setSettings({ ...defaultSettings, ...JSON.parse(stored) });
          }
        } catch (localError) {
          console.warn('Failed to load settings from localStorage:', localError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [userId]);

  const updateSettings = async (newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    // Update localStorage immediately for responsiveness
    localStorage.setItem('editor-settings', JSON.stringify(updated));

    // Try to sync with backend
    try {
      await apiClient.updateUserSettings(userId, updated);
      setError(null);
    } catch (backendError) {
      console.warn('Failed to sync settings with backend:', backendError);
      setError('Settings saved locally, but failed to sync with server');
    }
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      updateSettings,
      userId,
      isLoading,
      error
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}