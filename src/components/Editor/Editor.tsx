import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import Link from "@tiptap/extension-link";
import { Toolbar } from "./Toolbar";
import { useEffect, useState } from "react";

interface EditorProps {
  initialContent?: string;
  onChange?: (markdown: string) => void;
  onLinkClick?: (url: string) => void;
}

export function MarkdownEditor({ initialContent = "", onChange, onLinkClick }: EditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isRawMode, setIsRawMode] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit, 
      Markdown,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-400 hover:text-blue-300 underline cursor-pointer",
        },
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      // @ts-ignore
      const markdown = editor.storage.markdown.getMarkdown();
      setContent(markdown);
      if (onChange) {
        onChange(markdown);
      }
    },
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert prose-p:my-2 prose-headings:my-4 prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl focus:outline-none max-w-none min-h-[500px]",
      },
    },
  });

  // Intercept all link clicks in capture phase to prevent browser navigation
  const handleCaptureClick = (event: React.MouseEvent) => {
    const target = (event.target as HTMLElement).closest("a");
    if (target) {
      const url = target.getAttribute("href");
      
      if (url && onLinkClick) {
        event.preventDefault();
        event.stopPropagation();
        onLinkClick(url);
      }
    }
  };

  // Update editor content when initialContent changes (e.g. loading a new file)
  useEffect(() => {
    // @ts-ignore
    if (editor && initialContent !== editor.storage.markdown.getMarkdown()) {
      editor.commands.setContent(initialContent);
    }
  }, [initialContent, editor]);

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-200 transition-colors">
      <Toolbar 
        editor={editor} 
        isRawMode={isRawMode} 
        onToggleRaw={() => setIsRawMode(!isRawMode)} 
      />
      
      <div 
        className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar"
        onClickCapture={handleCaptureClick}
      >
        {isRawMode ? (
          <div className="max-w-none h-full py-4 px-4 font-mono text-sm leading-relaxed text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg border border-neutral-200 dark:border-neutral-800/50 select-text selection:bg-blue-500/30 transition-colors">
            <pre className="whitespace-pre-wrap break-words">{content}</pre>
          </div>
        ) : (
          <EditorContent editor={editor} className="h-[95%] overflow-y-auto px-4" />
        )}
      </div>
    </div>
  );
}
