import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X, Folder, FolderOpen, File, ChevronRight,
  HardDrive, Home, Server
} from 'lucide-react';

// 虚拟目录结构（模拟服务器典型目录布局）
interface DirNode {
  name: string;
  type: 'file' | 'dir';
  children?: DirNode[];
}

// 绝对路径目录树（从 / 开始）
const ROOT_TREE: DirNode[] = [
  {
    name: '/',
    type: 'dir',
    children: [
      {
        name: 'var',
        type: 'dir',
        children: [
          {
            name: 'www',
            type: 'dir',
            children: [
              { name: 'html', type: 'dir', children: [] },
              { name: 'uploads', type: 'dir', children: [
                { name: 'attachments', type: 'dir', children: [] },
                { name: 'files', type: 'dir', children: [] },
                { name: 'images', type: 'dir', children: [] },
              ]},
              { name: 'attachments', type: 'dir', children: [] },
            ],
          },
          { name: 'lib', type: 'dir', children: [] },
          { name: 'log', type: 'dir', children: [] },
        ],
      },
      {
        name: 'home',
        type: 'dir',
        children: [
          { name: 'admin', type: 'dir', children: [
            { name: 'uploads', type: 'dir', children: [] },
            { name: 'data', type: 'dir', children: [] },
          ]},
          { name: 'www', type: 'dir', children: [
            { name: 'uploads', type: 'dir', children: [] },
          ]},
        ],
      },
      {
        name: 'opt',
        type: 'dir',
        children: [
          { name: 'formcraft', type: 'dir', children: [
            { name: 'uploads', type: 'dir', children: [] },
            { name: 'data', type: 'dir', children: [
              { name: 'formcraft.db', type: 'file' },
            ]},
          ]},
        ],
      },
      {
        name: 'data',
        type: 'dir',
        children: [
          { name: 'formcraft', type: 'dir', children: [
            { name: 'uploads', type: 'dir', children: [] },
            { name: 'formcraft.db', type: 'file' },
          ]},
          { name: 'uploads', type: 'dir', children: [] },
        ],
      },
      {
        name: 'tmp',
        type: 'dir',
        children: [
          { name: 'uploads', type: 'dir', children: [] },
        ],
      },
      {
        name: 'srv',
        type: 'dir',
        children: [
          { name: 'www', type: 'dir', children: [
            { name: 'uploads', type: 'dir', children: [] },
          ]},
        ],
      },
      { name: 'etc', type: 'dir', children: [] },
    ],
  },
];

// 相对路径目录树（从 . 开始）
const RELATIVE_TREE: DirNode[] = [
  {
    name: '.',
    type: 'dir',
    children: [
      {
        name: 'uploads',
        type: 'dir',
        children: [
          { name: 'attachments', type: 'dir', children: [] },
          { name: 'files', type: 'dir', children: [] },
          { name: 'images', type: 'dir', children: [] },
        ],
      },
      {
        name: 'public',
        type: 'dir',
        children: [
          { name: 'uploads', type: 'dir', children: [
            { name: 'attachments', type: 'dir', children: [] },
          ]},
        ],
      },
      {
        name: 'data',
        type: 'dir',
        children: [
          { name: 'formcraft.db', type: 'file' },
          { name: 'uploads', type: 'dir', children: [] },
        ],
      },
      {
        name: 'storage',
        type: 'dir',
        children: [
          { name: 'attachments', type: 'dir', children: [] },
          { name: 'uploads', type: 'dir', children: [] },
        ],
      },
      {
        name: 'files',
        type: 'dir',
        children: [
          { name: 'attachments', type: 'dir', children: [] },
        ],
      },
    ],
  },
];

