import React, { useState, useEffect } from 'react';
import { useAuthStore, useSystemStore } from '@/store/formStore';
import { LogIn, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, checkAuth, isLoggedIn, logout, user } = useAuthStore();
  const { settings } = useSystemStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const ok = login(username, password);
      if (!ok) setError('账号或密码错误');
      setLoading(false);
    }, 500);
  };

  if (isLoggedIn && user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-blue-600">{user.displayName[0]?.toUpperCase() || user.username[0].toUpperCase()}</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">{user.displayName}</h2>
          <p className="text-sm text-gray-500 mb-1">账号: {user.username}</p>
          <p className="text-sm text-gray-500 mb-6">您已登录</p>
          <button
            onClick={logout}
            className="w-full h-10 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            退出登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">{settings.systemName[0]?.toUpperCase() || 'F'}</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{settings.systemName}</h1>
          <p className="text-sm text-gray-500 mt-1">登录管理您的表单</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">账号</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="请输入账号"
              className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">密码</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="请输入密码"
              className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full h-10 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6">默认管理员: admin / admin123</p>
      </div>
    </div>
  );
};
