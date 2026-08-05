import React, { useState } from 'react';
import {
  ArrowLeft, Users, Plus, Trash2, Shield, Key, X,
  CheckCircle, AlertCircle, FileText, Eye, EyeOff, Globe, Settings,
} from 'lucide-react';
import { useUserStore, useAuthStore } from '@/store/formStore';
import type { UserPermission } from '@/store/formStore';

interface AdminUsersPageProps {
  onBack: () => void;
}

export const AdminUsersPage: React.FC<AdminUsersPageProps> = ({ onBack }) => {
  const { users, createUser, updatePermissions, deleteUser, resetPassword, load: reloadUsers } = useUserStore();
  const currentUser = useAuthStore(s => s.user);
  const [showCreate, setShowCreate] = useState(false);
  const [showPwdModal, setShowPwdModal] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 新建用户表单
  const [newUser, setNewUser] = useState({ username: '', displayName: '', password: '', confirmPwd: '' });
  const [newPerms, setNewPerms] = useState<UserPermission>({
    canCreateForm: true,
    canEditForm: true,
    canSettings: false,
    canPublicQuery: true,
  });

  // 重置密码
  const [newPwd, setNewPwd] = useState('');
  const [showPwdInput, setShowPwdInput] = useState(false);

  const handleCreate = () => {
    setMsg(null);
    if (!newUser.username.trim()) { setMsg({ type: 'error', text: '请输入用户名' }); return; }
    if (!newUser.displayName.trim()) { setMsg({ type: 'error', text: '请输入显示名称' }); return; }
    if (newUser.password.length < 6) { setMsg({ type: 'error', text: '密码长度不能少于6位' }); return; }
    if (newUser.password !== newUser.confirmPwd) { setMsg({ type: 'error', text: '两次密码不一致' }); return; }
    const result = createUser(newUser.username.trim(), newUser.displayName.trim(), newUser.password, newPerms);
    if (result.ok) {
      setMsg({ type: 'success', text: result.message });
      setNewUser({ username: '', displayName: '', password: '', confirmPwd: '' });
      setShowCreate(false);
      reloadUsers();
    } else {
      setMsg({ type: 'error', text: result.message });
    }
  };

  const handleDelete = (userId: string) => {
    if (!confirm('确定要删除该用户吗？')) return;
    deleteUser(userId);
    reloadUsers();
  };

  const handleResetPwd = (userId: string) => {
    if (newPwd.length < 6) { setMsg({ type: 'error', text: '密码长度不能少于6位' }); return; }
    const result = resetPassword(userId, newPwd);
    if (result.ok) {
      setMsg({ type: 'success', text: result.message });
      setShowPwdModal(null);
      setNewPwd('');
    } else {
      setMsg({ type: 'error', text: result.message });
    }
  };

  const togglePerm = (userId: string, key: keyof UserPermission) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    updatePermissions(userId, { ...user.permissions, [key]: !user.permissions[key] });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center h-16 gap-4">
            <button onClick={onBack} className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-semibold text-gray-900">用户管理</span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={() => { setShowCreate(!showCreate); setMsg(null); }}
                className="flex items-center gap-2 px-4 h-9 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> 新建用户
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {msg && (
          <div className={`mb-4 flex items-center gap-2 p-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
            {msg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {msg.text}
            <button onClick={() => setMsg(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {/* 创建用户面板 */}
        {showCreate && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4" /> 新建普通用户
            </h3>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">用户名</label>
                <input
                  value={newUser.username}
                  onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))}
                  placeholder="登录账号"
                  className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">显示名称</label>
                <input
                  value={newUser.displayName}
                  onChange={e => setNewUser(p => ({ ...p, displayName: e.target.value }))}
                  placeholder="如：张三"
                  className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">密码（至少6位）</label>
                <input
                  type={showPwdInput ? 'text' : 'password'}
                  value={newUser.password}
                  onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))}
                  placeholder="登录密码"
                  className="w-full h-9 px-3 pr-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400"
                />
                <button type="button" onClick={() => setShowPwdInput(!showPwdInput)} className="ml-[-28px] text-gray-400 hover:text-gray-600 relative top-[-26px] float-right mr-2">
                  {showPwdInput ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">确认密码</label>
                <input
                  type="password"
                  value={newUser.confirmPwd}
                  onChange={e => setNewUser(p => ({ ...p, confirmPwd: e.target.value }))}
                  placeholder="再次输入密码"
                  className={`w-full h-9 px-3 text-sm border rounded-lg focus:outline-none focus:ring-1 ${newUser.confirmPwd && newUser.confirmPwd !== newUser.password ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-purple-400'}`}
                />
              </div>
            </div>

            {/* 权限设置 */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-2">用户权限</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'canCreateForm' as const, label: '新建表单', desc: '允许创建新表单', icon: FileText },
                  { key: 'canEditForm' as const, label: '修改表单', desc: '允许编辑表单设计和设置', icon: Settings },
                  { key: 'canSettings' as const, label: '系统设置', desc: '允许访问系统设置和用户管理', icon: Shield },
                  { key: 'canPublicQuery' as const, label: '公开查询', desc: '允许设置和使用公开查询', icon: Globe },
                ].map(({ key, label, desc, icon: Icon }) => (
                  <label key={key} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${newPerms[key] ? 'border-purple-500 bg-purple-50' : 'border-gray-100 hover:border-gray-200'}`}>
                    <input
                      type="checkbox"
                      checked={newPerms[key]}
                      onChange={() => setNewPerms(p => ({ ...p, [key]: !p[key] }))}
                      className="accent-purple-600"
                    />
                    <Icon className={`w-4 h-4 ${newPerms[key] ? 'text-purple-600' : 'text-gray-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${newPerms[key] ? 'text-purple-700' : 'text-gray-600'}`}>{label}</div>
                      <div className="text-xs text-gray-400">{desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleCreate} className="h-9 px-5 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                创建用户
              </button>
              <button onClick={() => { setShowCreate(false); setMsg(null); }} className="h-9 px-5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                取消
              </button>
            </div>
          </div>
        )}

        {/* 用户列表 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700">用户列表 ({users.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">用户信息</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">角色</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">新建表单</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">修改表单</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">系统设置</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">公开查询</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">创建时间</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const isSelf = currentUser?.username === u.username;
                  return (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-xs font-medium text-purple-600">
                            {u.displayName[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-800 text-sm">{u.displayName}</div>
                            <div className="text-xs text-gray-400">{u.username}</div>
                          </div>
                          {isSelf && <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded font-medium">当前</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                          {u.role === 'admin' ? '管理员' : '普通用户'}
                        </span>
                      </td>
                      {(['canCreateForm', 'canEditForm', 'canSettings', 'canPublicQuery'] as const).map(key => (
                        <td key={key} className="px-4 py-3">
                          {u.role === 'admin' ? (
                            <span className="text-green-600"><CheckCircle className="w-4 h-4" /></span>
                          ) : (
                            <button
                              onClick={() => togglePerm(u.id, key)}
                              className={`w-5 h-5 rounded flex items-center justify-center transition-all ${u.permissions[key] ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-300'}`}
                            >
                              {u.permissions[key] ? <CheckCircle className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(u.createdAt).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {u.role === 'user' && !isSelf && (
                            <>
                              <button
                                onClick={() => { setShowPwdModal(u.id); setNewPwd(''); setMsg(null); }}
                                className="h-7 px-2 text-xs rounded-md border border-gray-200 text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors flex items-center gap-1"
                              >
                                <Key className="w-3 h-3" /> 重置密码
                              </button>
                              <button
                                onClick={() => handleDelete(u.id)}
                                className="h-7 w-7 rounded-md flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {u.role === 'admin' && (
                            <span className="text-xs text-gray-300 italic">系统内置</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 重置密码弹窗 */}
        {showPwdModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                重置密码 - {users.find(u => u.id === showPwdModal)?.username}
              </h3>
              <p className="text-xs text-gray-400 mb-4">输入新密码（至少6位）</p>
              <input
                type="text"
                value={newPwd}
                onChange={e => setNewPwd(e.target.value)}
                placeholder="新密码"
                className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400 mb-4"
              />
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowPwdModal(null)} className="h-8 px-4 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                  取消
                </button>
                <button onClick={() => handleResetPwd(showPwdModal)} className="h-8 px-4 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  确认重置
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
