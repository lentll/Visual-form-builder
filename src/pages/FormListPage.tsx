import React, { useState } from 'react';
import type { FormSchema } from '@/types/form';
import { useFormStore, useAuthStore, useSystemStore } from '@/store/formStore';
import {
  Plus, Search, MoreHorizontal, FileText, Users,
  Edit3, Trash2, Eye, BarChart2,
  Globe, ExternalLink, LogOut, Send,
  Lock, ChevronRight, TrendingUp, Settings
} from 'lucide-react';

interface FormListPageProps {
  onEdit: (formId: string) => void;
  onPreview: (formId: string) => void;
  onData: (formId: string) => void;
  onLogout: () => void;
  onSettings: () => void;
  onUsers: () => void;
}

const StatusBadge = ({ status }: { status: FormSchema['status'] }) => {
  const map = {
    draft: { label: '草稿', cls: 'bg-gray-100 text-gray-600' },
    published: { label: '收集中', cls: 'bg-green-100 text-green-700' },
    closed: { label: '已关闭', cls: 'bg-red-100 text-red-600' },
  };
  const { label, cls } = map[status];
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>;
};

const ThemeAccent = ({ theme }: { theme?: string }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-500', green: 'bg-green-500',
    purple: 'bg-purple-500', orange: 'bg-orange-500', default: 'bg-gray-600',
  };
  return <div className={`h-1 w-full rounded-t-xl ${colors[theme || 'blue']}`} />;
};

