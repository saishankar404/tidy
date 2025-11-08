import { DocsLayout } from "@/components/docs/DocsLayout";
import { Badge } from "@/components/ui/badge";

const Editor = () => {
  return (
    <DocsLayout>
      <div className="mb-8">
        <Badge variant="secondary" className="mb-4">Features</Badge>
        <h1 id="code-editor">Code Editor</h1>
        <p className="text-xl text-muted-foreground">
          Full-featured Monaco editor with multi-file support and advanced capabilities.
        </p>
      </div>

      <h2 id="overview">Overview</h2>
      <p>
        TIDY Editor uses Microsoft's Monaco Editor, the same editor that powers Visual Studio Code. This provides a professional, feature-rich editing experience with syntax highlighting, IntelliSense, and more.
      </p>

      <h2 id="features">Core Features</h2>

      <h3 id="syntax">Syntax Highlighting</h3>
      <p>Automatic syntax highlighting for 70+ programming languages including:</p>
      <ul>
        <li>JavaScript, TypeScript</li>
        <li>React, Vue, Angular</li>
        <li>Python, Java, C++, Go</li>
        <li>HTML, CSS, SCSS</li>
        <li>JSON, YAML, XML</li>
        <li>Markdown, SQL</li>
      </ul>

      <h3 id="intellisense">IntelliSense</h3>
      <p>Smart code completion with:</p>
      <ul>
        <li>Context-aware suggestions</li>
        <li>Parameter hints</li>
        <li>Quick info on hover</li>
        <li>Auto-imports</li>
        <li>Signature help</li>
      </ul>

      <h3 id="multi-file">Multi-File Support</h3>
      <p>Work with multiple files simultaneously:</p>
      <ul>
        <li>Tabbed interface for open files</li>
        <li>Quick file switching</li>
        <li>File tree navigation</li>
        <li>Unsaved changes indicators</li>
      </ul>

      <h3 id="file-management">File Management</h3>
      <p>Complete file system operations:</p>
      <ul>
        <li>Create files and folders</li>
        <li>Rename and delete</li>
        <li>Move files between folders</li>
        <li>Drag and drop support</li>
      </ul>

      <h2 id="editor-features">Editor Capabilities</h2>

      <h3 id="editing">Advanced Editing</h3>
      <ul>
        <li><strong>Multi-cursor editing</strong> - Edit multiple locations simultaneously</li>
        <li><strong>Find and replace</strong> - Search with regex support</li>
        <li><strong>Code folding</strong> - Collapse and expand code blocks</li>
        <li><strong>Auto-formatting</strong> - Format code on save or command</li>
        <li><strong>Bracket matching</strong> - Highlight matching brackets</li>
      </ul>

      <h3 id="navigation">Code Navigation</h3>
      <ul>
        <li><strong>Go to definition</strong> - Jump to function/variable definitions</li>
        <li><strong>Find all references</strong> - Locate all usages</li>
        <li><strong>Outline view</strong> - Navigate by symbols</li>
        <li><strong>Breadcrumbs</strong> - Show current position</li>
      </ul>

      <h3 id="customization">Customization</h3>
      <ul>
        <li><strong>Theme support</strong> - Light and dark themes</li>
        <li><strong>Font settings</strong> - Customize font family and size</li>
        <li><strong>Minimap</strong> - Code overview (experimental)</li>
        <li><strong>Line numbers</strong> - Relative or absolute</li>
      </ul>

      <h2 id="keyboard">Keyboard Shortcuts</h2>

      <h3 id="general">General</h3>
      <table>
        <thead>
          <tr>
            <th>Shortcut</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>Ctrl+S</code></td>
            <td>Save file</td>
          </tr>
          <tr>
            <td><code>Ctrl+F</code></td>
            <td>Find</td>
          </tr>
          <tr>
            <td><code>Ctrl+H</code></td>
            <td>Find and replace</td>
          </tr>
          <tr>
            <td><code>Ctrl+/</code></td>
            <td>Toggle comment</td>
          </tr>
          <tr>
            <td><code>Ctrl+D</code></td>
            <td>Select next occurrence</td>
          </tr>
        </tbody>
      </table>

      <h3 id="editing-shortcuts">Editing</h3>
      <table>
        <thead>
          <tr>
            <th>Shortcut</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>Alt+Up/Down</code></td>
            <td>Move line up/down</td>
          </tr>
          <tr>
            <td><code>Shift+Alt+Down</code></td>
            <td>Copy line down</td>
          </tr>
          <tr>
            <td><code>Ctrl+Shift+K</code></td>
            <td>Delete line</td>
          </tr>
          <tr>
            <td><code>Ctrl+]</code></td>
            <td>Indent line</td>
          </tr>
          <tr>
            <td><code>Ctrl+[</code></td>
            <td>Outdent line</td>
          </tr>
        </tbody>
      </table>

      <h2 id="panels">Resizable Panels</h2>
      <p>The editor interface uses resizable panels for flexible workflow:</p>
      <ul>
        <li><strong>Left sidebar</strong> - File tree and navigation</li>
        <li><strong>Main editor</strong> - Code editing area</li>
        <li><strong>Right sidebar</strong> - AI analysis and chat</li>
      </ul>
      <p>Drag panel borders to resize according to your preference.</p>

      <h2 id="file-tree">File Tree</h2>

      <h3 id="creating">Creating Files</h3>
      <ol>
        <li>Click the "+" icon in the file tree header</li>
        <li>Enter file name with extension</li>
        <li>File opens automatically in editor</li>
      </ol>

      <h3 id="organizing">Organizing Files</h3>
      <ul>
        <li>Create folders for organization</li>
        <li>Nest files within folders</li>
        <li>Rename by right-clicking (context menu)</li>
        <li>Delete unused files</li>
      </ul>

      <h2 id="experimental">Experimental Features</h2>

      <h3 id="tab-bar">Tab Bar</h3>
      <p>Enable in settings for a traditional tab-based interface:</p>
      <ul>
        <li>Visual tabs for all open files</li>
        <li>Close buttons on tabs</li>
        <li>Reorder tabs by dragging</li>
        <li>Unsaved indicator on tabs</li>
      </ul>

      <h3 id="minimap-feature">Minimap</h3>
      <p>Code overview sidebar showing:</p>
      <ul>
        <li>Condensed view of entire file</li>
        <li>Current viewport indicator</li>
        <li>Quick navigation by clicking</li>
        <li>Syntax highlighting preserved</li>
      </ul>

      <h2 id="performance">Performance</h2>
      <p>The editor is optimized for performance:</p>
      <ul>
        <li>Lazy loading of large files</li>
        <li>Virtualized rendering for long files</li>
        <li>Efficient syntax highlighting</li>
        <li>Debounced auto-save</li>
      </ul>

      <h2 id="tips">Tips & Tricks</h2>
      <ul>
        <li>Use <code>Ctrl+P</code> for quick file opening</li>
        <li>Multi-cursor with <code>Ctrl+Alt+Down</code></li>
        <li>Column selection with <code>Shift+Alt+Drag</code></li>
        <li>Format on save for consistent code style</li>
        <li>Use code folding to focus on specific sections</li>
      </ul>
    </DocsLayout>
  );
};

export default Editor;