import { Routes, Route } from "react-router-dom";
import DocsIndex from "./docs/DocsIndex";
import GettingStarted from "./docs/GettingStarted";
import AIAnalysis from "./docs/features/AIAnalysis";
import Editor from "./docs/features/Editor";
import Chat from "./docs/features/Chat";
import Snippets from "./docs/features/Snippets";
import Architecture from "./docs/technical/Architecture";
import API from "./docs/technical/API";
import Configuration from "./docs/technical/Configuration";
import Structure from "./docs/developer/Structure";
import Development from "./docs/developer/Development";

const Docs = () => {
  return (
    <Routes>
      <Route path="/" element={<DocsIndex />} />
      <Route path="/getting-started" element={<GettingStarted />} />
      <Route path="/features/ai-analysis" element={<AIAnalysis />} />
      <Route path="/features/editor" element={<Editor />} />
      <Route path="/features/chat" element={<Chat />} />
      <Route path="/features/snippets" element={<Snippets />} />
      <Route path="/technical/architecture" element={<Architecture />} />
      <Route path="/technical/api" element={<API />} />
      <Route path="/technical/configuration" element={<Configuration />} />
      <Route path="/developer/structure" element={<Structure />} />
      <Route path="/developer/development" element={<Development />} />
    </Routes>
  );
};

export default Docs;