import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { HelpCircle, Keyboard } from "lucide-react";

interface Shortcut {
  key: string;
  description: string;
  category: string;
}

const SHORTCUTS: Shortcut[] = [
  { key: "Ctrl+S", description: "Save current file", category: "File" },
  { key: "Ctrl+K", description: "Toggle code reviewer", category: "AI" },
  { key: "Ctrl+/", description: "Toggle comment", category: "Editor" },
  { key: "Ctrl+D", description: "Duplicate line", category: "Editor" },
  { key: "Alt+↑/↓", description: "Move line up/down", category: "Editor" },
  { key: "Ctrl+F", description: "Find in file", category: "Search" },
  { key: "Ctrl+H", description: "Replace in file", category: "Search" },
  { key: "Ctrl+P", description: "Command palette", category: "Navigation" },
  { key: "Ctrl+B", description: "Toggle sidebar", category: "Navigation" },
];



export function KeyboardShortcutsHelp() {
  const categories = Array.from(new Set(SHORTCUTS.map(s => s.category)));

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <HelpCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {categories.map(category => (
            <div key={category}>
              <h3 className="font-medium text-sm mb-3 text-muted-foreground uppercase tracking-wide">
                {category}
              </h3>
              <div className="space-y-2">
                {SHORTCUTS.filter(s => s.category === category).map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between py-1">
                    <span className="text-sm">{shortcut.description}</span>
                    <Kbd>{shortcut.key}</Kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Pro tip:</strong> Most shortcuts work with <Kbd>Cmd</Kbd> on Mac instead of <Kbd>Ctrl</Kbd>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}