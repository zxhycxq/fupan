import { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';
import '@wangeditor/editor/dist/css/style.css';

interface WangEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  maxLength?: number;
  height?: number;
}

export interface WangEditorRef {
  getText: () => string;
}

const WangEditor = forwardRef<WangEditorRef, WangEditorProps>(({ 
  value = '', 
  onChange, 
  placeholder = '请输入内容...',
  maxLength = 500,
  height = 300
}, ref) => {
  const [editor, setEditor] = useState<IDomEditor | null>(null);
  const [html, setHtml] = useState(value);

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    getText: () => {
      if (!editor) return '';
      return editor.getText();
    }
  }));

  // 工具栏配置
  const toolbarConfig: Partial<IToolbarConfig> = {
    toolbarKeys: [
      'bold',
      'italic',
      'underline',
      'through',
      '|',
      'color',
      'bgColor',
      '|',
      'fontSize',
      'fontFamily',
      '|',
      'bulletedList',
      'numberedList',
      '|',
      'justifyLeft',
      'justifyCenter',
      'justifyRight',
      '|',
      'undo',
      'redo',
    ]
  };

  // 编辑器配置
  const editorConfig: Partial<IEditorConfig> = {
    placeholder,
    maxLength,
    MENU_CONF: {}
  };

  // 及时销毁 editor
  useEffect(() => {
    return () => {
      if (editor == null) return;
      editor.destroy();
      setEditor(null);
    };
  }, [editor]);

  // 当外部value变化时，更新编辑器内容
  useEffect(() => {
    if (value !== html) {
      setHtml(value);
    }
  }, [value]);

  const handleChange = (editor: IDomEditor) => {
    const newHtml = editor.getHtml();
    setHtml(newHtml);
    onChange?.(newHtml);
  };

  return (
    <div style={{ border: '1px solid #ccc', zIndex: 100 }}>
      <Toolbar
        editor={editor}
        defaultConfig={toolbarConfig}
        mode="default"
        style={{ borderBottom: '1px solid #ccc' }}
      />
      <Editor
        defaultConfig={editorConfig}
        value={html}
        onCreated={setEditor}
        onChange={handleChange}
        mode="default"
        style={{ height: `${height}px`, overflowY: 'hidden' }}
      />
    </div>
  );
});

WangEditor.displayName = 'WangEditor';

export default WangEditor;
