import path from 'node:path';
import dotenv from 'dotenv';

// Workspace scripts run with backend/ as cwd. Neon CLI initializes the repository-root
// .env, so load backend/.env first and root .env as a fallback; process secrets win.
const cwd = process.cwd();
dotenv.config({
  path: [path.resolve(cwd, '.env'), path.resolve(cwd, '../.env')],
  override: false,
});
