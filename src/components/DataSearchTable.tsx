import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { FormField, FormSubmission, FieldOption } from '@/types/form';
import { Search, X, ChevronDown, Edit3, Save, AlertCircle, Download, FileSpreadsheet, Plus, Trash2, ImageIcon, Eye } from 'lucide-react';
import { AttachmentPreview } from './AttachmentPreview';
import { ImageLightbox } from './ImageLightbox';
import type { LightboxImage } from './ImageLightbox';

const MIN_COL_WIDTH = 80;
const DEFAULT_COL_WIDTH = 150;
const NUM_COL_WIDTH = 50;
const TIME_COL_WIDTH = 150;
const SUBMITTER_COL_WIDTH = 100;

interface DataSearchTableProps {
  fields: FormField[];
  submissions: FormSubmission[];
  /** 是否默认展示全部数据（管理端用 true，公开查询用 false） */
  showAllByDefault?: boolean;
  /** 是否允许编辑数据记录 */
  canEditData?: boolean;
  /** 编辑提交数据回调 */
  onEditSubmission?: (submissionId: string, data: Record<string, any>) => void;
  /** 是否启用固定高度内部滚动（管理端数据页用 true） */
  scrollable?: boolean;
}

interface FilterItem {
  fieldId: string;
  value: string;
}

