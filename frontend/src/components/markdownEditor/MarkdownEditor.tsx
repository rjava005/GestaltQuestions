
import MDEditor from "@uiw/react-md-editor";


interface MarkdownEditorProps {
  content: string;
  setContent: (value: string) => void;
}

export default function MarkDownEditor({ content, setContent }: MarkdownEditorProps) {
  return (
    <div className="flex flex-col gap-4 p-3" data-color-mode="light">
      <h3 className="text-lg font-semibold">Markdown Editor</h3>

      <MDEditor
        value={content}
        onChange={(v) => setContent(v || "")}
        preview="edit"
        className="min-h-screen"
        visibleDragbar={false}
      />
    </div>
  );
}
