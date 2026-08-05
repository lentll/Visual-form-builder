import React from 'react';
import type { FormField, SubField, SubFieldType } from '@/types/form';
import { useFormStore } from '@/store/formStore';

interface PropertyPanelProps {
  field: FormField;
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-4">
    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-4">{title}</h4>
    <div className="px-4 space-y-3">{children}</div>
  </div>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-xs font-medium text-gray-600 mb-1">{children}</label>
);

const TextInput = ({ value, onChange, placeholder }: { value?: string; onChange: (v: string) => void; placeholder?: string }) => (
  <input
    type="text"
    value={value || ''}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    className="w-full h-8 px-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
  />
);

const NumberInput = ({ value, onChange, min, max }: { value?: number; onChange: (v: number) => void; min?: number; max?: number }) => (
  <input
    type="number"
    value={value ?? ''}
    onChange={e => onChange(Number(e.target.value))}
    min={min}
    max={max}
    className="w-full h-8 px-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
  />
);

const Toggle = ({ checked, onChange, label }: { checked?: boolean; onChange: (v: boolean) => void; label: string }) => (
  <label className="flex items-center justify-between cursor-pointer">
    <span className="text-sm text-gray-600">{label}</span>
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors ${checked ? 'bg-blue-500' : 'bg-gray-200'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'left-5' : 'left-0.5'}`} />
    </button>
  </label>
);

// 选项编辑器
const OptionsEditor = ({ options, onChange }: { options?: { label: string; value: string }[]; onChange: (opts: { label: string; value: string }[]) => void }) => {
  const opts = options || [];
  const addOption = () => onChange([...opts, { label: `选项${opts.length + 1}`, value: `opt${opts.length + 1}` }]);
  const removeOption = (i: number) => onChange(opts.filter((_, idx) => idx !== i));
  const updateOption = (i: number, key: 'label' | 'value', val: string) => {
    const newOpts = [...opts];
    newOpts[i] = { ...newOpts[i], [key]: val };
    onChange(newOpts);
  };

  return (
    <div className="space-y-2">
      {opts.map((opt, i) => (
        <div key={i} className="flex gap-1.5 items-center">
          <input
            value={opt.label}
            onChange={e => updateOption(i, 'label', e.target.value)}
            placeholder="选项标签"
            className="flex-1 h-7 px-2 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          <button onClick={() => removeOption(i)} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      ))}
      <button
        onClick={addOption}
        className="w-full h-7 text-xs text-blue-600 border border-dashed border-blue-300 rounded hover:bg-blue-50 transition-colors flex items-center justify-center gap-1"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        添加选项
      </button>
    </div>
  );
};

// 明细表子字段编辑器
const SUB_FIELD_TYPES: { value: SubFieldType; label: string }[] = [
  { value: 'input', label: '文本' },
  { value: 'number', label: '数字' },
  { value: 'select', label: '下拉' },
  { value: 'date', label: '日期' },
  { value: 'switch', label: '开关' },
];

const SubFieldsEditor = ({ subFields, onChange }: { subFields?: SubField[]; onChange: (sf: SubField[]) => void }) => {
  const sfs = subFields || [];
  const addField = () => {
    const idx = sfs.length + 1;
    onChange([...sfs, { id: `sf_${Date.now()}`, type: 'input', label: `列${idx}`, placeholder: '' }]);
  };
  const removeField = (i: number) => onChange(sfs.filter((_, idx) => idx !== i));
  const updateField = (i: number, key: keyof SubField, val: any) => {
    const newSfs = sfs.map((sf, idx) => idx === i ? { ...sf, [key]: val } : sf);
    onChange(newSfs);
  };

  return (
    <div className="space-y-2">
      {sfs.map((sf, i) => (
        <div key={sf.id} className="border border-gray-200 rounded-lg p-2.5 space-y-2 relative group">
          {/* 行号和删除按钮 */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">列 {i + 1}</span>
            <button onClick={() => removeField(i)} className="w-5 h-5 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          {/* 列名称 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-10 shrink-0">名称</span>
            <input
              value={sf.label}
              onChange={e => updateField(i, 'label', e.target.value)}
              className="flex-1 h-7 px-2 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
              placeholder="列标题"
            />
          </div>
          {/* 列类型 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-10 shrink-0">类型</span>
            <div className="flex flex-1 gap-1 flex-wrap">
              {SUB_FIELD_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => updateField(i, 'type', t.value)}
                  className={`px-2 py-0.5 text-[11px] rounded border transition-colors ${sf.type === t.value ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          {/* 占位提示 + 必填 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-10 shrink-0">提示</span>
            <input
              value={sf.placeholder || ''}
              onChange={e => updateField(i, 'placeholder', e.target.value)}
              className="flex-1 h-7 px-2 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
              placeholder="占位文字（可选）"
            />
            <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer shrink-0">
              <input type="checkbox" checked={sf.required || false} onChange={e => updateField(i, 'required', e.target.checked)} className="w-3 h-3" />
              必填
            </label>
          </div>
          {/* 下拉选择类型额外配置：选项 */}
          {sf.type === 'select' && (
            <div className="pl-12">
              <OptionsEditor
                options={sf.options}
                onChange={opts => updateField(i, 'options', opts)}
              />
            </div>
          )}
        </div>
      ))}
      <button
        onClick={addField}
        className="w-full h-7 text-xs text-blue-600 border border-dashed border-blue-300 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-1"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        添加列
      </button>
    </div>
  );
};

