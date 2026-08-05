import { create } from 'zustand';
import type { FormField, FormSchema, FormSettings, FormSubmission } from '@/types/form';
import { nanoid } from 'nanoid';

// ── 用户类型 ──
export interface UserPermission {
  canCreateForm: boolean;
  canEditForm: boolean;
  canSettings: boolean;
  canPublicQuery: boolean;
}

export interface SystemUser {
  id: string;
  username: string; // 登录账号
  password: string; // 演示用明文存储
  displayName: string; // 显示名称
  role: 'admin' | 'user';
  permissions: UserPermission;
  createdAt: string;
}

// 预设用户
const DEFAULT_USERS: SystemUser[] = [
  {
    id: 'u-admin',
    username: 'admin',
    password: 'admin123',
    displayName: '系统管理员',
    role: 'admin',
    permissions: { canCreateForm: true, canEditForm: true, canSettings: true, canPublicQuery: true },
    createdAt: '2025-01-01T00:00:00.000Z',
  },
];

interface FormStore {
  // 表单列表
  forms: FormSchema[];
  // 当前编辑的表单
  currentForm: FormSchema | null;
  // 当前选中的字段
  selectedFieldId: string | null;
  // 提交数据
  submissions: Record<string, FormSubmission[]>;

  // 表单列表操作
  createForm: () => FormSchema;
  deleteForm: (id: string) => void;
  updateFormSettings: (id: string, settings: Partial<FormSettings>) => void;
  publishForm: (id: string) => void;
  closeForm: (id: string) => void;

  // 当前表单操作
  setCurrentForm: (form: FormSchema | null) => void;
  loadForm: (id: string) => void;

  // 字段操作
  addField: (field: FormField, index?: number) => void;
  updateField: (id: string, updates: Partial<FormField>) => void;
  deleteField: (id: string) => void;
  moveField: (fromIndex: number, toIndex: number) => void;
  duplicateField: (id: string) => void;
  setSelectedField: (id: string | null) => void;

  // 数据提交
  submitForm: (formId: string, data: Record<string, any>) => void;
  getSubmissions: (formId: string) => FormSubmission[];
  updateSubmission: (formId: string, submissionId: string, data: Record<string, any>) => void;
}

const DEFAULT_SETTINGS: FormSettings = {
  title: '未命名表单',
  description: '',
  submitText: '提交',
  successMessage: '提交成功，感谢您的参与！',
  theme: 'blue',
  showProgress: false,
  allowEdit: false,
};

// ── 示例提交数据生成 ──
const getDefaultSubmissions = (): Record<string, FormSubmission[]> => ({
  'sample-1': Array.from({ length: 28 }, (_, i) => ({
    id: `s-${i}`,
    formId: 'sample-1',
    data: { f1: `用户${i + 1}`, f3: Math.ceil(Math.random() * 5), f4: ['design', 'data', 'analysis', 'flow'][i % 4] },
    submittedAt: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
    submittedBy: ['系统管理员', '张三', '李四'][i % 3],
  })),
  'sample-2': Array.from({ length: 30 }, (_, i) => ({
    id: `s2-${i}`,
    formId: 'sample-2',
    data: {
      g1: ['张三', '李四', '王五', '赵六', '陈七'][i % 5],
      g2: `138${String(10000000 + i).slice(0, 8)}`,
      g3: `user${i + 1}@example.com`,
      g4: ['bj', 'sh', 'sz', 'gz', 'other'][i % 5],
      g5: new Date(Date.now() + 86400000 * (i % 30)).toISOString().slice(0, 10),
      g6: i % 2 === 0,
    },
    submittedAt: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
    submittedBy: ['系统管理员', '王五', '陈七'][i % 3],
  })),
});

// ── localStorage 持久化 ──
const loadFormsFromStorage = (): FormSchema[] => {
  try {
    const saved = localStorage.getItem('formcraft_forms');
    if (saved) {
      const forms = JSON.parse(saved);
      if (Array.isArray(forms) && forms.length > 0) return forms;
    }
  } catch { /* ignore */ }
  return SAMPLE_FORMS;
};