// 合并的完整树（用于"全部"视图）
const FULL_TREE: DirNode[] = [
  {
    name: '/',
    type: 'dir',
    children: [
      {
        name: 'var',
        type: 'dir',
        children: [
          {
            name: 'www',
            type: 'dir',
            children: [
              { name: 'html', type: 'dir', children: [] },
              { name: 'uploads', type: 'dir', children: [
                { name: 'attachments', type: 'dir', children: [] },
                { name: 'files', type: 'dir', children: [] },
              ]},
              { name: 'attachments', type: 'dir', children: [] },
            ],
          },
          { name: 'lib', type: 'dir', children: [] },
          { name: 'log', type: 'dir', children: [] },
        ],
      },
      {
        name: 'home',
        type: 'dir',
        children: [
          { name: 'admin', type: 'dir', children: [
            { name: 'uploads', type: 'dir', children: [] },
            { name: 'data', type: 'dir', children: [] },
          ]},
          { name: 'www', type: 'dir', children: [
            { name: 'uploads', type: 'dir', children: [] },
          ]},
        ],
      },
      {
        name: 'opt',
        type: 'dir',
        children: [
          { name: 'formcraft', type: 'dir', children: [
            { name: 'uploads', type: 'dir', children: [] },
            { name: 'data', type: 'dir', children: [
              { name: 'formcraft.db', type: 'file' },
            ]},
          ]},
        ],
      },
      {
        name: 'data',
        type: 'dir',
        children: [
          { name: 'formcraft', type: 'dir', children: [
            { name: 'uploads', type: 'dir', children: [] },
            { name: 'formcraft.db', type: 'file' },
          ]},
          { name: 'uploads', type: 'dir', children: [] },
        ],
      },
      { name: 'tmp', type: 'dir', children: [
        { name: 'uploads', type: 'dir', children: [] },
      ]},
      { name: 'srv', type: 'dir', children: [
        { name: 'www', type: 'dir', children: [
          { name: 'uploads', type: 'dir', children: [] },
        ]},
      ]},
      { name: 'etc', type: 'dir', children: [] },
    ],
  },
  {
    name: '.',
    type: 'dir',
    children: [
      {
        name: 'uploads',
        type: 'dir',
        children: [
          { name: 'attachments', type: 'dir', children: [] },
          { name: 'files', type: 'dir', children: [] },
          { name: 'images', type: 'dir', children: [] },
        ],
      },
      {
        name: 'public',
        type: 'dir',
        children: [
          { name: 'uploads', type: 'dir', children: [
            { name: 'attachments', type: 'dir', children: [] },
          ]},
        ],
      },
      {
        name: 'data',
        type: 'dir',
        children: [
          { name: 'formcraft.db', type: 'file' },
          { name: 'uploads', type: 'dir', children: [] },
        ],
      },
      { name: 'storage', type: 'dir', children: [
        { name: 'attachments', type: 'dir', children: [] },
        { name: 'uploads', type: 'dir', children: [] },
      ]},
      { name: 'files', type: 'dir', children: [
        { name: 'attachments', type: 'dir', children: [] },
      ]},
    ],
  },
];

// ======================== 类型定义 ========================

interface DirectoryBrowserProps {
  /** 当前选中的路径 */
  value: string;
  /** 选择回调 */
  onSelect: (path: string) => void;
  /** 关闭弹窗 */
  onClose: () => void;
  /** 模式：选择目录 或 选择文件（含数据库文件） */
  mode?: 'directory' | 'file';
  /** 标题 */
  title?: string;
}

// ======================== 主组件 ========================

