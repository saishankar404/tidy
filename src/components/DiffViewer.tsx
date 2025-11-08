import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Check, X, Download, Eye } from "lucide-react";

interface DiffViewerProps {
  isOpen: boolean;
  onClose: () => void;
  filePath: string;
  originalContent: string;
  newContent: string;
  onAccept: () => void;
  onReject: () => void;
}

export function DiffViewer({
  isOpen,
  onClose,
  filePath,
  originalContent,
  newContent,
  onAccept,
  onReject
}: DiffViewerProps) {
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');

  // Simple diff calculation (in a real app, you'd use a proper diff library)
  const generateDiff = () => {
    const originalLines = originalContent.split('\n');
    const newLines = newContent.split('\n');
    const diff: Array<{ type: 'add' | 'remove' | 'context', content: string, lineNumber?: number }> = [];

    const maxLines = Math.max(originalLines.length, newLines.length);

    for (let i = 0; i < maxLines; i++) {
      const originalLine = originalLines[i];
      const newLine = newLines[i];

      if (originalLine !== newLine) {
        if (originalLine !== undefined) {
          diff.push({ type: 'remove', content: originalLine, lineNumber: i + 1 });
        }
        if (newLine !== undefined) {
          diff.push({ type: 'add', content: newLine, lineNumber: i + 1 });
        }
      } else if (originalLine !== undefined) {
        diff.push({ type: 'context', content: originalLine, lineNumber: i + 1 });
      }
    }

    return diff;
  };

  const diff = generateDiff();

  const downloadFile = () => {
    const blob = new Blob([newContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filePath.split('/').pop() || 'file.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Review Changes: {filePath}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'split' ? 'unified' : 'split')}
              >
                <Eye className="h-3 w-3 mr-1" />
                {viewMode === 'split' ? 'Unified' : 'Split'}
              </Button>
              <Button variant="outline" size="sm" onClick={downloadFile}>
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            {viewMode === 'split' ? (
              <div className="grid grid-cols-2 gap-4 h-full">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Original</h4>
                  <pre className="text-xs font-mono bg-muted p-3 rounded border overflow-x-auto whitespace-pre-wrap">
                    {originalContent}
                  </pre>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Modified</h4>
                  <pre className="text-xs font-mono bg-muted p-3 rounded border overflow-x-auto whitespace-pre-wrap">
                    {newContent}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    +{diff.filter(d => d.type === 'add').length} additions
                  </Badge>
                  <Badge variant="outline" className="text-red-600 border-red-200">
                    -{diff.filter(d => d.type === 'remove').length} deletions
                  </Badge>
                </div>
                <div className="border rounded font-mono text-sm">
                  {diff.map((line, index) => (
                    <div
                      key={index}
                      className={`px-3 py-1 flex items-center ${
                        line.type === 'add'
                          ? 'bg-green-50 border-l-4 border-green-400'
                          : line.type === 'remove'
                          ? 'bg-red-50 border-l-4 border-red-400'
                          : 'bg-gray-50'
                      }`}
                    >
                      <span className="w-8 text-right text-xs text-muted-foreground mr-3">
                        {line.lineNumber}
                      </span>
                      <span className={`flex-1 ${
                        line.type === 'add'
                          ? 'text-green-800'
                          : line.type === 'remove'
                          ? 'text-red-800'
                          : 'text-gray-700'
                      }`}>
                        {line.type === 'add' && '+ '}
                        {line.type === 'remove' && '- '}
                        {line.content || ' '}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onReject}>
            <X className="h-4 w-4 mr-2" />
            Reject Changes
          </Button>
          <Button onClick={onAccept}>
            <Check className="h-4 w-4 mr-2" />
            Accept & Apply Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}