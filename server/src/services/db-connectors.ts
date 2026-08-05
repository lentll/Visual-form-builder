import mysql from 'mysql2/promise';
import pg from 'pg';
import { MongoClient } from 'mongodb';
import initSqlJs from 'sql.js';
import fs from 'fs';

export type DbType = 'mysql' | 'postgresql' | 'mongodb' | 'sqlite';

export interface DbConnectionParams {
  type: DbType;
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
}

export interface DbTestResult {
  ok: boolean;
  message: string;
}

const CONNECTION_TIMEOUT = 5000; // 5 秒

/**
 * 提取数据库连接错误的可读消息
 * 处理 AggregateError（mysql2/pg）、标准 Error 等不同错误结构
 */
function extractErrorMessage(err: unknown, host: string, port: string): string {
  // 1. 标准 Error（有 message）
  if (err instanceof Error && err.message) {
    return err.message;
  }

  // 2. AggregateError（mysql2 的 ECONNREFUSED 等）
  const agg = err as { errors?: Array<{ code?: string; message?: string }> };
  if (agg.errors && Array.isArray(agg.errors) && agg.errors.length > 0) {
    const codes = agg.errors.map(e => e.code || 'UNKNOWN').join(', ');
    return `${codes} — 无法连接到 ${host}:${port}`;
  }

  // 3. 有 code 属性的对象
  const e = err as { code?: string };
  if (e.code) {
    return `${e.code} — 无法连接到 ${host}:${port}`;
  }

  // 4. 其他
  return String(err) || `无法连接到 ${host}:${port}`;
}

/** MySQL 连接测试 */
async function testMySQL(params: DbConnectionParams): Promise<DbTestResult> {
  let connection: mysql.Connection | null = null;
  try {
    connection = await mysql.createConnection({
      host: params.host,
      port: parseInt(params.port, 10) || 3306,
      database: params.database,
      user: params.user || 'root',
      password: params.password || '',
      connectTimeout: CONNECTION_TIMEOUT,
    });
    await connection.ping();
    return { ok: true, message: `MySQL 连接成功 — ${params.host}:${params.port}/${params.database}` };
  } catch (err: unknown) {
    // mysql2 可能抛出 AggregateError（无 .message），需特殊处理
    const msg = extractErrorMessage(err, params.host, params.port);
    return { ok: false, message: `MySQL 连接失败: ${msg}` };
  } finally {
    try { await connection.end(); } catch { /* 忽略关闭错误 */ }
  }
}

/** PostgreSQL 连接测试 */
async function testPostgreSQL(params: DbConnectionParams): Promise<DbTestResult> {
  const client = new pg.Client({
    host: params.host,
    port: parseInt(params.port, 10) || 5432,
    database: params.database,
    user: params.user || 'postgres',
    password: params.password || '',
    connectionTimeoutMillis: CONNECTION_TIMEOUT,
  });
  try {
    await client.connect();
    await client.query('SELECT 1');
    return { ok: true, message: `PostgreSQL 连接成功 — ${params.host}:${params.port}/${params.database}` };
  } catch (err: unknown) {
    const msg = extractErrorMessage(err, params.host, params.port);
    return { ok: false, message: `PostgreSQL 连接失败: ${msg}` };
  } finally {
    try { await client.end(); } catch { /* 忽略关闭错误 */ }
  }
}

/** MongoDB 连接测试 */
async function testMongoDB(params: DbConnectionParams): Promise<DbTestResult> {
  const port = parseInt(params.port, 10) || 27017;
  const auth = params.user ? `${encodeURIComponent(params.user)}:${encodeURIComponent(params.password)}@` : '';
  const uri = `mongodb://${auth}${params.host}:${port}/${params.database}`;

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: CONNECTION_TIMEOUT,
    connectTimeoutMS: CONNECTION_TIMEOUT,
  });
  try {
    await client.connect();
    await client.db().admin().ping();
    return { ok: true, message: `MongoDB 连接成功 — ${params.host}:${port}/${params.database}` };
  } catch (err: unknown) {
    const msg = extractErrorMessage(err, params.host, String(port));
    return { ok: false, message: `MongoDB 连接失败: ${msg}` };
  } finally {
    try { await client.close(); } catch { /* 忽略关闭错误 */ }
  }
}

/** SQLite 连接测试（使用 sql.js — 纯 WebAssembly，全平台兼容） */
async function testSQLite(params: DbConnectionParams): Promise<DbTestResult> {
  try {
    const dbPath = params.database || './formcraft.db';

    // 初始化 sql.js
    const SQL = await initSqlJs();

    // 如果文件已存在，读取它；否则创建空数据库
    let db: import('sql.js').Database;
    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }

    // 验证数据库可读写
    db.run('PRAGMA journal_mode = WAL');
    const result = db.exec('SELECT 1');
    if (!result || result.length === 0) {
      db.close();
      return { ok: false, message: 'SQLite 连接失败: 无法执行查询验证' };
    }

    // 保存到文件（如为新创建）
    const data = db.export();
    const dir = params.database ? params.database.substring(0, params.database.lastIndexOf('/')) : '.';
    if (dir && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbPath, Buffer.from(data));

    db.close();
    return { ok: true, message: `SQLite 连接成功 — ${dbPath}` };
  } catch (err: unknown) {
    const msg = err instanceof Error ? (err.message || '未知错误') : String(err);
    return { ok: false, message: `SQLite 连接失败: ${msg}` };
  }
}

/**
 * 测试数据库连接（统一入口）
 */
export async function testConnection(params: DbConnectionParams): Promise<DbTestResult> {
  // 基础参数校验
  if (!params.type) {
    return { ok: false, message: '请选择数据库类型' };
  }

  // SQLite 只需要 database 路径
  if (params.type === 'sqlite') {
    if (!params.database) {
      return { ok: false, message: '请填写 SQLite 数据库文件路径' };
    }
    return await testSQLite(params);
  }

  // 远程数据库需要 host 和 database
  if (!params.host) {
    return { ok: false, message: '请填写主机地址' };
  }
  if (!params.database) {
    return { ok: false, message: '请填写数据库名称' };
  }

  // 端口为空时使用默认端口
  if (!params.port) {
    const defaults: Record<string, string> = {
      mysql: '3306',
      postgresql: '5432',
      mongodb: '27017',
    };
    params.port = defaults[params.type] || '';
  }

  switch (params.type) {
    case 'mysql':
      return testMySQL(params);
    case 'postgresql':
      return testPostgreSQL(params);
    case 'mongodb':
      return testMongoDB(params);
    default:
      return { ok: false, message: `不支持的数据库类型: ${params.type}` };
  }
}
