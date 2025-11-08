// Demo scenarios for hackathon presentation
// These showcase different use cases for the Code Snippet Library

const demoScenarios = {
  // Scenario 1: AI Chat Integration
  chatSuggestions: [
    "Ask Tidy: 'How do I handle errors in async functions?'",
    "Save the suggested try-catch wrapper from chat",
    "Show how it appears in the library with auto-categorization"
  ],

  // Scenario 2: Manual Code Organization
  manualSnippets: [
    {
      title: "React Error Boundary",
      description: "Reusable error boundary component for React apps",
      code: `class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong.</h2>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}`,
      language: "typescript",
      tags: ["react", "error-handling", "component", "boundary"],
      category: "error-handling",
      source: "manual"
    }
  ],

  // Scenario 3: Search and Filter Demo
  searchDemo: [
    "Search for 'error' to find error-handling snippets",
    "Filter by 'Security' category",
    "Sort by 'Most Used' to see popular patterns"
  ],

  // Scenario 4: Copy to Clipboard
  clipboardDemo: [
    "Click 'Copy' on any snippet",
    "Paste into your code editor",
    "Show usage tracking increases"
  ],

  // Scenario 5: Statistics Dashboard
  statsDemo: [
    "View total snippets count",
    "See most used snippets",
    "Check category distribution"
  ]
};

export default demoScenarios;