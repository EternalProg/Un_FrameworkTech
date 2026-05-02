import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const MIGRATION_NAME = 'items_schema';
const schemaFilePath = path.join(process.cwd(), 'db', 'schema.sql');

async function getCurrentSchemaHash() {
  const schemaSql = await readFile(schemaFilePath, 'utf-8');
  return createHash('md5').update(schemaSql).digest('hex');
}

async function getStoredSchemaHash(db) {
  const [rows] = await db.query('SELECT schema_hash FROM migrations WHERE name = ? LIMIT 1', [
    MIGRATION_NAME,
  ]);

  return rows[0]?.schema_hash ?? null;
}

async function updateStoredSchemaHash(db, schemaHash) {
  await db.query(
    `
      INSERT INTO migrations (name, schema_hash)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE schema_hash = VALUES(schema_hash)
    `,
    [MIGRATION_NAME, schemaHash],
  );
}

export { getCurrentSchemaHash, getStoredSchemaHash, updateStoredSchemaHash };