const loadSubmissionsFromStorage = (): Record<string, FormSubmission[]> => {
  try {
    const saved = localStorage.getItem('formcraft_submissions');
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return getDefaultSubmissions();
};

const persistForms = (forms: FormSchema[]) => {
  try { localStorage.setItem('formcraft_forms', JSON.stringify(forms)); } catch { /* ignore */ }
};

const persistSubmissions = (submissions: Record<string, FormSubmission[]>) => {
  try { localStorage.setItem('formcraft_submissions', JSON.stringify(submissions)); } catch { /* ignore */ }
};

// 初始示例表单
const SAMPLE_FORMS: FormSchema[] = [
  {
    id: 'sample-1',
    settings: {
      title: '用户满意度调查',
      description: '请花几分钟时间填写本次调查，您的反馈对我们非常重要。',
      submitText: '提交问卷',
      successMessage: '感谢您的参与！',
      theme: 'blue',
      showProgress: true,
      publicQuery: 'public' as const,
      publicSubmit: 'public' as const,
    },
    fields: [
      {
        id: 'f1', type: 'input', label: '您的姓名', placeholder: '请输入您的姓名',
        validation: { required: true }, width: 'half',
      },
      {
        id: 'f2', type: 'select', label: '您的职位', placeholder: '请选择您的职位',
        options: [
          { label: '开发工程师', value: 'dev' },
          { label: '产品经理', value: 'pm' },
          { label: '设计师', value: 'designer' },
          { label: '运营', value: 'ops' },
          { label: '其他', value: 'other' },
        ],
        width: 'half',
      },
      {
        id: 'f3', type: 'rate', label: '您对我们产品的整体满意度', max: 5,
        validation: { required: true },
      },
      {
        id: 'f4', type: 'radio', label: '您最常使用的功能是？',
        options: [
          { label: '表单设计', value: 'design' },
          { label: '数据收集', value: 'data' },
          { label: '统计分析', value: 'analysis' },
          { label: '流程审批', value: 'flow' },
        ],
        validation: { required: true },
      },
      {
        id: 'f5', type: 'checkbox', label: '您希望我们改进哪些方面？（多选）',
        options: [
          { label: '界面交互', value: 'ui' },
          { label: '性能速度', value: 'perf' },
          { label: '功能丰富度', value: 'feature' },
          { label: '文档帮助', value: 'doc' },
        ],
      },
      {
        id: 'f6', type: 'textarea', label: '其他建议', placeholder: '请输入您的建议...',
        rows: 4, showCount: true, validation: { maxLength: 500 },
      },
    ],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    status: 'published',
    submits: 28,
    ownerId: 'admin',
  },
  {
    id: 'sample-2',
    settings: {
      title: '活动报名表',
      description: '欢迎报名参加我们的年度技术交流大会。',
      submitText: '立即报名',
      successMessage: '报名成功！我们将通过邮件通知您活动详情。',
      theme: 'green',
      publicQuery: 'public' as const,
      publicSubmit: 'login-required' as const,
    },
    fields: [
      { id: 'g1', type: 'input', label: '姓名', placeholder: '请输入真实姓名', validation: { required: true }, width: 'half' },
      { id: 'g2', type: 'input', label: '手机号', placeholder: '请输入手机号码', validation: { required: true, pattern: '^1[3-9]\\d{9}$', message: '请输入正确的手机号' }, width: 'half' },
      { id: 'g3', type: 'input', label: '电子邮箱', placeholder: 'example@email.com', validation: { required: true } },
      { id: 'g4', type: 'select', label: '所在城市', options: [{ label: '北京', value: 'bj' }, { label: '上海', value: 'sh' }, { label: '深圳', value: 'sz' }, { label: '广州', value: 'gz' }, { label: '其他', value: 'other' }], validation: { required: true } },
      { id: 'g5', type: 'date', label: '期望参加日期', validation: { required: true } },
      { id: 'g6', type: 'switch', label: '是否需要住宿安排', defaultValue: false },
      { id: 'g7', type: 'textarea', label: '备注信息', placeholder: '如有特殊需求，请在此说明...', rows: 3 },
    ],
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    status: 'published',
    submits: 156,
    ownerId: 'admin',
  },
  {
    id: 'sample-3',
    settings: {
      title: '员工信息登记表',
      description: '请填写您的基本信息，用于完善人事档案。',
      submitText: '提交',
      successMessage: '信息已提交，HR部门将在3个工作日内与您确认。',
      theme: 'default',
    },
    fields: [],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    status: 'draft',
    submits: 0,
    ownerId: 'admin',
  },
];

// ── 认证状态（多用户） ──
interface AuthStore {
  isLoggedIn: boolean;
  user: { username: string; displayName: string; role: 'admin' | 'user'; permissions: UserPermission } | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  checkAuth: () => void;
  changePassword: (oldPassword: string, newPassword: string) => { ok: boolean; message: string };
}

const loadUsers = (): SystemUser[] => {
  try {
    const saved = localStorage.getItem('formcraft_users');
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return DEFAULT_USERS;
};

const saveUsers = (users: SystemUser[]) => {
  localStorage.setItem('formcraft_users', JSON.stringify(users));
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  isLoggedIn: false,
  user: null,
  login: (username, password) => {
    const users = loadUsers();
    const found = users.find(u => u.username === username && u.password === password);
    if (found) {
      const user = { username: found.username, displayName: found.displayName, role: found.role, permissions: found.permissions };
      localStorage.setItem('formcraft_auth', JSON.stringify(user));
      set({ isLoggedIn: true, user });
      return true;
    }
    return false;
  },
  logout: () => {
    localStorage.removeItem('formcraft_auth');
    set({ isLoggedIn: false, user: null });
  },
  checkAuth: () => {
    const saved = localStorage.getItem('formcraft_auth');
    if (saved) {
      try {
        const user = JSON.parse(saved);
        set({ isLoggedIn: true, user });
      } catch { localStorage.removeItem('formcraft_auth'); }
    }
  },
  changePassword: (oldPassword, newPassword) => {
    const currentUser = get().user;
    if (!currentUser) return { ok: false, message: '未登录' };
    const users = loadUsers();
    const idx = users.findIndex(u => u.username === currentUser.username);
    if (idx === -1) return { ok: false, message: '用户不存在' };
    if (users[idx].password !== oldPassword) {
      return { ok: false, message: '当前密码错误' };
    }
    if (newPassword.length < 6) {
      return { ok: false, message: '新密码长度不能少于6位' };
    }
    users[idx].password = newPassword;
    saveUsers(users);
    return { ok: true, message: '密码修改成功' };
  },
}));

