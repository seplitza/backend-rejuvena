import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Typography from '@tiptap/extension-typography';
import { useState, useRef } from 'react';

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
}

// В продакшене админка на /admin/, API на том же домене
const API_URL = window.location.origin;

export default function TipTapEditor({ content, onChange }: TipTapEditorProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Включаем markdown shortcuts
        heading: {
          levels: [1, 2, 3]
        },
        bold: {
          // ** или __ для жирного
          HTMLAttributes: {
            style: 'font-weight: bold;'
          }
        },
        italic: {
          // * или _ для курсива
          HTMLAttributes: {
            style: 'font-style: italic;'
          }
        }
      }),
      Typography,
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          style: 'max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0;'
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение');
      return;
    }

    // Проверка размера (макс 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Файл слишком большой. Максимум 10MB');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/media/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Ошибка загрузки');
      }

      const data = await response.json();
      const imageUrl = `${API_URL}${data.url}`;

      // Вставляем изображение в редактор
      editor.chain().focus().setImage({ src: imageUrl }).run();
    } catch (error) {
      console.error('Ошибка загрузки изображения:', error);
      alert('Не удалось загрузить изображение');
    } finally {
      setUploading(false);
      // Сбрасываем input для возможности повторной загрузки того же файла
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const addImageFromUrl = () => {
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
        
        {/* Image Upload Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleImageUpload}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            padding: '6px 12px',
            border: '1px solid #D1D5DB',
            background: uploading ? '#E5E7EB' : 'white',
            color: uploading ? '#9CA3AF' : '#374151',
            borderRadius: '6px',
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          {uploading ? '⏳ Загрузка...' : '📤 Загрузить фото'}
        </button>
        
        {/* Image from URL Button */}
        <button
          onClick={addImageFromUrl}
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
          🖼️ Фото по URL
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

      {/* Подсказка о Markdown */}
      <div style={{
        padding: '8px 12px',
        background: '#EEF2FF',
        borderLeft: '3px solid #6366F1',
        fontSize: '12px',
        color: '#4338CA',
        marginBottom: '8px'
      }}>
        💡 <strong>Markdown shortcuts:</strong> **жирный**, *курсив*, ## заголовок, * список, [текст](ссылка)
      </div>

      {/* Editor */}
      <div style={{
        border: '1px solid #E5E7EB',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        padding: '16px',
        minHeight: '300px',
        background: 'white'
      }}>
        <EditorContent editor={editor} />
      </div>
      
      <style>{`
        .ProseMirror {
          outline: none;
          min-height: 300px;
        }
        
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 16px 0;
          display: block;
          cursor: pointer;
          transition: transform 0.2s;
        }
        
        .ProseMirror img:hover {
          transform: scale(1.02);
        }
        
        .ProseMirror img.ProseMirror-selectednode {
          outline: 3px solid #4F46E5;
        }
        
        .ProseMirror p {
          margin: 8px 0;
        }
        
        .ProseMirror h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 16px 0;
        }
        
        .ProseMirror h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 14px 0;
        }
        
        .ProseMirror h3 {
          font-size: 1.25em;
          font-weight: bold;
          margin: 12px 0;
        }
        
        .ProseMirror ul, .ProseMirror ol {
          padding-left: 24px;
          margin: 12px 0;
        }
        
        .ProseMirror li {
          margin: 4px 0;
        }
        
        .ProseMirror a {
          color: #4F46E5;
          text-decoration: underline;
        }
        
        .ProseMirror strong {
          font-weight: bold;
        }
        
        .ProseMirror em {
          font-style: italic;
        }
      `}</style>
    </div>
  );
}