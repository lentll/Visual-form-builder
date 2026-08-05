import React, { useState } from 'react';
import { useFormStore, useAuthStore } from '@/store/formStore';
import { ChevronLeft, Download, FileSpreadsheet, Archive, X, CheckCircle, Loader2 } from 'lucide-react';
import { DataSearchTable } from '@/components/DataSearchTable';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import type { FormField } from '@/types/form';

// 将任意字段值转换为适合导出到 Excel 的纯文本，避免对象型字段导出成 [object Object]
const formatExportValue = (field: FormField, val: any): string => {
  if (val === undefined || val === null) return '';
  if (typeof val === 'boolean') return val ? '是' : '否';

  switch (field.type) {
    case 'contact': {
      if (typeof val !== 'object') return String(val);
      return [val.name, val.phone, val.email, val.company].filter(Boolean).join(' | ');
    }
    case 'address': {
      if (typeof val !== 'object') return String(val);
      return [val.province, val.city, val.district, val.detail].filter(Boolean).join(' ');
    }
    case 'location': {
      if (typeof val === 'object' && val !== null) {
        const parts: string[] = [];
        if (val.lat && val.lng) parts.push(`${Number(val.lat).toFixed(4)}, ${Number(val.lng).toFixed(4)}`);
        if (val.address) parts.push(String(val.address));
        return parts.join(' — ');
      }
      return String(val);
    }
    case 'hyperlink': {
      if (typeof val === 'object' && val !== null) {
        const url = val.url || '';
        return val.text ? `${val.text} (${url})` : url;
      }
      return String(val);
    }
    case 'barcode': {
      if (typeof val === 'object' && val !== null) return val.content ? String(val.content) : '';
      return String(val);
    }
    case 'subtable': {
      if (Array.isArray(val)) return val.length ? `${val.length} 行明细` : '';
      return '';
    }
    case 'multiselect': {
      const arr = Array.isArray(val) ? val : (val ? [val] : []);
      return arr.map((v: string) => field.options?.find(o => o.value === v)?.label ?? v).join(', ');
    }
    case 'cascade': {
      const arr = Array.isArray(val) ? val : (val ? [val] : []);
      const resolve = (opts: any[], target?: string): string => {
        for (const o of opts) {
          if (o.value === target) return o.label;
          if (o.children) {
            const r = resolve(o.children, target);
            if (r && r !== target) return r;
          }
        }
        return target ?? '';
      };
      return arr.map((v: string) => resolve(field.cascadeOptions || field.options || [], v)).join(' / ');
    }
    case 'select':
    case 'radio': {
      const opt = field.options?.find(o => o.value === String(val));
      return opt ? opt.label : String(val);
    }
    case 'relation':
    case 'birelation': {
      return val ? String(val) : '';
    }
  }

  // 其他数组：用逗号拼接，对象元素序列化为 JSON（避免 [object Object]）
  if (Array.isArray(val)) {
    return val.map((v: any) => (typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v))).join(', ');
  }
  // 兜底：任何对象型一律 JSON 序列化，绝不直接 String()
  if (typeof val === 'object' && val !== null) {
    try { return JSON.stringify(val); } catch { return ''; }
  }
  return String(val);
};

interface FormDataPageProps {
  formId: string;
  onBack: () => void;
}

