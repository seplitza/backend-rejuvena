import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Typography from '@tiptap/extension-typography';
import { useState, useRef } from 'react';
import { Node } from '@tiptap/core';

// Кастомное расширение для поддержки <div> с атрибутами (для якорей)
const DivWithAttributes = Node.create({
  name: 'divWithAttributes',
  group: 'block',
  content: 'block*',
  
  parseHTML() {
    return [
      {
        tag: 'div',
        getAttrs: (node) => {
          if (typeof node === 'string') return null;
          const element = node as HTMLElement;
          // Сохраняем все атрибуты div
          const attrs: Record<string, string> = {};
          Array.from(element.attributes).forEach(attr => {
            attrs[attr.name] = attr.value;
          });
          return attrs;
        }
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', HTMLAttributes, 0];
  },

  addAttributes() {
    return {
      id: { default: null },
      class: { default: null },
      style: { default: null }
    };
  }
});

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
}

// В продакшене админка на /admin/, API на том же домене
const API_URL = window.location.origin;

// Функция парсинга markdown в HTML
const parseMarkdownToHTML = (text: string): string => {
  let html = text;
  
  // Заголовки
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // Жирный текст
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  
  // Курсив
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
  
  // Списки
  html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*?<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);
  
  // Параграфы
  const paragraphs = html.split('\n\n');
  html = paragraphs.map(p => {
    if (p.match(/^<h[123]>/) || p.match(/^<ul>/)) return p;
    return `<p>${p.replace(/\n/g, '<br>')}</p>`;
  }).join('');
  
  return html;
};

export default function TipTapEditor({ content, onChange }: TipTapEditorProps) {
  const [uploading, setUploading] = useState(false);
  const [showHTML, setShowHTML] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
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
      DivWithAttributes, // Добавляем поддержку <div> с атрибутами
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
    },
    editorProps: {
      handlePaste: (_view, event) => {
        const text = event.clipboardData?.getData('text/plain');
        if (!text || !editor) return false;
        
        const hasMarkdown = /(\*\*|__|\*|_|^#{1,3} |^\* |^- )/m.test(text);
        if (hasMarkdown) {
          event.preventDefault();
          const html = parseMarkdownToHTML(text);
          editor.chain().focus().insertContent(html).run();
          return true;
        }
        return false;
      }
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
    const url = prompt('Введите URL ссылки (например: #reason-posture для якоря):');
    if (url) {
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to, '');
      
      if (selectedText) {
        // Если есть выделенный текст - просто добавляем ссылку
        editor.chain().focus().setLink({ href: url }).run();
      } else {
        // Если текст не выделен - вставляем URL как текст ссылки
        const linkText = url.startsWith('#') 
          ? url.substring(1).replace(/-/g, ' ') // Для якорей убираем # и заменяем - на пробелы
          : url; // Для обычных URL используем сам URL
        
        editor
          .chain()
          .focus()
          .insertContent(`<a href="${url}">${linkText}</a> `)
          .run();
      }
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
        
        {/* HTML Mode Toggle Button */}
        <button
          onClick={() => {
            if (!showHTML) {
              // Переключаемся в HTML режим - сохраняем текущий HTML
              setHtmlContent(editor?.getHTML() || '');
            } else {
              // Возвращаемся в визуальный режим - применяем изменения
              // Сначала сохраняем через onChange (чтобы родитель получил чистый HTML)
              onChange(htmlContent);
              // Затем обновляем editor (может немного изменить форматирование, но основной контент сохранится)
              editor?.commands.setContent(htmlContent);
            }
            setShowHTML(!showHTML);
          }}
          style={{
            padding: '6px 12px',
            border: '1px solid #D1D5DB',
            background: showHTML ? '#10B981' : 'white',
            color: showHTML ? 'white' : '#374151',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: showHTML ? 'bold' : 'normal',
            marginLeft: '8px'
          }}
        >
          {showHTML ? '✅ Применить HTML' : '</> HTML'}
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
      {!showHTML ? (
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
      ) : (
        <div style={{
          border: '1px solid #E5E7EB',
          borderTop: 'none',
          borderRadius: '0 0 8px 8px',
          background: 'white'
        }}>
          <textarea
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
            style={{
              width: '100%',
              minHeight: '400px',
              padding: '16px',
              fontFamily: 'Monaco, Consolas, "Courier New", monospace',
              fontSize: '13px',
              lineHeight: '1.6',
              border: 'none',
              outline: 'none',
              resize: 'vertical',
              background: '#1e1e1e',
              color: '#d4d4d4'
            }}
            placeholder="Вставьте HTML код здесь..."
          />
          <div style={{
            padding: '12px',
            background: '#FEF3C7',
            borderTop: '1px solid #FCD34D',
            fontSize: '12px',
            color: '#92400E'
          }}>
            ⚠️ <strong>Внимание:</strong> Будьте аккуратны с HTML кодом. Убедитесь что все теги закрыты правильно.
          </div>
        </div>
      )}
      
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