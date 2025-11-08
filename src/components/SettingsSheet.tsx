import { useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettings } from "@/lib/SettingsContext";

export function SettingsSheet() {
  const { settings, updateSettings } = useSettings();
  const [open, setOpen] = useState(false);

  const handleToggle = (key: keyof typeof settings.experimental, value: boolean) => {
    updateSettings({
      experimental: {
        ...settings.experimental,
        [key]: value,
      },
    });
  };

  const handleAIToggle = (key: keyof typeof settings.ai, value: boolean | string | number) => {
    updateSettings({
      ai: {
        ...settings.ai,
        [key]: value,
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-3.5 w-3.5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>
        <div className="py-6 space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Experimental Add-ons</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="tab-bar">Multi-File Tab Bar</Label>
                  <p className="text-sm text-muted-foreground">
                    Show tabs for open files with drag-to-reorder and close buttons.
                  </p>
                </div>
                <Switch
                  id="tab-bar"
                  checked={settings.experimental.tabBar}
                  onCheckedChange={(checked) => handleToggle('tabBar', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sidebar-popovers">macOS-Style Popovers</Label>
                  <p className="text-sm text-muted-foreground">
                    Enhanced hover previews with glassmorphism and contextual info.
                  </p>
                </div>
                <Switch
                  id="sidebar-popovers"
                  checked={settings.experimental.sidebarPopovers}
                  onCheckedChange={(checked) => handleToggle('sidebarPopovers', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="minimap">Right-Side Minimap</Label>
                  <p className="text-sm text-muted-foreground">
                    Visualize file structure with color-coded regions.
                  </p>
                </div>
                <Switch
                  id="minimap"
                  checked={settings.experimental.minimap}
                  onCheckedChange={(checked) => handleToggle('minimap', checked)}
                />
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-4">AI Assistant</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="ai-enabled">Enable AI Features</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable AI-powered code completions and analysis.
                  </p>
                </div>
                <Switch
                  id="ai-enabled"
                  checked={settings.ai.enabled}
                  onCheckedChange={(checked) => handleAIToggle('enabled', checked)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-key">Gemini API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="Enter your Gemini API key"
                  value={settings.ai.apiKey}
                  onChange={(e) => handleAIToggle('apiKey', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ai-model">AI Model</Label>
                <Select
                  value={settings.ai.model}
                  onValueChange={(value) => handleAIToggle('model', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended - Fast & Smart)</SelectItem>
                     <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro (Most Advanced)</SelectItem>
                     <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash (Stable)</SelectItem>
                     <SelectItem value="gemini-pro">Gemini Pro (Legacy)</SelectItem>
                   </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="temperature">Creativity Level: {settings.ai.temperature}</Label>
                <input
                  id="temperature"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.ai.temperature}
                  onChange={(e) => handleAIToggle('temperature', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-tokens">Max Response Length: {settings.ai.maxTokens}</Label>
                <input
                  id="max-tokens"
                  type="range"
                  min="1024"
                  max="8192"
                  step="512"
                  value={settings.ai.maxTokens}
                  onChange={(e) => handleAIToggle('maxTokens', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}