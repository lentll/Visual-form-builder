import React, { useState, useEffect } from 'react';
import { useFormStore, useSystemStore } from '@/store/formStore';
import type { FormField } from '@/types/form';
import { Send, CheckCircle, Star, Lock, ExternalLink, Navigation, MapPin, Link, QrCode, Plus, Trash2 } from 'lucide-react';
import { ImageLightbox } from '@/components/ImageLightbox';
import type { LightboxImage } from '@/components/ImageLightbox';

// ---- 独立子组件：星级评分 ----
const RateField: React.FC<{ field: FormField; value: any; onChange: (v: any) => void }> = ({ field, value, onChange }) => {
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
};

// ---- 独立子组件：文件上传 ----
type UploadFileItem = { name: string; size: number; type: string; dataUrl: string };

const UploadField: React.FC<{ field: FormField; value: any; onChange: (v: any) => void }> = ({ field, value, onChange }) => {
  const [files, setFiles] = useState<UploadFileItem[]>(() => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'object' && value.name) return [value];
    return [];
  });
  const [lightbox, setLightbox] = useState<{ images: LightboxImage[]; index: number } | null>(null);

  const processSelected = (selected: File[]): Promise<UploadFileItem[]> =>
    Promise.all(
      selected.map(file => new Promise<UploadFileItem>(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve({ name: file.name, size: file.size, type: file.type, dataUrl: reader.result as string });
        reader.onerror = () => resolve({ name: file.name, size: file.size, type: file.type, dataUrl: '' });
        reader.readAsDataURL(file);
      }))
    );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    const processed = await processSelected(selected);
    // 始终支持多文件追加（无论 field.multiple 设置）
    setFiles(prev => {
      const next = [...prev, ...processed];
      onChange(next.length === 1 ? next[0] : next);
      return next;
    });
    e.target.value = '';
  };

  const removeFile = (idx: number) => {
    setFiles(prev => {
      const next = prev.filter((_, i) => i !== idx);
      if (next.length === 0) onChange(null);
      else if (next.length === 1 && !field.multiple) onChange(next[0]);
      else onChange(next);
      return next;
    });
  };

  const isImg = (f: UploadFileItem) => f.type.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(f.name);

  const imgFiles = files.filter(f => isImg(f) && f.dataUrl);

  const openLightbox = (file: UploadFileItem) => {
    const imgs = imgFiles.map(f => ({ url: f.dataUrl, name: f.name } as LightboxImage));
    const idx = imgFiles.findIndex(f => f.dataUrl === file.dataUrl);
    setLightbox({ images: imgs, index: Math.max(0, idx) });
  };

  return (
    <>
      {lightbox && (
        <ImageLightbox images={lightbox.images} initialIndex={lightbox.index} onClose={() => setLightbox(null)} />
      )}
      <div>
        {/* 已上传文件列表 */}
        {files.length > 0 && (
          <div className="mb-2 space-y-1.5">
            {files.map((file, i) => (
              <div key={`${file.name}-${i}`} className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-sm">
                {isImg(file) && file.dataUrl ? (
                  <button
                    type="button"
                    onClick={() => openLightbox(file)}
                    className="w-8 h-8 rounded overflow-hidden shrink-0 hover:ring-2 hover:ring-blue-400 transition-all"
                    title="点击预览"
                  >
                    <img src={file.dataUrl} alt={file.name} className="w-full h-full object-cover" />
                  </button>
                ) : (
                  <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                <span className="flex-1 truncate text-gray-700">{file.name}</span>
                <span className="text-xs text-gray-400 shrink-0">{(file.size / 1024).toFixed(1)} KB</span>
                <button type="button" onClick={() => removeFile(i)} className="text-red-400 hover:text-red-600 shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
        {/* 上传区域 */}
        <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-colors">
          <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span className="text-sm text-gray-500">点击选择文件（可多选）</span>
          <span className="text-xs text-gray-400">{field.accept || '支持所有格式'}</span>
          <input
            type="file"
            className="sr-only"
            accept={field.accept}
            multiple
            onChange={handleFileChange}
          />
        </label>
      </div>
    </>
  );
};

interface FormSubmitPageProps {
  formId: string;
}

// ---- 独立子组件：联系人 ----
const ContactField: React.FC<{ field: FormField; value: any; onChange: (v: any) => void }> = ({ field, value, onChange }) => {
  const cf = field.contactFields || ['name', 'phone', 'email'];
  const labels: Record<string, string> = { name: '姓名', phone: '电话', email: '邮箱', company: '公司' };
  const placeholders: Record<string, string> = { name: '请输入姓名', phone: '请输入电话', email: '请输入邮箱', company: '请输入公司名称' };
  const val: Record<string, string> = typeof value === 'object' && value !== null ? value : {};
  return (
    <div className="grid grid-cols-2 gap-2">
      {cf.map((key: string) => (
        <div key={key}>
          <label className="block text-xs text-gray-500 mb-1">{labels[key]}</label>
          <input type={key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'}
            value={val[key] || ''} onChange={e => onChange({ ...val, [key]: e.target.value })}
            placeholder={placeholders[key]}
            className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400" />
        </div>
      ))}
    </div>
  );
};

// ---- 独立子组件：地址 ----
const PROVINCES = ['北京市','天津市','上海市','重庆市','河北省','山西省','内蒙古自治区','辽宁省','吉林省','黑龙江省','江苏省','浙江省','安徽省','福建省','江西省','山东省','河南省','湖北省','湖南省','广东省','广西壮族自治区','海南省','四川省','贵州省','云南省','西藏自治区','陕西省','甘肃省','青海省','宁夏回族自治区','新疆维吾尔自治区'];
const AddressField: React.FC<{ field: FormField; value: any; onChange: (v: any) => void }> = ({ field, value, onChange }) => {
  const level = field.addressLevel || 3;
  const val: Record<string, string> = typeof value === 'object' && value !== null ? value : {};
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <select value={val.province || ''} onChange={e => onChange({ ...val, province: e.target.value, city: '', district: '' })}
          className="flex-1 h-9 px-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200">
          <option value="">省/直辖市</option>
          {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {level >= 2 && <input type="text" value={val.city || ''} onChange={e => onChange({ ...val, city: e.target.value })} placeholder="市/区"
          className="flex-1 h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200" />}
        {level >= 3 && <input type="text" value={val.district || ''} onChange={e => onChange({ ...val, district: e.target.value })} placeholder="区/县"
          className="flex-1 h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200" />}
      </div>
      {level >= 4 && <input type="text" value={val.detail || ''} onChange={e => onChange({ ...val, detail: e.target.value })}
        placeholder="详细地址" className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200" />}
    </div>
  );
};

// ---- 独立子组件：定位 ----
const LocationField: React.FC<{ field: FormField; value: any; onChange: (v: any) => void }> = ({ field, value, onChange }) => {
  const [loading, setLoading] = useState(false);
  const [locError, setLocError] = useState('');
  const locVal = typeof value === 'object' && value !== null ? value : null;
  const getLocation = () => {
    if (!navigator.geolocation) { setLocError('浏览器不支持定位'); return; }
    setLoading(true); setLocError('');
    navigator.geolocation.getCurrentPosition(
      pos => { onChange({ lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6), address: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}` }); setLoading(false); },
      () => { setLocError('获取位置失败，请手动输入'); setLoading(false); },
      { timeout: 8000 }
    );
  };
  return (
    <div className="space-y-2">
      {field.locationMode !== 'manual' && (
        <button type="button" onClick={getLocation} disabled={loading}
          className="flex items-center gap-2 w-full h-10 px-4 border border-dashed border-blue-300 rounded-lg bg-blue-50 text-blue-600 text-sm hover:bg-blue-100 transition-colors disabled:opacity-60">
          <Navigation className="w-4 h-4" />
          {loading ? '正在获取位置...' : locVal ? '重新定位' : '点击获取当前位置'}
        </button>
      )}
      {locVal && (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          <MapPin className="w-4 h-4 shrink-0" />
          <span className="flex-1 truncate">{locVal.address || `${locVal.lat}, ${locVal.lng}`}</span>
        </div>
      )}
      <input type="text" value={typeof value === 'string' ? value : (locVal?.address || '')}
        onChange={e => onChange(e.target.value)} placeholder="或手动输入地址"
        className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200" />
      {locError && <p className="text-xs text-red-500">{locError}</p>}
    </div>
  );
};

// ---- 独立子组件：超链接 ----
const HyperlinkField: React.FC<{ field: FormField; value: any; onChange: (v: any) => void }> = ({ field, value, onChange }) => {
  const val = typeof value === 'object' && value !== null ? value : { url: '', text: field.linkText || '' };
  return (
    <div className="space-y-2">
      <input type="url" value={val.url || ''} onChange={e => onChange({ ...val, url: e.target.value })}
        placeholder={field.placeholder || 'https://'} className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200" />
      <input type="text" value={val.text || ''} onChange={e => onChange({ ...val, text: e.target.value })}
        placeholder="链接显示文字（选填）" className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200" />
      {val.url && (
        <a href={val.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-blue-500 hover:text-blue-700">
          <Link className="w-3.5 h-3.5" />{val.text || val.url}
        </a>
      )}
    </div>
  );
};

// ---- 独立子组件：条码 ----
const BarcodeField: React.FC<{ field: FormField; value: any; onChange: (v: any) => void }> = ({ field, value, onChange }) => {
  const isQR = field.barcodeType !== 'barcode';
  const qrUrl = value ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(String(value))}` : '';
  return (
    <div className="space-y-3">
      <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} placeholder={field.placeholder || '请输入内容'}
        className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200" />
      {value ? (
        <div className="flex items-center gap-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          {isQR ? (
            <img src={qrUrl} alt="QR Code" className="w-24 h-24 rounded border border-gray-200" />
          ) : (
            <div className="flex items-end gap-0.5 h-10">
              {String(value).padEnd(12, '0').slice(0, 12).split('').map((c, i) => (
                <div key={i} style={{ width: 2, height: parseInt(c) % 2 === 0 ? 36 : 28, backgroundColor: '#333', borderRadius: 1 }} />
              ))}
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500 mb-1">{isQR ? '二维码' : '条形码'}</p>
            <p className="text-sm font-mono text-gray-700 break-all">{value}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg">
          <div className="text-center">
            <QrCode className="w-8 h-8 text-gray-300 mx-auto mb-1" />
            <p className="text-xs text-gray-400">输入内容后自动生成{isQR ? '二维码' : '条形码'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ---- 独立子组件：进度 ----
const ProgressField: React.FC<{ field: FormField; value: any; onChange: (v: any) => void }> = ({ field, value, onChange }) => {
  const min = field.min ?? 0; const max = field.max ?? 100;
  const cur = Number(value ?? field.defaultValue ?? 0);
  const pct = Math.min(100, Math.max(0, ((cur - min) / (max - min)) * 100));
  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: field.progressColor || '#3b82f6' }} />
        </div>
        <span className="text-sm font-medium text-gray-700 w-12 text-right">{pct.toFixed(0)}%</span>
      </div>
      <input type="range" min={min} max={max} step={field.step || 1} value={cur}
        onChange={e => onChange(Number(e.target.value))} className="w-full accent-blue-500" />
      <div className="flex justify-between text-xs text-gray-400"><span>{min}</span><span>{max}</span></div>
    </div>
  );
};

// ---- 独立子组件：等级 ----
const LevelField: React.FC<{ field: FormField; value: any; onChange: (v: any) => void }> = ({ field, value, onChange }) => {
  const max = field.levelMax || 5; const cur = Number(value || 0); const type = field.levelType || 'star';
  const [hover, setHover] = useState(0);
  const tagLabels = ['差', '较差', '一般', '良好', '优秀'];
  if (type === 'star') return (
    <div className="flex gap-1.5 pt-1">
      {Array.from({ length: max }, (_, i) => i + 1).map(n => (
        <button key={n} type="button" onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => onChange(n === cur ? 0 : n)}>
          <Star className={`w-7 h-7 transition-colors ${n <= (hover || cur) ? 'fill-orange-400 text-orange-400' : 'text-gray-300 hover:text-orange-200'}`} />
        </button>
      ))}
      {cur > 0 && <span className="ml-1 text-sm text-gray-500 self-center">{cur} 级</span>}
    </div>
  );
  if (type === 'number') return (
    <div className="flex gap-2 pt-1 flex-wrap">
      {Array.from({ length: max }, (_, i) => i + 1).map(n => (
        <button key={n} type="button" onClick={() => onChange(n === cur ? 0 : n)}
          className={`w-9 h-9 rounded-full border-2 text-sm font-bold transition-colors ${n <= cur ? 'border-orange-400 bg-orange-400 text-white' : 'border-gray-200 text-gray-400 hover:border-orange-300'}`}>{n}</button>
      ))}
      {cur > 0 && <span className="text-sm text-gray-500 self-center ml-1">{cur} 级</span>}
    </div>
  );
  return (
    <div className="flex gap-2 pt-1 flex-wrap">
      {Array.from({ length: max }, (_, i) => i + 1).map(n => (
        <button key={n} type="button" onClick={() => onChange(n === cur ? 0 : n)}
          className={`px-3 py-1 text-sm rounded-full border transition-colors ${n <= cur ? 'bg-orange-100 border-orange-300 text-orange-700' : 'border-gray-200 text-gray-500 hover:border-orange-200'}`}>
          {tagLabels[n - 1] || `L${n}`}
        </button>
      ))}
    </div>
  );
};

// ---- 独立子组件：多选项（标签式） ----
const MultiSelectField: React.FC<{ field: FormField; value: any; onChange: (v: any) => void }> = ({ field, value, onChange }) => {
  const selected: string[] = Array.isArray(value) ? value : [];
  const maxSel = field.maxSelect;
  const toggle = (v: string) => {
    if (selected.includes(v)) onChange(selected.filter(s => s !== v));
    else { if (maxSel && selected.length >= maxSel) return; onChange([...selected, v]); }
  };
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {field.options?.map(opt => {
        const active = selected.includes(opt.value);
        return (
          <button key={opt.value} type="button" onClick={() => toggle(opt.value)}
            className={`px-3 py-1 text-sm rounded-full border transition-all ${active ? 'bg-blue-100 border-blue-400 text-blue-700 font-medium' : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'}`}>
            {opt.label}
          </button>
        );
      })}
      {maxSel && <span className="text-xs text-gray-400 self-center">最多{maxSel}项，已选{selected.length}</span>}
    </div>
  );
};

// ---- 独立子组件：级联选项 ----
const CascadeField: React.FC<{ field: FormField; value: any; onChange: (v: any) => void }> = ({ field, value, onChange }) => {
  const options = field.cascadeOptions || [];
  const level = field.cascadeLevel || 2;
  const selected: string[] = Array.isArray(value) ? value : [];
  const getLevel = (lvl: number) => {
    if (lvl === 0) return options;
    let cur = options.find(o => o.value === selected[0]);
    for (let i = 1; i < lvl; i++) cur = cur?.children?.find(o => o.value === selected[i]);
    return cur?.children || [];
  };
  const handleSelect = (lvl: number, v: string) => {
    const newSel = selected.slice(0, lvl); newSel[lvl] = v; onChange(newSel);
  };
  return (
    <div className="flex gap-2 flex-wrap">
      {Array.from({ length: level }, (_, lvl) => (
        <select key={lvl} value={selected[lvl] || ''} onChange={e => handleSelect(lvl, e.target.value)}
          className="flex-1 min-w-0 h-10 px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
          disabled={lvl > 0 && !selected[lvl - 1]}>
          <option value="">{lvl === 0 ? (field.placeholder || '请选择') : `第${lvl + 1}级`}</option>
          {getLevel(lvl).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ))}
    </div>
  );
};

// ---- 独立子组件：关联（单向/双向） ----
const RelationField: React.FC<{ field: FormField; value: any; onChange: (v: any) => void; isBi?: boolean }> = ({ field, value, onChange, isBi }) => {
  const { forms, submissions } = useFormStore();
  const relForm = forms.find(f => f.id === field.relatedFormId);
  const relSubs = relForm ? (submissions[relForm.id] || []) : [];
  const displayField = relForm?.fields.find(f => f.id === field.relatedFieldId);
  const selected: string[] = Array.isArray(value) ? value : (value ? [value] : []);
  const getLabel = (subId: string) => {
    const sub = relSubs.find(s => s.id === subId);
    if (!sub) return subId;
    const v = displayField ? sub.data[displayField.id] : null;
    return v ? String(v) : `记录 #${relSubs.indexOf(sub) + 1}`;
  };
  return (
    <div className="space-y-2">
      <select onChange={e => { if (e.target.value && !selected.includes(e.target.value)) onChange([...selected, e.target.value]); }} defaultValue=""
        className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200">
        <option value="">{relForm ? `选择 ${relForm.settings.title} 中的记录` : '请先配置关联表单'}</option>
        {relSubs.filter(s => !selected.includes(s.id)).map(s => (
          <option key={s.id} value={s.id}>{getLabel(s.id)}</option>
        ))}
      </select>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map(id => (
            <span key={id} className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border ${isBi ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
              {getLabel(id)}
              <button type="button" onClick={() => onChange(selected.filter(s => s !== id))} className="hover:opacity-70">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ---- 独立子组件：明细表 ----
const SubtableField: React.FC<{ field: FormField; value: any; onChange: (v: any) => void }> = ({ field, value, onChange }) => {
  const cols = field.subFields || [];
  const rows: Record<string, any>[] = Array.isArray(value) ? value : [];
  const addRow = () => { const r: Record<string, any> = {}; cols.forEach(c => { r[c.id] = c.type === 'switch' ? false : ''; }); onChange([...rows, r]); };
  const updateCell = (ri: number, colId: string, val: any) => onChange(rows.map((r, i) => i === ri ? { ...r, [colId]: val } : r));
  const removeRow = (idx: number) => onChange(rows.filter((_, i) => i !== idx));
  const getCellInput = (col: any, ri: number, val: any) => {
    switch (col.type) {
      case 'number': return <input type="number" value={val ?? ''} onChange={e => updateCell(ri, col.id, Number(e.target.value))} placeholder={col.placeholder} className="w-full h-7 px-2 text-xs border-0 focus:outline-none bg-transparent" />;
      case 'select': return <select value={val || ''} onChange={e => updateCell(ri, col.id, e.target.value)} className="w-full h-7 px-1 text-xs border-0 focus:outline-none bg-transparent"><option value="">-</option>{col.options?.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
      case 'date': return <input type="date" value={val || ''} onChange={e => updateCell(ri, col.id, e.target.value)} className="w-full h-7 px-2 text-xs border-0 focus:outline-none bg-transparent" />;
      case 'switch': return <input type="checkbox" checked={!!val} onChange={e => updateCell(ri, col.id, e.target.checked)} className="accent-blue-600" />;
      default: return <input type="text" value={val || ''} onChange={e => updateCell(ri, col.id, e.target.value)} placeholder={col.placeholder} className="w-full h-7 px-2 text-xs border-0 focus:outline-none bg-transparent" />;
    }
  };
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="bg-gray-50 border-b border-gray-200">{cols.map(c => (<th key={c.id} className="px-2 py-2 text-left text-gray-600 font-medium border-r border-gray-200 last:border-r-0 whitespace-nowrap">{c.required && <span className="text-red-500 mr-0.5">*</span>}{c.label}</th>))}<th className="px-2 py-2 text-gray-400 font-normal w-8">操作</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={cols.length + 1} className="py-4 text-center text-gray-400 text-xs">暂无数据，点击下方添加</td></tr>}
            {rows.map((row, ri) => (
              <tr key={ri} className="border-t border-gray-100 hover:bg-gray-50">
                {cols.map(c => (<td key={c.id} className="border-r border-gray-100 last:border-r-0">{getCellInput(c, ri, row[c.id])}</td>))}
                <td className="px-2 py-1 text-center"><button type="button" onClick={() => removeRow(ri)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
        <button type="button" onClick={addRow} className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700 transition-colors">
          <Plus className="w-3.5 h-3.5" /> 添加一行
        </button>
      </div>
    </div>
  );
};

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
      case 'cascader':
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
          <input ref={ref} type="time" value={value || ''}
            onInput={e => onChange(e.currentTarget.value)}
            onChange={e => { onChange(e.currentTarget.value); ref.current?.blur(); }}
            onClick={() => ref.current?.showPicker?.()}
            className={`${baseInputCls} cursor-pointer`} />
        );
      }
      case 'rate':
        return <RateField field={field} value={value} onChange={onChange} />;
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
      case 'upload':
        return <UploadField field={field} value={value} onChange={onChange} />;

      // ── 信息类字段 ──
      case 'contact':
        return <ContactField field={field} value={value} onChange={onChange} />;
      case 'idcard':
        return (
          <div className="flex items-center gap-2">
            <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} placeholder={field.placeholder || '请输入身份证号码'}
              maxLength={18} className={baseInputCls + ' font-mono tracking-wider'} disabled={field.disabled} />
          </div>
        );
      case 'phone':
        return <input type="tel" value={value || ''} onChange={e => onChange(e.target.value)} placeholder={field.placeholder || '请输入手机号码'}
          maxLength={11} className={baseInputCls + ' tracking-wider'} disabled={field.disabled} />;
      case 'email':
        return <input type="email" value={value || ''} onChange={e => onChange(e.target.value)} placeholder={field.placeholder || '请输入邮箱地址'}
          className={baseInputCls} disabled={field.disabled} />;
      case 'address':
        return <AddressField field={field} value={value} onChange={onChange} />;
      case 'hyperlink':
        return <HyperlinkField field={field} value={value} onChange={onChange} />;
      case 'barcode':
        return <BarcodeField field={field} value={value} onChange={onChange} />;
      case 'location':
        return <LocationField field={field} value={value} onChange={onChange} />;

      // ── 数值类字段 ──
      case 'progress':
        return <ProgressField field={field} value={value} onChange={onChange} />;
      case 'level':
        return <LevelField field={field} value={value} onChange={onChange} />;
      case 'percent':
        return (
          <div className={`flex items-center h-10 border rounded-lg overflow-hidden ${error ? 'border-red-400' : 'border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-200'}`}>
            <input type="number" min={field.min ?? 0} max={field.max ?? 100} step={field.step || 1} value={value ?? ''} onChange={e => onChange(Number(e.target.value))}
              placeholder={field.placeholder || '0'} className="flex-1 h-full px-3 text-sm outline-none bg-white" />
            <span className="h-full px-3 flex items-center bg-gray-50 border-l border-gray-200 text-gray-500 text-sm">%</span>
          </div>
        );
      case 'currency':
        return (
          <div className={`flex items-center h-10 border rounded-lg overflow-hidden ${error ? 'border-red-400' : 'border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-200'}`}>
            <span className="h-full px-3 flex items-center bg-gray-50 border-r border-gray-200 text-gray-600 text-sm font-medium">{field.currency || '¥'}</span>
            <input type="number" min={0} step={0.01} value={value ?? ''} onChange={e => onChange(Number(e.target.value))}
              placeholder={field.placeholder || '0.00'} className="flex-1 h-full px-3 text-sm outline-none bg-white" />
          </div>
        );

      // ── 选择类字段 ──
      case 'multiselect':
        return <MultiSelectField field={field} value={value} onChange={onChange} />;
      case 'cascade':
        return <CascadeField field={field} value={value} onChange={onChange} />;

      // ── 高级关联 ──
      case 'relation':
        return <RelationField field={field} value={value} onChange={onChange} />;
      case 'birelation':
        return <RelationField field={field} value={value} onChange={onChange} isBi />;
      case 'subtable':
        return <SubtableField field={field} value={value} onChange={onChange} />;

      // ── 布局字段 ──
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

export const FormSubmitPage: React.FC<FormSubmitPageProps> = ({ formId }) => {
  const { forms, submitForm } = useFormStore();
  const { settings } = useSystemStore();
  const form = forms.find(f => f.id === formId);
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const title = form?.settings.title || '表单提交';
    document.title = `${title} - 提交`;
    return () => { document.title = settings.systemName; };
  }, [form]);

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <ExternalLink className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-gray-400">表单不存在或已被删除</p>
        </div>
      </div>
    );
  }

  if (!form.settings.publicSubmit || form.settings.publicSubmit === 'off') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-sm w-full mx-4">
          <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-orange-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">未开放独立提交</h2>
          <p className="text-sm text-gray-500">该表单暂未开启独立提交页面</p>
        </div>
      </div>
    );
  }

  // 状态检查 - 已由 App.tsx 处理 login-required 权限
  if (form.status !== 'published') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-sm w-full mx-4">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">表单暂未开放</h2>
          <p className="text-sm text-gray-500">该表单暂未发布或已停止收集</p>
        </div>
      </div>
    );
  }

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-md w-full">
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
        <footer className="fixed bottom-0 left-0 right-0 text-center py-4">
          <p className="text-xs text-gray-300">Powered by {settings.systemName}</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-xl mx-auto">
        {/* 表单卡片 - 独立提交页面，无返回按钮 */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          <div className={`h-2 ${accentBar[form.settings.theme || 'blue']}`} />
          <div className="p-6">
            <h1 className="text-xl font-bold text-gray-900">{form.settings.title}</h1>
            {form.settings.description && <p className="mt-2 text-sm text-gray-500">{form.settings.description}</p>}
          </div>
        </div>

        {/* 字段区域 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          {form.fields.length === 0 ? (
            <p className="text-center text-gray-400 py-8">该表单暂无填写字段</p>
          ) : (
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
          )}
        </div>

        {/* 提交按钮 */}
        <div className="flex justify-center mb-8">
          <button
            onClick={handleSubmit}
            className={`flex items-center gap-2 px-10 h-11 text-sm font-medium text-white rounded-xl shadow-sm hover:opacity-90 transition-opacity ${themeColor[form.settings.theme || 'blue']}`}
          >
            <Send className="w-4 h-4" />
            {form.settings.submitText || '提交'}
          </button>
        </div>
      </div>

      <footer className="text-center py-4">
        <p className="text-xs text-gray-300">Powered by {settings.systemName}</p>
      </footer>
    </div>
  );
};