export const DataSearchTable: React.FC<DataSearchTableProps> = ({ fields, submissions, showAllByDefault = false, canEditData = false, onEditSubmission, scrollable = false }) => {
  const [filters, setFilters] = useState<FilterItem[]>([]);
  const [previewAttachment, setPreviewAttachment] = useState<{ url: string; filename: string } | null>(null);
  // 图片灯箱状态
  const [lightbox, setLightbox] = useState<{ images: LightboxImage[]; index: number } | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [resizing, setResizing] = useState<{ fieldId: string; startX: number; startWidth: number } | null>(null);
  // 编辑弹窗
  const [editingSubmission, setEditingSubmission] = useState<FormSubmission | null>(null);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [editSaving, setEditSaving] = useState(false);
  const [editMsg, setEditMsg] = useState<string | null>(null);
  // 添加筛选下拉
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  const searchableFields = fields.filter(f => !['title', 'description', 'divider', 'image'].includes(f.type));

  const getColWidth = useCallback((fieldId: string) => {
    if (fieldId === '#') return NUM_COL_WIDTH;
    if (fieldId === '__time__') return columnWidths[fieldId] || TIME_COL_WIDTH;
    if (fieldId === '__submitter__') return columnWidths[fieldId] || SUBMITTER_COL_WIDTH;
    return columnWidths[fieldId] || DEFAULT_COL_WIDTH;
  }, [columnWidths]);

  const handleResizeStart = useCallback((e: React.MouseEvent, fieldId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const currentWidth = getColWidth(fieldId);
    setResizing({ fieldId, startX: e.clientX, startWidth: currentWidth });
  }, [getColWidth]);

  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizing) return;
      const diff = e.clientX - resizing.startX;
      const newWidth = Math.max(MIN_COL_WIDTH, resizing.startWidth + diff);
      setColumnWidths(prev => ({ ...prev, [resizing.fieldId]: newWidth }));
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing]);

  const addFilter = (fieldId: string) => {
    setFilters([...filters, { fieldId, value: '' }]);
    setFilterDropdownOpen(false);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const updateFilterField = (index: number, fieldId: string) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], fieldId };
    setFilters(newFilters);
  };

  const updateFilterValue = (index: number, value: string) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], value };
    setFilters(newFilters);
  };

  const getOptionLabel = (fieldId: string, value: string) => {
    const field = fields.find(f => f.id === fieldId);
    return field?.options?.find(o => o.value === value)?.label || value;
  };

  const hasActiveFilters = filters.some(f => f.value.trim());

  // 点击外部关闭筛选下拉
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setFilterDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = useMemo(() => {
    // 管理端默认展示全部；公开查询端需要有筛选条件才显示
    if (!showAllByDefault && !hasActiveFilters) return [];
    if (!hasActiveFilters) return submissions; // showAllByDefault=true 且无筛选 → 全部
    return submissions.filter(sub => {
      return filters.every(filter => {
        if (!filter.value.trim()) return true;
        const val = sub.data[filter.fieldId];
        if (val === undefined || val === null || val === '') return false;
        const searchStr = filter.value.toLowerCase();
        if (typeof val === 'boolean') {
          const field = fields.find(f => f.id === filter.fieldId);
          const displayText = val ? (field?.switchOnText || '是') : (field?.switchOffText || '否');
          return String(val).toLowerCase().includes(searchStr) || displayText.toLowerCase().includes(searchStr);
        }
        if (Array.isArray(val)) return val.some(v => String(v).toLowerCase().includes(searchStr));
        return String(val).toLowerCase().includes(searchStr);
      });
    });
  }, [submissions, filters, hasActiveFilters]);

  const renderCellValue = (field: FormField, val: any) => {
    if (val === undefined || val === null || val === '') return <span className="text-gray-300">—</span>;
    if (field.type === 'switch') return val ? (field.switchOnText || '是') : (field.switchOffText || '否');
    if (field.type === 'upload' && val) return renderAttachment(field.id, val);
    if (Array.isArray(val) && !['multiselect', 'cascade', 'subtable'].includes(field.type)) return val.map(v => getOptionLabel(field.id, v)).join('、');
    if (['select', 'radio', 'cascader'].includes(field.type)) return getOptionLabel(field.id, String(val));
    // 信息类字段
    if (field.type === 'contact') {
      if (typeof val === 'object' && val !== null)
        return [val.name, val.phone, val.email, val.company].filter(Boolean).join(' | ') || <span className="text-gray-300">—</span>;
      return String(val);
    }
    if (field.type === 'idcard') return String(val).replace(/(\d{4})\d{10}(\d{4})/, '$1**********$2');
    if (field.type === 'phone') return String(val);
    if (field.type === 'address') {
      if (typeof val === 'object' && val !== null)
        return [val.province, val.city, val.district, val.detail].filter(Boolean).join(' ') || <span className="text-gray-300">—</span>;
      return String(val);
    }
    if (field.type === 'email') return <a href={`mailto:${val}`} className="text-blue-600 hover:underline">{String(val)}</a>;
    if (field.type === 'hyperlink') {
      const url = typeof val === 'object' ? val.url : String(val);
      const text = typeof val === 'object' && val.text ? val.text : url;
      if (!url) return <span className="text-gray-300">—</span>;
      return <a href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{text}</a>;
    }
    if (field.type === 'barcode') {
      return <span className="font-mono text-xs text-gray-600">{typeof val === 'object' && val.content ? val.content : String(val)}</span>;
    }
    if (field.type === 'location') {
      if (typeof val === 'object' && val !== null) {
        const parts = [];
        if (val.lat && val.lng) parts.push(`${Number(val.lat).toFixed(4)}, ${Number(val.lng).toFixed(4)}`);
        if (val.address) parts.push(val.address);
        return parts.join(' — ') || <span className="text-gray-300">—</span>;
      }
      return String(val);
    }
    // 评分（星级）
    if (field.type === 'rate') {
      const max = field.max || 5;
      const cur = Math.min(max, Math.max(0, Number(val) || 0));
      return <span className="text-yellow-500 text-xs whitespace-nowrap">{'★'.repeat(cur)}{'☆'.repeat(max - cur)} <span className="text-gray-400 ml-0.5">{cur}分</span></span>;
    }
    // 数值类字段
    if (field.type === 'progress') {
      const max = field.max || 100;
      const pct = Math.min(100, Math.max(0, (Number(val) / max) * 100));
      const color = field.progressColor || '#3b82f6';
      return (
        <div className="flex items-center gap-2 min-w-[100px]">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
          </div>
          <span className="text-gray-500 text-xs tabular-nums">{Number(val)}/{max}</span>
        </div>
      );
    }
    if (field.type === 'level') {
      const max = field.levelMax || 5;
      const lv = Math.min(max, Math.max(1, Number(val) || 1));
      if (field.levelType === 'number') return <span className="font-mono text-xs">{lv}/{max}</span>;
      if (field.levelType === 'tag') {
        const labels = ['极差', '较差', '一般', '良好', '优秀'];
        return <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-600">{labels[Math.min(lv - 1, 4)]}</span>;
      }
      return <span className="text-yellow-500 text-xs">{'★'.repeat(lv)}{'☆'.repeat(max - lv)}</span>;
    }
    if (field.type === 'percent') return <span className="tabular-nums">{Number(val).toFixed(0)}%</span>;
    if (field.type === 'currency') {
      const sym = field.currency || '¥';
      return <span className="tabular-nums font-medium">{sym}{Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
    }
    // 选择类字段
    if (field.type === 'multiselect' && Array.isArray(val)) {
      return (
        <div className="flex flex-wrap gap-1">
          {val.slice(0, 5).map((v: string) => (
            <span key={v} className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs whitespace-nowrap">{getOptionLabel(field.id, v)}</span>
          ))}
          {val.length > 5 && <span className="text-xs text-gray-400">+{val.length - 5}</span>}
        </div>
      );
    }
    if (field.type === 'cascade' && Array.isArray(val)) {
      const path = val.map((v: string) => {
        const findLabel = (opts?: FieldOption[]): string => {
          for (const o of (opts || [])) {
            if (o.value === v) return o.label;
            const found = findLabel(o.children);
            if (found) return found;
          }
          return v;
        };
        return findLabel(field.cascadeOptions || field.options);
      });
      return path.join(' / ');
    }
    // 高级关联
    if ((field.type === 'relation' || field.type === 'birelation') && val) {
      return <span className="text-blue-600 font-medium">{String(val)}</span>;
    }
    if (field.type === 'subtable' && Array.isArray(val)) {
      if (val.length === 0) return <span className="text-gray-300">—</span>;
      return <span className="text-gray-500 text-xs">{val.length} 行明细</span>;
    }
    return String(val);
  };

  const renderAttachment = (_fieldId: string, val: any) => {
    const items: any[] = Array.isArray(val) ? val : [val];

    // 分离图片和非图片文件
    const parseItem = (item: any) => {
      const name: string = item?.name || (typeof item === 'string' ? item.split('/').pop() || item : '');
      const dataUrl: string = item?.dataUrl || '';
      const mimeType: string = item?.type || '';
      const isImg = mimeType.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(name);
      const isExcel = mimeType.includes('spreadsheet') || mimeType.includes('excel') || /\.(xls|xlsx|csv)$/i.test(name);
      return { name, dataUrl, mimeType, isImg, isExcel };
    };

    const parsed = items.map(parseItem);

    // 所有图片统一收集用于灯箱
    const imgItems = parsed
      .filter(p => p.isImg && p.dataUrl)
      .map(p => ({ url: p.dataUrl, name: p.name } as LightboxImage));

    return (
      <div className="flex flex-wrap gap-1.5 items-start">
        {parsed.map((p, idx) => {
          if (p.isImg && p.dataUrl) {
            // 图片：显示缩略图，点击打开灯箱
            const imgIndex = imgItems.findIndex(m => m.url === p.dataUrl);
            return (
              <button
                key={idx}
                onClick={() => setLightbox({ images: imgItems, index: Math.max(0, imgIndex) })}
                className="w-14 h-14 rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-400 transition-all hover:shadow-md hover:scale-105 flex-shrink-0"
                title={p.name}
              >
                <img
                  src={p.dataUrl}
                  alt={p.name}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </button>
            );
          }

          // 非图片文件：显示图标+文件名标签
          const handleClick = () => {
            if (p.dataUrl) {
              const a = document.createElement('a');
              a.href = p.dataUrl;
              a.download = p.name;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            } else if (p.name.startsWith('http')) {
              window.open(p.name, '_blank');
            }
          };

          return (
            <button
              key={idx}
              onClick={handleClick}
              className={`inline-flex items-center gap-1 px-2 h-6 text-xs rounded hover:opacity-80 transition-opacity ${
                p.isExcel
                  ? 'text-emerald-600 bg-emerald-50 border border-emerald-100'
                  : 'text-blue-600 bg-blue-50 border border-blue-100'
              }`}
              title={p.dataUrl ? `下载: ${p.name}` : p.name}
            >
              {p.isExcel ? (
                <FileSpreadsheet className="w-3 h-3 flex-shrink-0" />
              ) : (
                <Download className="w-3 h-3 flex-shrink-0" />
              )}
              <span className="max-w-24 truncate">{p.name}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const getFieldLabel = (fieldId: string) => {
    return fields.find(f => f.id === fieldId)?.label || fieldId;
  };

  const startEdit = (sub: FormSubmission) => {
    setEditingSubmission(sub);
    setEditData({ ...sub.data });
    setEditMsg(null);
  };

  const handleEditFieldChange = (fieldId: string, value: any) => {
    setEditData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleEditSave = () => {
    if (!editingSubmission) return;
    setEditSaving(true);
    setEditMsg(null);
    // 模拟保存延迟
    setTimeout(() => {
      onEditSubmission?.(editingSubmission.id, editData);
      setEditSaving(false);
      setEditMsg('保存成功');
      setTimeout(() => { setEditingSubmission(null); setEditMsg(null); }, 800);
    }, 300);
  };

  const availableFields = searchableFields.filter(f => !filters.some(fl => fl.fieldId === f.id));

  // 渲染编辑弹窗中的字段输入
  const renderEditField = (field: FormField) => {
    const val = editData[field.id] ?? field.defaultValue ?? '';
    if (field.type === 'textarea') {
      return (
        <textarea
          value={val}
          onChange={e => handleEditFieldChange(field.id, e.target.value)}
          rows={field.rows || 3}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
          placeholder={field.placeholder}
        />
      );
    }
    if ((field.type === 'select' || field.type === 'cascader') && field.options) {
      return (
        <select
          value={val}
          onChange={e => handleEditFieldChange(field.id, e.target.value)}
          className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
        >
          <option value="">-- 请选择 --</option>
          {field.options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      );
    }
    if (field.type === 'radio' && field.options) {
      return (
        <div className="flex flex-wrap gap-3 pt-1">
          {field.options.map(o => (
            <label key={o.value} className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input
                type="radio"
                name={`edit-${field.id}`}
                value={o.value}
                checked={String(val) === o.value}
                onChange={e => handleEditFieldChange(field.id, e.target.value)}
                className="accent-blue-600"
              />
              {o.label}
            </label>
          ))}
        </div>
      );
    }
    if (field.type === 'checkbox' && field.options) {
      const arrVal: string[] = Array.isArray(val) ? val : (val ? [String(val)] : []);
      return (
        <div className="flex flex-wrap gap-3 pt-1">
          {field.options.map(o => (
            <label key={o.value} className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                value={o.value}
                checked={arrVal.includes(o.value)}
                onChange={e => {
                  const newVal = e.target.checked
                    ? [...arrVal, o.value]
                    : arrVal.filter(v => v !== o.value);
                  handleEditFieldChange(field.id, newVal);
                }}
                className="accent-blue-600"
              />
              {o.label}
            </label>
          ))}
        </div>
      );
    }
    if (field.type === 'switch') {
      return (
        <label className="inline-flex items-center gap-2 cursor-pointer pt-1">
          <button
            onClick={() => handleEditFieldChange(field.id, !val)}
            className={`relative w-10 h-5 rounded-full transition-colors ${val ? 'bg-blue-500' : 'bg-gray-200'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${val ? 'left-5' : 'left-0.5'}`} />
          </button>
          <span className="text-sm text-gray-600">{val ? (field.switchOnText || '是') : (field.switchOffText || '否')}</span>
        </label>
      );
    }
    if (field.type === 'date') {
      return (
        <input
          type="date"
          value={typeof val === 'string' ? val.slice(0, 10) : ''}
          onChange={e => handleEditFieldChange(field.id, e.target.value)}
          className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      );
    }
    if (field.type === 'number') {
      return (
        <input
          type="number"
          value={val}
          onChange={e => handleEditFieldChange(field.id, e.target.value)}
          className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
          placeholder={field.placeholder}
        />
      );
    }
    if (field.type === 'rate') {
      const max = field.max || 5;
      return (
        <div className="flex gap-1 pt-1">
          {Array.from({ length: max }, (_, i) => (
            <button
              key={i}
              onClick={() => handleEditFieldChange(field.id, i + 1 === val ? 0 : i + 1)}
              className={`text-xl transition-colors ${i < Number(val) ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`}
            >
              ★
            </button>
          ))}
        </div>
      );
    }
    // 文件上传编辑
    if (field.type === 'upload') {
      const items: any[] = Array.isArray(val) ? val : (val ? [val] : []);
      const isImageFile = (file: any) => {
        if (!file) return false;
        const name = file.name || '';
        const type = file.type || file.mimeType || '';
        return type.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(name);
      };
      const handleAddFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files || []);
        const processed = await Promise.all(
          selected.map(file => new Promise<any>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve({ name: file.name, size: file.size, type: file.type, dataUrl: reader.result as string });
            reader.onerror = () => resolve({ name: file.name, size: file.size, type: file.type, dataUrl: '' });
            reader.readAsDataURL(file);
          }))
        );
        // 始终追加，不区分 field.multiple
        const newVal = [...items, ...processed];
        handleEditFieldChange(field.id, newVal);
        e.target.value = '';
      };
      const handleRemoveFile = (idx: number) => {
        const newVal = items.filter((_, i) => i !== idx);
        handleEditFieldChange(field.id, newVal.length > 0 ? newVal : null);
      };
      return (
        <div>
          {/* 已上传文件列表 */}
          {items.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {items.map((file: any, i: number) => {
                const name = file.name || (typeof file === 'string' ? file.split('/').pop() || file : '');
                const dataUrl = file.dataUrl || (typeof file === 'string' ? file : '');
                const isImg = dataUrl ? isImageFile(file) : /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(name);
                return (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-sm">
                    {isImg && dataUrl ? (
                      <img src={dataUrl} alt={name} className="w-8 h-8 rounded object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center shrink-0">
                        <ImageIcon className="w-4 h-4 text-blue-500" />
                      </div>
                    )}
                    <span className="flex-1 truncate text-gray-700 text-xs">{name}</span>
                    {dataUrl && isImg && (
                      <button
                        type="button"
                        onClick={() => {
                          const imgItems = items
                            .filter(f => f.dataUrl && isImageFile(f))
                            .map(f => ({ url: f.dataUrl, name: f.name } as LightboxImage));
                          const curIdx = imgItems.findIndex(m => m.url === dataUrl);
                          setLightbox({ images: imgItems, index: Math.max(0, curIdx) });
                        }}
                        className="text-gray-400 hover:text-blue-600 shrink-0"
                        title="预览"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button type="button" onClick={() => handleRemoveFile(i)} className="text-red-400 hover:text-red-600 shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {/* 添加文件按钮 */}
          <label className="flex flex-col items-center justify-center h-20 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-colors">
            <Plus className="w-5 h-5 text-gray-400 mb-0.5" />
            <span className="text-xs text-gray-500">添加文件</span>
            <span className="text-xs text-gray-300">{field.accept || '支持所有格式'}</span>
            <input
              type="file"
              className="sr-only"
              accept={field.accept}
              multiple
              onChange={handleAddFiles}
            />
          </label>
        </div>
      );
    }
    // 联系人
    if (field.type === 'contact') {
      const obj = (typeof val === 'object' && val !== null) ? val : {} as Record<string, string>;
      const cFields = field.contactFields || ['name', 'phone', 'email', 'company'];
      const updateContact = (key: string, v: string) => handleEditFieldChange(field.id, { ...obj, [key]: v });
      return (
        <div className="space-y-2">
          {cFields.includes('name') && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-10 shrink-0">姓名</span>
              <input value={obj.name || ''} onChange={e => updateContact('name', e.target.value)} className="flex-1 h-8 px-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="姓名" />
            </div>
          )}
          {cFields.includes('phone') && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-10 shrink-0">电话</span>
              <input value={obj.phone || ''} onChange={e => updateContact('phone', e.target.value)} className="flex-1 h-8 px-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="电话" />
            </div>
          )}
          {cFields.includes('email') && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-10 shrink-0">邮箱</span>
              <input value={obj.email || ''} onChange={e => updateContact('email', e.target.value)} className="flex-1 h-8 px-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="邮箱" />
            </div>
          )}
          {cFields.includes('company') && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-10 shrink-0">公司</span>
              <input value={obj.company || ''} onChange={e => updateContact('company', e.target.value)} className="flex-1 h-8 px-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="公司" />
            </div>
          )}
        </div>
      );
    }
    // 身份证
    if (field.type === 'idcard') {
      return (
        <input
          value={val}
          onChange={e => handleEditFieldChange(field.id, e.target.value)}
          maxLength={18}
          className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
          placeholder="18位身份证号码"
        />
      );
    }
    // 电话
    if (field.type === 'phone') {
      return (
        <input
          type="tel"
          value={val}
          onChange={e => handleEditFieldChange(field.id, e.target.value)}
          className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
          placeholder="手机号码"
        />
      );
    }
    // 地址
    if (field.type === 'address') {
      const obj = (typeof val === 'object' && val !== null) ? val : {} as Record<string, string>;
      const updateAddr = (key: string, v: string) => handleEditFieldChange(field.id, { ...obj, [key]: v });
      const level = field.addressLevel || 4;
      return (
        <div className="space-y-2">
          {(level >= 1) && (
            <input value={obj.province || ''} onChange={e => updateAddr('province', e.target.value)} className="w-full h-8 px-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="省/自治区/直辖市" />
          )}
          {(level >= 2) && (
            <input value={obj.city || ''} onChange={e => updateAddr('city', e.target.value)} className="w-full h-8 px-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="市/区" />
          )}
          {(level >= 3) && (
            <input value={obj.district || ''} onChange={e => updateAddr('district', e.target.value)} className="w-full h-8 px-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="区/县" />
          )}
          {(level >= 4) && (
            <input value={obj.detail || ''} onChange={e => updateAddr('detail', e.target.value)} className="w-full h-8 px-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="详细地址" />
          )}
        </div>
      );
    }
    // 邮箱
    if (field.type === 'email') {
      return (
        <input
          type="email"
          value={val}
          onChange={e => handleEditFieldChange(field.id, e.target.value)}
          className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
          placeholder="example@email.com"
        />
      );
    }
    // 超链接
    if (field.type === 'hyperlink') {
      const obj = (typeof val === 'object' && val !== null) ? val : { url: String(val || ''), text: '' };
      return (
        <div className="space-y-2">
          <input value={obj.url || ''} onChange={e => handleEditFieldChange(field.id, { ...obj, url: e.target.value })} className="w-full h-8 px-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="链接地址 (https://...)" />
          <input value={obj.text || ''} onChange={e => handleEditFieldChange(field.id, { ...obj, text: e.target.value })} className="w-full h-8 px-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="显示文字（可选）" />
        </div>
      );
    }
    // 条码
    if (field.type === 'barcode') {
      return (
        <input
          value={typeof val === 'object' && val.content ? val.content : val}
          onChange={e => handleEditFieldChange(field.id, e.target.value)}
          className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
          placeholder="条码/二维码内容"
        />
      );
    }
    // 定位
    if (field.type === 'location') {
      const obj = (typeof val === 'object' && val !== null) ? val : {} as Record<string, any>;
      const updateLoc = (key: string, v: any) => handleEditFieldChange(field.id, { ...obj, [key]: v });
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input type="number" step="any" value={obj.lat ?? ''} onChange={e => updateLoc('lat', parseFloat(e.target.value) || '')} className="flex-1 h-8 px-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="纬度" />
            <input type="number" step="any" value={obj.lng ?? ''} onChange={e => updateLoc('lng', parseFloat(e.target.value) || '')} className="flex-1 h-8 px-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="经度" />
          </div>
          <input value={obj.address || ''} onChange={e => updateLoc('address', e.target.value)} className="w-full h-8 px-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="地址描述" />
        </div>
      );
    }
    // 进度
    if (field.type === 'progress') {
      const max = field.max || 100;
      return (
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0} max={max}
            value={Number(val) || 0}
            onChange={e => handleEditFieldChange(field.id, Number(e.target.value))}
            className="flex-1 accent-blue-500"
          />
          <span className="text-sm text-gray-600 tabular-nums w-16 text-right">{Number(val) || 0} / {max}</span>
        </div>
      );
    }
    // 等级
    if (field.type === 'level') {
      const max = field.levelMax || 5;
      const lv = Number(val) || 0;
      if (field.levelType === 'number') {
        return (
          <input
            type="number" min={1} max={max}
            value={lv || ''} onChange={e => handleEditFieldChange(field.id, Math.min(max, Math.max(1, Number(e.target.value) || 1)))}
            className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        );
      }
      return (
        <div className="flex gap-1 pt-1">
          {Array.from({ length: max }, (_, i) => (
            <button
              key={i}
              onClick={() => handleEditFieldChange(field.id, i + 1 === lv ? 0 : i + 1)}
              className={`text-xl transition-colors ${i < lv ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`}
            >
              ★
            </button>
          ))}
        </div>
      );
    }
    // 百分比
    if (field.type === 'percent') {
      return (
        <div className="flex items-center gap-2">
          <input
            type="number" min={0} max={100}
            value={val ?? ''}
            onChange={e => handleEditFieldChange(field.id, Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
            className="flex-1 h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
            placeholder="0-100"
          />
          <span className="text-sm text-gray-400">%</span>
        </div>
      );
    }
    // 货币
    if (field.type === 'currency') {
      const sym = field.currency || '¥';
      return (
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-500">{sym}</span>
          <input
            type="number" step="0.01"
            value={val ?? ''}
            onChange={e => handleEditFieldChange(field.id, e.target.value === '' ? '' : Number(e.target.value))}
            className="flex-1 h-9 px-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
            placeholder="0.00"
          />
        </div>
      );
    }
    // 多选项（标签式多选）
    if (field.type === 'multiselect' && field.options) {
      const arrVal: string[] = Array.isArray(val) ? val : (val ? [String(val)] : []);
      return (
        <div className="flex flex-wrap gap-2 pt-1">
          {field.options.map(o => (
            <label key={o.value} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs cursor-pointer border transition-colors ${arrVal.includes(o.value) ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:border-blue-200'}`}>
              <input
                type="checkbox" value={o.value} checked={arrVal.includes(o.value)}
                onChange={e => {
                  const newVal = e.target.checked ? [...arrVal, o.value] : arrVal.filter(v => v !== o.value);
                  handleEditFieldChange(field.id, newVal);
                }}
                className="sr-only"
              />
              {o.label}
            </label>
          ))}
        </div>
      );
    }
    // 级联选项
    if (field.type === 'cascade' && (field.cascadeOptions || field.options)) {
      const cascadeOpts = field.cascadeOptions || field.options || [];
      const arrVal: string[] = Array.isArray(val) ? val : (val ? [String(val)] : []);
      const renderCascadeSelects = () => {
        const selects: React.ReactNode[] = [];
        let currentOpts = cascadeOpts;
        for (let i = 0; i <= arrVal.length; i++) {
          if (i > 0) {
            const selected = cascadeOpts.find(o => o.value === arrVal[i - 1]) || currentOpts.find(o => o.value === arrVal[i - 1]);
            currentOpts = selected?.children || [];
          }
          selects.push(
            <select
              key={i}
              value={arrVal[i] || ''}
              onChange={e => {
                const newVal = e.target.value ? [...arrVal.slice(0, i), e.target.value] : arrVal.slice(0, i);
                handleEditFieldChange(field.id, newVal);
              }}
              className="h-8 px-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
              style={{ minWidth: 120 }}
            >
              <option value="">-- {i === 0 ? '请选择' : `第${i + 1}级`} --</option>
              {currentOpts.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          );
          if (currentOpts.length === 0 || (i < arrVal.length && currentOpts.every(o => !o.children?.length))) break;
        }
        return selects;
      };
      return <div className="flex flex-wrap gap-2">{renderCascadeSelects()}</div>;
    }
    // 关联字段（单向/双向）
    if (field.type === 'relation' || field.type === 'birelation') {
      return (
        <input
          value={val || ''}
          onChange={e => handleEditFieldChange(field.id, e.target.value)}
          className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
          placeholder={field.placeholder || '关联记录标识'}
        />
      );
    }
    // 明细表
    if (field.type === 'subtable' && field.subFields) {
      const rows: Record<string, any>[] = Array.isArray(val) ? val : [];
      const addRow = () => {
        const newRow: Record<string, any> = {};
        field.subFields?.forEach(sf => { newRow[sf.id] = sf.type === 'switch' ? false : sf.type === 'number' ? 0 : ''; });
        handleEditFieldChange(field.id, [...rows, newRow]);
      };
      const removeRow = (idx: number) => {
        handleEditFieldChange(field.id, rows.filter((_, i) => i !== idx));
      };
      const updateRow = (idx: number, colId: string, v: any) => {
        const newRows = rows.map((r, i) => i === idx ? { ...r, [colId]: v } : r);
        handleEditFieldChange(field.id, newRows);
      };
      return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto max-h-48">
            <table className="w-full text-xs border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  {field.subFields.map(sf => (
                    <th key={sf.id} className="px-2 py-1.5 text-left text-gray-500 font-medium border-b border-gray-200 whitespace-nowrap">{sf.label}</th>
                  ))}
                  <th className="px-2 py-1.5 w-10 border-b border-gray-200" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri} className="border-b border-gray-100">
                    {field.subFields!.map(sf => (
                      <td key={sf.id} className="px-1 py-0.5">
                        {sf.type === 'switch' ? (
                          <button onClick={() => updateRow(ri, sf.id, !row[sf.id])} className={`w-8 h-4 rounded-full transition-colors ${row[sf.id] ? 'bg-blue-500' : 'bg-gray-200'}`}>
                            <span className={`block w-3 h-3 bg-white rounded-full shadow transition-transform ${row[sf.id] ? 'ml-4' : 'ml-0.5'}`} />
                          </button>
                        ) : sf.type === 'select' && sf.options ? (
                          <select value={row[sf.id] || ''} onChange={e => updateRow(ri, sf.id, e.target.value)} className="w-full h-6 px-1 text-xs border border-gray-200 rounded focus:outline-none">
                            <option value="">—</option>
                            {sf.options.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
                          </select>
                        ) : sf.type === 'number' ? (
                          <input type="number" value={row[sf.id] ?? ''} onChange={e => updateRow(ri, sf.id, e.target.value === '' ? '' : Number(e.target.value))} className="w-full h-6 px-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400" style={{ minWidth: 64 }} />
                        ) : sf.type === 'date' ? (
                          <input type="date" value={row[sf.id] || ''} onChange={e => updateRow(ri, sf.id, e.target.value)} className="w-full h-6 px-1 text-xs border border-gray-200 rounded focus:outline-none" />
                        ) : (
                          <input value={row[sf.id] || ''} onChange={e => updateRow(ri, sf.id, e.target.value)} className="w-full h-6 px-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder={sf.placeholder} style={{ minWidth: 64 }} />
                        )}
                      </td>
                    ))}
                    <td className="px-1 py-0.5 text-center">
                      <button onClick={() => removeRow(ri)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length === 0 && <div className="py-3 text-center text-xs text-gray-400">暂无明细数据</div>}
          <button onClick={addRow} className="w-full h-7 flex items-center justify-center gap-1 text-xs text-blue-600 border-t border-gray-200 bg-gray-50/50 hover:bg-blue-50 transition-colors">
            <Plus className="w-3 h-3" /> 添加行
          </button>
        </div>
      );
    }
    // input / time / slider 等默认用输入框
    return (
      <input
        type={field.type === 'time' ? 'time' : 'text'}
        value={val}
        onChange={e => handleEditFieldChange(field.id, e.target.value)}
        className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
        placeholder={field.placeholder}
      />
    );
  };

  return (
    <div className={`w-full ${scrollable ? 'h-full flex flex-col overflow-hidden' : ''}`}>
      {/* 搜索筛选区 */}
      <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4 ${scrollable ? 'flex-shrink-0' : ''}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Search className="w-4 h-4" /> 数据查询
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {hasActiveFilters
                ? `共 ${filtered.length} 条结果`
                : showAllByDefault
                ? `共 ${submissions.length} 条记录`
                : '请在下方添加筛选条件'}
            </span>
            {availableFields.length > 0 && (
              <div className="relative" ref={filterDropdownRef}>
                <button
                  onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                  className="flex items-center gap-1 px-2.5 h-7 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <ChevronDown className={`w-3 h-3 transition-transform ${filterDropdownOpen ? 'rotate-180' : ''}`} /> 添加筛选
                </button>
                {filterDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 max-h-60 overflow-y-auto">
                    {availableFields.map(f => (
                      <button
                        key={f.id}
                        onClick={() => addFilter(f.id)}
                        className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                        <span className="truncate">{f.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {filters.map((filter, idx) => (
          <div key={idx} className="flex gap-2 mb-2 items-center">
            <select
              value={filter.fieldId}
              onChange={e => updateFilterField(idx, e.target.value)}
              className="h-8 px-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 min-w-0 w-36"
            >
              {searchableFields.map(f => (
                <option key={f.id} value={f.id} disabled={idx !== filters.findIndex(fl => fl.fieldId === f.id) && filters.some((fl, i) => i !== idx && fl.fieldId === f.id)}>
                  {f.label}
                </option>
              ))}
            </select>
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
              <input
                type="text"
                value={filter.value}
                onChange={e => updateFilterValue(idx, e.target.value)}
                placeholder={`搜索 ${getFieldLabel(filter.fieldId)}...`}
                className="w-full h-8 pl-8 pr-3 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
            <button
              onClick={() => removeFilter(idx)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {filters.length === 0 && (
          <div className="py-8 text-center">
            <Search className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">点击"添加筛选"按字段搜索数据</p>
            <p className="text-xs text-gray-300 mt-1">支持多个字段组合搜索</p>
          </div>
        )}
      </div>

      {/* 数据表格 */}
      <div className={`bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden ${scrollable ? 'flex-1 flex flex-col overflow-hidden' : ''}`}>
        {!showAllByDefault && !hasActiveFilters ? (
          <div className="py-12 text-center">
            <Search className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">输入筛选条件后开始查询</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Search className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">暂无匹配数据</p>
          </div>
        ) : (
          <div className={`${scrollable ? 'overflow-auto h-full data-search-scroll' : 'overflow-x-auto'}`} style={{ width: '100%' }}>
            <table className="w-full text-sm border-collapse" style={{ tableLayout: 'fixed', minWidth: '100%' }}>
              <colgroup>
                <col style={{ width: getColWidth('#') }} />
                <col style={{ width: getColWidth('__time__') }} />
                <col style={{ width: getColWidth('__submitter__') }} />
                {searchableFields.map(f => (
                  <col key={f.id} style={{ width: getColWidth(f.id) }} />
                ))}
                {canEditData && <col style={{ width: 80 }} />}
              </colgroup>
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="relative px-3 py-2.5 text-left text-xs font-semibold text-gray-500 whitespace-nowrap border-r border-gray-200/60 bg-gray-50">
                    #
                  </th>
                  <th className="relative px-3 py-2.5 text-left text-xs font-semibold text-gray-500 whitespace-nowrap border-r border-gray-200/60 bg-gray-50">
                    提交时间
                    <div
                      className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-400/20 transition-colors"
                      onMouseDown={e => handleResizeStart(e, '__time__')}
                    >
                      <div className="absolute right-0.5 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-gray-300 rounded-full transition-colors" />
                    </div>
                  </th>
                  <th className="relative px-3 py-2.5 text-left text-xs font-semibold text-gray-500 whitespace-nowrap border-r border-gray-200/60 bg-gray-50">
                    提交人
                    <div
                      className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-400/20 transition-colors"
                      onMouseDown={e => handleResizeStart(e, '__submitter__')}
                    >
                      <div className="absolute right-0.5 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-gray-300 rounded-full transition-colors" />
                    </div>
                  </th>
                  {searchableFields.map(f => (
                    <th key={f.id} className="relative px-3 py-2.5 text-left text-xs font-semibold text-gray-500 whitespace-nowrap border-r border-gray-200/60 bg-gray-50">
                      <span className="truncate block pr-2">{f.label}</span>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-400/20 transition-colors"
                        onMouseDown={e => handleResizeStart(e, f.id)}
                      >
                        <div className="absolute right-0.5 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-gray-300 rounded-full transition-colors" />
                      </div>
                    </th>
                  ))}
                  {canEditData && <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 whitespace-nowrap bg-gray-50">操作</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.slice().reverse().map((sub, idx) => (
                  <tr key={sub.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                    <td className="px-3 py-2.5 text-gray-400 text-xs border-r border-gray-50">{filtered.length - idx}</td>
                    <td className="px-3 py-2.5 text-gray-500 text-xs whitespace-nowrap border-r border-gray-50">
                      {new Date(sub.submittedAt).toLocaleString('zh-CN', {
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs whitespace-nowrap border-r border-gray-50">
                      {sub.submittedBy || '—'}
                    </td>
                    {searchableFields.map(f => (
                      <td key={f.id} className="px-3 py-2.5 text-gray-700 text-xs border-r border-gray-50" style={{ whiteSpace: 'normal', wordBreak: 'break-word', verticalAlign: 'top' }}>
                        {renderCellValue(f, sub.data[f.id])}</td>
                    ))}
                    {canEditData && (
                      <td className="px-2 py-2.5 text-center border-r border-gray-50">
                        <button
                          onClick={() => startEdit(sub)}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="编辑此记录"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {previewAttachment && (
        <AttachmentPreview
          url={previewAttachment.url}
          filename={previewAttachment.filename}
          onClose={() => setPreviewAttachment(null)}
        />
      )}

      {/* 图片灯箱 */}
      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}

      {/* 编辑数据弹窗 */}
      {editingSubmission && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 pt-12 overflow-y-auto" onClick={() => setEditingSubmission(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 mb-12" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">编辑数据记录</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  提交时间：{new Date(editingSubmission.submittedAt).toLocaleString('zh-CN')}
                </p>
              </div>
              <button onClick={() => setEditingSubmission(null)} className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-4">
              {editMsg && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${editMsg === '保存成功' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                  {editMsg === '保存成功' ? <Save className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {editMsg}
                </div>
              )}
              {searchableFields.map(field => (
                <div key={field.id}>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    {field.label}
                    {field.validation?.required && <span className="text-red-400 ml-0.5">*</span>}
                  </label>
                  {renderEditField(field)}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
              <button
                onClick={() => setEditingSubmission(null)}
                className="px-4 h-9 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-white transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleEditSave}
                disabled={editSaving}
                className="flex items-center gap-2 px-5 h-9 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {editSaving ? (
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                {editSaving ? '保存中...' : '保存修改'}
              </button>
            </div>
          </div>
        </div>
      )}

      {resizing && (
        <div className="fixed inset-0 z-50 cursor-col-resize" />
      )}
    </div>
  );
};
