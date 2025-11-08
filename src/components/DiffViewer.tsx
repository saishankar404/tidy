import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Check, X, Download, Eye } from "lucide-react";
// @ts-ignore
import { diffLines } from "diff";

interface DiffChange {
  added?: boolean;
  removed?: boolean;
  value: string;
}

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

  // Generate proper diff using diff library
  const generateDiff = () => {
    const patches = diffLines(originalContent, newContent);
    const diff: Array<{ type: 'add' | 'remove' | 'context', content: string, lineNumber?: number }> = [];

    let lineNumber = 1;

    patches.forEach((patch: DiffChange) => {
      if (patch.added) {
        // Added lines
        const lines = patch.value.split('\n');
        lines.forEach((line: string, index: number) => {
          if (line !== '' || index < lines.length - 1) { // Don't add empty line at end
            diff.push({ type: 'add', content: line, lineNumber });
          }
        });
      } else if (patch.removed) {
        // Removed lines
        const lines = patch.value.split('\n');
        lines.forEach((line: string, index: number) => {
          if (line !== '' || index < lines.length - 1) { // Don't add empty line at end
            diff.push({ type: 'remove', content: line, lineNumber });
            lineNumber++; // Increment line number for removed lines
          }
        });
      } else {
        // Context lines
        const lines = patch.value.split('\n');
        lines.forEach((line: string, index: number) => {
          if (line !== '' || index < lines.length - 1) { // Don't add empty line at end
            diff.push({ type: 'context', content: line, lineNumber });
            lineNumber++;
          }
        });
      }
    });

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
      <DialogContent className="max-w-6xl w-full max-h-[85vh] flex flex-col p-0 mx-4 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-sm sm:text-base truncate max-w-[60%] sm:max-w-none">Review Changes: {filePath}</span>
            <div className="flex items-center gap-2 flex-shrink-0">
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

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col px-6 py-4 w-full">
          <ScrollArea className="flex-1 pr-4 w-full">
            {viewMode === 'split' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-0">
                <div className="space-y-2 min-w-0 flex flex-col">
                  <h4 className="font-medium text-sm text-muted-foreground flex-shrink-0">Original</h4>
                  <div className="flex-1 min-h-0 overflow-hidden border rounded">
                    <ScrollArea className="h-full w-full">
                      <div className="text-xs font-mono bg-muted p-3 whitespace-pre-wrap break-words overflow-wrap-anywhere min-w-0">
                        {originalContent.split('\n').map((line, index) => (
                          <div key={index} className="min-w-0 break-all">
                            {line || '\u00A0'}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
                <div className="space-y-2 min-w-0 flex flex-col">
                  <h4 className="font-medium text-sm text-muted-foreground flex-shrink-0">Modified</h4>
                  <div className="flex-1 min-h-0 overflow-hidden border rounded">
                    <ScrollArea className="h-full w-full">
                      <div className="text-xs font-mono bg-muted p-3 whitespace-pre-wrap break-words overflow-wrap-anywhere min-w-0">
                        {newContent.split('\n').map((line, index) => (
                          <div key={index} className="min-w-0 break-all">
                            {line || '\u00A0'}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 flex flex-col min-h-0">
                <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    +{diff.filter(d => d.type === 'add').length} additions
                  </Badge>
                  <Badge variant="outline" className="text-red-600 border-red-200">
                    -{diff.filter(d => d.type === 'remove').length} deletions
                  </Badge>
                </div>
                <div className="flex-1 min-h-0 border rounded overflow-hidden">
                  <ScrollArea className="h-full w-full">
                    <div className="font-mono text-sm min-w-0">
                      {diff.map((line, index) => (
                        <div
                          key={index}
                          className={`px-3 py-1 flex items-start min-w-0 ${
                            line.type === 'add'
                              ? 'bg-green-50 border-l-4 border-green-400'
                              : line.type === 'remove'
                              ? 'bg-red-50 border-l-4 border-red-400'
                              : 'bg-gray-50'
                          }`}
                        >
                          <span className="w-8 text-right text-xs text-muted-foreground mr-3 flex-shrink-0 mt-0.5">
                            {line.lineNumber}
                          </span>
                          <span className={`flex-1 whitespace-pre-wrap break-words text-xs ${
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
                  </ScrollArea>
                </div>
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="flex-shrink-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4">
          <div className="flex justify-center items-center gap-4">
            <Button variant="outline" onClick={onReject} className="w-24 h-9 flex-shrink-0 px-3">
              <X className="h-4 w-4 mr-1.5" />
              Reject
            </Button>
            <Button onClick={onAccept} className="w-28 h-9 flex-shrink-0 px-3">
              <Check className="h-4 w-4 mr-1.5" />
              Accept
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}