import { DocsLayout } from "@/components/docs/DocsLayout";
import { Badge } from "@/components/ui/badge";

const Chat = () => {
  return (
    <DocsLayout>
      <div className="mb-8">
        <Badge variant="secondary" className="mb-4">Features</Badge>
        <h1 id="chat-assistant">Chat Assistant</h1>
        <p className="text-xl text-muted-foreground">
          Context-aware AI assistant for code help, suggestions, and explanations.
        </p>
      </div>

      <h2 id="overview">Overview</h2>
      <p>
        The Chat Assistant is an intelligent conversational AI powered by Google Gemini. It understands your code context and provides targeted help, explanations, and suggestions through natural language interaction.
      </p>

      <h2 id="capabilities">Capabilities</h2>

      <h3 id="code-help">Code Help</h3>
      <p>Ask questions about your code and get instant answers:</p>
      <ul>
        <li>Explain complex code sections</li>
        <li>Clarify syntax and language features</li>
        <li>Suggest alternative implementations</li>
        <li>Debug issues and errors</li>
      </ul>

      <h3 id="suggestions">Intelligent Suggestions</h3>
      <p>Receive code improvements directly in chat:</p>
      <ul>
        <li>One-click code insertion</li>
        <li>Syntax-highlighted suggestions</li>
        <li>Before/after comparisons</li>
        <li>Explanation of changes</li>
      </ul>

      <h3 id="context-awareness">Context Awareness</h3>
      <p>The assistant understands:</p>
      <ul>
        <li>Current file content</li>
        <li>Recent analysis results</li>
        <li>Previous conversation history</li>
        <li>Project structure</li>
      </ul>

      <h2 id="using-chat">Using the Chat</h2>

      <h3 id="starting">Starting a Conversation</h3>
      <ol>
        <li>Open the code reviewer sidebar</li>
        <li>Type your question in the chat input</li>
        <li>Press Enter or click Send</li>
        <li>Wait for AI response</li>
      </ol>

      <h3 id="questions">Example Questions</h3>
      <pre><code>{`"How can I optimize this function?"
"What's wrong with this code?"
"Explain how this algorithm works"
"Suggest a better way to handle errors"
"Add error handling to this function"
"Convert this to TypeScript"
"Add unit tests for this code"`}</code></pre>

      <h3 id="applying-suggestions">Applying Suggestions</h3>
      <p>When the assistant provides code:</p>
      <ol>
        <li>Review the suggested code in the chat</li>
        <li>Click "Apply" button next to the suggestion</li>
        <li>Code is inserted at cursor position</li>
        <li>Or replaces selected code if applicable</li>
      </ol>

      <h2 id="features">Chat Features</h2>

      <h3 id="persistence">Persistent Conversations</h3>
      <p>Chat history is automatically saved:</p>
      <ul>
        <li>Conversations persist across sessions</li>
        <li>Access previous discussions</li>
        <li>Continue where you left off</li>
        <li>Clear history when needed</li>
      </ul>

      <h3 id="formatting">Message Formatting</h3>
      <p>Chat supports rich formatting:</p>
      <ul>
        <li>Markdown syntax</li>
        <li>Code blocks with syntax highlighting</li>
        <li>Inline code with <code>`backticks`</code></li>
        <li>Lists and emphasis</li>
      </ul>

      <h3 id="snippets">Save to Snippets</h3>
      <p>Useful suggestions can be saved:</p>
      <ol>
        <li>Click "Save as Snippet" on code suggestions</li>
        <li>Add title and description</li>
        <li>AI auto-categorizes the snippet</li>
        <li>Access later from snippet library</li>
      </ol>

      <h2 id="best-practices">Best Practices</h2>

      <h3 id="asking">Asking Effective Questions</h3>
      <ul>
        <li>Be specific about what you need help with</li>
        <li>Provide context if asking about external code</li>
        <li>Mention the programming language explicitly</li>
        <li>Include error messages if debugging</li>
      </ul>

      <h3 id="reviewing">Reviewing Suggestions</h3>
      <ul>
        <li>Always review AI suggestions before applying</li>
        <li>Understand why the change is recommended</li>
        <li>Consider project-specific requirements</li>
        <li>Test changes after applying</li>
      </ul>

      <h2 id="use-cases">Common Use Cases</h2>

      <h3 id="debugging">Debugging Assistance</h3>
      <pre><code>{`You: "This function throws a TypeError. What's wrong?"
Assistant: *analyzes code*
"The error occurs because... Here's the fix:"`}</code></pre>

      <h3 id="optimization">Code Optimization</h3>
      <pre><code>{`You: "How can I make this loop more efficient?"
Assistant: "You can optimize this by... [code suggestion]"`}</code></pre>

      <h3 id="learning">Learning & Education</h3>
      <pre><code>{`You: "Explain how async/await works in this context"
Assistant: "Async/await is syntactic sugar for Promises..."`}</code></pre>

      <h3 id="refactoring">Refactoring Help</h3>
      <pre><code>{`You: "Refactor this to use modern ES6 features"
Assistant: "Here's the refactored version using..."`}</code></pre>

      <h2 id="configuration">Configuration</h2>

      <h3 id="ai-settings">AI Settings</h3>
      <p>Customize chat behavior in settings:</p>
      <ul>
        <li><strong>Model</strong> - Select Gemini model version</li>
        <li><strong>Temperature</strong> - Control response creativity</li>
        <li><strong>Max Tokens</strong> - Limit response length</li>
      </ul>

      <h3 id="context-settings">Context Settings</h3>
      <p>Control what context is shared:</p>
      <ul>
        <li>Current file content</li>
        <li>Analysis results</li>
        <li>Open files</li>
        <li>Chat history length</li>
      </ul>

      <h2 id="limitations">Limitations</h2>
      <ul>
        <li>Response quality depends on question clarity</li>
        <li>May not understand highly domain-specific code</li>
        <li>API rate limits affect conversation frequency</li>
        <li>Offline mode disables chat functionality</li>
        <li>Context window limits very long conversations</li>
      </ul>

      <h2 id="tips">Pro Tips</h2>
      <ul>
        <li>Use chat for quick clarifications during development</li>
        <li>Save frequently used patterns as snippets</li>
        <li>Ask for multiple alternatives to compare approaches</li>
        <li>Use chat to learn new patterns and techniques</li>
        <li>Clear history periodically for better performance</li>
      </ul>
    </DocsLayout>
  );
};

export default Chat;