import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, BookOpen, TrendingUp, Clock, Star } from 'lucide-react';
import { snippetStorage } from '@/lib/snippetStorage';
import { CodeSnippet, SnippetFilters } from '@/lib/analysis/types';
import SnippetCard from '@/components/SnippetCard';
import SaveSnippetModal from '@/components/SaveSnippetModal';

const SnippetLibrary: React.FC = () => {
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [filteredSnippets, setFilteredSnippets] = useState<CodeSnippet[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'lastUsed' | 'usageCount' | 'title'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [stats, setStats] = useState<any>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<CodeSnippet | null>(null);

  useEffect(() => {
    loadSnippets();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [snippets, searchQuery, selectedCategory, sortBy, sortOrder]);

  const loadSnippets = () => {
    const allSnippets = snippetStorage.getSnippets();
    const statsData = snippetStorage.getStats();
    setSnippets(allSnippets);
    setStats(statsData);
  };

  const applyFilters = () => {
    const filters: SnippetFilters = {
      search: searchQuery || undefined,
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      sortBy,
      sortOrder,
    };

    const filtered = snippetStorage.getSnippets(filters);
    setFilteredSnippets(filtered);
  };

  const handleDeleteSnippet = (id: string) => {
    if (snippetStorage.deleteSnippet(id)) {
      loadSnippets();
    }
  };

  const handleAddManualSnippet = () => {
    setIsSaveModalOpen(true);
  };

  const handleSaveSnippet = (snippetData: Omit<CodeSnippet, 'id' | 'createdAt' | 'usageCount'>) => {
    snippetStorage.saveSnippet(snippetData);
    loadSnippets();
  };

  const handleEditSnippet = (snippet: CodeSnippet) => {
    setEditingSnippet(snippet);
    setIsSaveModalOpen(true);
  };

  const handleUpdateSnippet = (id: string, snippetData: Omit<CodeSnippet, 'id' | 'createdAt' | 'usageCount'>) => {
    if (snippetStorage.updateSnippet(id, snippetData)) {
      loadSnippets();
      setEditingSnippet(null);
    }
  };

  const handleCloseModal = () => {
    setIsSaveModalOpen(false);
    setEditingSnippet(null);
  };

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'security', label: 'Security' },
    { value: 'performance', label: 'Performance' },
    { value: 'error-handling', label: 'Error Handling' },
    { value: 'ui', label: 'UI Components' },
    { value: 'utility', label: 'Utilities' },
    { value: 'custom', label: 'Custom' },
  ];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Code Snippet Library</h1>
        <p className="text-muted-foreground">
          Save and organize your favorite code patterns from AI analysis and chat suggestions
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Snippets</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Most Used</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.mostUsed.length > 0 ? stats.mostUsed[0].usageCount : 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.mostUsed.length > 0 ? stats.mostUsed[0].title.substring(0, 20) + '...' : 'No usage yet'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recent.length}</div>
              <p className="text-xs text-muted-foreground">Recently added</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(stats.byCategory).length}</div>
              <p className="text-xs text-muted-foreground">Active categories</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search snippets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
          const [sort, order] = value.split('-');
          setSortBy(sort as any);
          setSortOrder(order as any);
        }}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt-desc">Newest First</SelectItem>
            <SelectItem value="createdAt-asc">Oldest First</SelectItem>
            <SelectItem value="lastUsed-desc">Recently Used</SelectItem>
            <SelectItem value="usageCount-desc">Most Used</SelectItem>
            <SelectItem value="title-asc">Name A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Snippets Grid */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {filteredSnippets.length} Snippet{filteredSnippets.length !== 1 ? 's' : ''}
          </h2>
          <Button onClick={handleAddManualSnippet}>
            <Plus className="h-4 w-4 mr-2" />
            Add Manual Snippet
          </Button>
        </div>
      </div>

      {filteredSnippets.length === 0 ? (
        <Card className="p-8 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No snippets found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || selectedCategory !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Start chatting with Tidy to get code suggestions you can save here!'}
          </p>
          <Button variant="outline" onClick={handleAddManualSnippet}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Snippet
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSnippets.map((snippet) => (
            <SnippetCard
              key={snippet.id}
              snippet={snippet}
              onDelete={handleDeleteSnippet}
              onEdit={handleEditSnippet}
            />
          ))}
        </div>
      )}

      <SaveSnippetModal
        key={isSaveModalOpen ? 'open' : 'closed'}
        isOpen={isSaveModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveSnippet}
        onUpdate={handleUpdateSnippet}
        snippet={editingSnippet || undefined}
      />
    </div>
  );
};

export default SnippetLibrary;