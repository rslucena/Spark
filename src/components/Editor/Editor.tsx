import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import { Toolbar } from "./Toolbar";
import { useEffect, useState } from "react";

interface EditorProps {
  initialContent?: string;
  onChange?: (markdown: string) => void;
}

export function MarkdownEditor({ initialContent = "", onChange }: EditorProps) {
  const [content, setContent] = useState(initialContent);

  const editor = useEditor({
    extensions: [StarterKit, Markdown],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const markdown = editor.storage.markdown.getMarkdown();
      setContent(markdown);
      if (onChange) {
        onChange(markdown);
      }
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-invert prose-p:my-2 prose-headings:my-4 prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl focus:outline-none max-w-none min-h-[500px]",
      },
    },
  });

  // Update editor content when initialContent changes (e.g. loading a new file)
  useEffect(() => {
    if (editor && initialContent !== editor.storage.markdown.getMarkdown()) {
      editor.commands.setContent(initialContent);
    }
  }, [initialContent, editor]);

  return (
    <div className="w-full h-full flex flex-col bg-neutral-900 text-neutral-200">
      <Toolbar editor={editor} />
      <div className="flex-1 overflow-y-auto px-8 pb-8">
        <EditorContent editor={editor} className="h-full" />
      </div>

      {/* Dev only: Markdown preview */}
      <div className="mt-8 p-4 bg-neutral-950 border-t border-neutral-800 hidden">
        <h3 className="text-sm font-semibold text-neutral-500 mb-2">Markdown Preview (Dev Only)</h3>
        <pre className="text-xs text-neutral-400 whitespace-pre-wrap">{content}</pre>
      </div>
    </div>
  );
}
