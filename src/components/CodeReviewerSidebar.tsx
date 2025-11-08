import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Bot, Check, X as XIcon, Zap, ChevronDown, ChevronUp, ChevronLeft, Sparkles, GitBranch, Send, History, Copy, BookOpen, Settings, Play, Clock, Shield, BarChart3, Wrench, FileText, TestTube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAIReview, type SuggestionItem } from "@/lib/useAIReview";
import { ChatAssistant, type ChatMessage } from "@/lib/chatAssistant";
import { useSettings } from "@/lib/SettingsContext";
import { GeminiService } from "@/lib/geminiApi";
import { snippetStorage } from "@/lib/snippetStorage";
import { CodeSnippet } from "@/lib/analysis/types";
import { toast } from "@/hooks/use-toast";
import { DiffViewer } from "@/components/DiffViewer";

// Simple HTML sanitization function to prevent XSS
const sanitizeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// Function to render message content with code blocks
const renderMessageContent = (content: string) => {
  const parts = content.split(/(```[\w]*\n[\s\S]*?\n```)/g);

  return parts.map((part, index) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      // Extract language and code
      const match = part.match(/```(\w*)\n([\s\S]*?)\n```/);
      if (match) {
        const [, language, code] = match;
        return (
          <pre key={index} className="bg-gray-900 text-gray-100 p-3 rounded-md my-2 overflow-x-auto text-xs">
            <code className={`language-${language || 'text'}`}>
              {code}
            </code>
          </pre>
        );
      }
    }
    // Regular text
    return (
      <span key={index} className="whitespace-pre-wrap">
        {sanitizeHtml(part)}
      </span>
    );
  });
};

// Chat storage utilities
const CHAT_STORAGE_KEY = 'tidy_chat_history';

interface ChatStorageData {
  messages: ChatMessage[];
  inputMessage: string;
  lastUpdated: number;
}

const saveChatToStorage = (messages: ChatMessage[], inputMessage: string) => {
  try {
    const chatData: ChatStorageData = {
      messages,
      inputMessage,
      lastUpdated: Date.now()
    };
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chatData));
  } catch (error) {
    console.warn('Failed to save chat history:', error);
  }
};

