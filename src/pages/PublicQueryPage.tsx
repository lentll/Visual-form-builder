import React, { useEffect } from 'react';
import { useFormStore, useSystemStore } from '@/store/formStore';
import { Search, ExternalLink } from 'lucide-react';
import { DataSearchTable } from '@/components/DataSearchTable';

interface PublicQueryPageProps {
  formId: string;
}

export const PublicQueryPage: React.FC<PublicQueryPageProps> = ({ formId }) => {
  const { forms, getSubmissions } = useFormStore();
  const { settings } = useSystemStore();
  const form = forms.find(f => f.id === formId);

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Search className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">表单不存在或已被删除</p>
        </div>
      </div>
    );
  }

  if (!form.settings.publicQuery || form.settings.publicQuery === 'off') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-sm w-full mx-4">
          <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="w-7 h-7 text-orange-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">未开放公开查询</h2>
          <p className="text-sm text-gray-500">该表单暂未开启公开查询功能</p>
        </div>
      </div>
    );
  }

  const submissions = getSubmissions(formId);
  const searchableFields = form.fields.filter(f =>
    !['title', 'description', 'divider', 'image'].includes(f.type)
  );

  // 公开查询页自定义标题（优先使用自定义标题，否则使用表单标题）
  const pageTitle = form.settings.publicQueryTitle || form.settings.title;
  const bgImage = form.settings.publicQueryBgImage;

  // 设置页面标题
  useEffect(() => {
    document.title = `${pageTitle} - 查询`;
    return () => { document.title = settings.systemName; };
  }, [pageTitle]);

  // 页面背景样式
  const bgStyle = bgImage
    ? {
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }
    : {};

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50 relative" style={bgStyle}>
      {/* 当有背景图时添加半透明遮罩 */}
      {bgImage && <div className="absolute inset-0 bg-black/30 -z-0" />}
      <div className="relative z-10 h-full flex flex-col overflow-hidden">
      <header className={`${bgImage ? 'bg-white/90 backdrop-blur-sm' : 'bg-white'} border-b border-gray-100 flex-shrink-0`}>
        <div className="w-full max-w-[95%] xl:max-w-[90%] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <div className="min-w-0">
                <h1 className="font-semibold text-gray-900 text-sm truncate">{pageTitle}</h1>
                <p className="text-xs text-gray-400">公开查询 · {submissions.length} 条记录</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-[95%] xl:max-w-[90%] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex-1 overflow-hidden flex flex-col">
        {searchableFields.length === 0 ? (
          <div className={`${bgImage ? 'bg-white/90 backdrop-blur-sm' : 'bg-white'} rounded-xl border border-gray-100 p-10 text-center`}>
            <p className="text-gray-400">该表单暂无可查询字段</p>
          </div>
        ) : (
          <DataSearchTable fields={searchableFields} submissions={submissions} scrollable />
        )}
      </main>

      <footer className="text-center py-3 flex-shrink-0">
        <p className={`text-xs ${bgImage ? 'text-white/60' : 'text-gray-300'}`}>Powered by {settings.systemName}</p>
      </footer>
      </div>
    </div>
  );
};