export const PropertyPanel: React.FC<PropertyPanelProps> = ({ field }) => {
  const { updateField } = useFormStore();
  const update = (updates: Partial<FormField>) => updateField(field.id, updates);

  const hasOptions = ['select', 'radio', 'checkbox', 'cascader', 'multiselect', 'cascade'].includes(field.type);
  const isLayout = ['title', 'description', 'divider', 'image'].includes(field.type);

  return (
    <div className="h-full overflow-y-auto py-4 text-sm">
      {/* 基础属性 */}
      <Section title="基础属性">
        {!isLayout && (
          <>
            <div>
              <Label>标签文字</Label>
              <TextInput value={field.label} onChange={v => update({ label: v })} />
            </div>
            {!['rate', 'slider', 'switch', 'divider'].includes(field.type) && (
              <div>
                <Label>占位提示</Label>
                <TextInput value={field.placeholder} onChange={v => update({ placeholder: v })} placeholder="请输入提示文字" />
              </div>
            )}
            <div>
              <Label>帮助说明</Label>
              <TextInput value={field.description} onChange={v => update({ description: v })} placeholder="字段说明（选填）" />
            </div>
          </>
        )}

        {/* 展示控件特有 */}
        {['title', 'description'].includes(field.type) && (
          <div>
            <Label>内容</Label>
            <textarea
              value={field.content || ''}
              onChange={e => update({ content: e.target.value })}
              rows={3}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
            />
          </div>
        )}
        {field.type === 'image' && (
          <div>
            <Label>图片地址</Label>
            <TextInput value={field.imageUrl} onChange={v => update({ imageUrl: v })} placeholder="https://..." />
          </div>
        )}
        {['title', 'description', 'image'].includes(field.type) && (
          <div>
            <Label>对齐方式</Label>
            <div className="flex gap-1">
              {(['left', 'center', 'right'] as const).map(a => (
                <button
                  key={a}
                  onClick={() => update({ align: a })}
                  className={`flex-1 h-7 text-xs rounded border transition-colors ${field.align === a ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                >
                  {a === 'left' ? '左' : a === 'center' ? '中' : '右'}
                </button>
              ))}
            </div>
          </div>
        )}
        {field.type === 'title' && (
          <div>
            <Label>标题级别</Label>
            <div className="flex gap-1">
              {([1, 2, 3] as const).map(l => (
                <button
                  key={l}
                  onClick={() => update({ level: l })}
                  className={`flex-1 h-7 text-xs rounded border transition-colors ${field.level === l ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-600'}`}
                >
                  H{l}
                </button>
              ))}
            </div>
          </div>
        )}
        {field.type === 'divider' && (
          <div>
            <Label>分割线文字（可选）</Label>
            <TextInput value={field.content} onChange={v => update({ content: v })} placeholder="分割线文字" />
          </div>
        )}
      </Section>

      {/* 控件特有属性 */}
      {!isLayout && (
        <Section title="控件属性">
          {field.type === 'textarea' && (
            <div>
              <Label>行数</Label>
              <NumberInput value={field.rows} onChange={v => update({ rows: v })} min={1} max={20} />
            </div>
          )}
          {field.type === 'rate' && (
            <div>
              <Label>最高评分</Label>
              <NumberInput value={field.max} onChange={v => update({ max: v })} min={3} max={10} />
            </div>
          )}
          {field.type === 'slider' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>最小值</Label><NumberInput value={field.min} onChange={v => update({ min: v })} /></div>
                <div><Label>最大值</Label><NumberInput value={field.max} onChange={v => update({ max: v })} /></div>
              </div>
              <div><Label>步长</Label><NumberInput value={field.step} onChange={v => update({ step: v })} min={1} /></div>
            </>
          )}
          {field.type === 'switch' && (
            <div className="grid grid-cols-2 gap-2">
              <div><Label>开启文字</Label><TextInput value={field.switchOnText} onChange={v => update({ switchOnText: v })} placeholder="是" /></div>
              <div><Label>关闭文字</Label><TextInput value={field.switchOffText} onChange={v => update({ switchOffText: v })} placeholder="否" /></div>
            </div>
          )}
          {['input', 'textarea'].includes(field.type) && (
            <Toggle checked={field.showCount} onChange={v => update({ showCount: v })} label="显示字数统计" />
          )}
          {field.type === 'input' && (
            <div className="grid grid-cols-2 gap-2">
              <div><Label>前缀</Label><TextInput value={field.prefix} onChange={v => update({ prefix: v })} placeholder="前缀" /></div>
              <div><Label>后缀</Label><TextInput value={field.suffix} onChange={v => update({ suffix: v })} placeholder="后缀" /></div>
            </div>
          )}
          {field.type === 'select' && (
            <Toggle checked={field.multiple} onChange={v => update({ multiple: v })} label="支持多选" />
          )}
          {field.type === 'upload' && (
            <>
              <Toggle checked={field.multiple} onChange={v => update({ multiple: v })} label="允许多文件" />
              <div><Label>接受文件类型</Label><TextInput value={field.accept} onChange={v => update({ accept: v })} placeholder="image/*, .pdf 等" /></div>
            </>
          )}
          {/* 联系人 */}
          {field.type === 'contact' && (
            <div>
              <Label>包含字段</Label>
              <div className="flex flex-wrap gap-2">
                {(['name', 'phone', 'email', 'company'] as const).map(k => {
                  const arr = field.contactFields || ['name', 'phone', 'email', 'company'];
                  const checked = arr.includes(k);
                  return (
                    <label key={k} className={`flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer border transition-colors ${checked ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-500'}`}>
                      <input type="checkbox" checked={checked} onChange={() => update({ contactFields: checked ? arr.filter(a => a !== k) : [...arr, k] })} className="sr-only" />
                      {{name:'姓名',phone:'电话',email:'邮箱',company:'公司'}[k]}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
          {/* 地址 */}
          {field.type === 'address' && (
            <div>
              <Label>地址层级</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map(l => (
                  <button key={l} onClick={() => update({ addressLevel: l as 1|2|3|4 })}
                    className={`flex-1 h-7 text-xs rounded border transition-colors ${(field.addressLevel || 4) === l ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    {['省','省市','省市区','省市区+详细'][l-1]}
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* 定位 */}
          {field.type === 'location' && (
            <div>
              <Label>定位方式</Label>
              <div className="flex gap-1">
                {(['auto', 'manual'] as const).map(m => (
                  <button key={m} onClick={() => update({ locationMode: m })}
                    className={`flex-1 h-7 text-xs rounded border transition-colors ${(field.locationMode || 'manual') === m ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    {m === 'auto' ? '自动定位' : '手动输入'}
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* 条码 */}
          {field.type === 'barcode' && (
            <div>
              <Label>条码类型</Label>
              <div className="flex gap-1">
                {(['qrcode', 'barcode'] as const).map(t => (
                  <button key={t} onClick={() => update({ barcodeType: t })}
                    className={`flex-1 h-7 text-xs rounded border transition-colors ${(field.barcodeType || 'qrcode') === t ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    {t === 'qrcode' ? '二维码' : '条形码'}
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* 超链接 */}
          {field.type === 'hyperlink' && (
            <div><Label>链接文字</Label><TextInput value={field.linkText} onChange={v => update({ linkText: v })} placeholder="点击查看" /></div>
          )}
          {/* 进度 */}
          {field.type === 'progress' && (
            <>
              <div><Label>最大值</Label><NumberInput value={field.max} onChange={v => update({ max: v })} min={1} max={10000} /></div>
              <div><Label>进度条颜色</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={field.progressColor || '#3b82f6'} onChange={e => update({ progressColor: e.target.value })} className="w-8 h-7 rounded border border-gray-200 cursor-pointer" />
                  <TextInput value={field.progressColor || ''} onChange={v => update({ progressColor: v })} placeholder="#3b82f6" />
                </div>
              </div>
            </>
          )}
          {/* 等级 */}
          {field.type === 'level' && (
            <>
              <div><Label>最大等级</Label><NumberInput value={field.levelMax} onChange={v => update({ levelMax: v })} min={3} max={10} /></div>
              <div>
                <Label>展示方式</Label>
                <div className="flex gap-1">
                  {(['star', 'number', 'tag'] as const).map(t => (
                    <button key={t} onClick={() => update({ levelType: t })}
                      className={`flex-1 h-7 text-xs rounded border transition-colors ${(field.levelType || 'star') === t ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {{star:'★星标',number:'数字',tag:'标签'}[t]}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          {/* 货币 */}
          {field.type === 'currency' && (
            <div>
              <Label>货币符号</Label>
              <div className="flex gap-1">
                {(['¥', '$', '€', '£', '¥/元'] as const).map(s => {
                  const sym = s === '¥/元' ? '元' : s;
                  return (
                    <button key={s} onClick={() => update({ currency: sym })}
                      className={`flex-1 h-7 text-xs rounded border transition-colors ${(field.currency || '¥') === sym ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {/* 多选项 */}
          {field.type === 'multiselect' && (
            <div><Label>最多可选</Label><NumberInput value={field.maxSelect} onChange={v => update({ maxSelect: v })} min={0} max={100} /></div>
          )}
          {/* 级联选项 */}
          {field.type === 'cascade' && (
            <div><Label>级联层级</Label><NumberInput value={field.cascadeLevel} onChange={v => update({ cascadeLevel: v })} min={2} max={5} /></div>
          )}
          {/* 关联字段 */}
          {field.type === 'relation' && (
            <>
              <div><Label>关联表单 ID</Label><TextInput value={field.relatedFormId} onChange={v => update({ relatedFormId: v })} placeholder="表单ID" /></div>
              <div><Label>关联字段 ID</Label><TextInput value={field.relatedFieldId} onChange={v => update({ relatedFieldId: v })} placeholder="显示字段ID" /></div>
            </>
          )}
          {field.type === 'birelation' && (
            <>
              <div><Label>关联表单 ID</Label><TextInput value={field.biRelatedFormId} onChange={v => update({ biRelatedFormId: v })} placeholder="表单ID" /></div>
              <div><Label>关联字段 ID</Label><TextInput value={field.biRelatedFieldId} onChange={v => update({ biRelatedFieldId: v })} placeholder="显示字段ID" /></div>
            </>
          )}
          {/* 明细表 */}
          {field.type === 'subtable' && (
            <>
              <div>
                <Label>默认行数</Label>
                <NumberInput value={field.defaultRowCount} onChange={v => update({ defaultRowCount: v })} min={0} max={100} />
              </div>
              <div>
                <Label>列配置</Label>
                <SubFieldsEditor subFields={field.subFields} onChange={sf => update({ subFields: sf })} />
              </div>
            </>
          )}

          {/* 布局宽度 - 排除复杂字段和自有布局的字段 */}
          {!['radio', 'checkbox', 'rate', 'slider', 'switch', 'upload', 'cascader', 'contact', 'address', 'location', 'hyperlink', 'barcode', 'progress', 'multiselect', 'cascade', 'relation', 'birelation', 'subtable'].includes(field.type) && (
            <div>
              <Label>字段宽度</Label>
              <div className="flex gap-1">
                {(['full', 'half'] as const).map((val) => (
                  <button key={val}
                    onClick={() => update({ width: val })}
                    className={`flex-1 h-7 text-xs rounded border transition-colors ${(field.width || 'full') === val ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >
                    {val === 'full' ? '整行' : '半行'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* 选项配置 */}
      {hasOptions && (
        <Section title="选项配置">
          <OptionsEditor options={field.options} onChange={opts => update({ options: opts })} />
        </Section>
      )}

      {/* 验证规则 */}
      {!isLayout && (
        <Section title="验证规则">
          <Toggle
            checked={field.validation?.required}
            onChange={v => update({ validation: { ...field.validation, required: v } })}
            label="必填"
          />
          {['input', 'textarea'].includes(field.type) && (
            <div className="grid grid-cols-2 gap-2">
              <div><Label>最小长度</Label><NumberInput value={field.validation?.minLength} onChange={v => update({ validation: { ...field.validation, minLength: v } })} min={0} /></div>
              <div><Label>最大长度</Label><NumberInput value={field.validation?.maxLength} onChange={v => update({ validation: { ...field.validation, maxLength: v } })} min={0} /></div>
            </div>
          )}
          {['input'].includes(field.type) && (
            <div>
              <Label>正则验证</Label>
              <TextInput value={field.validation?.pattern} onChange={v => update({ validation: { ...field.validation, pattern: v } })} placeholder="正则表达式" />
            </div>
          )}
          {field.validation?.pattern && (
            <div>
              <Label>错误提示</Label>
              <TextInput value={field.validation?.message} onChange={v => update({ validation: { ...field.validation, message: v } })} placeholder="验证失败提示" />
            </div>
          )}
          <Toggle checked={field.hidden} onChange={v => update({ hidden: v })} label="隐藏此字段" />
          <Toggle checked={field.disabled} onChange={v => update({ disabled: v })} label="禁用此字段" />
        </Section>
      )}
    </div>
  );
};