export const FormListPage: React.FC<FormListPageProps> = ({ onEdit, onPreview, onData, onLogout, onSettings, onUsers }) => {
  const { forms, createForm, deleteForm, loadForm, publishForm, closeForm } = useFormStore();
  const currentUser = useAuthStore(s => s.user);
  const isAdmin = currentUser?.role === 'admin';
  const canCreate = isAdmin || !!currentUser?.permissions?.canCreateForm;
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'closed'>('all');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  // 普通用户可看自己的表单 + 管理员设置了查看权限的表单
  const myForms = isAdmin
    ? forms
    : forms.filter(f => f.ownerId === currentUser?.username || (f.ownerId !== currentUser?.username && f.settings.canViewData !== false));

  const handleCreate = () => {
    const newForm = createForm();
    loadForm(newForm.id);
    onEdit(newForm.id);
  };

  const handleEdit = (id: string) => {
    loadForm(id);
    onEdit(id);
  };

  const filtered = myForms.filter(f => {
    if (filter !== 'all' && f.status !== filter) return false;
    if (search && !f.settings.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: myForms.length,
    published: myForms.filter(f => f.status === 'published').length,
    totalSubmits: myForms.reduce((s, f) => s + f.submits, 0),
    draft: myForms.filter(f => f.status === 'draft').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center h-16 gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">{useSystemStore.getState().settings.systemName}</span>
              <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">Pro</span>
            </div>
            <nav className="flex gap-1 ml-4">
              {['我的表单', '模板库', '数据中心'].map((item, i) => (
                <button key={item} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${i === 0 ? 'text-blue-600 bg-blue-50 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
                  {item}
                </button>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-3">
              {canCreate && (
                <button onClick={handleCreate} className="flex items-center gap-2 px-4 h-9 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="w-4 h-4" />
                  新建表单
                </button>
              )}
              {isAdmin && (
                <button onClick={onUsers} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-purple-500 hover:border-purple-200 hover:bg-purple-50 transition-colors" title="用户管理">
                  <Users className="w-4 h-4" />
                </button>
              )}
              {isAdmin && (
                <button onClick={onSettings} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-blue-500 hover:border-blue-200 hover:bg-blue-50 transition-colors" title="系统设置">
                  <Settings className="w-4 h-4" />
                </button>
              )}
              <span className="text-xs text-gray-400 ml-1">{currentUser?.displayName || currentUser?.username}</span>
              <button onClick={onLogout} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors" title="退出登录">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: '全部表单', value: stats.total, icon: FileText, color: 'text-blue-600 bg-blue-50' },
            { label: '收集中', value: stats.published, icon: Globe, color: 'text-green-600 bg-green-50' },
            { label: '草稿', value: stats.draft, icon: Lock, color: 'text-gray-600 bg-gray-50' },
            { label: '总提交数', value: stats.totalSubmits, icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color.split(' ')[1]}`}>
                <Icon className={`w-5 h-5 ${color.split(' ')[0]}`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 筛选与搜索 */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索表单..."
              className="w-full h-9 pl-9 pr-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
            />
          </div>
          <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-0.5">
            {[
              { value: 'all', label: '全部' },
              { value: 'published', label: '收集中' },
              { value: 'draft', label: '草稿' },
              { value: 'closed', label: '已关闭' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value as any)}
                className={`px-3 h-7 text-xs rounded-md transition-colors ${filter === value ? 'bg-blue-600 text-white font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 表单列表 */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <FileText className="w-7 h-7 text-gray-300" />
            </div>
            <div className="text-center">
              <p className="text-gray-500 font-medium">暂无表单</p>
              <p className="text-sm text-gray-400 mt-1">{search ? '未找到匹配的表单' : '点击"新建表单"开始创建'}</p>
            </div>
            {!search && canCreate && (
              <button onClick={handleCreate} className="mt-2 px-5 h-9 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Plus className="w-4 h-4" />
                新建表单
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(form => (
              <div key={form.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                <ThemeAccent theme={form.settings.theme} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate text-sm">{form.settings.title}</h3>
                      {form.settings.description && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{form.settings.description}</p>
                      )}
                    </div>
                    <div className="relative shrink-0">
                      <button
                        onClick={() => setMenuOpen(menuOpen === form.id ? null : form.id)}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {menuOpen === form.id && (
                        <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-36 z-20">
                          {(isAdmin || form.ownerId === currentUser?.username) && (
                            <button onClick={() => { handleEdit(form.id); setMenuOpen(null); }} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                              <Edit3 className="w-3.5 h-3.5" /> 编辑
                            </button>
                          )}
                          <button onClick={() => { onPreview(form.id); setMenuOpen(null); }} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                            <Eye className="w-3.5 h-3.5" /> 预览
                          </button>
                          {(isAdmin || form.ownerId === currentUser?.username || form.settings.canViewData !== false) && (
                            <button onClick={() => { onData(form.id); setMenuOpen(null); }} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                              <BarChart2 className="w-3.5 h-3.5" /> 数据
                            </button>
                          )}
                          {(isAdmin || form.ownerId === currentUser?.username) && form.status === 'draft' && (
                            <button onClick={() => { publishForm(form.id); setMenuOpen(null); }} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-green-600 hover:bg-green-50">
                              <Globe className="w-3.5 h-3.5" /> 发布
                            </button>
                          )}
                          {(isAdmin || form.ownerId === currentUser?.username) && form.status === 'published' && (
                            <button onClick={() => { closeForm(form.id); setMenuOpen(null); }} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-orange-600 hover:bg-orange-50">
                              <Lock className="w-3.5 h-3.5" /> 关闭收集
                            </button>
                          )}
                          {(isAdmin || form.ownerId === currentUser?.username) && (
                            <>
                              <div className="h-px bg-gray-100 my-1" />
                              <button onClick={() => { deleteForm(form.id); setMenuOpen(null); }} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50">
                                <Trash2 className="w-3.5 h-3.5" /> 删除
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                    <StatusBadge status={form.status} />
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" /> {form.fields.length} 个字段
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {form.submits} 次提交
                    </span>
                    {form.ownerId !== currentUser?.username && (
                      <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">来自 {form.ownerId}</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {(isAdmin || form.ownerId === currentUser?.username) && (
                      <button
                        onClick={() => handleEdit(form.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 h-8 text-xs font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> 编辑
                      </button>
                    )}
                    {(isAdmin || form.ownerId === currentUser?.username || form.settings.canViewData !== false) && (
                      <button
                        onClick={() => onData(form.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 h-8 text-xs font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <BarChart2 className="w-3.5 h-3.5" /> 数据
                      </button>
                    )}
                    {form.ownerId !== currentUser?.username && (
                      <span className="text-xs text-gray-400 self-center ml-auto">{form.ownerId}</span>
                    )}
                    {form.settings.publicQuery && form.settings.publicQuery !== 'off' && (
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}${window.location.pathname}#publicQuery=${form.id}`;
                          navigator.clipboard.writeText(url).then(() => alert('公开查询链接已复制到剪贴板！'));
                        }}
                        className="flex items-center justify-center w-8 h-8 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-colors"
                        title="复制公开查询链接"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {form.settings.publicSubmit && form.settings.publicSubmit !== 'off' && (
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}${window.location.pathname}#submit=${form.id}`;
                          navigator.clipboard.writeText(url).then(() => alert('提交链接已复制到剪贴板！'));
                        }}
                        className="flex items-center justify-center w-8 h-8 rounded-lg border border-purple-200 text-purple-600 hover:bg-purple-50 transition-colors"
                        title="复制提交链接"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onPreview(form.id)}
                      className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* 新建卡片 */}
            {canCreate && (
            <button
              onClick={handleCreate}
              className="bg-white rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all p-5 flex flex-col items-center justify-center gap-3 min-h-40 group"
            >
              <div className="w-10 h-10 rounded-full border-2 border-gray-200 group-hover:border-blue-400 flex items-center justify-center transition-colors">
                <Plus className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
              </div>
              <span className="text-sm text-gray-400 group-hover:text-blue-600 transition-colors font-medium">新建表单</span>
            </button>
            )}
          </div>
        )}
      </main>

      {/* 点击外部关闭菜单 */}
      {menuOpen && <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />}
    </div>
  );
};
