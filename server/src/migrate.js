import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const direction = process.argv[2] ?? 'up';

function section(sql, name) {
  const marker = `-- migrate:${name}`;
  const start = sql.indexOf(marker);
  if (start === -1) return '';
  const next = sql.indexOf('-- migrate:', start + marker.length);
  return sql.slice(start + marker.length, next === -1 ? undefined : next).trim();
}

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

async function run() {
  await ensureTable();
  const migrationsDir = path.resolve(__dirname, '..', 'migrations');
  const files = (await fs.readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort();

  if (direction === 'down') {
    const { rows } = await pool.query('SELECT filename FROM schema_migrations ORDER BY filename DESC LIMIT 1');
    if (!rows.length) return;
    const filename = rows[0].filename;
    const sql = await fs.readFile(path.join(migrationsDir, filename), 'utf8');
    await pool.query(section(sql, 'down'));
    await pool.query('DELETE FROM schema_migrations WHERE filename = $1', [filename]);
    return;
  }

  for (const filename of files) {
    const { rowCount } = await pool.query('SELECT 1 FROM schema_migrations WHERE filename = $1', [filename]);
    if (rowCount) continue;
    const sql = await fs.readFile(path.join(migrationsDir, filename), 'utf8');
    await pool.query(section(sql, 'up'));
    await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
  }
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
