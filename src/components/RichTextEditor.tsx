import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Typography from '@tiptap/extension-typography';
import Placeholder from '@tiptap/extension-placeholder';
import HardBreak from '@tiptap/extension-hard-break';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const RichTextEditor = ({
  content,
  onChange,
  placeholder = 'Start writing...',
}: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline cursor-pointer',
        },
        linkOnPaste: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Typography,
      Placeholder.configure({
        placeholder,
      }),
      HardBreak.configure({
        keepMarks: true,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm focus:outline-none text-left leading-relaxed mt-2 min-h-[300px] max-w-none px-4',
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer?.files?.length) {
          // Handle file drops if needed
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  const setLink = () => {
    const isActive = editor.isActive('link');

    if (isActive) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    const selection = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(
      selection.from,
      selection.to
    );

    if (selectedText) {
      const url = window.prompt('Enter URL:', 'https://');

      if (url === null) {
        return;
      }

      editor.chain().focus().setLink({ href: url }).run();
    } else {
      const linkText = window.prompt(
        'Enter the text to display and URL (separated by a comma):\nExample: Google, https://google.com'
      );

      if (linkText === null) return;

      const [text, url] = linkText.split(',').map((s) => s.trim());
      if (!text || !url) return;

      editor
        .chain()
        .focus()
        .insertContent({
          type: 'text',
          text: text,
          marks: [
            {
              type: 'link',
              attrs: {
                href: url,
              },
            },
          ],
        })
        .insertContent(' ')
        .run();
    }
  };

  return (
    <div className='border border-gray-300 rounded-md'>
      {editor && (
        <BubbleMenu
          className='flex bg-white shadow-lg border rounded-lg overflow-hidden divide-x'
          tippyOptions={{ duration: 100 }}
          editor={editor}>
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 hover:bg-gray-100 ${
              editor.isActive('bold') ? 'bg-gray-200' : ''
            }`}>
            <span className='font-bold'>B</span>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 hover:bg-gray-100 ${
              editor.isActive('italic') ? 'bg-gray-200' : ''
            }`}>
            <span className='italic'>I</span>
          </button>
          <button
            onClick={setLink}
            className={`p-2 hover:bg-gray-100 ${
              editor.isActive('link') ? 'bg-gray-200' : ''
            }`}>
            🔗
          </button>
        </BubbleMenu>
      )}
      <div className='flex flex-wrap gap-1 p-2 border-b border-gray-300 bg-gray-50'>
        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={`px-3 py-1 rounded ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-gray-200 text-gray-900'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          type='button'>
          H2
        </button>
        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className={`px-3 py-1 rounded ${
            editor.isActive('heading', { level: 3 })
              ? 'bg-gray-200 text-gray-900'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          type='button'>
          H3
        </button>
        <div className='w-px bg-gray-300 mx-1' />
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1 rounded ${
            editor.isActive('bold')
              ? 'bg-gray-200 text-gray-900'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          type='button'>
          B
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1 rounded italic ${
            editor.isActive('italic')
              ? 'bg-gray-200 text-gray-900'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          type='button'>
          I
        </button>
        <button
          onClick={setLink}
          className={`px-3 py-1 rounded ${
            editor.isActive('link')
              ? 'bg-gray-200 text-gray-900'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          type='button'>
          🔗
        </button>
        <div className='w-px bg-gray-300 mx-1' />
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1 rounded ${
            editor.isActive('bulletList')
              ? 'bg-gray-200 text-gray-900'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          type='button'>
          •
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-3 py-1 rounded ${
            editor.isActive('orderedList')
              ? 'bg-gray-200 text-gray-900'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          type='button'>
          1.
        </button>
        <div className='w-px bg-gray-300 mx-1' />
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`px-3 py-1 rounded ${
            editor.isActive({ textAlign: 'left' })
              ? 'bg-gray-200 text-gray-900'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          type='button'>
          ←
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`px-3 py-1 rounded ${
            editor.isActive({ textAlign: 'center' })
              ? 'bg-gray-200 text-gray-900'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          type='button'>
          ↔
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`px-3 py-1 rounded ${
            editor.isActive({ textAlign: 'right' })
              ? 'bg-gray-200 text-gray-900'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          type='button'>
          →
        </button>
      </div>
      <div className='p-3 min-h-[300px]'>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default RichTextEditor;
