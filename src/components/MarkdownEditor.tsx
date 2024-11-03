// src/components/MarkdownEditor.tsx
import React, { ChangeEvent, useRef, useEffect, useState } from 'react';

interface MarkdownEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ initialContent, onChange }) => {
  // Add logging to track prop updates
  // console.log('MarkdownEditor render - initialContent:', initialContent);
  
  const [value, setValue] = useState(''); // Initialize empty
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update local state when initialContent changes
  useEffect(() => {
    // console.log('Setting value from initialContent:', initialContent);
    setValue(initialContent);
  }, [initialContent]);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    // console.log('Input changed:', newValue);
    setValue(newValue);
    onChange(newValue);
    adjustHeight();
  };

  return (
    <div className="w-full min-h-[200px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <textarea
        ref={textareaRef}
        className="w-full h-full p-4 resize-none bg-transparent focus:outline-none dark:text-white"
        value={value}
        onChange={handleChange}
        placeholder="Write your markdown here..."
        style={{
          minHeight: '200px',
          overflowY: 'hidden',
        }}
      />
    </div>
  );
};

export default MarkdownEditor;