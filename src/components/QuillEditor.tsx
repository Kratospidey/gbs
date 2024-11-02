import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface QuillEditorProps {
  initialValue?: string;
  onChange: (value: string) => void;
}

const QuillEditor: React.FC<QuillEditorProps> = ({ initialValue = '', onChange }) => {
  // Ensure initialValue is always a string
  const sanitizedValue = typeof initialValue === 'string' ? initialValue : '';

  return (
    <ReactQuill
      theme="snow"
      value={sanitizedValue}
      onChange={onChange}
      modules={{
        toolbar: [
          [{ 'header': [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          ['link', 'image'],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          ['clean']
        ],
      }}
    />
  );
};

export default QuillEditor;