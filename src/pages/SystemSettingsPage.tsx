import React, { useState } from 'react';
import {
  ArrowLeft, Database, HardDrive, Shield, Save, CheckCircle,
  AlertCircle, Loader2, Eye, EyeOff, Settings, FolderOpen, Server, Users
} from 'lucide-react';
import { useAuthStore, useSystemStore } from '@/store/formStore';
import type { DbType } from '@/store/formStore';
import { DirectoryBrowser } from '@/components/DirectoryBrowser';

interface SystemSettingsPageProps {
  onBack: () => void;
  onGoUsers: () => void;
}

// 数据库类型配置
const DB_TYPES: { value: DbType; label: string; desc: string; icon: string; ports: string }[] = [
  { value: 'localStorage', label: '浏览器本地存储', desc: '数据存储在当前浏览器，无需数据库，适合演示和本地使用', icon: '💾', ports: '' },
  { value: 'mysql', label: 'MySQL', desc: '开源关系型数据库，适合大多数业务场景', icon: '🐬', ports: '3306' },
  { value: 'postgresql', label: 'PostgreSQL', desc: '功能强大的开源对象关系型数据库', icon: '🐘', ports: '5432' },
  { value: 'mongodb', label: 'MongoDB', desc: '文档型 NoSQL 数据库，灵活的数据结构', icon: '🍃', ports: '27017' },
  { value: 'sqlite', label: 'SQLite', desc: '轻量级本地文件数据库，适合小型项目', icon: '📁', ports: '' },
];

// 侧边导航项
const NAV_ITEMS = [
  { id: 'account', label: '账号安全', icon: Shield },
  { id: 'database', label: '数据库配置', icon: Database },
  { id: 'storage', label: '附件存储', icon: HardDrive },
  { id: 'general', label: '基本设置', icon: Settings },
];

// 简单的小节标题组件
const SectionTitle = ({ title, desc }: { title: string; desc?: string }) => (
  <div className="mb-5">
    <h3 className="text-base font-semibold text-gray-900">{title}</h3>
    {desc && <p className="text-sm text-gray-500 mt-0.5">{desc}</p>}
  </div>
);

