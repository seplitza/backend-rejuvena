import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export default function TipTapEditor({ content, onChange }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          style: 'max-width: 100%; height: auto;'
        }
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          style: 'color: #4F46E5; text-decoration: underline;'
        }
      })
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    }
  });

  if (!editor) {
    return null;
  }

  const addImage = () => {
    const url = prompt('Введите URL изображения:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addLink = () => {
    const url = prompt('Введите URL ссылки:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        padding: '12px',
        background: '#F9FAFB',
        borderRadius: '8px 8px 0 0',
        borderBottom: '1px solid #E5E7EB'
      }}>
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          style={{
            padding: '6px 12px',
            border: '1px solid #D1D5DB',
            background: editor.isActive('bold') ? '#4F46E5' : 'white',
            color: editor.isActive('bold') ? 'white' : '#374151',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          B
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          style={{
            padding: '6px 12px',
            border: '1px solid #D1D5DB',
            background: editor.isActive('italic') ? '#4F46E5' : 'white',
            color: editor.isActive('italic') ? 'white' : '#374151',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontStyle: 'italic'
          }}
        >
          I
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          style={{
            padding: '6px 12px',
            border: '1px solid #D1D5DB',
            background: editor.isActive('heading', { level: 1 }) ? '#4F46E5' : 'white',
            color: editor.isActive('heading', { level: 1 }) ? 'white' : '#374151',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          style={{
            padding: '6px 12px',
            border: '1px solid #D1D5DB',
            background: editor.isActive('heading', { level: 2 }) ? '#4F46E5' : 'white',
            color: editor.isActive('heading', { level: 2 }) ? 'white' : '#374151',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          style={{
            padding: '6px 12px',
            border: '1px solid #D1D5DB',
            background: editor.isActive('bulletList') ? '#4F46E5' : 'white',
            color: editor.isActive('bulletList') ? 'white' : '#374151',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          • List
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          style={{
            padding: '6px 12px',
            border: '1px solid #D1D5DB',
            background: editor.isActive('orderedList') ? '#4F46E5' : 'white',
            color: editor.isActive('orderedList') ? 'white' : '#374151',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          1. List
        </button>
        <button
          onClick={addImage}
          style={{
            padding: '6px 12px',
            border: '1px solid #D1D5DB',
            background: 'white',
            color: '#374151',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🖼️ Image
        </button>
        <button
          onClick={addLink}
          style={{
            padding: '6px 12px',
            border: '1px solid #D1D5DB',
            background: 'white',
            color: '#374151',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🔗 Link
        </button>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}
