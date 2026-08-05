// 表单字段类型
export type FieldType =
  // 原有字段
  | 'input'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'time'
  | 'number'
  | 'rate'
  | 'slider'
  | 'switch'
  | 'upload'
  | 'cascader'
  | 'divider'
  | 'title'
  | 'description'
  | 'image'
  // 新增字段 - 信息类
  | 'contact'       // 联系人
  | 'idcard'        // 身份证
  | 'phone'         // 电话
  | 'address'       // 地址
  | 'email'         // 邮箱
  | 'hyperlink'     // 超链接
  | 'barcode'       // 条码（扫码/生成）
  | 'location'      // 定位
  // 新增字段 - 数值类
  | 'progress'      // 进度
  | 'level'         // 等级
  | 'percent'       // 百分比
  | 'currency'      // 货币
  // 新增字段 - 选择类
  | 'multiselect'   // 多选项（标签式多选）
  | 'cascade'       // 级联选项（树形多级）
  // 新增字段 - 高级关联
  | 'relation'      // 单向关联（关联其他表单数据）
  | 'birelation'    // 双向关联
  | 'subtable';     // 明细表（子表格）

export interface FieldOption {
  label: string;
  value: string;
  children?: FieldOption[]; // 级联选项的子级
}

export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  message?: string;
}

// 明细表子字段（简化版，只支持基础类型）
export type SubFieldType = 'input' | 'number' | 'select' | 'date' | 'switch';
export interface SubField {
  id: string;
  type: SubFieldType;
  label: string;
  placeholder?: string;
  options?: FieldOption[];
  required?: boolean;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  defaultValue?: any;
  options?: FieldOption[];
  validation?: FieldValidation;
  width?: 'full' | 'half';
  hidden?: boolean;
  disabled?: boolean;
  description?: string;
  // 特定字段属性
  rows?: number;           // textarea 行数
  multiple?: boolean;      // select/upload 多选
  accept?: string;         // upload 文件类型
  max?: number;            // rate 最大值 / slider 最大值 / progress 最大值
  min?: number;            // slider 最小值
  step?: number;           // slider 步长
  showCount?: boolean;     // input/textarea 是否显示字数
  prefix?: string;         // input 前缀
  suffix?: string;         // input 后缀
  imageUrl?: string;       // image 图片地址
  content?: string;        // title/description/divider 文本内容
  align?: 'left' | 'center' | 'right'; // 对齐方式
  level?: 1 | 2 | 3;      // title 级别
  // 货币
  currency?: string;       // 货币符号 ¥/$/ € 等
  // 等级
  levelMax?: number;       // 等级最大值（默认5）
  levelType?: 'star' | 'number' | 'tag'; // 等级展示方式
  // 进度
  progressColor?: string;  // 进度条颜色
  // 超链接
  linkText?: string;       // 链接文字
  // 条码
  barcodeType?: 'qrcode' | 'barcode'; // 条码类型
  // 定位
  locationMode?: 'auto' | 'manual';  // 定位模式
  // 联系人
  contactFields?: Array<'name' | 'phone' | 'email' | 'company'>; // 联系人包含哪些子字段
  // 地址
  addressLevel?: 1 | 2 | 3 | 4; // 地址层级：省/市/区/详细
  // 关联
  relatedFormId?: string;  // 关联表单 ID
  relatedFieldId?: string; // 关联字段 ID（用于显示）
  relatedLabel?: string;   // 关联字段显示名称
  // 双向关联
  biRelatedFormId?: string;
  biRelatedFieldId?: string;
  // 明细表
  subFields?: SubField[];      // 明细表的列定义
  defaultRowCount?: number;    // 默认行数
  // 多选项（标签式）
  maxSelect?: number;      // 最多可选数量
  // 级联选项
  cascadeOptions?: FieldOption[]; // 支持多级的级联选项
  cascadeLevel?: number;   // 级联层级数
  // 开关
  switchOnText?: string;   // 开关开启时显示的文字（默认"是"）
  switchOffText?: string;  // 开关关闭时显示的文字（默认"否"）
}

export interface FormSettings {
  title: string;
  description?: string;
  submitText?: string;
  successMessage?: string;
  theme?: 'default' | 'blue' | 'green' | 'purple' | 'orange';
  bgColor?: string;
  showProgress?: boolean;
  allowEdit?: boolean;   // 允许修改提交
  deadline?: string;     // 截止日期
  maxSubmits?: number;   // 最大提交次数
  publicQuery?: 'off' | 'public' | 'login-required'; // 公开查询模式：关闭/免登录/需登录
  publicQueryTitle?: string; // 公开查询页面自定义标题
  publicQueryBgImage?: string; // 公开查询页面背景图
  publicSubmit?: 'off' | 'public' | 'login-required'; // 提交页模式：关闭/免登录/需登录
  // 表单级数据权限（管理员设置，控制普通用户对该表单的数据操作权限）
  canViewData?: boolean; // 普通用户是否可查看数据（默认 true）
  canEditData?: boolean; // 普通用户是否可编辑数据记录（默认 false）
}

export interface FormSchema {
  id: string;
  settings: FormSettings;
  fields: FormField[];
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'published' | 'closed';
  submits: number;
  ownerId: string; // 创建者用户名
}

export interface FormSubmission {
  id: string;
  formId: string;
  data: Record<string, any>;
  submittedAt: string;
  submittedBy?: string; // 提交者显示名称（登录用户）
  ip?: string;
}
