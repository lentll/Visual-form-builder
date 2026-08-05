import React from 'react';
import type { FieldType } from '@/types/form';
import {
  Type, AlignLeft, ChevronDown, Circle, CheckSquare,
  Calendar, Clock, Hash, Star, Sliders, ToggleLeft,
  Upload, Layers, Minus, Heading1, FileText, Image,
  User, CreditCard, Phone, MapPin, Mail, Link,
  TrendingUp, Award, Percent, DollarSign,
  Tags, GitBranch, QrCode, Navigation,
  ArrowLeftRight, ArrowRight, Table2,
} from 'lucide-react';

export interface FieldDef {
  type: FieldType;
  label: string;
  icon: React.ReactNode;
  category: string;
  defaultProps?: Record<string, any>;
}

const iconStyle = 'w-4 h-4';

export const FIELD_DEFINITIONS: FieldDef[] = [
  // ── 基础控件 ──
  { type: 'input', label: '单行文本', icon: <Type className={iconStyle} />, category: '基础控件', defaultProps: { placeholder: '请输入内容', width: 'full' } },
  { type: 'textarea', label: '多行文本', icon: <AlignLeft className={iconStyle} />, category: '基础控件', defaultProps: { placeholder: '请输入内容', rows: 4, width: 'full' } },
  { type: 'number', label: '数字输入', icon: <Hash className={iconStyle} />, category: '基础控件', defaultProps: { placeholder: '请输入数字', width: 'half' } },
  { type: 'select', label: '下拉选择', icon: <ChevronDown className={iconStyle} />, category: '基础控件', defaultProps: { placeholder: '请选择', options: [{ label: '选项1', value: 'opt1' }, { label: '选项2', value: 'opt2' }], width: 'full' } },
  { type: 'radio', label: '单选框', icon: <Circle className={iconStyle} />, category: '基础控件', defaultProps: { options: [{ label: '选项1', value: 'opt1' }, { label: '选项2', value: 'opt2' }, { label: '选项3', value: 'opt3' }] } },
  { type: 'checkbox', label: '多选框', icon: <CheckSquare className={iconStyle} />, category: '基础控件', defaultProps: { options: [{ label: '选项1', value: 'opt1' }, { label: '选项2', value: 'opt2' }, { label: '选项3', value: 'opt3' }] } },

  // ── 信息类字段 ──
  { type: 'contact', label: '联系人', icon: <User className={iconStyle} />, category: '信息类字段', defaultProps: { width: 'full', contactFields: ['name', 'phone', 'email'] } },
  { type: 'idcard', label: '身份证', icon: <CreditCard className={iconStyle} />, category: '信息类字段', defaultProps: { placeholder: '请输入身份证号', width: 'half', validation: { pattern: '^[1-9]\\d{5}(18|19|20)\\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\\d{3}[0-9Xx]$', message: '请输入有效的18位身份证号' } } },
  { type: 'phone', label: '电话', icon: <Phone className={iconStyle} />, category: '信息类字段', defaultProps: { placeholder: '请输入手机号', width: 'half', validation: { pattern: '^1[3-9]\\d{9}$', message: '请输入有效的手机号码' } } },
  { type: 'address', label: '地址', icon: <MapPin className={iconStyle} />, category: '信息类字段', defaultProps: { width: 'full', addressLevel: 3 } },
  { type: 'email', label: '邮箱', icon: <Mail className={iconStyle} />, category: '信息类字段', defaultProps: { placeholder: '请输入邮箱地址', width: 'half', validation: { pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$', message: '请输入有效的邮箱地址' } } },
  { type: 'hyperlink', label: '超链接', icon: <Link className={iconStyle} />, category: '信息类字段', defaultProps: { placeholder: '请输入链接地址', width: 'full', linkText: '点击访问' } },
  { type: 'barcode', label: '条码', icon: <QrCode className={iconStyle} />, category: '信息类字段', defaultProps: { placeholder: '请输入内容生成条码', width: 'half', barcodeType: 'qrcode' } },
  { type: 'location', label: '定位', icon: <Navigation className={iconStyle} />, category: '信息类字段', defaultProps: { width: 'full', locationMode: 'auto' } },

  // ── 数值类字段 ──
  { type: 'progress', label: '进度', icon: <TrendingUp className={iconStyle} />, category: '数值类字段', defaultProps: { min: 0, max: 100, defaultValue: 0, width: 'full' } },
  { type: 'level', label: '等级', icon: <Award className={iconStyle} />, category: '数值类字段', defaultProps: { levelMax: 5, levelType: 'star', defaultValue: 0 } },
  { type: 'percent', label: '百分比', icon: <Percent className={iconStyle} />, category: '数值类字段', defaultProps: { placeholder: '请输入百分比', min: 0, max: 100, defaultValue: 0, width: 'half' } },
  { type: 'currency', label: '货币', icon: <DollarSign className={iconStyle} />, category: '数值类字段', defaultProps: { placeholder: '请输入金额', currency: '¥', width: 'half' } },

  // ── 选择类字段 ──
  { type: 'multiselect', label: '多选项', icon: <Tags className={iconStyle} />, category: '选择类字段', defaultProps: { options: [{ label: '标签1', value: 't1' }, { label: '标签2', value: 't2' }, { label: '标签3', value: 't3' }], width: 'full' } },
  { type: 'cascade', label: '级联选项', icon: <GitBranch className={iconStyle} />, category: '选择类字段', defaultProps: { placeholder: '请逐级选择', width: 'full', cascadeLevel: 2, cascadeOptions: [{ label: '一级A', value: 'A', children: [{ label: '二级A1', value: 'A1' }, { label: '二级A2', value: 'A2' }] }, { label: '一级B', value: 'B', children: [{ label: '二级B1', value: 'B1' }] }] } },

  // ── 高级控件 ──
  { type: 'date', label: '日期选择', icon: <Calendar className={iconStyle} />, category: '高级控件', defaultProps: { placeholder: '请选择日期', width: 'half' } },
  { type: 'time', label: '时间选择', icon: <Clock className={iconStyle} />, category: '高级控件', defaultProps: { placeholder: '请选择时间', width: 'half' } },
  { type: 'rate', label: '评分', icon: <Star className={iconStyle} />, category: '高级控件', defaultProps: { max: 5 } },
  { type: 'slider', label: '滑块', icon: <Sliders className={iconStyle} />, category: '高级控件', defaultProps: { min: 0, max: 100, step: 1, defaultValue: 50 } },
  { type: 'switch', label: '开关', icon: <ToggleLeft className={iconStyle} />, category: '高级控件', defaultProps: { defaultValue: false } },
  { type: 'upload', label: '文件上传', icon: <Upload className={iconStyle} />, category: '高级控件', defaultProps: { accept: '*', multiple: false } },
  { type: 'cascader', label: '级联选择', icon: <Layers className={iconStyle} />, category: '高级控件', defaultProps: { placeholder: '请选择', options: [] } },

  // ── 高级关联 ──
  { type: 'relation', label: '单向关联', icon: <ArrowRight className={iconStyle} />, category: '高级关联', defaultProps: { width: 'full', relatedLabel: '关联数据' } },
  { type: 'birelation', label: '双向关联', icon: <ArrowLeftRight className={iconStyle} />, category: '高级关联', defaultProps: { width: 'full', relatedLabel: '双向关联数据' } },
  { type: 'subtable', label: '明细表', icon: <Table2 className={iconStyle} />, category: '高级关联', defaultProps: { width: 'full', defaultRowCount: 1, subFields: [{ id: 'sf1', type: 'input', label: '名称', placeholder: '请输入' }, { id: 'sf2', type: 'number', label: '数量', placeholder: '0' }, { id: 'sf3', type: 'number', label: '单价', placeholder: '0.00' }] } },

  // ── 展示控件 ──
  { type: 'title', label: '标题', icon: <Heading1 className={iconStyle} />, category: '展示控件', defaultProps: { content: '标题文字', level: 2 } },
  { type: 'description', label: '说明文字', icon: <FileText className={iconStyle} />, category: '展示控件', defaultProps: { content: '这是一段说明文字' } },
  { type: 'divider', label: '分割线', icon: <Minus className={iconStyle} />, category: '展示控件', defaultProps: {} },
  { type: 'image', label: '图片', icon: <Image className={iconStyle} />, category: '展示控件', defaultProps: { imageUrl: 'https://via.placeholder.com/600x200', align: 'center' } },
];

export const FIELD_CATEGORIES = ['基础控件', '信息类字段', '数值类字段', '选择类字段', '高级控件', '高级关联', '展示控件'];

export const getFieldDef = (type: FieldType) =>
  FIELD_DEFINITIONS.find(d => d.type === type);
