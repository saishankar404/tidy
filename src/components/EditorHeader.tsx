import { useNavigate } from "react-router-dom";
import { Sparkles, History, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsSheet } from "@/components/SettingsSheet";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";

interface EditorHeaderProps {
  fileName: string;
  onOpenCodeReviewer: () => void;
}

export function EditorHeader({ fileName, onOpenCodeReviewer }: EditorHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="h-12 bg-card border-b border-border flex items-center justify-between px-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm font-medium text-foreground">
          {fileName || "Untitled"}
        </span>
        <span className="text-xs text-muted-foreground">•</span>
        <span className="text-xs text-muted-foreground">Saved</span>
      </div>

         <div className="flex items-center gap-2">
           <Button
             variant="ghost"
             size="icon"
             onClick={onOpenCodeReviewer}
             className="h-8 w-8 transition-all duration-200 hover:bg-muted"
             title="AI Assistant (Ctrl+K)"
           >
              <Sparkles className="h-4 w-4" />
           </Button>
           <Button
             variant="ghost"
             size="icon"
             onClick={() => navigate('/history')}
             className="h-8 w-8 transition-all duration-200 hover:bg-muted"
             title="Analysis History"
           >
             <History className="h-4 w-4" />
           </Button>
           <Button
             variant="ghost"
             size="icon"
             onClick={() => navigate('/snippets')}
             className="h-8 w-8 transition-all duration-200 hover:bg-muted"
             title="Code Snippets"
           >
             <BookOpen className="h-4 w-4" />
           </Button>
           <KeyboardShortcutsHelp />
           <SettingsSheet />
         </div>
    </header>
  );
}
