import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Edit, Trash2, Clock, Star, MessageSquare, FileText } from 'lucide-react';
import { CodeSnippet } from '@/lib/analysis/types';
import { snippetStorage } from '@/lib/snippetStorage';
import { useToast } from '@/hooks/use-toast';

interface SnippetCardProps {
  snippet: CodeSnippet;
  onDelete: (id: string) => void;
  onEdit: (snippet: CodeSnippet) => void;
}

const SnippetCard: React.FC<SnippetCardProps> = ({ snippet, onDelete, onEdit }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet.code);
      snippetStorage.incrementUsage(snippet.id);
      toast({
        title: "Copied!",
        description: "Code snippet copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this snippet?')) {
      onDelete(snippet.id);
      toast({
        title: "Snippet deleted",
        description: "Code snippet has been removed from your library",
      });
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      security: 'bg-red-100 text-red-800',
      performance: 'bg-blue-100 text-blue-800',
      'error-handling': 'bg-orange-100 text-orange-800',
      ui: 'bg-purple-100 text-purple-800',
      utility: 'bg-green-100 text-green-800',
      custom: 'bg-gray-100 text-gray-800',
    };
    return colors[category as keyof typeof colors] || colors.custom;
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'chat-suggestion':
        return <MessageSquare className="h-3 w-3" />;
      case 'analysis-result':
        return <FileText className="h-3 w-3" />;
      default:
        return <Star className="h-3 w-3" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      'day'
    );
  };

  const truncateCode = (code: string, maxLength: number = 150) => {
    if (code.length <= maxLength) return code;
    return code.substring(0, maxLength) + '...';
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg leading-tight mb-1 truncate">
              {snippet.title}
            </CardTitle>
            <CardDescription className="text-sm">
              {snippet.description}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 ml-2">
            {getSourceIcon(snippet.source)}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <Badge className={getCategoryColor(snippet.category)}>
            {snippet.category.replace('-', ' ')}
          </Badge>
          {snippet.usageCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              <Star className="h-3 w-3 mr-1" />
              {snippet.usageCount}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        <div className="bg-muted rounded-md p-3 mb-4 font-mono text-sm overflow-hidden">
          <pre className="whitespace-pre-wrap break-words">
            {isExpanded ? snippet.code : truncateCode(snippet.code)}
          </pre>
          {snippet.code.length > 150 && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-6 text-xs"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {snippet.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {snippet.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{snippet.tags.length - 3} more
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(snippet.createdAt)}
          </div>
          <div className="text-xs">
            {snippet.language}
          </div>
        </div>

        <div className="flex gap-2 mt-auto">
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={handleCopy}
          >
            <Copy className="h-3 w-3 mr-1" />
            Copy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(snippet)}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SnippetCard;