const loadChatFromStorage = (): { messages: ChatMessage[], inputMessage: string } | null => {
  try {
    const saved = localStorage.getItem(CHAT_STORAGE_KEY);
    if (saved) {
      const parsed: ChatStorageData = JSON.parse(saved);
      // Convert timestamp strings back to Date objects
      const messages = parsed.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
      return {
        messages,
        inputMessage: parsed.inputMessage || ''
      };
    }
  } catch (error) {
    console.warn('Failed to load chat history:', error);
  }
  return null;
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



// Analysis types configuration
const ANALYSIS_TYPES = [
  { id: 'codeQuality', label: 'Code Quality', icon: Zap, description: 'Syntax, best practices, and code structure' },
  { id: 'security', label: 'Security', icon: Shield, description: 'Vulnerabilities and unsafe patterns' },
  { id: 'performance', label: 'Performance', icon: BarChart3, description: 'Efficiency and optimization opportunities' },
  { id: 'maintainability', label: 'Maintainability', icon: Wrench, description: 'Readability and code organization' },
  { id: 'testing', label: 'Testing', icon: TestTube, description: 'Test coverage and quality' },
  { id: 'documentation', label: 'Documentation', icon: FileText, description: 'Comments and API documentation' }
];

// Preset configurations
const ANALYSIS_PRESETS = {
  quick: ['codeQuality', 'security'],
  standard: ['codeQuality', 'security', 'performance'],
  full: ['codeQuality', 'security', 'performance', 'maintainability', 'testing', 'documentation']
};

export function CodeReviewerSidebar({ currentFile, currentFileData, onClose, onOpenDiff, onApplyChanges, onAnalyze, onConnectGitHub }: CodeReviewerSidebarProps) {
    const navigate = useNavigate();
    const [shouldAnalyze, setShouldAnalyze] = useState(false);
    const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>(ANALYSIS_PRESETS.quick);

  // Calculate estimated time based on selected analyses
  const getEstimatedTime = (analyses: string[]) => {
    const timePerAnalysis = 5; // seconds per analysis
    return analyses.length * timePerAnalysis;
  };

  const getAnalysisType = (analyses: string[]) => {
    if (analyses.length === 2 && analyses.includes('codeQuality') && analyses.includes('security')) {
      return 'Quick Review';
    }
    if (analyses.length === 3 && analyses.includes('codeQuality') && analyses.includes('security') && analyses.includes('performance')) {
      return 'Standard Review';
    }
    if (analyses.length === 6) {
      return 'Full Review';
    }
    return 'Custom Review';
  };
    const { data, loading, error, progress, cancelAnalysis } = useAIReview(currentFileData || '', currentFile, 'typescript', shouldAnalyze, selectedAnalyses);
      const [selectedSuggestion, setSelectedSuggestion] = useState<SuggestionItem | null>(null);
      const [isResolving, setIsResolving] = useState(false);
      const [showDiffViewer, setShowDiffViewer] = useState(false);
      const [pendingChanges, setPendingChanges] = useState<{ filePath: string; originalContent: string; newContent: string } | null>(null);
  const [retryCount, setRetryCount] = useState(0);
     const [expandedWalkthroughFiles, setExpandedWalkthroughFiles] = useState<Set<string>>(new Set());
    const [showChat, setShowChat] = useState(false);
    const [chatMode, setChatMode] = useState(false);

    // Persistent chat state - survives mode switches
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [chatAssistant, setChatAssistant] = useState<ChatAssistant | null>(null);
    const { settings } = useSettings();

    // Load chat history from localStorage on component mount
    useEffect(() => {
      const savedChat = loadChatFromStorage();
      if (savedChat) {
        setMessages(savedChat.messages);
        setInputMessage(savedChat.inputMessage);
      }
    }, []);

    // Save chat to localStorage whenever it changes
    useEffect(() => {
      if (messages.length > 0 || inputMessage.trim()) {
        saveChatToStorage(messages, inputMessage);
      }
    }, [messages, inputMessage]);

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

    // Initialize welcome message only if no saved chat exists
    useEffect(() => {
      if (messages.length === 0 && chatAssistant) {
        setMessages([{
          id: Date.now().toString(),
          role: 'assistant',
          content: `Hi! I'm Tidy, your AI coding assistant. I can help you analyze your code, answer questions, and provide suggestions. What would you like to know?`,
          timestamp: new Date(),
        }]);
      }
    }, [chatAssistant, messages.length]);

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
        // Simple fallback for demo - just show the existing diff
        setSelectedSuggestion({
          ...suggestion,
          diff: suggestion.diff || `// Suggested fix for: ${suggestion.title}\n// ${suggestion.description}\n\n${currentFileData}`,
          fixedCode: currentFileData
        });
      } catch (error) {
        console.error('Failed to resolve suggestion:', error);
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
    if (!selectedSuggestion) return;

    // Get the original content
    const originalContent = currentFileData || '';

    let newContent = '';
    if (selectedSuggestion.fixedCode) {
      newContent = selectedSuggestion.fixedCode;
    } else if (selectedSuggestion.diff) {
      // Simple diff application - in production, use a proper diff library
      const lines = selectedSuggestion.diff.split('\n');
      const resultLines: string[] = [];

      for (const line of lines) {
        if (line.startsWith('+') && !line.startsWith('+++')) {
          // Add line
          resultLines.push(line.substring(1));
        } else if (!line.startsWith('-') && !line.startsWith('+++')) {
          // Context or unchanged line
          resultLines.push(line.startsWith(' ') ? line.substring(1) : line);
        }
        // Skip removal lines for now (simplified approach)
      }

      newContent = resultLines.join('\n');
    }

    // Show diff viewer
    setPendingChanges({
      filePath: selectedSuggestion.filePath,
      originalContent,
      newContent
    });
    setShowDiffViewer(true);
  };

  const handleConfirmAccept = () => {
    if (pendingChanges) {
      onApplyChanges(pendingChanges.filePath, pendingChanges.newContent);
      setSelectedSuggestion(null);
      setPendingChanges(null);
      setShowDiffViewer(false);
      toast({
        title: "Success!",
        description: "Changes applied successfully",
      });
    }
  };

  const handleRejectChanges = () => {
    setSelectedSuggestion(null);
    setPendingChanges(null);
    setShowDiffViewer(false);
  };

  const handleRetryAnalysis = () => {
    setRetryCount(prev => prev + 1);
    setShouldAnalyze(true);
    onAnalyze?.();
  };

  const getErrorMessage = (error: string) => {
    if (error.includes('API key') || error.includes('authentication')) {
      return {
        title: 'API Configuration Issue',
        message: 'Please check your Gemini API key in settings.',
        action: 'Open Settings',
        actionFn: () => {
          // Could open settings modal or navigate to settings
          toast({
            title: "API Key Required",
            description: "Please configure your API key in settings",
            variant: "destructive",
          });
        }
      };
    }
    if (error.includes('quota') || error.includes('rate limit')) {
      return {
        title: 'API Quota Exceeded',
        message: 'You\'ve reached your API usage limit. Try again later.',
        action: 'Retry Later',
        actionFn: () => setRetryCount(0)
      };
    }
    if (error.includes('network') || error.includes('timeout')) {
      return {
        title: 'Connection Issue',
        message: 'Unable to connect to AI services. Check your internet connection.',
        action: 'Retry',
        actionFn: handleRetryAnalysis
      };
    }
    return {
      title: 'Analysis Failed',
      message: error,
      action: 'Retry',
      actionFn: handleRetryAnalysis
    };
  };

  const handleQuickApply = (suggestion: SuggestionItem) => {
    if (suggestion.fixedCode) {
      onApplyChanges(suggestion.filePath, suggestion.fixedCode);
      toast({
        title: "Quick fix applied!",
        description: "Code improvement has been applied",
      });
    }
  };

  // Determine if a suggestion can be quick-applied
  const canQuickApply = (suggestion: SuggestionItem) => {
    // Quick apply for low-risk, high-confidence fixes
    return suggestion.impactLevel === 'low' ||
           suggestion.title.toLowerCase().includes('missing') ||
           suggestion.title.toLowerCase().includes('unused') ||
           suggestion.title.toLowerCase().includes('formatting');
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

    const applyCodeSuggestion = (suggestion: { description: string; originalSnippet: string; suggestedSnippet: string; applyCommand: string }) => {
      try {
        // Simple string replacement for demo
        const currentContent = currentFileData;
        const newContent = currentContent.replace(suggestion.originalSnippet, suggestion.suggestedSnippet);

        // Apply the change to the file
        onApplyChanges?.(currentFile, newContent);

        // Add success message
        const successMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: '✅ Code change applied successfully!',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, successMessage]);

      } catch (error) {
        console.error('Failed to apply code suggestion:', error);
        const errorMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: '❌ Failed to apply the code change. Please try again.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
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

        if (typeof aiResponse === 'object' && aiResponse && 'type' in aiResponse && aiResponse.type === 'code_suggestion') {
          // Handle code suggestion
          const suggestionMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: aiResponse.data.description,
            timestamp: new Date(),
            codeSuggestion: aiResponse.data
          };
          setMessages(prev => [...prev, suggestionMessage]);
        } else if (typeof aiResponse === 'string') {
          // Handle regular text response
          const aiMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: aiResponse,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, aiMessage]);
        }
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
          <h2 className="text-sm font-medium text-foreground">AI Assistant</h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={cancelAnalysis}
              className="h-6 px-2 text-xs hover:bg-destructive/10 hover:text-destructive"
              disabled={!loading}
            >
              Stop
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 rounded hover:bg-muted/50">
              <X className="h-3 w-3" />
            </Button>
          </div>
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
  if (loading) {
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
                 <h3 className="text-lg font-medium text-foreground">
                   {getAnalysisType(selectedAnalyses)} in progress...
                 </h3>
                 <p className="text-sm text-muted-foreground">
                   {currentAnalyzer ? `Analyzing ${currentAnalyzer}...` : 'Preparing analysis...'}
                 </p>
                 <Progress value={progressPercent} className="w-full" />
                 <div className="flex justify-between items-center text-xs text-muted-foreground">
                   <span>{progress?.current || 0} of {progress?.total || selectedAnalyses.length} completed</span>
                   <span>~{Math.max(1, getEstimatedTime(selectedAnalyses) - Math.floor((progress?.current || 0) * getEstimatedTime(selectedAnalyses) / (progress?.total || selectedAnalyses.length)))}s remaining</span>
                 </div>
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
               size="sm"
               onClick={() => setShowChat(false)}
               className="h-7 px-2 text-xs hover:bg-muted/50"
               title="Back to Analysis"
             >
               <ChevronLeft className="h-3 w-3 mr-1" />
               Back
             </Button>
             <h2 className="text-sm font-medium text-foreground">Chat with Tidy</h2>
           </div>
           <Button
             variant="ghost"
             size="icon"
             onClick={onClose}
             className="h-6 w-6 rounded hover:bg-muted/50"
             title="Close Sidebar"
           >
             <X className="h-3 w-3" />
           </Button>
        </div>

        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                 <div key={message.id} className="w-full flex justify-start animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className={`max-w-[85%] rounded-lg px-3 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}>
                      {message.role === 'user' && (
                        <div className="text-xs font-medium text-primary-foreground/70 mb-1">You</div>
                      )}
                      <div className="text-sm">
                        {renderMessageContent(message.content)}
                      </div>
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

  // Show chat-only mode
  if (chatMode) {
    return (
      <div className="h-full bg-background border-l border-border flex flex-col font-inter">
        <div className="h-12 px-3 py-2 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setChatMode(false)}
              className="h-6 w-6 rounded hover:bg-muted/50"
            >
              <X className="h-3 w-3 rotate-90" />
            </Button>
            <h2 className="text-sm font-medium text-foreground">Chat with Tidy</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 rounded hover:bg-muted/50">
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Chat Messages */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <Bot className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Hi! I'm Tidy, your AI coding assistant. How can I help you today?</p>
                </div>
              ) : (
                messages.map((message, index) => (
                   <div key={message.id} className="w-full flex justify-start animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                     <div className={`max-w-[85%] rounded-lg px-3 py-2 ${
                       message.role === 'user'
                         ? 'bg-primary text-primary-foreground'
                         : 'bg-muted text-muted-foreground'
                     }`}>
                        {message.role === 'user' && (
                          <div className="text-xs font-medium text-primary-foreground/70 mb-1">You</div>
                        )}
                        {message.codeSuggestion ? (
                        <div className="space-y-3">
                          <p className="text-sm font-medium">🤖 {message.codeSuggestion.description}</p>

                          <div className="space-y-2">
                            <div>
                              <p className="text-xs font-medium text-red-600 mb-1">Before:</p>
                              <pre className="text-xs bg-red-50 dark:bg-red-950/20 p-2 rounded border text-red-800 dark:text-red-200 overflow-x-auto">
                                {message.codeSuggestion.originalSnippet}
                              </pre>
                            </div>

                            <div>
                              <p className="text-xs font-medium text-green-600 mb-1">After:</p>
                              <pre className="text-xs bg-green-50 dark:bg-green-950/20 p-2 rounded border text-green-800 dark:text-green-200 overflow-x-auto">
                                {message.codeSuggestion.suggestedSnippet}
                              </pre>
                            </div>
                          </div>

                              <div className="flex gap-1 flex-wrap">
                                <Button
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      await navigator.clipboard.writeText(message.codeSuggestion!.suggestedSnippet);
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
                                  }}
                                  className="bg-black text-white hover:bg-gray-800 text-xs py-1 px-2 h-auto"
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copy
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    // Auto-detect category and create snippet
                                    const code = message.codeSuggestion!.suggestedSnippet;
                                    const description = message.codeSuggestion!.description;

                                    // Simple category detection
                                    let category: CodeSnippet['category'] = 'utility';
                                    if (description.toLowerCase().includes('error') || code.includes('try') || code.includes('catch')) {
                                      category = 'error-handling';
                                    } else if (description.toLowerCase().includes('security') || code.includes('sanitize') || code.includes('validate')) {
                                      category = 'security';
                                    } else if (description.toLowerCase().includes('async') || code.includes('async') || code.includes('await')) {
                                      category = 'performance';
                                    }

                                    // Auto-generate title
                                    const title = description.length > 50
                                      ? description.substring(0, 47) + '...'
                                      : description;

                                    // Auto-detect language
                                    const language = code.includes('function') || code.includes('const') || code.includes('let')
                                      ? 'typescript'
                                      : 'javascript';

                                    // Auto-generate tags
                                    const tags = [];
                                    if (code.includes('try') || code.includes('catch')) tags.push('error-handling');
                                    if (code.includes('async') || code.includes('await')) tags.push('async');
                                    if (code.includes('function')) tags.push('function');

                                    snippetStorage.saveSnippet({
                                      title,
                                      description,
                                      code,
                                      language,
                                      tags,
                                      category,
                                      source: 'chat-suggestion',
                                      metadata: {
                                        chatContext: 'AI code suggestion from chat',
                                      },
                                    });

                                    toast({
                                      title: "Snippet saved!",
                                      description: `Saved to ${category.replace('-', ' ')} category`,
                                    });
                                  }}
                                  className="bg-black text-white hover:bg-gray-800 text-xs py-1 px-2 h-auto"
                                >
                                  <BookOpen className="h-3 w-3 mr-1" />
                                  Save
                                </Button>
                                {message.codeSuggestion!.type === 'improvement' && (
                                  <Button
                                    size="sm"
                                    onClick={() => applyCodeSuggestion(message.codeSuggestion!)}
                                    className="bg-black text-white hover:bg-gray-800 text-xs py-1 px-2 h-auto"
                                  >
                                    Apply
                                 </Button>
                               )}
                             </div>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{sanitizeHtml(message.content)}</p>
                      )}
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
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

        <div className="flex-1 flex flex-col">
          {/* Top section with buttons */}
          <div className="p-6 border-b border-border">
            <div className="w-full max-w-sm mx-auto space-y-4">
              <div className="text-center">
                <Bot className="h-12 w-12 text-black mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">AI Code Assistant</h3>
                <p className="text-sm text-muted-foreground">Enhance your coding experience with AI-powered tools</p>
              </div>

               <div className="space-y-3">
                 <DropdownMenu>
                   <DropdownMenuTrigger asChild>
                     <Button
                       className="w-full h-12 border-2 border-dashed border-muted-foreground/30 rounded-xl bg-background hover:bg-muted/50 transition-all duration-300 hover:border-muted-foreground/50 hover:shadow-sm"
                       variant="outline"
                     >
                       <Sparkles className="h-5 w-5 mr-3" />
                       <span className="font-medium">Analyze Code</span>
                       <ChevronDown className="h-4 w-4 ml-auto" />
                     </Button>
                   </DropdownMenuTrigger>
                   <DropdownMenuContent className="w-80 p-4" align="start">
                     <div className="space-y-4">
                       <div>
                         <h4 className="font-medium text-sm mb-3">Quick Presets</h4>
                         <div className="grid grid-cols-1 gap-2">
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => {
                               setSelectedAnalyses(ANALYSIS_PRESETS.quick);
                               setShouldAnalyze(true);
                               onAnalyze?.();
                             }}
                             className="justify-start h-8"
                           >
                             <Clock className="h-3 w-3 mr-2" />
                             Quick Review (2 checks - ~10s)
                           </Button>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => {
                               setSelectedAnalyses(ANALYSIS_PRESETS.standard);
                               setShouldAnalyze(true);
                               onAnalyze?.();
                             }}
                             className="justify-start h-8"
                           >
                             <Play className="h-3 w-3 mr-2" />
                             Standard Review (3 checks - ~15s)
                           </Button>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => {
                               setSelectedAnalyses(ANALYSIS_PRESETS.full);
                               setShouldAnalyze(true);
                               onAnalyze?.();
                             }}
                             className="justify-start h-8"
                           >
                             <Settings className="h-3 w-3 mr-2" />
                             Full Review (6 checks - ~30s)
                           </Button>
                         </div>
                       </div>

                       <DropdownMenuSeparator />

                       <div>
                         <h4 className="font-medium text-sm mb-3">Custom Analysis</h4>
                         <div className="space-y-2">
                           {ANALYSIS_TYPES.map((type) => {
                             const Icon = type.icon;
                             const isSelected = selectedAnalyses.includes(type.id);
                             return (
                               <div key={type.id} className="flex items-center space-x-2">
                                 <Checkbox
                                   id={type.id}
                                   checked={isSelected}
                                   onCheckedChange={(checked) => {
                                     if (checked) {
                                       setSelectedAnalyses(prev => [...prev, type.id]);
                                     } else {
                                       setSelectedAnalyses(prev => prev.filter(id => id !== type.id));
                                     }
                                   }}
                                 />
                                 <label
                                   htmlFor={type.id}
                                   className="flex items-center space-x-2 text-sm cursor-pointer flex-1"
                                 >
                                   <Icon className="h-3 w-3" />
                                   <div>
                                     <div className="font-medium">{type.label}</div>
                                     <div className="text-xs text-muted-foreground">{type.description}</div>
                                   </div>
                                 </label>
                               </div>
                             );
                           })}
                         </div>
                         <Button
                           onClick={() => {
                             setShouldAnalyze(true);
                             onAnalyze?.();
                           }}
                           className="w-full mt-3 h-8"
                           disabled={selectedAnalyses.length === 0}
                         >
                           <Sparkles className="h-3 w-3 mr-2" />
                           Run Custom Analysis ({selectedAnalyses.length} checks)
                         </Button>
                       </div>
                     </div>
                   </DropdownMenuContent>
                 </DropdownMenu>

                <Button
                  onClick={() => setChatMode(true)}
                  className="w-full h-12 border-2 border-dashed border-muted-foreground/30 rounded-xl bg-background hover:bg-muted/50 transition-all duration-300 hover:border-muted-foreground/50 hover:shadow-sm"
                  variant="outline"
                >
                  <Bot className="h-5 w-5 mr-3" />
                  <span className="font-medium">Chat with Tidy</span>
                </Button>

                <Button
                  onClick={onConnectGitHub}
                  className="w-full h-12 border-2 border-dashed border-muted-foreground/30 rounded-xl bg-background hover:bg-muted/50 transition-all duration-300 hover:border-muted-foreground/50 hover:shadow-sm"
                  variant="outline"
                >
                  <GitBranch className="h-5 w-5 mr-3" />
                  <span className="font-medium">Manage Github</span>
                </Button>

                <Button
                  onClick={() => navigate('/history')}
                  className="w-full h-12 border-2 border-dashed border-muted-foreground/30 rounded-xl bg-background hover:bg-muted/50 transition-all duration-300 hover:border-muted-foreground/50 hover:shadow-sm"
                  variant="outline"
                >
                  <History className="h-5 w-5 mr-3" />
                  <span className="font-medium">View History</span>
                </Button>
              </div>
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
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm space-y-4 text-center">
            <div className="space-y-3">
              <div className="relative mx-auto w-12 h-12">
                <div className="absolute inset-0 border-4 border-destructive/20 rounded-full"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <X className="h-5 w-5 text-destructive" />
                </div>
              </div>

              {(() => {
                const errorInfo = getErrorMessage(error || 'Unknown error');
                return (
                  <>
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-foreground">{errorInfo.title}</h3>
                      <p className="text-xs text-muted-foreground">{errorInfo.message}</p>
                    </div>

                     <div className="flex justify-center gap-2">
                       <Button
                         size="sm"
                         onClick={errorInfo.actionFn}
                         className="bg-black text-white hover:bg-gray-800 text-xs py-1 px-3 h-auto"
                       >
                         {errorInfo.action}
                      </Button>
                      {retryCount < 2 && (
                        <Button
                          size="sm"
                          onClick={handleRetryAnalysis}
                          className="h-8 px-3 text-xs"
                        >
                          Try Again
                        </Button>
                      )}
                    </div>

                    {retryCount > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Retry attempt {retryCount} of 2
                      </p>
                    )}
                  </>
                );
              })()}
            </div>
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
                       <div className="flex gap-1">
                         {canQuickApply(item) && (
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => handleQuickApply(item)}
                             className="h-6 px-2 text-xs border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
                           >
                             <Check className="h-3 w-3 mr-1" />
                             Quick Apply
                           </Button>
                         )}
                         <Button
                           size="sm"
                           variant="outline"
                           onClick={() => handleResolve(item)}
                           className="h-6 px-2 text-xs border-muted-foreground/20 hover:bg-muted/50"
                         >
                           <Zap className="h-3 w-3 mr-1" />
                           Review
                         </Button>
                       </div>
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

                 <div className="flex items-center justify-end mt-3">
                   <div className="flex gap-2 w-full">
                     <Button
                       variant="outline"
                       onClick={handleReject}
                       className="flex-1 bg-black text-white border-black hover:bg-gray-800 hover:border-gray-800 text-xs py-1.5 h-auto"
                     >
                       <XIcon className="h-3 w-3 mr-1" />
                       Reject
                     </Button>
                     <Button
                       onClick={handleAccept}
                       className="flex-1 bg-black text-white hover:bg-gray-800 text-xs py-1.5 h-auto"
                     >
                       <Check className="h-3 w-3 mr-1" />
                       Accept
                     </Button>
                   </div>
                 </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Diff Viewer */}
      {pendingChanges && (
        <DiffViewer
          isOpen={showDiffViewer}
          onClose={() => setShowDiffViewer(false)}
          filePath={pendingChanges.filePath}
          originalContent={pendingChanges.originalContent}
          newContent={pendingChanges.newContent}
          onAccept={handleConfirmAccept}
          onReject={handleRejectChanges}
        />
      )}
    </>
  );
}