export const DirectoryBrowser: React.FC<DirectoryBrowserProps> = ({
  value,
  onSelect,
  onClose,
  mode = 'directory',
  title,
}) => {
  const [currentPath, setCurrentPath] = useState(value || (mode === 'directory' ? '/var/www/uploads' : '/data/formcraft.db'));
  const [viewMode, setViewMode] = useState<'all' | 'absolute' | 'relative'>('all');
  const modalRef = useRef<HTMLDivElement>(null);

  // 当前使用的树
  const treeData = useMemo(() => {
    switch (viewMode) {
      case 'absolute': return ROOT_TREE;
      case 'relative': return RELATIVE_TREE;
      default: return FULL_TREE;
    }
  }, [viewMode]);

  // 面包屑
  const breadcrumbs = useMemo(() => {
    if (currentPath === '/' || currentPath === '.') return [currentPath];
    if (currentPath.startsWith('./')) {
      return currentPath.split('/').filter(Boolean);
    }
    const parts = currentPath.split('/').filter(Boolean);
    return ['/', ...parts];
  }, [currentPath]);

  // 当前目录下的内容
  const currentDirContents = useMemo(() => {
    // 在树中查找当前路径的节点
    const findInChildren = (nodes: DirNode[], targetPath: string, parentPath: string): DirNode | null => {
      for (const node of nodes) {
        const nodePath = parentPath === '/' ? `/${node.name}` : `${parentPath}/${node.name}`;
        if (nodePath === targetPath) return node;
        if (node.children) {
          const found = findInChildren(node.children, targetPath, nodePath);
          if (found) return found;
        }
      }
      return null;
    };

    for (const root of treeData) {
      const node = root.name === currentPath ? root : findInChildren(root.children || [], currentPath, root.name);
      if (node) return node.children || [];
    }
    return [];
  }, [treeData, currentPath]);

  const navigateTo = (childName: string) => {
    if (currentPath === '/' || currentPath === '.') {
      setCurrentPath(currentPath === '/' ? `/${childName}` : `./${childName}`);
    } else {
      setCurrentPath(`${currentPath}/${childName}`);
    }
  };

  const navigateUp = () => {
    if (currentPath === '/' || currentPath === '.') return;
    if (currentPath.startsWith('./')) {
      const parts = currentPath.split('/');
      parts.pop();
      setCurrentPath(parts.join('/') || '.');
    } else {
      const parts = currentPath.split('/').filter(Boolean);
      parts.pop();
      setCurrentPath(parts.length === 0 ? '/' : '/' + parts.join('/'));
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === 0) {
      setCurrentPath(breadcrumbs[0] === '/' ? '/' : '.');
      return;
    }
    if (breadcrumbs[0] === '/') {
      setCurrentPath('/' + breadcrumbs.slice(1, index + 1).join('/'));
    } else {
      setCurrentPath(breadcrumbs.slice(0, index + 1).join('/'));
    }
  };

  const handleSelectCurrent = () => {
    onSelect(currentPath);
    onClose();
  };

  const handleCustomPath = () => {
    const custom = prompt('输入自定义路径：', currentPath);
    if (custom) {
      onSelect(custom.trim());
      onClose();
    }
  };

  // 点击背景关闭
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  // ESC 关闭
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl w-[560px] max-h-[520px] flex flex-col overflow-hidden"
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <FolderOpen className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {title || (mode === 'directory' ? '选择目录' : '选择文件')}
              </h3>
              <p className="text-xs text-gray-400">
                {mode === 'directory' ? '点击目录即选中，可在下方输入框手动输入路径' : '点击文件选中，可浏览目录导航'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 工具栏 */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-gray-100 bg-gray-50/50">
          {/* 视图切换 */}
          <div className="flex items-center bg-white rounded-lg border border-gray-200 p-0.5">
            <button
              onClick={() => setViewMode('all')}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                viewMode === 'all' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setViewMode('absolute')}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                viewMode === 'absolute' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Server className="w-3 h-3 inline mr-1" />
              绝对路径
            </button>
            <button
              onClick={() => setViewMode('relative')}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                viewMode === 'relative' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Home className="w-3 h-3 inline mr-1" />
              相对路径
            </button>
          </div>
        </div>

        {/* 面包屑 */}
        <div className="flex items-center gap-0.5 px-5 py-2 border-b border-gray-100 bg-white overflow-x-auto">
          {/* 返回上级 */}
          <button
            onClick={navigateUp}
            disabled={currentPath === '/' || currentPath === '.'}
            className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-default shrink-0 mr-1"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
          {breadcrumbs.map((part, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />}
              <button
                onClick={() => handleBreadcrumbClick(idx)}
                className={`px-1.5 py-0.5 text-xs rounded hover:bg-gray-100 transition-colors whitespace-nowrap ${
                  idx === breadcrumbs.length - 1 ? 'font-semibold text-blue-600' : 'text-gray-600'
                }`}
              >
                {part === '/' ? <HardDrive className="w-3.5 h-3.5 inline" /> : part}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* 目录/文件列表 */}
        <div className="flex-1 overflow-y-auto px-2 py-2" style={{ maxHeight: '260px' }}>
          {currentDirContents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <Folder className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">此目录为空</p>
            </div>
          ) : (
            currentDirContents.map((item) => {
              const isDir = item.type === 'dir';
              const Icon = isDir ? Folder : File;
              const canSelect = mode === 'directory' ? isDir : item.type === 'file';

              return (
                <div
                  key={item.name}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm group ${
                    canSelect
                      ? 'hover:bg-blue-50 text-gray-700'
                      : 'hover:bg-gray-50 text-gray-500'
                  }`}
                  onClick={() => {
                    if (isDir) {
                      navigateTo(item.name);
                    } else if (canSelect) {
                      const filePath = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
                      onSelect(filePath);
                      onClose();
                    }
                  }}
                  onDoubleClick={() => {
                    if (isDir) {
                      const dirPath = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
                      if (mode === 'directory') {
                        onSelect(dirPath);
                        onClose();
                      } else {
                        navigateTo(item.name);
                      }
                    }
                  }}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isDir ? 'text-amber-500' : 'text-gray-400'}`} />
                  <span className="flex-1 truncate">{item.name}</span>
                  {isDir ? (
                    <span className="text-xs text-gray-300 group-hover:text-blue-400">目录</span>
                  ) : (
                    <span className="text-xs text-gray-300">文件</span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center gap-3">
          {/* 当前路径输入 */}
          <div className="flex-1 flex items-center gap-2">
            <span className="text-xs text-gray-500 shrink-0">当前路径：</span>
            <input
              value={currentPath}
              onChange={e => setCurrentPath(e.target.value)}
              className="flex-1 h-8 px-2.5 text-xs font-mono border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <button
            onClick={handleCustomPath}
            className="h-8 px-3 text-xs border border-gray-200 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
          >
            手动输入
          </button>
          <button
            onClick={handleSelectCurrent}
            className="h-8 px-4 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            选择此{mode === 'directory' ? '目录' : '路径'}
          </button>
        </div>
      </div>
    </div>
  );
};
