import React from 'react';
import { useFormStore } from '@/store/formStore';

interface FormSettingsPanelProps {
  formId: string;
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

const THEMES = [
  { value: 'blue', label: '蓝色', color: 'bg-blue-500' },
  { value: 'green', label: '绿色', color: 'bg-green-500' },
  { value: 'purple', label: '紫色', color: 'bg-purple-500' },
  { value: 'orange', label: '橙色', color: 'bg-orange-500' },
  { value: 'default', label: '深灰', color: 'bg-gray-700' },
] as const;

export const FormSettingsPanel: React.FC<FormSettingsPanelProps> = ({ formId }) => {
  const { currentForm, updateFormSettings } = useFormStore();
  if (!currentForm) return null;
  const s = currentForm.settings;
  const update = (updates: any) => updateFormSettings(formId, updates);

  return (
    <div className="h-full overflow-y-auto py-4">
      <Section title="基本信息">
        <div>
          <Label>表单标题</Label>
          <input value={s.title} onChange={e => update({ title: e.target.value })}
            className="w-full h-8 px-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400" />
        </div>
        <div>
          <Label>表单描述</Label>
          <textarea value={s.description || ''} onChange={e => update({ description: e.target.value })}
            rows={3} placeholder="填写表单说明（可选）"
            className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none" />
        </div>
      </Section>

      <Section title="主题色">
        <div className="flex gap-2 flex-wrap">
          {THEMES.map(t => (
            <button key={t.value} onClick={() => update({ theme: t.value })}
              title={t.label}
              className={`w-8 h-8 rounded-full ${t.color} ring-offset-2 transition-all ${s.theme === t.value ? 'ring-2 ring-blue-400 scale-110' : 'hover:scale-105'}`} />
          ))}
        </div>
      </Section>

      <Section title="提交设置">
        <div>
          <Label>提交按钮文字</Label>
          <input value={s.submitText || '提交'} onChange={e => update({ submitText: e.target.value })}
            className="w-full h-8 px-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400" />
        </div>
        <div>
          <Label>提交成功提示</Label>
          <textarea value={s.successMessage || ''} onChange={e => update({ successMessage: e.target.value })}
            rows={2}
            className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none" />
        </div>
        <div>
          <Label>截止日期（可选）</Label>
          <input type="datetime-local" value={s.deadline || ''} onChange={e => update({ deadline: e.target.value })}
            className="w-full h-8 px-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400" />
        </div>
        <div>
          <Label>最大提交次数（0=不限）</Label>
          <input type="number" value={s.maxSubmits || 0} onChange={e => update({ maxSubmits: Number(e.target.value) })}
            min={0}
            className="w-full h-8 px-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400" />
        </div>
      </Section>

      <Section title="公开查询">
        <p className="text-xs text-gray-400 mb-3">设置数据查询页的访问方式</p>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {[
            { value: 'off', label: '关闭' },
            { value: 'public', label: '免登录访问' },
            { value: 'login-required', label: '需登录访问' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => update({ publicQuery: value })}
              className={`flex-1 h-7 text-xs rounded-md transition-colors ${(s.publicQuery || 'off') === value ? 'bg-white text-gray-900 font-medium shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {label}
            </button>
          ))}
        </div>
        {s.publicQuery && s.publicQuery !== 'off' && (
          <div className="space-y-3 mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              {s.publicQuery === 'public' ? '免登录即可通过链接查询数据' : '需登录后才能通过链接查询数据'}
            </p>
            <div>
              <Label>查询页标题</Label>
              <input
                value={s.publicQueryTitle || ''}
                onChange={e => update({ publicQueryTitle: e.target.value })}
                placeholder={s.title || '请输入查询页标题'}
                className="w-full h-8 px-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
              <p className="text-xs text-gray-400 mt-1">留空则默认显示表单标题</p>
            </div>
            <div>
              <Label>查询页背景图</Label>
              <input
                value={s.publicQueryBgImage || ''}
                onChange={e => update({ publicQueryBgImage: e.target.value })}
                placeholder="输入图片URL或选择一张（可选）"
                className="w-full h-8 px-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
              <p className="text-xs text-gray-400 mt-1">支持在线图片URL，留空则使用默认灰色背景</p>
            </div>
            {s.publicQueryBgImage && (
              <div className="rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={s.publicQueryBgImage}
                  alt="背景图预览"
                  className="w-full h-24 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        )}
      </Section>

      <Section title="提交页面">
        <p className="text-xs text-gray-400 mb-3">设置表单提交页的独立访问方式</p>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {[
            { value: 'off', label: '关闭' },
            { value: 'public', label: '免登录提交' },
            { value: 'login-required', label: '需登录提交' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => update({ publicSubmit: value })}
              className={`flex-1 h-7 text-xs rounded-md transition-colors ${(s.publicSubmit || 'off') === value ? 'bg-white text-gray-900 font-medium shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {label}
            </button>
          ))}
        </div>
        {s.publicSubmit && s.publicSubmit !== 'off' && (
          <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">
            {s.publicSubmit === 'public' ? '免登录即可通过独立链接填写并提交表单' : '需登录后才能通过独立链接填写并提交表单'}
          </p>
        )}
      </Section>

      <Section title="其他选项">
        <Toggle checked={s.showProgress} onChange={v => update({ showProgress: v })} label="显示填写进度" />
      </Section>

      <Section title="数据权限">
        <p className="text-xs text-gray-400 mb-2">设置普通用户对该表单数据的操作权限</p>
        <Toggle
          checked={s.canViewData !== false}
          onChange={v => update({ canViewData: v })}
          label="普通用户可查看数据"
        />
        <Toggle
          checked={!!s.canEditData}
          onChange={v => update({ canEditData: v })}
          label="普通用户可编辑数据记录"
        />
        <p className="text-xs text-gray-300 mt-2 pt-2 border-t border-gray-100">
          注意：普通用户始终无法编辑表单布局和设置，仅可操作数据。
        </p>
      </Section>
    </div>
  );
};
