import React from 'react';
import type { FormField } from '@/types/form';
import { Star, Minus, MapPin, Navigation, QrCode, Link, User, Phone, Mail, CreditCard, TrendingUp, Award, Percent, DollarSign, Tags, GitBranch, ArrowRight, ArrowLeftRight, Table2, Plus, Trash2 } from 'lucide-react';

interface FieldPreviewProps {
  field: FormField;
  selected?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  isDragging?: boolean;
}

// 评分预览
const RatePreview = ({ max = 5 }: { max?: number }) => (
  <div className="flex gap-1 mt-1">
    {Array.from({ length: max }, (_, i) => (
      <Star key={i} className={`w-6 h-6 ${i < 3 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
    ))}
  </div>
);

// 单选预览
const RadioPreview = ({ options }: { options?: { label: string; value: string }[] }) => (
  <div className="flex flex-wrap gap-3 mt-1">
    {options?.map((opt, i) => (
      <label key={i} className="flex items-center gap-1.5 text-sm text-gray-600">
        <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${i === 0 ? 'border-blue-500' : 'border-gray-300'}`}>
          {i === 0 && <span className="w-2 h-2 rounded-full bg-blue-500 block" />}
        </span>
        {opt.label}
      </label>
    ))}
  </div>
);

// 多选预览
const CheckboxPreview = ({ options }: { options?: { label: string; value: string }[] }) => (
  <div className="flex flex-wrap gap-3 mt-1">
    {options?.map((opt, i) => (
      <label key={i} className="flex items-center gap-1.5 text-sm text-gray-600">
        <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${i === 0 ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
          {i === 0 && <svg viewBox="0 0 10 8" className="w-2.5 h-2 text-white fill-current"><path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>}
        </span>
        {opt.label}
      </label>
    ))}
  </div>
);

// 滑块预览
const SliderPreview = ({ min = 0, max = 100, defaultValue = 50 }: { min?: number; max?: number; defaultValue?: number }) => {
  const pct = ((defaultValue - min) / (max - min)) * 100;
  return (
    <div className="mt-2 px-1">
      <div className="relative h-2 bg-gray-200 rounded-full">
        <div className="absolute h-2 bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
        <div className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full top-1/2 -translate-y-1/2 shadow-sm" style={{ left: `calc(${pct}% - 8px)` }} />
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{min}</span><span>{defaultValue}</span><span>{max}</span>
      </div>
    </div>
  );
};

// 进度条预览
const ProgressPreview = ({ value = 0, max = 100, color = '#3b82f6' }: { value?: number; max?: number; color?: string }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>进度</span><span>{pct.toFixed(0)}%</span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color || '#3b82f6' }} />
      </div>
    </div>
  );
};