// ── 用户管理 Store ──
interface UserStore {
  users: SystemUser[];
  load: () => void;
  createUser: (username: string, displayName: string, password: string, permissions: UserPermission) => { ok: boolean; message: string };
  updatePermissions: (userId: string, permissions: UserPermission) => void;
  deleteUser: (userId: string) => void;
  resetPassword: (userId: string, newPassword: string) => { ok: boolean; message: string };
}

export const useUserStore = create<UserStore>((set) => ({
  users: loadUsers(),
  load: () => set({ users: loadUsers() }),
  createUser: (username, displayName, password, permissions) => {
    if (!username.trim()) return { ok: false, message: '用户名不能为空' };
    if (!displayName.trim()) return { ok: false, message: '显示名称不能为空' };
    if (password.length < 6) return { ok: false, message: '密码长度不能少于6位' };
    const users = loadUsers();
    if (users.some(u => u.username === username.trim())) {
      return { ok: false, message: '用户名已存在' };
    }
    const newUser: SystemUser = {
      id: nanoid(),
      username: username.trim(),
      displayName: displayName.trim(),
      password,
      role: 'user',
      permissions,
      createdAt: new Date().toISOString(),
    };
    const updated = [...users, newUser];
    saveUsers(updated);
    set({ users: updated });
    return { ok: true, message: '用户创建成功' };
  },
  updatePermissions: (userId, permissions) => {
    const users = loadUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return;
    users[idx].permissions = permissions;
    saveUsers(users);
    set({ users });
  },
  deleteUser: (userId) => {
    const users = loadUsers().filter(u => u.id !== userId);
    saveUsers(users);
    set({ users });
  },
  resetPassword: (userId, newPassword) => {
    if (newPassword.length < 6) return { ok: false, message: '密码长度不能少于6位' };
    const users = loadUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return { ok: false, message: '用户不存在' };
    users[idx].password = newPassword;
    saveUsers(users);
    set({ users });
    return { ok: true, message: '密码已重置' };
  },
}));

