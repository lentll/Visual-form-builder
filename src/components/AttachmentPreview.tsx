import React, { useState } from 'react';
import { X, Download, FileText, FileSpreadsheet, FileImage, File } from 'lucide-react';

interface AttachmentPreviewProps {
  url?: string;
  filename?: string;
  onClose: () => void;
}

const getFileTypeIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return FileImage;
  if (['xls', 'xlsx', 'csv'].includes(ext)) return FileSpreadsheet;
  if (['doc', 'docx', 'txt', 'pdf'].includes(ext)) return FileText;
  return File;
};

const isImage = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext);
};

const isPdf = (filename: string) => {
  return filename.toLowerCase().endsWith('.pdf');
};

const isOffice = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return ['xls', 'xlsx', 'csv', 'doc', 'docx', 'txt'].includes(ext);
};

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({ url, filename, onClose }) => {
  const [loadError, setLoadError] = useState(false);
  const name = filename || url?.split('/').pop() || '附件';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-4xl w-full mx-4 max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* 顶部栏 */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2 min-w-0">
            {React.createElement(getFileTypeIcon(name), { className: 'w-5 h-5 text-gray-400 flex-shrink-0' })}
            <span className="text-sm font-medium text-gray-700 truncate">{name}</span>
          </div>
          <div className="flex items-center gap-1">
            {url && (
              <a
                href={url}
                download={name}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 h-8 text-xs text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> 下载
              </a>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 预览区 */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-50">
          {url && isImage(name) ? (
            !loadError ? (
              <img
                src={url}
                alt={name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                onError={() => setLoadError(true)}
              />
            ) : (
              <div className="text-center text-gray-400">
                <FileImage className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">图片加载失败</p>
              </div>
            )
          ) : url && (isPdf(name) || isOffice(name)) ? (
            <div className="w-full h-full min-h-[500px]">
              <iframe
                src={`https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`}
                className="w-full h-full border-0 rounded-lg"
                title={name}
              />
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                {React.createElement(getFileTypeIcon(name), { className: 'w-8 h-8 text-gray-400' })}
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">{name}</p>
              <p className="text-xs text-gray-400 mb-4">
                {url ? '点击下载按钮保存文件' : '暂无可预览内容'}
              </p>
              {url && (
                <a
                  href={url}
                  download={name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 h-9 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" /> 下载文件
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
