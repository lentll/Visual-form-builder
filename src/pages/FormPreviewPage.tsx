import React, { useState } from 'react';
import { useFormStore } from '@/store/formStore';
import type { FormField } from '@/types/form';
import { ChevronLeft, Send, CheckCircle, Star } from 'lucide-react';

interface FormPreviewPageProps {
  formId: string;
  onBack: () => void;
}

const FieldRenderer = ({ field, value, onChange, error }: {
  field: FormField;
  value: any;
  onChange: (v: any) => void;
  error?: string;
}) => {
  const isLayout = ['title', 'description', 'divider', 'image'].includes(field.type);

  if (field.hidden) return null;

  const baseInputCls = `w-full h-10 px-3 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 ${error ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200 focus:border-blue-400'}`;

  const renderInput = () => {
    switch (field.type) {
      case 'input':
        return (
          <div className="flex items-center gap-0">
            {field.prefix && <span className="h-10 px-3 flex items-center bg-gray-50 border border-r-0 border-gray-200 rounded-l-lg text-sm text-gray-600">{field.prefix}</span>}
            <input
              type="text"
              value={value || ''}
              onChange={e => onChange(e.target.value)}
              placeholder={field.placeholder}
              disabled={field.disabled}
              maxLength={field.validation?.maxLength}
              className={`${baseInputCls} ${field.prefix ? 'rounded-l-none' : ''} ${field.suffix ? 'rounded-r-none' : ''}`}
            />
            {field.suffix && <span className="h-10 px-3 flex items-center bg-gray-50 border border-l-0 border-gray-200 rounded-r-lg text-sm text-gray-600">{field.suffix}</span>}
          </div>
        );
      case 'number':
        return <input type="number" value={value ?? ''} onChange={e => onChange(Number(e.target.value))} placeholder={field.placeholder} disabled={field.disabled} className={baseInputCls} />;
      case 'textarea':
        return (
          <div className="relative">
            <textarea
              value={value || ''}
              onChange={e => onChange(e.target.value)}
              placeholder={field.placeholder}
              disabled={field.disabled}
              rows={field.rows || 4}
              maxLength={field.validation?.maxLength}
              className={`w-full px-3 py-2.5 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 resize-none ${error ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200 focus:border-blue-400'}`}
            />
            {field.showCount && field.validation?.maxLength && (
              <span className="absolute bottom-2 right-3 text-xs text-gray-400">{(value || '').length}/{field.validation.maxLength}</span>
            )}
          </div>
        );
      case 'select':
        return (
          <select value={value || ''} onChange={e => onChange(e.target.value)} disabled={field.disabled} className={baseInputCls + ' bg-white'}>
            <option value="">{field.placeholder || '请选择'}</option>
            {field.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        );
      case 'radio':
        return (
          <div className="flex flex-wrap gap-3 pt-1">
            {field.options?.map(opt => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${value === opt.value ? 'border-blue-500' : 'border-gray-300 group-hover:border-blue-300'}`}>
                  {value === opt.value && <span className="w-2 h-2 rounded-full bg-blue-500 block" />}
                </span>
                <span className="text-sm text-gray-700">{opt.label}</span>
                <input type="radio" className="sr-only" value={opt.value} checked={value === opt.value} onChange={() => onChange(opt.value)} />
              </label>
            ))}
          </div>
        );
      case 'checkbox':
        return (
          <div className="flex flex-wrap gap-3 pt-1">
            {field.options?.map(opt => {
              const checked = Array.isArray(value) && value.includes(opt.value);
              return (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
                  <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${checked ? 'border-blue-500 bg-blue-500' : 'border-gray-300 group-hover:border-blue-300'}`}>
                    {checked && <svg viewBox="0 0 10 8" className="w-2.5 h-2 text-white fill-current"><path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>}
                  </span>
                  <span className="text-sm text-gray-700">{opt.label}</span>
                  <input type="checkbox" className="sr-only" checked={checked}
                    onChange={() => {
                      const arr: string[] = Array.isArray(value) ? [...value] : [];
                      onChange(checked ? arr.filter(v => v !== opt.value) : [...arr, opt.value]);
                    }} />
                </label>
              );
            })}
          </div>
        );
      case 'date': {
        const ref = React.useRef<HTMLInputElement>(null);
        return (
          <input ref={ref} type="date" value={value || ''} onChange={e => onChange(e.target.value)}
            onClick={() => ref.current?.showPicker?.()}
            className={`${baseInputCls} cursor-pointer`} />
        );
      }
      case 'time': {
        const ref = React.useRef<HTMLInputElement>(null);
        return (
          <input ref={ref} type="time" value={value || ''} onChange={e => onChange(e.target.value)}
            onClick={() => ref.current?.showPicker?.()}
            className={`${baseInputCls} cursor-pointer`} />
        );
      }
      case 'rate': {
        const max = field.max || 5;
        const cur = value || 0;
        const [hover, setHover] = useState(0);
        return (
          <div className="flex gap-1.5 pt-1">
            {Array.from({ length: max }, (_, i) => i + 1).map(n => (
              <button key={n} type="button" onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => onChange(n)}>
                <Star className={`w-7 h-7 transition-colors ${n <= (hover || cur) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`} />
              </button>
            ))}
            {cur > 0 && <span className="ml-1 text-sm text-gray-500 self-center">{cur} 分</span>}
          </div>
        );
      }
      case 'slider': {
        const min = field.min ?? 0;
        const max = field.max ?? 100;
        const cur = value ?? field.defaultValue ?? min;
        return (
          <div className="pt-2 pb-1">
            <input type="range" min={min} max={max} step={field.step || 1} value={cur}
              onChange={e => onChange(Number(e.target.value))}
              className="w-full accent-blue-500" />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{min}</span><span className="font-medium text-blue-600">{cur}</span><span>{max}</span>
            </div>
          </div>
        );
      }
      case 'switch':
        return (
          <div className="flex items-center gap-2 pt-1">
            <button type="button" onClick={() => onChange(!value)}
              className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-blue-500' : 'bg-gray-200'}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'left-6' : 'left-1'}`} />
            </button>
            <span className="text-sm text-gray-600">{value ? (field.switchOnText || '是') : (field.switchOffText || '否')}</span>
          </div>
        );
      case 'upload': {
        const [files, setFiles] = useState<Array<{ name: string; size: number; type: string; dataUrl: string }>>([]);
        const processFiles = (selected: File[]): Promise<Array<{ name: string; size: number; type: string; dataUrl: string }>> => {
          return Promise.all(
            selected.map(file => new Promise<{ name: string; size: number; type: string; dataUrl: string }>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve({ name: file.name, size: file.size, type: file.type, dataUrl: reader.result as string });
              reader.onerror = () => resolve({ name: file.name, size: file.size, type: file.type, dataUrl: '' });
              reader.readAsDataURL(file);
            }))
          );
        };
        const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
          const selected = Array.from(e.target.files || []);
          const processed = await processFiles(selected);
          if (!field.multiple) {
            setFiles(processed.slice(0, 1));
            onChange(processed[0] || null);
          } else {
            setFiles(prev => [...prev, ...processed]);
            onChange([...files, ...processed]);
          }
          e.target.value = '';
        };
        const removeFile = (idx: number) => {
          const updated = files.filter((_, i) => i !== idx);
          setFiles(updated);
          onChange(field.multiple ? updated : null);
        };
        const isImageFile = (file: { type: string; name: string }) => {
          return file.type.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(file.name);
        };
        return (
          <div>
            <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-colors">
              <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              <span className="text-sm text-gray-500">点击选择文件</span>
              <span className="text-xs text-gray-400">{field.accept || '支持所有格式'}</span>
              <input type="file" className="sr-only" accept={field.accept} multiple={field.multiple} onChange={handleFileChange} />
            </label>
            {files.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {files.map((file, i) => (
                  <div key={`${file.name}-${i}`} className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-sm">
                    {isImageFile(file) && file.dataUrl ? (
                      <img src={file.dataUrl} alt={file.name} className="w-8 h-8 rounded object-cover shrink-0" />
                    ) : (
                      <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    )}
                    <span className="flex-1 truncate text-gray-700">{file.name}</span>
                    <span className="text-xs text-gray-400 shrink-0">{(file.size / 1024).toFixed(1)} KB</span>
                    <button type="button" onClick={() => removeFile(i)} className="text-red-400 hover:text-red-600 shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }
      case 'title': {
        const sizes = ['text-2xl', 'text-xl', 'text-lg'];
        const weights = ['font-bold', 'font-semibold', 'font-medium'];
        const lvl = (field.level || 2) - 1;
        return <div className={`${sizes[lvl]} ${weights[lvl]} text-gray-900 text-${field.align || 'left'}`}>{field.content}</div>;
      }
      case 'description':
        return <p className={`text-sm text-gray-600 leading-relaxed text-${field.align || 'left'}`}>{field.content}</p>;
      case 'divider':
        return (
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-gray-200" />
            {field.content && <span className="text-xs text-gray-400">{field.content}</span>}
            {field.content && <div className="flex-1 h-px bg-gray-200" />}
          </div>
        );
      case 'image':
        return (
          <div className={`flex justify-${field.align === 'right' ? 'end' : field.align === 'center' ? 'center' : 'start'}`}>
            <img src={field.imageUrl} alt="" className="max-w-full rounded-lg" onError={e => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x200/e2e8f0/94a3b8?text=Image'; }} />
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className={field.width === 'half' ? '' : 'col-span-2'}>
      {!isLayout && (
        <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1.5">
          {field.validation?.required && <span className="text-red-500">*</span>}
          {field.label}
        </label>
      )}
      {field.description && <p className="text-xs text-gray-400 mb-1.5">{field.description}</p>}
      {renderInput()}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export const FormPreviewPage: React.FC<FormPreviewPageProps> = ({ formId, onBack }) => {
  const { forms, submitForm } = useFormStore();
  const form = forms.find(f => f.id === formId);
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!form) return <div className="flex-1 flex items-center justify-center">表单不存在</div>;

  const themeColor: Record<string, string> = {
    blue: 'bg-blue-600', green: 'bg-green-600',
    purple: 'bg-purple-600', orange: 'bg-orange-600', default: 'bg-gray-800',
  };
  const accentBar: Record<string, string> = {
    blue: 'bg-blue-500', green: 'bg-green-500',
    purple: 'bg-purple-500', orange: 'bg-orange-500', default: 'bg-gray-600',
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    form.fields.forEach(field => {
      if (field.hidden) return;
      const val = values[field.id];
      if (field.validation?.required) {
        const empty = val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0);
        if (empty) errs[field.id] = `${field.label}不能为空`;
      }
      if (val && field.validation?.pattern) {
        const re = new RegExp(field.validation.pattern);
        if (!re.test(String(val))) errs[field.id] = field.validation.message || '格式不正确';
      }
      if (val && field.validation?.minLength && String(val).length < field.validation.minLength) {
        errs[field.id] = `最少输入${field.validation.minLength}个字符`;
      }
      if (val && field.validation?.maxLength && String(val).length > field.validation.maxLength) {
        errs[field.id] = `最多输入${field.validation.maxLength}个字符`;
      }
    });
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    submitForm(formId, values);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">提交成功</h3>
          <p className="text-gray-500">{form.settings.successMessage}</p>
          <button onClick={() => { setSubmitted(false); setValues({}); setErrors({}); }}
            className={`mt-6 px-6 h-10 text-sm font-medium text-white rounded-lg ${themeColor[form.settings.theme || 'blue']} hover:opacity-90 transition-opacity`}>
            再次填写
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
          <ChevronLeft className="w-4 h-4" /> 返回列表
        </button>

        {/* 表单卡片 */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          <div className={`h-2 ${accentBar[form.settings.theme || 'blue']}`} />
          <div className="p-6">
            <h1 className="text-xl font-bold text-gray-900">{form.settings.title}</h1>
            {form.settings.description && <p className="mt-2 text-sm text-gray-500">{form.settings.description}</p>}
          </div>
        </div>

        {/* 字段区域 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            {form.fields.map(field => (
              <FieldRenderer
                key={field.id}
                field={field}
                value={values[field.id]}
                onChange={v => {
                  setValues(prev => ({ ...prev, [field.id]: v }));
                  if (errors[field.id]) setErrors(prev => { const e = { ...prev }; delete e[field.id]; return e; });
                }}
                error={errors[field.id]}
              />
            ))}
          </div>
        </div>

        {/* 提交 */}
        <div className="flex justify-center">
          <button
            onClick={handleSubmit}
            className={`flex items-center gap-2 px-10 h-11 text-sm font-medium text-white rounded-xl shadow-sm hover:opacity-90 transition-opacity ${themeColor[form.settings.theme || 'blue']}`}
          >
            <Send className="w-4 h-4" />
            {form.settings.submitText || '提交'}
          </button>
        </div>
      </div>
    </div>
  );
};
