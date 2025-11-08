import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { CodeSnippet } from '@/lib/analysis/types';

interface SaveSnippetModalProps {
  isOpen: boolean;
  onClose: () => void;
  code?: string;
  suggestedTitle?: string;
  suggestedDescription?: string;
  suggestedCategory?: CodeSnippet['category'];
  suggestedTags?: string[];
  snippet?: CodeSnippet; // For editing existing snippets
  onSave: (snippetData: Omit<CodeSnippet, 'id' | 'createdAt' | 'usageCount'>) => void;
  onUpdate?: (id: string, snippetData: Omit<CodeSnippet, 'id' | 'createdAt' | 'usageCount'>) => void; // For updating existing snippets
}

const SaveSnippetModal: React.FC<SaveSnippetModalProps> = ({
  isOpen,
  onClose,
  code = '',
  suggestedTitle = '',
  suggestedDescription = '',
  suggestedCategory = 'utility',
  suggestedTags = [],
  snippet,
  onSave,
  onUpdate,
}) => {
  const { theme } = useTheme();

  // Initialize form state - for create mode, use props; for edit mode, will be set by useEffect
  const [codeInput, setCodeInput] = useState(snippet?.code || code || '');
  const [title, setTitle] = useState(snippet?.title || suggestedTitle);
  const [description, setDescription] = useState(snippet?.description || suggestedDescription);
  const [category, setCategory] = useState<CodeSnippet['category']>(snippet?.category || suggestedCategory);
  const [tags, setTags] = useState<string[]>(snippet?.tags || suggestedTags);
  const [newTag, setNewTag] = useState('');

  // Only update form when switching between edit/create modes (snippet prop changes)
  React.useEffect(() => {
    if (snippet) {
      // Editing existing snippet
      setCodeInput(snippet.code);
      setTitle(snippet.title);
      setDescription(snippet.description);
      setCategory(snippet.category);
      setTags(snippet.tags);
    } else {
      // Creating new snippet - reset to defaults
      setCodeInput(code || '');
      setTitle(suggestedTitle);
      setDescription(suggestedDescription);
      setCategory(suggestedCategory);
      setTags(suggestedTags);
    }
  }, [snippet]); // Only depend on snippet prop, not individual form values

  const detectLanguage = (code: string): string => {
    if (code.includes('function') || code.includes('const') || code.includes('let') ||
        code.includes('interface') || code.includes('type') || code.includes('import') ||
        code.includes('export') || code.includes('class') || code.includes('=>')) {
      return 'typescript';
    }
    return 'javascript';
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('Please enter a title for the snippet');
      return;
    }

    if (!codeInput.trim()) {
      alert('Please enter some code for the snippet');
      return;
    }

    // Auto-detect language
    const language = detectLanguage(codeInput);

    const snippetData = {
      title: title.trim(),
      description: description.trim(),
      code: codeInput.trim(),
      language,
      tags,
      category,
      source: snippet ? snippet.source : 'manual',
      metadata: snippet ? snippet.metadata : {},
    };

    if (snippet && onUpdate) {
      // Update existing snippet
      onUpdate(snippet.id, snippetData);
    } else {
      // Save new snippet
      onSave(snippetData);
    }

    onClose();
  };

  const categories = [
    { value: 'security', label: 'Security' },
    { value: 'performance', label: 'Performance' },
    { value: 'error-handling', label: 'Error Handling' },
    { value: 'ui', label: 'UI Components' },
    { value: 'utility', label: 'Utilities' },
    { value: 'custom', label: 'Custom' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{snippet ? '✏️ Edit Code Snippet' : '💾 Save Code Snippet'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title..."
              className="mt-1"
            />
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={(value) => setCategory(value as CodeSnippet['category'])}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              className="mt-1"
              rows={2}
            />
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a tag..."
                className="flex-1"
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Code Input */}
          <div>
            <Label>Code *</Label>
            <div className="mt-1 border rounded-md overflow-hidden">
              <Editor
                height="200px"
                language={detectLanguage(codeInput)}
                value={codeInput}
                onChange={(value) => setCodeInput(value || '')}
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  lineNumbers: 'off',
                  folding: false,
                  renderLineHighlight: 'none',
                  overviewRulerLanes: 0,
                  hideCursorInOverviewRuler: true,
                  overviewRulerBorder: false,
                  scrollbar: {
                    vertical: 'visible',
                    horizontal: 'visible',
                    useShadows: false,
                  },
                  fontSize: 14,
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Inconsolata, "Roboto Mono", "Source Code Pro", monospace',
                  tabSize: 2,
                  insertSpaces: true,
                  detectIndentation: false,
                  automaticLayout: true,
                  theme: theme === 'dark' ? 'vs-dark' : 'vs',
                }}
                loading={<div className="flex items-center justify-center h-[200px] text-muted-foreground">Loading code editor...</div>}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {snippet ? 'Update Snippet' : 'Save Snippet'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveSnippetModal;