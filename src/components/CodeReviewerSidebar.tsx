import { useState, useEffect } from "react";
import { X, Bot, Check, X as XIcon, Zap, ChevronDown, ChevronUp, Sparkles, Github, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useAIReview, type SuggestionItem } from "@/lib/useAIReview";
import { ChatAssistant, type ChatMessage } from "@/lib/chatAssistant";
import { useSettings } from "@/lib/SettingsContext";
import { GeminiService } from "@/lib/geminiApi";

// Simple HTML sanitization function to prevent XSS
const sanitizeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

interface CodeReviewerSidebarProps {
  currentFile: string;
  currentFileData: string;
  onClose: () => void;
  onOpenDiff: (filePath: string, diffContent: string) => void;
  onApplyChanges: (filePath: string, newContent: string) => void;
  onAnalyze?: () => void;
  onConnectGitHub?: () => void;
}



export function CodeReviewerSidebar({ currentFile, currentFileData, onClose, onOpenDiff, onApplyChanges, onAnalyze, onConnectGitHub }: CodeReviewerSidebarProps) {
   const [shouldAnalyze, setShouldAnalyze] = useState(false);
   const { data, loading, error, progress } = useAIReview(currentFileData || '', currentFile, 'typescript', shouldAnalyze);
    const [selectedSuggestion, setSelectedSuggestion] = useState<SuggestionItem | null>(null);
    const [isResolving, setIsResolving] = useState(false);
    const [expandedWalkthroughFiles, setExpandedWalkthroughFiles] = useState<Set<string>>(new Set());
   const [showChat, setShowChat] = useState(false);
   const [showPreloader, setShowPreloader] = useState(false);
   const [messages, setMessages] = useState<ChatMessage[]>([]);
   const [inputMessage, setInputMessage] = useState('');
   const [isTyping, setIsTyping] = useState(false);
   const [chatAssistant, setChatAssistant] = useState<ChatAssistant | null>(null);
   const { settings } = useSettings();

   // Initialize chat assistant when component mounts
   useEffect(() => {
     if (settings.ai.enabled && settings.ai.apiKey) {
       const geminiService = new GeminiService({
         apiKey: settings.ai.apiKey,
         model: settings.ai.model,
         temperature: settings.ai.temperature,
         maxTokens: settings.ai.maxTokens,
       });

       const assistant = new ChatAssistant(geminiService);
       assistant.setContext({
         code: currentFileData,
         filePath: currentFile,
         language: 'typescript',
         analysisResults: [] // Will be updated when analysis completes
       });
       setChatAssistant(assistant);
     }
   }, [settings.ai, currentFile, currentFileData]);

    // Update chat context when analysis completes
    useEffect(() => {
      if (chatAssistant && data) {
        // Transform old format to new format for context
        // For now, we'll create a simple mapping
        const analysisResults = [
          {
            type: 'codeQuality' as const,
            score: 85,
            issues: data.fileWalkthrough.codeQuality?.map(item => ({
              id: `cq-${Math.random()}`,
              severity: 'medium' as const,
              title: item.title,
              description: item.description,
              category: 'general',
              confidence: 0.8
            })) || [],
            suggestions: [],
            summary: 'Code quality analysis',
            metadata: { analysisTime: 0, linesAnalyzed: 0, language: 'typescript' }
          }
        ];

        chatAssistant.setContext({
          code: currentFileData,
          filePath: currentFile,
          language: 'typescript',
          analysisResults
        });
      }
    }, [data, chatAssistant, currentFileData, currentFile]);

  const handleResolve = async (suggestion: SuggestionItem) => {
     setSelectedSuggestion(suggestion);
     setIsResolving(true);

     try {
       if (chatAssistant && currentFileData) {
         // Transform SuggestionItem to Issue format expected by generateFix
         const issue = {
           title: suggestion.title,
           description: suggestion.description,
           category: 'general', // Default category since SuggestionItem doesn't have one
           severity: suggestion.impactLevel as 'low' | 'medium' | 'high'
         };

          // Generate the fix using AI
          const result = await chatAssistant.generateFix(issue, currentFileData, currentFile, suggestion.diff);

         // Update the suggestion with the generated diff and store the fixed code
         setSelectedSuggestion({
           ...suggestion,
           diff: result.diff,
           fixedCode: result.fixedCode
         });
       } else {
         // Fallback: use the existing diff if available, or generate a placeholder
         setSelectedSuggestion({
           ...suggestion,
           diff: suggestion.diff || `// Suggested fix for: ${suggestion.title}\n// ${suggestion.description}\n\n${currentFileData}`,
           fixedCode: currentFileData
         });
       }
     } catch (error) {
       console.error('Failed to generate fix:', error);
       // Fallback to placeholder diff
       setSelectedSuggestion({
         ...suggestion,
         diff: suggestion.diff || `// Could not generate fix for: ${suggestion.title}\n// ${suggestion.description}\n\n${currentFileData}`,
         fixedCode: currentFileData
       });
     } finally {
       setIsResolving(false);
     }
   };

  const handleAccept = () => {
    if (selectedSuggestion && selectedSuggestion.fixedCode) {
      // Use the complete fixed code generated by AI
      onApplyChanges(selectedSuggestion.filePath, selectedSuggestion.fixedCode);
      setSelectedSuggestion(null);
    } else if (selectedSuggestion && selectedSuggestion.diff) {
      // Fallback: Extract the fixed code from the diff
      // For now, we'll use a simple approach - in a real implementation,
      // you'd properly apply the diff
      const lines = selectedSuggestion.diff.split('\n');
      const fixedLines: string[] = [];

      for (const line of lines) {
        if (line.startsWith('+') && !line.startsWith('+++')) {
          // Add line
          fixedLines.push(line.substring(1));
        } else if (line.startsWith(' ') || (!line.startsWith('-') && !line.startsWith('+'))) {
          // Context or unchanged line
          fixedLines.push(line.startsWith(' ') ? line.substring(1) : line);
        }
        // Skip removed lines (starting with -)
      }

      const fixedCode = fixedLines.join('\n');
      onApplyChanges(selectedSuggestion.filePath, fixedCode);
      setSelectedSuggestion(null);
    }
  };

  const handleReject = () => {
    setSelectedSuggestion(null);
  };



  const calculateDiffStatsFromDiff = (diff: string) => {
    const lines = diff.split('\n');
    let added = 0;
    let removed = 0;

    lines.forEach(line => {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        added++;
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        removed++;
      }
    });

    return { added, removed, files: 1 };
  };

  const toggleWalkthroughFile = (fileKey: string) => {
    setExpandedWalkthroughFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileKey)) {
        newSet.delete(fileKey);
      } else {
        newSet.add(fileKey);
      }
      return newSet;
    });
  };

   const handleSendMessage = async () => {
     if (!inputMessage.trim() || !chatAssistant) return;

     const userMessage: ChatMessage = {
       id: Date.now().toString(),
       role: 'user',
       content: inputMessage,
       timestamp: new Date(),
     };

     setMessages(prev => [...prev, userMessage]);
     setInputMessage('');
     setIsTyping(true);

     try {
       const aiResponse = await chatAssistant.generateResponse(inputMessage);
       const aiMessage: ChatMessage = {
         id: (Date.now() + 1).toString(),
         role: 'assistant',
         content: aiResponse,
         timestamp: new Date(),
       };

       setMessages(prev => [...prev, aiMessage]);
     } catch (error) {
       console.error('Chat error:', error);
       const errorMessage: ChatMessage = {
         id: (Date.now() + 1).toString(),
         role: 'assistant',
         content: "I'm sorry, I encountered an error while processing your message. Please try again.",
         timestamp: new Date(),
       };
       setMessages(prev => [...prev, errorMessage]);
     } finally {
       setIsTyping(false);
     }
   };



  if (loading) {
    return (
      <div className="h-full bg-background border-l border-border flex flex-col font-inter">
        <div className="h-12 px-3 py-2 border-b border-border flex items-center justify-between bg-muted/20">
          <h2 className="text-sm font-medium text-foreground">Code Reviewer</h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 rounded hover:bg-muted/50">
            <X className="h-3 w-3" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="relative">
              <Bot className="h-8 w-8 text-black mx-auto animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-2 border-muted-foreground/20 border-t-black rounded-full animate-spin"></div>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Analyzing code...</p>
              <div className="flex justify-center space-x-1">
                <div className="w-1 h-1 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1 h-1 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1 h-1 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show preloader during analysis
  if (showPreloader || loading) {
    const progressPercent = progress ? (progress.current / progress.total) * 100 : 0;
    const currentAnalyzer = progress?.currentAnalyzer || 'Initializing';

    return (
      <div className="h-full bg-background border-l border-border flex flex-col font-inter">
        <div className="h-12 px-3 py-2 border-b border-border flex items-center justify-between bg-muted/20">
          <h2 className="text-sm font-medium text-foreground">AI Assistant</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 rounded hover:bg-muted/50">
            <X className="h-3 w-3" />
          </Button>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm space-y-6 text-center">
            <div className="space-y-4">
              <div className="relative mx-auto w-16 h-16">
                <div className="absolute inset-0 border-4 border-muted-foreground/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary animate-pulse" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium text-foreground">Analyzing your code...</h3>
                <p className="text-sm text-muted-foreground">{currentAnalyzer}</p>
                <Progress value={progressPercent} className="w-full" />
                <p className="text-xs text-muted-foreground">{progress?.current || 0} of {progress?.total || 6} completed</p>
              </div>

              <div className="flex justify-center space-x-1">
                <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

   // Show chat interface after analysis
   if (showChat) {
     // Initialize messages if empty
     if (messages.length === 0 && chatAssistant) {
       setMessages([{
         id: Date.now().toString(),
         role: 'assistant',
         content: `Hi! I'm Tidy, your AI coding assistant. I've analyzed your code and found some suggestions above. What would you like to know or how can I help you improve your code?`,
         timestamp: new Date(),
       }]);
     }

    return (
      <div className="h-full bg-background border-l border-border flex flex-col font-inter">
        <div className="h-12 px-3 py-2 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowChat(false)}
              className="h-6 w-6 rounded hover:bg-muted/50"
            >
              <ChevronDown className="h-3 w-3 rotate-90" />
            </Button>
            <h2 className="text-sm font-medium text-foreground">Chat with Tidy</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 rounded hover:bg-muted/50">
            <X className="h-3 w-3" />
          </Button>
        </div>

        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`} style={{ animationDelay: `${index * 100}ms` }}>
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground ml-4'
                      : 'bg-muted text-muted-foreground mr-4'
                  }`}>
                     <p className="text-sm whitespace-pre-wrap">{sanitizeHtml(message.content)}</p>
                     <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted text-muted-foreground mr-4 rounded-lg px-3 py-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything about your code..."
                className="flex-1"
                disabled={isTyping}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                size="icon"
                className="h-10 w-10"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show modal interface by default when sidebar is opened
  if (!shouldAnalyze || (!data && !loading)) {
    return (
      <div className="h-full bg-background border-l border-border flex flex-col font-inter">
        <div className="h-12 px-3 py-2 border-b border-border flex items-center justify-between bg-muted/20">
          <h2 className="text-sm font-medium text-foreground">AI Assistant</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 rounded hover:bg-muted/50">
            <X className="h-3 w-3" />
          </Button>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm space-y-6">
            <div className="text-center">
              <Bot className="h-12 w-12 text-black mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">AI Code Assistant</h3>
              <p className="text-sm text-muted-foreground">Enhance your coding experience with AI-powered tools</p>
            </div>

            <div className="space-y-4">
               <Button
                 onClick={async () => {
                   setShowPreloader(true);

                   // Show preloader for 2-3 seconds
                   await new Promise(resolve => setTimeout(resolve, 2500));

                   setShowPreloader(false);
                   setShouldAnalyze(true);
                   onAnalyze?.();
                 }}
                disabled={showPreloader}
                className="w-full h-12 border-2 border-dashed border-muted-foreground/30 rounded-xl bg-background hover:bg-muted/50 transition-all duration-300 hover:border-muted-foreground/50 hover:shadow-sm disabled:opacity-50"
                variant="outline"
              >
                <Sparkles className="h-5 w-5 mr-3" />
                <span className="font-medium">Analyze now</span>
              </Button>

              <Button
                onClick={onConnectGitHub}
                className="w-full h-12 border-2 border-dashed border-muted-foreground/30 rounded-xl bg-background hover:bg-muted/50 transition-all duration-300 hover:border-muted-foreground/50 hover:shadow-sm"
                variant="outline"
              >
                <Github className="h-5 w-5 mr-3" />
                <span className="font-medium">Manage Github</span>
              </Button>

              {showChat && (
                <Button
                  onClick={() => setShowChat(true)}
                  className="w-full h-12 border-2 border-dashed border-muted-foreground/30 rounded-xl bg-background hover:bg-muted/50 transition-all duration-300 hover:border-muted-foreground/50 hover:shadow-sm"
                  variant="outline"
                >
                  <Bot className="h-5 w-5 mr-3" />
                  <span className="font-medium">Open Chat</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show code reviewer when analysis is complete
  if (loading) {
    return (
      <div className="w-80 h-full bg-gray-50/50 border-l border-dashed border-gray-300 flex flex-col font-inter">
        <div className="h-12 px-3 py-2 border-b border-dashed border-gray-300 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-700">Code Reviewer</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 rounded hover:bg-gray-200">
            <X className="h-3 w-3" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Bot className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-pulse" />
            <p className="text-xs text-gray-500">Analyzing code...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-full bg-background border-l border-border flex flex-col font-inter">
        <div className="h-12 px-3 py-2 border-b border-border flex items-center justify-between bg-muted/20">
          <h2 className="text-sm font-medium text-foreground">Code Reviewer</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 rounded hover:bg-muted/50">
            <X className="h-3 w-3" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <X className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Failed to load review</p>
            <p className="text-xs text-destructive mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const diffStats = selectedSuggestion ? calculateDiffStatsFromDiff(selectedSuggestion.diff) : { added: 0, removed: 0, files: 1 };

  return (
    <>
      <div className="h-full bg-background border-l border-border flex flex-col font-inter">
        {/* Header */}
        <div className="h-12 px-3 py-2 border-b border-border flex items-center justify-between bg-muted/20">
          <h2 className="text-sm font-medium text-gray-700">Code Reviewer</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6 rounded hover:bg-muted/50 transition-colors duration-200"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-4">
            {/* Changes Summary */}
            <div className="border border-border rounded-lg p-4 bg-card">
              <h3 className="font-semibold text-sm mb-2">Changes Summary</h3>
              <p className="text-xs text-muted-foreground mb-4">{data.summary}</p>

              <div className="space-y-2">
                {data.changesSummary.map((item, index) => (
                  <div
                    key={index}
                    className="border border-border rounded-md p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => onOpenDiff(item.title, item.diff)}
                  >
                    <p className="text-xs font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">{item.filePath}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* File Walkthrough */}
            <div className="border border-border rounded-lg p-4 bg-card">
              <h3 className="font-semibold text-sm mb-4">File Walkthrough</h3>

              <div className="space-y-4">
                {/* Code Quality */}
                {data.fileWalkthrough.codeQuality.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <h4 className="font-medium text-xs text-foreground">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.description}</p>

                    {item.files && item.files.length > 0 && (
                      <div className="ml-6 space-y-2">
                        {item.files.map((file, fileIndex) => {
                          const fileKey = `codeQuality-${index}-${fileIndex}`;
                          const isExpanded = expandedWalkthroughFiles.has(fileKey);
                          return (
                            <div key={fileIndex} className="border border-border rounded-md bg-muted/10">
                              <div
                                className="p-3 cursor-pointer hover:bg-muted/20 transition-colors flex items-center justify-between"
                                onClick={() => toggleWalkthroughFile(fileKey)}
                              >
                                <p className="text-xs font-medium text-foreground">{file.filePath}</p>
                                {isExpanded ? (
                                  <ChevronUp className="w-3 h-3 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                )}
                              </div>
                              {isExpanded && file.diff && (
                                <div className="px-3 pb-3">
                                  <div
                                    className="bg-muted/30 border border-border p-2 rounded text-xs font-mono overflow-x-auto max-h-20 cursor-pointer hover:bg-muted/40 transition-colors"
                                    onClick={() => onOpenDiff(file.filePath, file.diff || '')}
                                  >
                                    {file.diff.split('\n').map((line, i) => (
                                      <div key={i} className={cn(
                                        line.startsWith('+') && "text-green-700",
                                        line.startsWith('-') && "text-red-700"
                                      )}>
                                        {line}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}

                {/* Type Safety */}
                {data.fileWalkthrough.typeSafety.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <h4 className="font-medium text-xs text-foreground">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.description}</p>

                    {item.files && item.files.length > 0 && (
                      <div className="ml-6 space-y-2">
                        {item.files.map((file, fileIndex) => {
                          const fileKey = `typeSafety-${index}-${fileIndex}`;
                          const isExpanded = expandedWalkthroughFiles.has(fileKey);
                          return (
                            <div key={fileIndex} className="border border-border rounded-md bg-muted/10">
                              <div
                                className="p-3 cursor-pointer hover:bg-muted/20 transition-colors flex items-center justify-between"
                                onClick={() => toggleWalkthroughFile(fileKey)}
                              >
                                <p className="text-xs font-medium text-foreground">{file.filePath}</p>
                                {isExpanded ? (
                                  <ChevronUp className="w-3 h-3 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                )}
                              </div>
                              {isExpanded && file.diff && (
                                <div className="px-3 pb-3">
                                  <div
                                    className="bg-muted/30 border border-border p-2 rounded text-xs font-mono overflow-x-auto max-h-20 cursor-pointer hover:bg-muted/40 transition-colors"
                                    onClick={() => onOpenDiff(file.filePath, file.diff || '')}
                                  >
                                    {file.diff.split('\n').map((line, i) => (
                                      <div key={i} className={cn(
                                        line.startsWith('+') && "text-green-700",
                                        line.startsWith('-') && "text-red-700"
                                      )}>
                                        {line}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}

                {/* Performance */}
                {data.fileWalkthrough.performance.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <h4 className="font-medium text-xs text-foreground">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.description}</p>

                    {item.files && item.files.length > 0 && (
                      <div className="ml-6 space-y-2">
                        {item.files.map((file, fileIndex) => {
                          const fileKey = `performance-${index}-${fileIndex}`;
                          const isExpanded = expandedWalkthroughFiles.has(fileKey);
                          return (
                            <div key={fileIndex} className="border border-border rounded-md bg-muted/10">
                              <div
                                className="p-3 cursor-pointer hover:bg-muted/20 transition-colors flex items-center justify-between"
                                onClick={() => toggleWalkthroughFile(fileKey)}
                              >
                                <p className="text-xs font-medium text-foreground">{file.filePath}</p>
                                {isExpanded ? (
                                  <ChevronUp className="w-3 h-3 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                )}
                              </div>
                              {isExpanded && file.diff && (
                                <div className="px-3 pb-3">
                                  <div
                                    className="bg-muted/30 border border-border p-2 rounded text-xs font-mono overflow-x-auto max-h-20 cursor-pointer hover:bg-muted/40 transition-colors"
                                    onClick={() => onOpenDiff(file.filePath, file.diff || '')}
                                  >
                                    {file.diff.split('\n').map((line, i) => (
                                      <div key={i} className={cn(
                                        line.startsWith('+') && "text-green-700",
                                        line.startsWith('-') && "text-red-700"
                                      )}>
                                        {line}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}

                {/* Monitoring */}
                {data.fileWalkthrough.monitoring.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <h4 className="font-medium text-xs text-foreground">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.description}</p>

                    {item.files && item.files.length > 0 && (
                      <div className="ml-6 space-y-2">
                        {item.files.map((file, fileIndex) => {
                          const fileKey = `monitoring-${index}-${fileIndex}`;
                          const isExpanded = expandedWalkthroughFiles.has(fileKey);
                          return (
                            <div key={fileIndex} className="border border-border rounded-md bg-muted/10">
                              <div
                                className="p-3 cursor-pointer hover:bg-muted/20 transition-colors flex items-center justify-between"
                                onClick={() => toggleWalkthroughFile(fileKey)}
                              >
                                <p className="text-xs font-medium text-foreground">{file.filePath}</p>
                                {isExpanded ? (
                                  <ChevronUp className="w-3 h-3 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                )}
                              </div>
                              {isExpanded && file.diff && (
                                <div className="px-3 pb-3">
                                  <div
                                    className="bg-muted/30 border border-border p-2 rounded text-xs font-mono overflow-x-auto max-h-20 cursor-pointer hover:bg-muted/40 transition-colors"
                                    onClick={() => onOpenDiff(file.filePath, file.diff || '')}
                                  >
                                    {file.diff.split('\n').map((line, i) => (
                                      <div key={i} className={cn(
                                        line.startsWith('+') && "text-green-700",
                                        line.startsWith('-') && "text-red-700"
                                      )}>
                                        {line}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Code Suggestions */}
            <div className="border border-border rounded-lg p-4 bg-card">
              <h3 className="font-semibold text-sm mb-4">Code Suggestions</h3>
              <div className="space-y-3">
                {data.codeSuggestions.map((item, index) => (
                  <div key={index} className="border border-border rounded-md p-3 relative bg-muted/10">
                    <div className="flex items-start justify-between mb-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs border-muted-foreground/20",
                          item.impactLevel === 'high' && "text-foreground bg-muted/50",
                          item.impactLevel === 'medium' && "text-muted-foreground",
                          item.impactLevel === 'low' && "text-muted-foreground/70"
                        )}
                      >
                        {item.impactLevel} impact
                      </Badge>
                    </div>
                    <p className="text-xs font-medium mb-1 text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground mb-3">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground/70">{item.filePath}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolve(item)}
                        className="h-6 px-2 text-xs border-muted-foreground/20 hover:bg-muted/50"
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Resolve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
         </ScrollArea>

         {/* Chat Toggle */}
         <div className="p-3 border-t border-border">
           <Button
             onClick={() => setShowChat(true)}
             className="w-full h-10 border border-border rounded-lg bg-background hover:bg-muted/50 transition-all duration-200 hover:shadow-sm"
             variant="outline"
           >
             <Bot className="h-4 w-4 mr-2" />
             <span className="text-sm font-medium">Chat with Tidy</span>
           </Button>
         </div>
       </div>

       {/* Resolve Modal */}
      <Dialog open={!!selectedSuggestion} onOpenChange={() => setSelectedSuggestion(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Resolving: {selectedSuggestion?.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {isResolving ? (
              <div className="text-center py-8">
                <Bot className="h-8 w-8 text-blue-500 mx-auto mb-2 animate-pulse" />
                <p className="text-sm text-gray-600">AI is working on resolving this issue...</p>
              </div>
            ) : (
              <>
                <div className="border border-border rounded-md p-4 bg-card">
                  <h4 className="font-medium text-sm mb-3">Changes Preview</h4>
                  <div className="text-xs text-muted-foreground mb-3">
                    +{diffStats.added} lines added, -{diffStats.removed} lines removed, {diffStats.files} file(s) affected
                  </div>

                  {/* Show diff for the selected suggestion */}
                  <div className="mb-4">
                    <div className="text-xs font-medium text-foreground mb-2">{selectedSuggestion?.filePath}</div>
                     <pre className="bg-muted/30 border border-border p-3 rounded-md text-xs font-mono overflow-x-auto max-h-40">
                       {selectedSuggestion?.diff.split('\n').map((line, i) => (
                         <div key={i} className={cn(
                           line.startsWith('+') && "text-green-600 font-medium",
                           line.startsWith('-') && "text-red-600 font-medium",
                           !line.startsWith('+') && !line.startsWith('-') && "text-muted-foreground"
                         )}>
                           {line || '\u00A0'}
                         </div>
                       ))}
                     </pre>
                  </div>

                  {/* Show additional affected files if any */}
                  {diffStats.files > 1 && (
                    <div className="text-xs text-muted-foreground">
                      This change affects {diffStats.files - 1} other file{diffStats.files - 1 !== 1 ? 's' : ''} in the project.
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end">
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleReject} className="border-muted-foreground/20 hover:bg-muted/50">
                      <XIcon className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button variant="outline" onClick={handleAccept} className="border-muted-foreground/20 hover:bg-muted/50">
                      <Check className="h-4 w-4 mr-2" />
                      Accept
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}