import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Trash2, FileText, Calendar, BarChart3, AlertTriangle, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { analysisHistory, AnalysisSession } from "@/lib/analysisHistory";
import { AIReviewResponse } from "@/lib/useAIReview";

const AnalysisHistory = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<AnalysisSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<AnalysisSession[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSession, setSelectedSession] = useState<AnalysisSession | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredSessions(analysisHistory.searchSessions(searchQuery));
    } else {
      setFilteredSessions(sessions);
    }
  }, [searchQuery, sessions]);

  const loadSessions = () => {
    const allSessions = analysisHistory.getAllSessions();
    setSessions(allSessions);
    setFilteredSessions(allSessions);
  };

  const handleDeleteSession = (sessionId: string) => {
    analysisHistory.deleteSession(sessionId);
    loadSessions();
  };

  const handleClearAllHistory = () => {
    analysisHistory.clearAllHistory();
    loadSessions();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (score >= 60) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <X className="h-4 w-4 text-red-600" />;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-card">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Analysis History</h1>
            <p className="text-sm text-muted-foreground">View your previous code analysis sessions</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search analyses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>

          {sessions.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear All History</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all your analysis history. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAllHistory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {sessions.length === 0 ? "No Analysis History" : "No Results Found"}
            </h3>
            <p className="text-muted-foreground">
              {sessions.length === 0
                ? "Your code analysis sessions will appear here once you run some analyses."
                : "Try adjusting your search query to find what you're looking for."
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSessions.map((session) => (
              <Card key={session.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-sm font-medium truncate max-w-32" title={session.fileName}>
                        {session.fileName}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                      {getScoreIcon(session.score)}
                      <span className={`text-sm font-medium ${getScoreColor(session.score)}`}>
                        {session.score}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDate(session.timestamp)}
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {session.summary}
                  </p>

                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="text-xs">
                      {session.suggestionsCount} suggestions
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {session.issuesCount} issues
                    </Badge>
                  </div>

                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setSelectedSession(session)}
                        >
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            {session.fileName} - Analysis Details
                          </DialogTitle>
                        </DialogHeader>
                        {selectedSession && <AnalysisDetailsView session={selectedSession} />}
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Analysis</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this analysis session? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteSession(session.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const AnalysisDetailsView = ({ session }: { session: AnalysisSession }) => {
  const data = session.fullResults;

  return (
    <ScrollArea className="flex-1 pr-4">
      <div className="space-y-6">
        {/* Summary */}
        <div className="border border-border rounded-lg p-4 bg-card">
          <h3 className="font-semibold text-sm mb-2">Summary</h3>
          <p className="text-sm text-muted-foreground">{data.summary}</p>
        </div>

        {/* Changes Summary */}
        <div className="border border-border rounded-lg p-4 bg-card">
          <h3 className="font-semibold text-sm mb-4">Changes Summary</h3>
          <div className="space-y-2">
            {data.changesSummary.map((item, index) => (
              <div key={index} className="border border-border rounded-md p-3">
                <p className="text-xs font-medium text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Code Suggestions */}
        <div className="border border-border rounded-lg p-4 bg-card">
          <h3 className="font-semibold text-sm mb-4">Code Suggestions ({data.codeSuggestions.length})</h3>
          <div className="space-y-3">
            {data.codeSuggestions.map((item, index) => (
              <div key={index} className="border border-border rounded-md p-3">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    {item.impactLevel} impact
                  </Badge>
                </div>
                <p className="text-xs font-medium mb-1">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default AnalysisHistory;