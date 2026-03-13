import { MainLayout } from "./layouts/MainLayout";
import { MarkdownEditor } from "./components/Editor/Editor";
import { motion } from "framer-motion";

const INITIAL_CONTENT = `# Welcome to Spark
A local-first knowledge management application.

## Features
- **Local-First**: Your data lives on your machine.
- **Git Sync**: Automatically synchronize with your git repositories.
- **Markdown**: Use standard Markdown syntax.

> "Knowledge is power."

### Getting Started
Start typing here to edit this document.
`;

function App() {
  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full h-full max-w-4xl mx-auto mt-4"
      >
        <MarkdownEditor
          initialContent={INITIAL_CONTENT}
          onChange={(markdown) => {
            console.log("Markdown updated:", markdown);
          }}
        />
      </motion.div>
    </MainLayout>
  );
}

export default App;
