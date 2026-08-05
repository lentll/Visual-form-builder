import { useState, useEffect } from 'react';
import { FormListPage } from '@/pages/FormListPage';
import { FormDesigner } from '@/pages/FormDesigner';
import { FormPreviewPage } from '@/pages/FormPreviewPage';
import { FormDataPage } from '@/pages/FormDataPage';
import { LoginPage } from '@/pages/LoginPage';
import { PublicQueryPage } from '@/pages/PublicQueryPage';
import { FormSubmitPage } from '@/pages/FormSubmitPage';
import { SystemSettingsPage } from '@/pages/SystemSettingsPage';
import { AdminUsersPage } from '@/pages/AdminUsersPage';
import { useFormStore, useAuthStore } from '@/store/formStore';

type Page = 'list' | 'designer' | 'preview' | 'data' | 'login' | 'settings' | 'users';

function App() {
  const [page, setPage] = useState<Page>('login');
  const [currentFormId, setCurrentFormId] = useState<string | null>(null);
  // 记录进入预览前的来源页（designer 或 list），用于返回
  const [previewFrom, setPreviewFrom] = useState<'designer' | 'list'>('list');
  const { loadForm } = useFormStore();
  const { isLoggedIn, checkAuth } = useAuthStore();

  useEffect(() => {
    const init = async () => {
      checkAuth();
      const hash = window.location.hash.replace('#', '');
      const hashParams = new URLSearchParams(hash);
      const publicFormId = hashParams.get('publicQuery');
      const submitFormId = hashParams.get('submit');
      if (publicFormId) {
        setCurrentFormId(publicFormId);
        setPage('list'); // 避免 page === 'login' 导致误跳转登录页
        return;
      }
      if (submitFormId) {
        setCurrentFormId(submitFormId);
        setPage('list'); // 避免 page === 'login' 导致误跳转登录页
        return;
      }
      setPage('login');
    };
    init();
  }, [checkAuth]);

  // 监听登录状态
  useEffect(() => {
    if (isLoggedIn && page === 'login') {
      setPage('list');
    }
  }, [isLoggedIn, page]);

  const goToDesigner = (formId: string) => {
    loadForm(formId);
    setCurrentFormId(formId);
    setPage('designer');
  };

  // from: 'designer' 表示从编辑器进入预览，'list' 表示从列表进入预览
  const goToPreview = (formId: string, from: 'designer' | 'list' = 'list') => {
    setCurrentFormId(formId);
    setPreviewFrom(from);
    setPage('preview');
  };

  const goToData = (formId: string) => {
    setCurrentFormId(formId);
    setPage('data');
  };

  const goToList = () => {
    setPage('list');
    setCurrentFormId(null);
  };

  const goToLogin = () => {
    useAuthStore.getState().logout();
    setPage('login');
    setCurrentFormId(null);
  };

  const goToSettings = () => {
    setPage('settings');
    setCurrentFormId(null);
  };

  const goToUsers = () => {
    setPage('users');
    setCurrentFormId(null);
  };

  // 公开查询路由（URL hash 参数，如 #publicQuery=sample-1）
  {
    const hash = window.location.hash.replace('#', '');
    const publicQueryFormId = new URLSearchParams(hash).get('publicQuery');
    if (publicQueryFormId) {
      const { forms } = useFormStore.getState();
      const form = forms.find(f => f.id === publicQueryFormId);
      // 需登录模式 -> 检查登录状态
      if (form?.settings.publicQuery === 'login-required' && !isLoggedIn) {
        return <LoginPage />;
      }
      return <PublicQueryPage formId={publicQueryFormId} />;
    }
  }

  // 独立提交路由（URL hash 参数，如 #submit=sample-1）
  {
    const hash = window.location.hash.replace('#', '');
    const submitFormId = new URLSearchParams(hash).get('submit');
    if (submitFormId) {
      const { forms } = useFormStore.getState();
      const form = forms.find(f => f.id === submitFormId);
      // 需登录模式 -> 检查登录状态
      if (form?.settings.publicSubmit === 'login-required' && !isLoggedIn) {
        return <LoginPage />;
      }
      return <FormSubmitPage formId={submitFormId} />;
    }
  }

  // 未登录 → 登录页
  if (!isLoggedIn || page === 'login') {
    return <LoginPage />;
  }

  if (page === 'designer' && currentFormId) {
    return <FormDesigner formId={currentFormId} onBack={goToList} onPreview={(id) => goToPreview(id, 'designer')} />;
  }

  if (page === 'preview' && currentFormId) {
    const backFromPreview = previewFrom === 'designer'
      ? () => { loadForm(currentFormId); setPage('designer'); }
      : goToList;
    return <FormPreviewPage formId={currentFormId} onBack={backFromPreview} />;
  }

  if (page === 'data' && currentFormId) {
    return <FormDataPage formId={currentFormId} onBack={goToList} />;
  }

  if (page === 'settings') {
    return <SystemSettingsPage onBack={goToList} onGoUsers={goToUsers} />;
  }

  if (page === 'users') {
    return <AdminUsersPage onBack={goToList} />;
  }

  return (
    <FormListPage
      onEdit={goToDesigner}
      onPreview={goToPreview}
      onData={goToData}
      onLogout={goToLogin}
      onSettings={goToSettings}
      onUsers={goToUsers}
    />
  );
}

export default App;
