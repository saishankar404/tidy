import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    const stored = localStorage.getItem('editor-settings');
    if (stored) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      } catch (e) {
        console.warn('Failed to parse settings from localStorage');
      }
    }
  }, []);

  const updateSettings = (newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('editor-settings', JSON.stringify(updated));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
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