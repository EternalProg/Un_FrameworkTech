import { eq } from 'drizzle-orm';
import { usersTable } from '../db/schema.js';

function createUserRepository(db) {
  async function findByEmail(email) {
    const rows = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    return rows[0] ?? null;
  }

  async function findById(id) {
    const rows = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    return rows[0] ?? null;
  }

  async function create(data) {
    const result = await db.insert(usersTable).values(data);
    const insertId = result[0].insertId;

    return findById(insertId);
  }

  return {
    findByEmail,
    findById,
    create,
  };
}

export { createUserRepository };