// 表单项
const FormItem = ({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

const inputCls = "w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white";

export const SystemSettingsPage: React.FC<SystemSettingsPageProps> = ({ onBack, onGoUsers }) => {
  const [activeSection, setActiveSection] = useState('account');
  const currentUser = useAuthStore(s => s.user);
  const isAdmin = currentUser?.role === 'admin';
  const { changePassword } = useAuthStore();
  const { settings, updateSettings, testDbConnection } = useSystemStore();

  // 普通用户只能看到账号安全
  const navItems = isAdmin ? NAV_ITEMS : NAV_ITEMS.filter(n => n.id === 'account');

  // 密码修改状态
  const [pwdForm, setPwdForm] = useState({ oldPwd: '', newPwd: '', confirmPwd: '' });
  const [showPwd, setShowPwd] = useState({ old: false, new: false, confirm: false });
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 数据库连接测试状态
  const [testingDb, setTestingDb] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  // 保存提示
  const [saved, setSaved] = useState(false);

  // 目录/文件浏览弹窗
  const [showDirBrowser, setShowDirBrowser] = useState<'attachment' | 'sqlite' | null>(null);

  const handleChangePwd = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    if (!pwdForm.oldPwd || !pwdForm.newPwd || !pwdForm.confirmPwd) {
      setPwdMsg({ type: 'error', text: '请填写所有密码字段' });
      return;
    }
    if (pwdForm.newPwd !== pwdForm.confirmPwd) {
      setPwdMsg({ type: 'error', text: '两次输入的新密码不一致' });
      return;
    }
    const result = changePassword(pwdForm.oldPwd, pwdForm.newPwd);
    if (result.ok) {
      setPwdMsg({ type: 'success', text: result.message });
      setPwdForm({ oldPwd: '', newPwd: '', confirmPwd: '' });
    } else {
      setPwdMsg({ type: 'error', text: result.message });
    }
  };

  const handleTestDb = async () => {
    setTestingDb(true);
    setDbTestResult(null);
    const result = await testDbConnection();
    setDbTestResult(result);
    setTestingDb(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const selectedDb = DB_TYPES.find(d => d.value === settings.dbType)!;
  const isRemoteDb = !['localStorage', 'sqlite'].includes(settings.dbType);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center h-16 gap-4">
            <button
              onClick={onBack}
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Settings className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-base font-semibold text-gray-900">系统设置</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-6">
          {/* 左侧导航 */}
          <aside className="w-48 shrink-0">
            <nav className="bg-white rounded-xl border border-gray-100 shadow-sm p-2 space-y-0.5 sticky top-24">
              {navItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg transition-colors text-left ${
                    activeSection === id
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </button>
              ))}
              {isAdmin && (
                <button
                  onClick={onGoUsers}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg transition-colors text-left text-gray-600 hover:bg-gray-50"
                >
                  <Users className="w-4 h-4 flex-shrink-0" />
                  用户管理
                </button>
              )}
            </nav>
          </aside>

          {/* 右侧内容 */}
          <div className="flex-1 min-w-0">
            {/* 账号安全 */}
            {activeSection === 'account' && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <SectionTitle title="账号安全" desc={isAdmin ? "管理您的登录密码，建议定期更换密码以保障账号安全" : "修改您的登录密码"} />

                <div className="max-w-md">
                  <form onSubmit={handleChangePwd} className="space-y-4">
                    {/* 当前密码 */}
                    <FormItem label="当前密码" required>
                      <div className="relative">
                        <input
                          type={showPwd.old ? 'text' : 'password'}
                          value={pwdForm.oldPwd}
                          onChange={e => setPwdForm(p => ({ ...p, oldPwd: e.target.value }))}
                          placeholder="请输入当前密码"
                          className={`${inputCls} pr-10`}
                        />
                        <button type="button" onClick={() => setShowPwd(s => ({ ...s, old: !s.old }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showPwd.old ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FormItem>

                    {/* 新密码 */}
                    <FormItem label="新密码" required hint="密码长度不少于6位">
                      <div className="relative">
                        <input
                          type={showPwd.new ? 'text' : 'password'}
                          value={pwdForm.newPwd}
                          onChange={e => setPwdForm(p => ({ ...p, newPwd: e.target.value }))}
                          placeholder="请输入新密码"
                          className={`${inputCls} pr-10`}
                        />
                        <button type="button" onClick={() => setShowPwd(s => ({ ...s, new: !s.new }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showPwd.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {/* 密码强度指示 */}
                      {pwdForm.newPwd && (
                        <div className="mt-2">
                          <div className="flex gap-1 mb-1">
                            {[1, 2, 3, 4].map(level => {
                              const strength = Math.min(4, Math.floor(pwdForm.newPwd.length / 3));
                              return (
                                <div key={level} className={`h-1 flex-1 rounded-full transition-colors ${
                                  level <= strength
                                    ? strength <= 1 ? 'bg-red-400' : strength <= 2 ? 'bg-yellow-400' : strength <= 3 ? 'bg-blue-400' : 'bg-green-400'
                                    : 'bg-gray-200'
                                }`} />
                              );
                            })}
                          </div>
                          <p className="text-xs text-gray-400">
                            密码强度：{pwdForm.newPwd.length < 6 ? '弱' : pwdForm.newPwd.length < 9 ? '中' : pwdForm.newPwd.length < 12 ? '强' : '很强'}
                          </p>
                        </div>
                      )}
                    </FormItem>

                    {/* 确认密码 */}
                    <FormItem label="确认新密码" required>
                      <div className="relative">
                        <input
                          type={showPwd.confirm ? 'text' : 'password'}
                          value={pwdForm.confirmPwd}
                          onChange={e => setPwdForm(p => ({ ...p, confirmPwd: e.target.value }))}
                          placeholder="再次输入新密码"
                          className={`${inputCls} pr-10 ${
                            pwdForm.confirmPwd && pwdForm.confirmPwd !== pwdForm.newPwd ? 'border-red-300 focus:ring-red-400 focus:border-red-400' : ''
                          }`}
                        />
                        <button type="button" onClick={() => setShowPwd(s => ({ ...s, confirm: !s.confirm }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showPwd.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {pwdForm.confirmPwd && pwdForm.confirmPwd !== pwdForm.newPwd && (
                        <p className="text-xs text-red-500 mt-1">两次密码不一致</p>
                      )}
                    </FormItem>

                    {/* 提示信息 */}
                    {pwdMsg && (
                      <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                        pwdMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
                      }`}>
                        {pwdMsg.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                        {pwdMsg.text}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="h-9 px-5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      disabled={!pwdForm.oldPwd || !pwdForm.newPwd || !pwdForm.confirmPwd}
                    >
                      修改密码
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* 数据库配置 */}
            {activeSection === 'database' && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <SectionTitle title="数据库配置" desc="选择系统数据存储方式和配置数据库连接信息" />

                {/* 数据库类型选择 */}
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-700 mb-3">选择存储类型</p>
                  <div className="grid grid-cols-1 gap-2.5">
                    {DB_TYPES.map(db => (
                      <label
                        key={db.value}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                          settings.dbType === db.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="dbType"
                          value={db.value}
                          checked={settings.dbType === db.value}
                          onChange={() => {
                            updateSettings({ dbType: db.value, dbPort: db.ports });
                            setDbTestResult(null);
                          }}
                          className="mt-0.5 accent-blue-600"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span>{db.icon}</span>
                            <span className={`text-sm font-medium ${settings.dbType === db.value ? 'text-blue-700' : 'text-gray-800'}`}>{db.label}</span>
                            {settings.dbType === db.value && (
                              <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded font-medium">当前选择</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{db.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 远程数据库连接配置 */}
                {isRemoteDb && (
                  <div className="border-t border-gray-100 pt-5 mt-2">
                    <div className="flex items-center gap-2 mb-4">
                      <Server className="w-4 h-4 text-gray-500" />
                      <p className="text-sm font-semibold text-gray-800">{selectedDb.label} 连接配置</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormItem label="主机地址" required>
                        <input
                          value={settings.dbHost}
                          onChange={e => updateSettings({ dbHost: e.target.value })}
                          placeholder="localhost 或 IP 地址"
                          className={inputCls}
                        />
                      </FormItem>
                      <FormItem label="端口">
                        <input
                          value={settings.dbPort}
                          onChange={e => updateSettings({ dbPort: e.target.value })}
                          placeholder={selectedDb.ports}
                          className={inputCls}
                        />
                      </FormItem>
                      <FormItem label="数据库名称" required>
                        <input
                          value={settings.dbName}
                          onChange={e => updateSettings({ dbName: e.target.value })}
                          placeholder="formcraft"
                          className={inputCls}
                        />
                      </FormItem>
                      <FormItem label="用户名">
                        <input
                          value={settings.dbUser}
                          onChange={e => updateSettings({ dbUser: e.target.value })}
                          placeholder="数据库用户名"
                          className={inputCls}
                        />
                      </FormItem>
                      <div className="col-span-2">
                        <FormItem label="密码">
                          <input
                            type="password"
                            value={settings.dbPassword}
                            onChange={e => updateSettings({ dbPassword: e.target.value })}
                            placeholder="数据库密码"
                            className={inputCls}
                          />
                        </FormItem>
                      </div>
                    </div>

                    {/* 连接字符串预览 */}
                    {settings.dbHost && settings.dbName && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1 font-medium">连接字符串预览</p>
                        <code className="text-xs text-gray-700 break-all">
                          {settings.dbType === 'mongodb'
                            ? `mongodb://${settings.dbUser ? settings.dbUser + ':***@' : ''}${settings.dbHost}:${settings.dbPort || '27017'}/${settings.dbName}`
                            : `${settings.dbType}://${settings.dbUser ? settings.dbUser + ':***@' : ''}${settings.dbHost}:${settings.dbPort}/${settings.dbName}`
                          }
                        </code>
                      </div>
                    )}
                  </div>
                )}

                {/* SQLite 配置 */}
                {settings.dbType === 'sqlite' && (
                  <div className="border-t border-gray-100 pt-5 mt-2">
                    <FormItem label="数据库文件路径" hint="SQLite 数据库文件的绝对路径，不存在时将自动创建">
                      <div className="flex gap-2">
                        <input
                          value={settings.dbName || './formcraft.db'}
                          onChange={e => updateSettings({ dbName: e.target.value })}
                          placeholder="./formcraft.db"
                          className={`${inputCls} flex-1`}
                        />
                        <button
                          onClick={() => setShowDirBrowser('sqlite')}
                          className="h-9 px-3 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-1.5"
                        >
                          <FolderOpen className="w-4 h-4" />
                          浏览
                        </button>
                      </div>
                    </FormItem>
                  </div>
                )}

                {/* 测试连接按钮 */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={handleTestDb}
                    disabled={testingDb}
                    className="flex items-center gap-2 h-9 px-4 text-sm border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
                  >
                    {testingDb ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                    {testingDb ? '测试中...' : '测试连接'}
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 h-9 px-4 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saved ? '已保存' : '保存配置'}
                  </button>
                  {dbTestResult && (
                    <div className={`flex items-center gap-2 text-sm ${dbTestResult.ok ? 'text-green-600' : 'text-red-500'}`}>
                      {dbTestResult.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      {dbTestResult.message}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 附件存储 */}
            {activeSection === 'storage' && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <SectionTitle title="附件存储配置" desc="配置用户上传附件的存储目录和限制规则" />

                <div className="max-w-lg space-y-1">
                  <FormItem
                    label="附件存储目录"
                    required
                    hint="网站根目录下的相对路径，或服务器绝对路径。目录不存在时系统将尝试自动创建"
                  >
                    <div className="flex gap-2">
                      <input
                        value={settings.attachmentDir}
                        onChange={e => updateSettings({ attachmentDir: e.target.value })}
                        placeholder="/uploads/attachments"
                        className={`${inputCls} flex-1`}
                      />
                      <button
                        onClick={() => setShowDirBrowser('attachment')}
                        className="h-9 px-3 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-1.5"
                      >
                        <FolderOpen className="w-4 h-4" />
                        浏览
                      </button>
                    </div>
                    <div className="mt-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500 font-medium mb-1">当前路径预览</p>
                      <code className="text-xs text-blue-600">{settings.attachmentDir || '/uploads/attachments'}</code>
                    </div>
                  </FormItem>

                  <FormItem
                    label="单文件大小限制"
                    hint="超过此大小的文件将拒绝上传"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="2048"
                        value={settings.attachmentMaxSize}
                        onChange={e => updateSettings({ attachmentMaxSize: Number(e.target.value) })}
                        className="w-28 h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 text-right"
                      />
                      <span className="text-sm text-gray-600">MB</span>
                    </div>
                    {/* 快速选项 */}
                    <div className="flex gap-2 mt-2">
                      {[5, 10, 20, 50, 100].map(size => (
                        <button
                          key={size}
                          onClick={() => updateSettings({ attachmentMaxSize: size })}
                          className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                            settings.attachmentMaxSize === size
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {size} MB
                        </button>
                      ))}
                    </div>
                  </FormItem>

                  {/* 支持的文件类型说明 */}
                  <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-sm font-medium text-blue-800 mb-2">📎 支持的附件类型</p>
                    <div className="grid grid-cols-2 gap-1.5 text-xs text-blue-700">
                      {[
                        { icon: '🖼️', label: '图片', types: 'JPG, PNG, GIF, WebP, SVG' },
                        { icon: '📄', label: '文档', types: 'PDF, Word (.doc/.docx)' },
                        { icon: '📊', label: '表格', types: 'Excel (.xls/.xlsx), CSV' },
                        { icon: '🗜️', label: '压缩包', types: 'ZIP, RAR, 7Z' },
                        { icon: '🎥', label: '视频', types: 'MP4, AVI, MOV' },
                        { icon: '🎵', label: '音频', types: 'MP3, WAV, AAC' },
                      ].map(item => (
                        <div key={item.label} className="flex items-start gap-1.5">
                          <span>{item.icon}</span>
                          <div>
                            <span className="font-medium">{item.label}：</span>
                            <span className="text-blue-600">{item.types}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 mt-4">
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 h-9 px-4 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                      {saved ? '已保存' : '保存配置'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 基本设置 */}
            {activeSection === 'general' && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <SectionTitle title="基本设置" desc="配置系统名称和外观" />

                <div className="max-w-lg space-y-1">
                  <FormItem label="系统名称" hint="显示在页面标题和登录界面">
                    <input
                      value={settings.systemName}
                      onChange={e => updateSettings({ systemName: e.target.value })}
                      placeholder="FormCraft"
                      className={inputCls}
                    />
                  </FormItem>

                  <FormItem label="系统 Logo URL" hint="支持在线图片URL，留空使用默认图标">
                    <input
                      value={settings.systemLogo}
                      onChange={e => updateSettings({ systemLogo: e.target.value })}
                      placeholder="https://example.com/logo.png"
                      className={inputCls}
                    />
                    {settings.systemLogo && (
                      <div className="mt-2 p-2 border border-gray-100 rounded-lg inline-block">
                        <img
                          src={settings.systemLogo}
                          alt="Logo 预览"
                          className="h-10 object-contain"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    )}
                  </FormItem>

                  <div className="pt-4 border-t border-gray-100 mt-4">
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 h-9 px-4 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                      {saved ? '已保存' : '保存配置'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 目录浏览弹窗 */}
      {showDirBrowser === 'attachment' && (
        <DirectoryBrowser
          value={settings.attachmentDir}
          mode="directory"
          title="选择附件存储目录"
          onSelect={(path) => {
            updateSettings({ attachmentDir: path });
            setShowDirBrowser(null);
          }}
          onClose={() => setShowDirBrowser(null)}
        />
      )}
      {showDirBrowser === 'sqlite' && (
        <DirectoryBrowser
          value={settings.dbName}
          mode="file"
          title="选择 SQLite 数据库文件"
          onSelect={(path) => {
            updateSettings({ dbName: path });
            setShowDirBrowser(null);
          }}
          onClose={() => setShowDirBrowser(null)}
        />
      )}
    </div>
  );
};
