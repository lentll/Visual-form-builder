import React, { useState, useRef } from 'react';
import { useFormStore, useAuthStore } from '@/store/formStore';
import { FIELD_DEFINITIONS, FIELD_CATEGORIES } from '@/config/fieldDefs';
import type { FormField } from '@/types/form';
import { FieldPreview } from '@/components/FieldPreview';
import { PropertyPanel } from '@/components/PropertyPanel';
import { nanoid } from 'nanoid';
import {
  Settings, Eye, Share2, Save, ChevronLeft,
  X, Check, AlertCircle, Plus, GripVertical
} from 'lucide-react';
import { FormSettingsPanel } from '@/components/FormSettingsPanel';

interface FormDesignerProps {
  formId: string;
  onBack: () => void;
  onPreview: (formId: string) => void;
}

type RightTab = 'field' | 'form';

export const FormDesigner: React.FC<FormDesignerProps> = ({ formId, onBack, onPreview }) => {
  const {
    currentForm, selectedFieldId,
    addField, deleteField, duplicateField, setSelectedField,
    moveField, publishForm, updateFormSettings,
    deleteForm,
  } = useFormStore();
  const currentUser = useAuthStore(s => s.user);
  const isAdmin = currentUser?.role === 'admin';
  const isOwner = currentUser?.username === currentForm?.ownerId;
  // 非管理员且非表单所有者 → 不能编辑布局（只读模式）
  const canEditLayout = isAdmin || isOwner;

  const [rightTab, setRightTab] = useState<RightTab>('field');
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragField, setDragField] = useState<{ type: 'new'; fieldType: string } | { type: 'reorder'; index: number } | null>(null);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState('');
  const canvasRef = useRef<HTMLDivElement>(null);

  const selectedField = currentForm?.fields.find(f => f.id === selectedFieldId);

  const handleSave = () => {
    // 立即强制持久化到 localStorage，避免 300ms 防抖导致数据未及时写入
    const { forms, submissions } = useFormStore.getState();
    try { localStorage.setItem('formcraft_forms', JSON.stringify(forms)); } catch { /* ignore */ }
    try { localStorage.setItem('formcraft_submissions', JSON.stringify(submissions)); } catch { /* ignore */ }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCancel = () => {
    const isEmpty = currentForm!.fields.length === 0 && currentForm!.settings.title === '未命名表单';
    if (isEmpty) {
      deleteForm(formId);
      onBack();
    } else {
      if (window.confirm('确定要离开编辑器吗？未保存的更改可能会丢失。')) {
        onBack();
      }
    }
  };

  const handlePublish = () => {
    publishForm(formId);
    alert('表单已发布！');
  };

  // 从左侧面板拖拽新字段到画布
  const handleFieldTypeMouseDown = (fieldType: string) => {
    setDragField({ type: 'new', fieldType });
  };

  // 重新排序
  const handleFieldMouseDown = (index: number, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setDragField({ type: 'reorder', index });
  };

  const handleCanvasDragOver = (e: React.DragEvent | React.MouseEvent, index: number) => {
    e.preventDefault?.();
    setDragOverIndex(index);
  };

  const handleCanvasDrop = (index: number) => {
    if (!dragField) return;
    if (dragField.type === 'new') {
      const def = FIELD_DEFINITIONS.find(d => d.type === dragField.fieldType as any);
      if (def) {
        const newField: FormField = {
          id: nanoid(),
          type: def.type,
          label: def.label,
          ...(def.defaultProps || {}),
        } as FormField;
        addField(newField, index);
      }
    } else if (dragField.type === 'reorder') {
      if (dragField.index !== index) moveField(dragField.index, index);
    }
    setDragField(null);
    setDragOverIndex(null);
  };

  const handleAddFieldByClick = (fieldType: string) => {
    const def = FIELD_DEFINITIONS.find(d => d.type === fieldType as any);
    if (!def) return;
    const newField: FormField = {
      id: nanoid(),
      type: def.type,
      label: def.label,
      ...(def.defaultProps || {}),
    } as FormField;
    const insertIdx = selectedFieldId
      ? (currentForm?.fields.findIndex(f => f.id === selectedFieldId) ?? -1) + 1
      : currentForm?.fields.length;
    addField(newField, insertIdx);
  };

  if (!currentForm) return <div className="flex-1 flex items-center justify-center text-gray-400">表单加载中...</div>;

  if (!canEditLayout) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 min-h-screen gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-gray-300" />
        </div>
        <div className="text-center">
          <p className="text-gray-500 font-medium">无法编辑表单布局</p>
          <p className="text-sm text-gray-400 mt-1">您没有权限编辑该表单的布局和设置</p>
        </div>
        <button onClick={onBack} className="px-4 h-9 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
          返回
        </button>
      </div>
    );
  }

  const filteredDefs = search
    ? FIELD_DEFINITIONS.filter(d => d.label.includes(search) || d.type.includes(search))
    : FIELD_DEFINITIONS;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* 顶部工具栏 */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3 shrink-0 shadow-sm z-10">
        <button onClick={onBack} className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors text-sm">
          <ChevronLeft className="w-4 h-4" />
          返回
        </button>
        <div className="w-px h-5 bg-gray-200" />
        <div className="flex-1 min-w-0">
          <input
            value={currentForm.settings.title}
            onChange={e => {
              updateFormSettings(formId, { title: e.target.value });
            }}
            className="text-base font-semibold text-gray-900 bg-transparent border-none outline-none focus:ring-0 w-full max-w-xs"
            placeholder="表单标题"
          />
          <span className="ml-2 text-xs text-gray-400">
            {currentForm.status === 'draft' ? '草稿' : currentForm.status === 'published' ? '已发布' : '已关闭'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleCancel} className="flex items-center gap-1.5 px-3 h-8 text-sm rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
            <X className="w-3.5 h-3.5" />
            取消
          </button>
          <button onClick={handleSave} className={`flex items-center gap-1.5 px-3 h-8 text-sm rounded-md border transition-all ${saved ? 'border-green-400 bg-green-50 text-green-600' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}>
            {saved ? <><Check className="w-3.5 h-3.5" /> 已保存</> : <><Save className="w-3.5 h-3.5" /> 保存</>}
          </button>
          <button onClick={() => onPreview(formId)} className="flex items-center gap-1.5 px-3 h-8 text-sm rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
            <Eye className="w-3.5 h-3.5" />
            预览
          </button>
          <button onClick={handlePublish} className="flex items-center gap-1.5 px-4 h-8 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium">
            <Share2 className="w-3.5 h-3.5" />
            发布
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 左侧控件面板 */}
        <aside className="w-56 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-gray-100">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索控件..."
              className="w-full h-8 px-3 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {FIELD_CATEGORIES.map(cat => {
              const defs = filteredDefs.filter(d => d.category === cat);
              if (defs.length === 0) return null;
              return (
                <div key={cat} className="mb-2">
                  <div className="px-3 py-1 text-xs text-gray-400 font-medium">{cat}</div>
                  <div className="grid grid-cols-2 gap-1 px-2">
                    {defs.map(def => (
                      <button
                        key={def.type}
                        draggable
                        onDragStart={() => handleFieldTypeMouseDown(def.type)}
                        onClick={() => handleAddFieldByClick(def.type)}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg border border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-grab active:cursor-grabbing group"
                      >
                        <span className="text-gray-500 group-hover:text-blue-600 transition-colors">{def.icon}</span>
                        <span className="text-xs text-gray-600 group-hover:text-blue-700">{def.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* 中间画布 */}
        <main
          className="flex-1 overflow-y-auto"
          onDragOver={e => { e.preventDefault(); }}
          onDrop={() => {
            // 兜底：落在字段间隙时，追加到末尾
            handleCanvasDrop(currentForm.fields.length);
          }}
        >
          <div className="max-w-2xl mx-auto my-6 px-4">
            {/* 表单头部预览 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
              <div className={`h-2 ${currentForm.settings.theme === 'blue' ? 'bg-blue-500' : currentForm.settings.theme === 'green' ? 'bg-green-500' : currentForm.settings.theme === 'purple' ? 'bg-purple-500' : currentForm.settings.theme === 'orange' ? 'bg-orange-500' : 'bg-gray-700'}`} />
              <div className="p-6 pb-4">
                <h2 className="text-xl font-bold text-gray-900">{currentForm.settings.title}</h2>
                {currentForm.settings.description && (
                  <p className="mt-1.5 text-sm text-gray-500">{currentForm.settings.description}</p>
                )}
              </div>
            </div>

            {/* 字段画布 */}
            <div
              ref={canvasRef}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 min-h-80"
              onClick={() => setSelectedField(null)}
            >
              {currentForm.fields.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 gap-3"
                  onDragOver={e => { e.preventDefault(); setDragOverIndex(0); }}
                  onDrop={e => { e.stopPropagation(); handleCanvasDrop(0); }}
                >
                  <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center">
                    <Plus className="w-7 h-7 text-gray-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">从左侧拖入控件，或直接点击添加</p>
                    <p className="text-xs text-gray-400 mt-1">支持文本、选择、日期、评分等多种控件</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {/* 半行字段需要两两成组 */}
                  {renderFields(
                    currentForm.fields,
                    selectedFieldId,
                    (id) => { setSelectedField(id); setRightTab('field'); },
                    deleteField,
                    duplicateField,
                    dragOverIndex,
                    handleCanvasDragOver,
                    handleCanvasDrop,
                    handleFieldMouseDown,
                    dragField,
                  )}
                </div>
              )}
            </div>

            {/* 提交按钮预览 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-4 p-4 flex justify-center">
              <button className={`px-8 h-10 text-sm font-medium rounded-lg text-white ${currentForm.settings.theme === 'blue' ? 'bg-blue-600' : currentForm.settings.theme === 'green' ? 'bg-green-600' : currentForm.settings.theme === 'purple' ? 'bg-purple-600' : currentForm.settings.theme === 'orange' ? 'bg-orange-600' : 'bg-gray-800'}`}>
                {currentForm.settings.submitText || '提交'}
              </button>
            </div>
          </div>
        </main>

        {/* 右侧属性面板 */}
        <aside className="w-64 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
          <div className="flex border-b border-gray-100 shrink-0">
            <button
              onClick={() => setRightTab('field')}
              className={`flex-1 h-11 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${rightTab === 'field' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <GripVertical className="w-3.5 h-3.5" />
              字段属性
            </button>
            <button
              onClick={() => setRightTab('form')}
              className={`flex-1 h-11 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${rightTab === 'form' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Settings className="w-3.5 h-3.5" />
              表单设置
            </button>
          </div>

          {rightTab === 'field' ? (
            selectedField ? (
              <PropertyPanel key={selectedField.id} field={selectedField} />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2 p-4">
                <AlertCircle className="w-8 h-8 text-gray-200" />
                <p className="text-sm text-center">点击表单中的字段<br />查看或编辑属性</p>
              </div>
            )
          ) : (
            <FormSettingsPanel formId={formId} />
          )}
        </aside>
      </div>
    </div>
  );
};

// 渲染字段列表（处理半行布局）
function renderFields(
  fields: FormField[],
  selectedFieldId: string | null,
  onSelect: (id: string) => void,
  onDelete: (id: string) => void,
  onDuplicate: (id: string) => void,
  dragOverIndex: number | null,
  onDragOver: (e: any, i: number) => void,
  onDrop: (i: number) => void,
  onMouseDown: (i: number, e: React.MouseEvent) => void,
  _dragField: any,
) {
  const rows: FormField[][] = [];
  let i = 0;
  while (i < fields.length) {
    const f = fields[i];
    if (f.width === 'half' && i + 1 < fields.length && fields[i + 1].width === 'half') {
      rows.push([f, fields[i + 1]]);
      i += 2;
    } else {
      rows.push([f]);
      i++;
    }
  }

  return rows.map((row) => (
    <div key={row.map(f => f.id).join('-')} className="grid gap-2" style={{ gridTemplateColumns: row.length === 2 ? '1fr 1fr' : '1fr' }}>
      {row.map((field) => {
        const fieldIdx = fields.findIndex(f => f.id === field.id);
        return (
          <div
            key={field.id}
            draggable
            onDragStart={e => onMouseDown(fieldIdx, e as any)}
            onDragOver={e => onDragOver(e, fieldIdx)}
            onDrop={e => { e.stopPropagation(); onDrop(fieldIdx); }}
            className={`relative transition-all ${dragOverIndex === fieldIdx ? 'translate-y-px' : ''}`}
          >
            {dragOverIndex === fieldIdx && <div className="absolute -top-1 left-0 right-0 h-0.5 bg-blue-500 rounded-full z-10" />}
            <FieldPreview
              field={field}
              selected={selectedFieldId === field.id}
              onClick={() => onSelect(field.id)}
              onDelete={() => onDelete(field.id)}
              onDuplicate={() => onDuplicate(field.id)}
            />
          </div>
        );
      })}
    </div>
  ));
}