// 等级预览
const LevelPreview = ({ max = 5, type = 'star', value = 3 }: { max?: number; type?: string; value?: number }) => {
  if (type === 'star') {
    return (
      <div className="flex gap-1 mt-1">
        {Array.from({ length: max }, (_, i) => (
          <Star key={i} className={`w-5 h-5 ${i < value ? 'fill-orange-400 text-orange-400' : 'text-gray-300'}`} />
        ))}
      </div>
    );
  }
  if (type === 'number') {
    return (
      <div className="flex gap-1 mt-1">
        {Array.from({ length: max }, (_, i) => (
          <span key={i} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${i < value ? 'border-orange-400 bg-orange-400 text-white' : 'border-gray-200 text-gray-400'}`}>{i + 1}</span>
        ))}
      </div>
    );
  }
  // tag 类型
  const labels = ['差', '较差', '一般', '良好', '优秀'];
  return (
    <div className="flex gap-1 mt-1 flex-wrap">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`px-2 py-0.5 text-xs rounded-full border ${i < value ? 'bg-orange-100 border-orange-300 text-orange-700' : 'border-gray-200 text-gray-400'}`}>{labels[i] || `L${i + 1}`}</span>
      ))}
    </div>
  );
};

// 多选标签预览
const MultiSelectPreview = ({ options }: { options?: { label: string; value: string }[] }) => (
  <div className="flex flex-wrap gap-1.5 mt-1">
    {options?.slice(0, 4).map((opt, i) => (
      <span key={i} className={`px-2.5 py-0.5 text-xs rounded-full border transition-colors cursor-pointer ${i < 2 ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
        {opt.label}
      </span>
    ))}
    {(options?.length || 0) > 4 && <span className="text-xs text-gray-400 self-center">+{(options?.length || 0) - 4}</span>}
  </div>
);

// 级联选项预览
const CascadePreview = ({ placeholder = '请逐级选择', level = 2 }: { placeholder?: string; level?: number }) => (
  <div className="flex gap-2 mt-1">
    {Array.from({ length: level }, (_, i) => (
      <div key={i} className="flex-1 flex items-center h-9 px-3 border border-gray-200 rounded-md bg-gray-50 text-gray-400 text-sm">
        <span className="flex-1 truncate">{i === 0 ? placeholder : `第${i + 1}级`}</span>
        <svg className="w-3 h-3 ml-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
      </div>
    ))}
  </div>
);

// 明细表预览
const SubTablePreview = ({ subFields }: { subFields?: any[] }) => {
  const cols = subFields || [{ label: '名称' }, { label: '数量' }, { label: '单价' }];
  return (
    <div className="mt-1 border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-50">
            {cols.map((f: any, i: number) => (
              <th key={i} className="px-2 py-1.5 text-left text-gray-500 font-medium border-r border-gray-200 last:border-r-0">{f.label}</th>
            ))}
            <th className="px-2 py-1.5 text-gray-400 font-normal w-8">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-gray-100">
            {cols.map((_: any, i: number) => (
              <td key={i} className="px-2 py-1.5 border-r border-gray-100 last:border-r-0">
                <div className="h-5 bg-gray-100 rounded w-full" />
              </td>
            ))}
            <td className="px-2 py-1.5 text-center">
              <Trash2 className="w-3 h-3 text-gray-300" />
            </td>
          </tr>
        </tbody>
      </table>
      <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50">
        <button className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600">
          <Plus className="w-3 h-3" /> 添加一行
        </button>
      </div>
    </div>
  );
};

export const FieldPreview: React.FC<FieldPreviewProps> = ({
  field, selected, onClick, onDelete, onDuplicate, isDragging,
}) => {
  const isLayout = ['title', 'description', 'divider', 'image'].includes(field.type);

  const renderContent = () => {
    switch (field.type) {
      case 'input':
      case 'number':
        return (
          <div className="mt-1 flex items-center h-9 px-3 border border-gray-200 rounded-md bg-gray-50 text-gray-400 text-sm">
            {field.prefix && <span className="mr-1 text-gray-500">{field.prefix}</span>}
            <span className="flex-1 truncate">{field.placeholder || '请输入...'}</span>
            {field.suffix && <span className="ml-1 text-gray-500">{field.suffix}</span>}
          </div>
        );
      case 'textarea':
        return (
          <div className="mt-1 px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-400 text-sm" style={{ minHeight: `${(field.rows || 3) * 24}px` }}>
            {field.placeholder || '请输入...'}
          </div>
        );
      case 'select':
      case 'cascader':
        return (
          <div className="mt-1 flex items-center h-9 px-3 border border-gray-200 rounded-md bg-gray-50 text-gray-400 text-sm">
            <span className="flex-1">{field.placeholder || '请选择'}</span>
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </div>
        );
      case 'radio': return <RadioPreview options={field.options} />;
      case 'checkbox': return <CheckboxPreview options={field.options} />;
      case 'date':
        return (
          <div className="mt-1 flex items-center h-9 px-3 border border-gray-200 rounded-md bg-gray-50 text-gray-400 text-sm">
            <span className="flex-1">{field.placeholder || '请选择日期'}</span>
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
          </div>
        );
      case 'time':
        return (
          <div className="mt-1 flex items-center h-9 px-3 border border-gray-200 rounded-md bg-gray-50 text-gray-400 text-sm">
            <span className="flex-1">{field.placeholder || '请选择时间'}</span>
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
          </div>
        );
      case 'rate': return <RatePreview max={field.max} />;
      case 'slider': return <SliderPreview min={field.min} max={field.max} defaultValue={field.defaultValue} />;
      case 'switch':
        return (
          <div className="mt-2 flex items-center gap-2">
            <div className="w-10 h-5 bg-blue-500 rounded-full relative">
              <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow" />
            </div>
            <span className="text-sm text-gray-500">{field.switchOnText || '是'}</span>
          </div>
        );
      case 'upload':
        return (
          <div className="mt-1 flex flex-col items-center justify-center h-20 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 text-gray-400 text-sm gap-1">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            <span>点击上传文件</span>
          </div>
        );

      // ── 信息类字段 ──
      case 'contact':
        return (
          <div className="mt-1 border border-gray-200 rounded-lg bg-gray-50 p-2.5 flex flex-wrap gap-2">
            {(field.contactFields || ['name', 'phone', 'email']).map((cf: string) => {
              const cfLabels: Record<string, string> = { name: '姓名', phone: '电话', email: '邮箱', company: '公司' };
              const cfIcons: Record<string, React.ReactNode> = { name: <User className="w-3 h-3" />, phone: <Phone className="w-3 h-3" />, email: <Mail className="w-3 h-3" />, company: <CreditCard className="w-3 h-3" /> };
              return (
                <div key={cf} className="flex items-center gap-1 h-7 px-2 bg-white border border-gray-200 rounded text-xs text-gray-400">
                  {cfIcons[cf]}<span>{cfLabels[cf]}</span>
                </div>
              );
            })}
          </div>
        );
      case 'idcard':
        return (
          <div className="mt-1 flex items-center h-9 px-3 border border-gray-200 rounded-md bg-gray-50 text-gray-400 text-sm gap-2">
            <CreditCard className="w-4 h-4 text-gray-300" />
            <span className="flex-1 truncate">{field.placeholder || '请输入身份证号'}</span>
          </div>
        );
      case 'phone':
        return (
          <div className="mt-1 flex items-center h-9 px-3 border border-gray-200 rounded-md bg-gray-50 text-gray-400 text-sm gap-2">
            <Phone className="w-4 h-4 text-gray-300" />
            <span className="flex-1 truncate">{field.placeholder || '请输入手机号'}</span>
          </div>
        );
      case 'email':
        return (
          <div className="mt-1 flex items-center h-9 px-3 border border-gray-200 rounded-md bg-gray-50 text-gray-400 text-sm gap-2">
            <Mail className="w-4 h-4 text-gray-300" />
            <span className="flex-1 truncate">{field.placeholder || '请输入邮箱'}</span>
          </div>
        );
      case 'address':
        return (
          <div className="mt-1 space-y-1.5">
            <div className="flex gap-1.5">
              {Array.from({ length: Math.min(field.addressLevel || 3, 3) }, (_, i) => {
                const lvls = ['省/市', '市/区', '区/县'];
                return (
                  <div key={i} className="flex-1 flex items-center h-8 px-2 border border-gray-200 rounded-md bg-gray-50 text-gray-400 text-xs">
                    <span className="flex-1">{lvls[i]}</span>
                    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                  </div>
                );
              })}
            </div>
            {(field.addressLevel || 3) >= 4 && (
              <div className="flex items-center h-8 px-2 border border-gray-200 rounded-md bg-gray-50 text-gray-400 text-xs">
                <MapPin className="w-3 h-3 mr-1" /><span>详细地址</span>
              </div>
            )}
          </div>
        );
      case 'hyperlink':
        return (
          <div className="mt-1 space-y-1.5">
            <div className="flex items-center h-9 px-3 border border-gray-200 rounded-md bg-gray-50 text-gray-400 text-sm gap-2">
              <Link className="w-4 h-4 text-gray-300" />
              <span className="flex-1 truncate">{field.placeholder || 'https://'}</span>
            </div>
            {field.linkText && (
              <div className="flex items-center gap-1 text-xs text-blue-400">
                <Link className="w-3 h-3" /><span>{field.linkText}</span>
              </div>
            )}
          </div>
        );
      case 'barcode':
        return (
          <div className="mt-1 flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 text-gray-400 text-sm gap-1.5">
            <QrCode className="w-8 h-8 text-gray-300" />
            <span className="text-xs">输入内容后自动生成{field.barcodeType === 'barcode' ? '条形码' : '二维码'}</span>
          </div>
        );
      case 'location':
        return (
          <div className="mt-1 h-20 border border-gray-200 rounded-lg bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center gap-2 text-gray-400 text-sm">
            <Navigation className="w-5 h-5 text-blue-400" />
            <span>{field.locationMode === 'manual' ? '手动输入位置' : '点击获取当前位置'}</span>
          </div>
        );

      // ── 数值类字段 ──
      case 'progress':
        return <ProgressPreview value={field.defaultValue} max={field.max} color={field.progressColor} />;
      case 'level':
        return <LevelPreview max={field.levelMax} type={field.levelType} value={Math.floor((field.levelMax || 5) * 0.6)} />;
      case 'percent':
        return (
          <div className="mt-1 flex items-center h-9 border border-gray-200 rounded-md bg-gray-50 text-gray-400 text-sm overflow-hidden">
            <input readOnly className="flex-1 h-full px-3 bg-transparent text-gray-400 text-sm outline-none cursor-default" placeholder={field.placeholder || '0'} />
            <span className="h-full px-3 flex items-center bg-gray-100 border-l border-gray-200 text-gray-500"><Percent className="w-3.5 h-3.5" /></span>
          </div>
        );
      case 'currency':
        return (
          <div className="mt-1 flex items-center h-9 border border-gray-200 rounded-md bg-gray-50 text-gray-400 text-sm overflow-hidden">
            <span className="h-full px-3 flex items-center bg-gray-100 border-r border-gray-200 text-gray-500">{field.currency || '¥'}</span>
            <input readOnly className="flex-1 h-full px-3 bg-transparent text-gray-400 text-sm outline-none cursor-default" placeholder={field.placeholder || '0.00'} />
          </div>
        );

      // ── 选择类字段 ──
      case 'multiselect':
        return <MultiSelectPreview options={field.options} />;
      case 'cascade':
        return <CascadePreview placeholder={field.placeholder} level={field.cascadeLevel} />;

      // ── 高级关联 ──
      case 'relation':
        return (
          <div className="mt-1 flex items-center h-10 px-3 border border-dashed border-blue-200 rounded-lg bg-blue-50/50 text-sm gap-2">
            <ArrowRight className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="text-gray-400 flex-1 truncate">{field.relatedLabel || '点击选择关联数据'}</span>
          </div>
        );
      case 'birelation':
        return (
          <div className="mt-1 flex items-center h-10 px-3 border border-dashed border-purple-200 rounded-lg bg-purple-50/50 text-sm gap-2">
            <ArrowLeftRight className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-gray-400 flex-1 truncate">{field.relatedLabel || '点击选择双向关联数据'}</span>
          </div>
        );
      case 'subtable':
        return <SubTablePreview subFields={field.subFields} />;

      // ── 展示控件 ──
      case 'title': {
        const sizeClass = ['text-2xl font-bold', 'text-xl font-semibold', 'text-lg font-medium'][field.level! - 1 || 1];
        return <div className={`${sizeClass} text-gray-800 text-${field.align || 'left'}`}>{field.content || '标题'}</div>;
      }
      case 'description':
        return <p className={`text-sm text-gray-600 text-${field.align || 'left'}`}>{field.content || '说明文字'}</p>;
      case 'divider':
        return (
          <div className="flex items-center gap-2 py-1">
            <div className="flex-1 h-px bg-gray-200" />
            {field.content && <span className="text-xs text-gray-400 whitespace-nowrap">{field.content}</span>}
            {field.content && <div className="flex-1 h-px bg-gray-200" />}
          </div>
        );
      case 'image':
        return (
          <div className={`flex justify-${field.align === 'right' ? 'end' : field.align === 'center' ? 'center' : 'start'} mt-1`}>
            <img src={field.imageUrl} alt="图片" className="max-w-full max-h-40 rounded object-cover" onError={e => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x120/e2e8f0/94a3b8?text=图片'; }} />
          </div>
        );
      default: return null;
    }
  };

  return (
    <div
      onClick={e => { e.stopPropagation(); onClick?.(); }}
      className={`group relative rounded-lg border-2 transition-all cursor-pointer select-none
        ${isDragging ? 'opacity-50 scale-95' : ''}
        ${selected
          ? 'border-blue-500 bg-blue-50/30 shadow-sm'
          : 'border-transparent hover:border-blue-200 hover:bg-gray-50/50'
        }
        ${isLayout ? 'py-3 px-4' : 'py-3 px-4'}
      `}
    >
      {!isLayout && (
        <div className="flex items-start gap-1 mb-0.5">
          {field.validation?.required && (
            <span className="text-red-500 text-sm leading-5 mt-0.5">*</span>
          )}
          <span className="text-sm font-medium text-gray-700">{field.label}</span>
        </div>
      )}
      {field.description && (
        <p className="text-xs text-gray-400 mb-1">{field.description}</p>
      )}
      {renderContent()}

      {/* 操作按钮 */}
      {selected && (
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={e => { e.stopPropagation(); onDuplicate?.(); }}
            className="p-1 rounded hover:bg-blue-100 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
            title="复制"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete?.(); }}
            className="p-1 rounded hover:bg-red-100 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            title="删除"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      )}

      {/* 拖拽手柄 */}
      <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 transition-opacity cursor-grab">
        <Minus className="w-3 h-3 text-gray-400 rotate-90" />
      </div>
    </div>
  );
};