// 系统设置类型
export type DbType = 'localStorage' | 'mysql' | 'postgresql' | 'mongodb' | 'sqlite';

export interface SystemSettings {
  dbType: DbType;
  dbHost: string;
  dbPort: string;
  dbName: string;
  dbUser: string;
  dbPassword: string;
  attachmentDir: string;
  attachmentMaxSize: number; // MB
  systemName: string;
  systemLogo: string;
}

interface SystemStore {
  settings: SystemSettings;
  updateSettings: (updates: Partial<SystemSettings>) => void;
  testDbConnection: () => Promise<{ ok: boolean; message: string }>;
}

const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  dbType: 'localStorage',
  dbHost: 'localhost',
  dbPort: '3306',
  dbName: 'formcraft',
  dbUser: 'root',
  dbPassword: '',
  attachmentDir: '/uploads/attachments',
  attachmentMaxSize: 10,
  systemName: 'FormCraft',
  systemLogo: '',
};

const loadSystemSettings = (): SystemSettings => {
  try {
    const saved = localStorage.getItem('formcraft_system_settings');
    if (saved) return { ...DEFAULT_SYSTEM_SETTINGS, ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return { ...DEFAULT_SYSTEM_SETTINGS };
};

export const useSystemStore = create<SystemStore>((set, get) => ({
  settings: loadSystemSettings(),
  updateSettings: (updates) => {
    set(state => {
      const newSettings = { ...state.settings, ...updates };
      localStorage.setItem('formcraft_system_settings', JSON.stringify(newSettings));
      return { settings: newSettings };
    });
  },
  testDbConnection: async () => {
    const { settings } = get();
    // 模拟连接测试（实际项目需后端 API）
    await new Promise(r => setTimeout(r, 1200));
    if (settings.dbType === 'localStorage') {
      return { ok: true, message: '浏览器本地存储连接正常' };
    }
    if (!settings.dbHost || !settings.dbName) {
      return { ok: false, message: '请填写完整的数据库连接信息' };
    }
    // 模拟连接成功（演示用）
    return { ok: true, message: `${settings.dbType.toUpperCase()} 连接测试成功（演示模式）` };
  },
}));

export const useFormStore = create<FormStore>((set, get) => ({
  forms: loadFormsFromStorage(),
  currentForm: null,
  selectedFieldId: null,
  submissions: loadSubmissionsFromStorage(),

  createForm: () => {
    const auth = localStorage.getItem('formcraft_auth');
    const user = auth ? JSON.parse(auth) : { username: 'admin' };
    const newForm: FormSchema = {
      id: nanoid(),
      settings: { ...DEFAULT_SETTINGS },
      fields: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
      submits: 0,
      ownerId: user.username,
    };
    set(state => ({ forms: [newForm, ...state.forms] }));
    return newForm;
  },

  deleteForm: (id) => {
    set(state => ({ forms: state.forms.filter(f => f.id !== id) }));
  },

  updateFormSettings: (id, settings) => {
    set(state => ({
      forms: state.forms.map(f => f.id === id
        ? { ...f, settings: { ...f.settings, ...settings }, updatedAt: new Date().toISOString() }
        : f
      ),
      currentForm: state.currentForm?.id === id
        ? { ...state.currentForm, settings: { ...state.currentForm.settings, ...settings } }
        : state.currentForm,
    }));
  },

  publishForm: (id) => {
    set(state => ({
      forms: state.forms.map(f => f.id === id ? { ...f, status: 'published' } : f),
      currentForm: state.currentForm?.id === id ? { ...state.currentForm, status: 'published' } : state.currentForm,
    }));
  },

  closeForm: (id) => {
    set(state => ({
      forms: state.forms.map(f => f.id === id ? { ...f, status: 'closed' } : f),
    }));
  },

  setCurrentForm: (form) => set({ currentForm: form, selectedFieldId: null }),

  loadForm: (id) => {
    const form = get().forms.find(f => f.id === id);
    if (form) set({ currentForm: { ...form }, selectedFieldId: null });
  },

  addField: (field, index) => {
    set(state => {
      if (!state.currentForm) return state;
      const fields = [...state.currentForm.fields];
      if (index !== undefined) {
        fields.splice(index, 0, field);
      } else {
        fields.push(field);
      }
      const updated = { ...state.currentForm, fields, updatedAt: new Date().toISOString() };
      return {
        currentForm: updated,
        forms: state.forms.map(f => f.id === updated.id ? updated : f),
        selectedFieldId: field.id,
      };
    });
  },

  updateField: (id, updates) => {
    set(state => {
      if (!state.currentForm) return state;
      const fields = state.currentForm.fields.map(f => f.id === id ? { ...f, ...updates } : f);
      const updated = { ...state.currentForm, fields, updatedAt: new Date().toISOString() };
      return {
        currentForm: updated,
        forms: state.forms.map(f => f.id === updated.id ? updated : f),
      };
    });
  },

  deleteField: (id) => {
    set(state => {
      if (!state.currentForm) return state;
      const fields = state.currentForm.fields.filter(f => f.id !== id);
      const updated = { ...state.currentForm, fields, updatedAt: new Date().toISOString() };
      return {
        currentForm: updated,
        forms: state.forms.map(f => f.id === updated.id ? updated : f),
        selectedFieldId: null,
      };
    });
  },

  moveField: (fromIndex, toIndex) => {
    set(state => {
      if (!state.currentForm) return state;
      const fields = [...state.currentForm.fields];
      const [removed] = fields.splice(fromIndex, 1);
      fields.splice(toIndex, 0, removed);
      const updated = { ...state.currentForm, fields, updatedAt: new Date().toISOString() };
      return {
        currentForm: updated,
        forms: state.forms.map(f => f.id === updated.id ? updated : f),
      };
    });
  },

  duplicateField: (id) => {
    set(state => {
      if (!state.currentForm) return state;
      const idx = state.currentForm.fields.findIndex(f => f.id === id);
      if (idx === -1) return state;
      const original = state.currentForm.fields[idx];
      const copy = { ...original, id: nanoid(), label: original.label + ' (副本)' };
      const fields = [...state.currentForm.fields];
      fields.splice(idx + 1, 0, copy);
      const updated = { ...state.currentForm, fields, updatedAt: new Date().toISOString() };
      return {
        currentForm: updated,
        forms: state.forms.map(f => f.id === updated.id ? updated : f),
        selectedFieldId: copy.id,
      };
    });
  },

  setSelectedField: (id) => set({ selectedFieldId: id }),

  submitForm: (formId, data) => {
    const auth = localStorage.getItem('formcraft_auth');
    const user = auth ? JSON.parse(auth) : null;
    const submission: FormSubmission = {
      id: nanoid(),
      formId,
      data,
      submittedAt: new Date().toISOString(),
      submittedBy: user?.displayName || user?.username || '匿名用户',
    };
    set(state => ({
      submissions: {
        ...state.submissions,
        [formId]: [...(state.submissions[formId] || []), submission],
      },
      forms: state.forms.map(f => f.id === formId ? { ...f, submits: f.submits + 1 } : f),
    }));
  },

  getSubmissions: (formId) => {
    return get().submissions[formId] || [];
  },

  updateSubmission: (formId, submissionId, data) => {
    set(state => ({
      submissions: {
        ...state.submissions,
        [formId]: (state.submissions[formId] || []).map(s =>
          s.id === submissionId ? { ...s, data } : s
        ),
      },
    }));
  },
}));

// 自动持久化：每次 state 变更后保存到 localStorage
let saveTimer: ReturnType<typeof setTimeout> | null = null;
useFormStore.subscribe((state) => {
  if (saveTimer) clearTimeout(saveTimer);
  // 防抖 300ms，避免频繁写入
  saveTimer = setTimeout(() => {
    persistForms(state.forms);
    persistSubmissions(state.submissions);
  }, 300);
});