export const FormDataPage: React.FC<FormDataPageProps> = ({ formId, onBack }) => {
  const { forms, getSubmissions, updateSubmission } = useFormStore();
  const currentUser = useAuthStore(s => s.user);
  const form = forms.find(f => f.id === formId);
  const submissions = getSubmissions(formId);

  // 判断数据编辑权限：
  // - 管理员始终可编辑
  // - 表单创建者（普通用户）始终可编辑自己的表单数据
  // - 其他普通用户需看表单设置 canEditData
  const isAdmin = currentUser?.role === 'admin';
  const isOwner = currentUser?.username === form?.ownerId;
  const canEditData = isAdmin || isOwner || !!form?.settings.canEditData;
  const canViewData = isAdmin || isOwner || form?.settings.canViewData !== false;

  const [showExport, setShowExport] = useState(false);
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'xls'>('xlsx');
  const [exportWithAttachments, setExportWithAttachments] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!form) return <div className="flex items-center justify-center h-screen text-gray-400">表单不存在</div>;

  if (!canViewData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <ChevronLeft className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">无权查看数据</p>
          <p className="text-sm text-gray-400 mt-1">您没有权限查看该表单的提交数据</p>
          <button onClick={onBack} className="mt-4 px-4 h-9 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">返回</button>
        </div>
      </div>
    );
  }

  const searchableFields = form.fields.filter(f =>
    !['title', 'description', 'divider', 'image'].includes(f.type)
  );

  // 从表单字段获取列标签
  const fieldLabelMap: Record<string, string> = {};
  searchableFields.forEach(f => { fieldLabelMap[f.id] = f.label; });

  const hasAttachmentFields = form.fields.some(f => f.type === 'upload');

  const doExport = async () => {
    setExporting(true);
    setExportMsg(null);
    try {
      // 构建导出数据
      const exportData = submissions.map((sub, idx) => {
        const row: Record<string, any> = {
          '序号': idx + 1,
          '提交时间': new Date(sub.submittedAt).toLocaleString('zh-CN'),
        };
        searchableFields.forEach(f => {
          row[f.label] = formatExportValue(f, sub.data[f.id]);
        });
        return row;
      });

      // 生成 Excel
      const ws = XLSX.utils.json_to_sheet(exportData);
      // 设置列宽
      const colWidths = [{ wch: 6 }, { wch: 20 }];
      searchableFields.forEach(() => colWidths.push({ wch: 20 }));
      ws['!cols'] = colWidths;
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '表单数据');

      if (exportWithAttachments && hasAttachmentFields) {
        // 打包 Excel + 附件为 ZIP
        const zip = new JSZip();
        const excelBuf = exportFormat === 'xls' ? XLSX.write(wb, { bookType: 'biff8', type: 'array' }) : XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        zip.file(`表单数据.${exportFormat}`, excelBuf);

        // 收集附件
        const attachmentFields = form.fields.filter(f => f.type === 'upload');
        let attachmentCount = 0;
        for (const sub of submissions) {
          for (const af of attachmentFields) {
            const val = sub.data[af.id];
            if (!val) continue;
            const files = Array.isArray(val) ? val : [val];
            for (const file of files) {
              if (typeof file === 'string' && file.startsWith('http')) continue; // 跳过在线 URL
              attachmentCount++;
            }
          }
        }

        // 如果全是本地文件名（演示），添加说明文件
        zip.file('附件说明.txt', `该表单共有 ${attachmentCount} 个附件文件。\n\n注：当前为演示模式，附件路径为本地引用。实际部署后将包含真实文件。\n导出时间：${new Date().toLocaleString('zh-CN')}`);

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        triggerDownload(zipBlob, `${form.settings.title}_数据及附件.zip`);

        setExportMsg({ type: 'success', text: `成功导出 ${exportData.length} 条记录及附件` });
      } else {
        // 仅导出 Excel
        const fileExt = exportFormat;
        const mimeType = exportFormat === 'xls' ? 'application/vnd.ms-excel' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        const excelBuf = exportFormat === 'xls'
          ? XLSX.write(wb, { bookType: 'biff8', type: 'array' })
          : XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuf], { type: mimeType });
        triggerDownload(blob, `${form.settings.title}_数据导出.${fileExt}`);
        setExportMsg({ type: 'success', text: `成功导出 ${exportData.length} 条记录为 ${exportFormat.toUpperCase()} 文件` });
      }

      setTimeout(() => { setShowExport(false); setExportMsg(null); }, 1500);
    } catch (e: any) {
      setExportMsg({ type: 'error', text: `导出失败: ${e.message || '未知错误'}` });
    } finally {
      setExporting(false);
    }
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <header className="bg-white border-b border-gray-200 flex-shrink-0 z-10">
        <div className="w-full max-w-[95%] xl:max-w-[90%] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14 gap-4">
            <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors">
              <ChevronLeft className="w-4 h-4" /> 返回
            </button>
            <div className="w-px h-5 bg-gray-200" />
            <h1 className="font-semibold text-gray-900 text-sm truncate">{form.settings.title}</h1>
            <span className="text-xs text-gray-400">数据分析</span>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-gray-400">共 {submissions.length} 条提交记录</span>
              <button
                onClick={() => { setShowExport(true); setExportMsg(null); }}
                className="flex items-center gap-1.5 px-3 h-8 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> 导出数据
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden w-full max-w-[95%] xl:max-w-[90%] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {searchableFields.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
            <p className="text-gray-400">表单暂无可查询字段</p>
          </div>
        ) : (
          <DataSearchTable fields={searchableFields} submissions={submissions} showAllByDefault={true} canEditData={canEditData} onEditSubmission={(subId, data) => updateSubmission(formId, subId, data)} scrollable={true} />
        )}
      </main>

      {/* 导出弹窗 */}
      {showExport && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowExport(false)}>
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Download className="w-4 h-4" /> 导出数据
              </h3>
              <button onClick={() => setShowExport(false)} className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 导出格式 */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">导出格式</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'xlsx', label: 'Excel (.xlsx)', desc: 'Office 2007+格式，推荐', icon: FileSpreadsheet },
                    { value: 'xls', label: 'Excel (.xls)', desc: '兼容旧版 Office 97-2003', icon: FileSpreadsheet },
                  ].map(fmt => (
                    <button
                      key={fmt.value}
                      onClick={() => setExportFormat(fmt.value as 'xlsx' | 'xls')}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${exportFormat === fmt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}
                    >
                      <fmt.icon className={`w-8 h-8 ${exportFormat === fmt.value ? 'text-blue-600' : 'text-gray-400'}`} />
                      <div>
                        <div className={`text-sm font-medium ${exportFormat === fmt.value ? 'text-blue-700' : 'text-gray-700'}`}>{fmt.label}</div>
                        <div className="text-xs text-gray-400">{fmt.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 附件导出（仅当有附件字段时显示）*/}
              {hasAttachmentFields && (
                <div>
                  <label className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${exportWithAttachments ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}>
                    <input
                      type="checkbox"
                      checked={exportWithAttachments}
                      onChange={e => setExportWithAttachments(e.target.checked)}
                      className="mt-0.5 accent-blue-600"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <Archive className={`w-4 h-4 ${exportWithAttachments ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className={`text-sm font-medium ${exportWithAttachments ? 'text-blue-700' : 'text-gray-700'}`}>打包附件</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">将 Excel 和所有附件文件打包为 ZIP 压缩包</p>
                    </div>
                  </label>
                </div>
              )}

              {/* 导出信息 */}
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500">
                  将导出 <span className="font-medium text-gray-700">{submissions.length}</span> 条提交记录
                  ，包含 <span className="font-medium text-gray-700">{searchableFields.length}</span> 个字段
                </p>
              </div>

              {/* 提示信息 */}
              {exportMsg && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${exportMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                  {exportMsg.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <X className="w-4 h-4 flex-shrink-0" />}
                  {exportMsg.text}
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowExport(false)} className="flex-1 h-9 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                  取消
                </button>
                <button
                  onClick={doExport}
                  disabled={exporting}
                  className="flex-1 h-9 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {exporting ? '导出中...' : '确认导出'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
