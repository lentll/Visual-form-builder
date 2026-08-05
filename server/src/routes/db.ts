import { Router, type Request, type Response } from 'express';
import { testConnection, type DbType } from '../services/db-connectors.js';

const router = Router();

interface TestDbBody {
  type: DbType;
  host?: string;
  port?: string;
  database?: string;
  user?: string;
  password?: string;
}

router.post('/db/test', async (req: Request, res: Response) => {
  const { type, host, port, database, user, password } = req.body as TestDbBody;

  if (!type) {
    res.status(400).json({ ok: false, message: '缺少必填参数: type' });
    return;
  }

  const validTypes: DbType[] = ['mysql', 'postgresql', 'mongodb', 'sqlite'];
  if (!validTypes.includes(type)) {
    res.status(400).json({ ok: false, message: `不支持的数据库类型: ${type}，支持: ${validTypes.join(', ')}` });
    return;
  }

  try {
    const result = await testConnection({
      type,
      host: host || 'localhost',
      port: port || '',
      database: database || '',
      user: user || '',
      password: password || '',
    });
    res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ ok: false, message: `服务器内部错误: ${msg}` });
  }
});

export default router;
