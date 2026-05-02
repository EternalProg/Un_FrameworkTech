import { Readable } from 'node:stream';
import { asc, eq } from 'drizzle-orm';
import { itemsTable } from '../db/schema.js';
import { buildItemWithDefaults } from '../src/models/item.model.js';
import { ensureDirectory } from '../src/utils/file.utils.js';
import { uploadsDirectoryPath } from '../src/utils/path.utils.js';

const STREAM_PAGE_SIZE = 100;
const UPDATABLE_FIELDS = ['device', 'status', 'room', 'description', 'image'];

function createDeviceRepository(db) {
  async function findAll() {
    return db.select().from(itemsTable).orderBy(asc(itemsTable.id));
  }

  async function findById(id) {
    const rows = await db.select().from(itemsTable).where(eq(itemsTable.id, id)).limit(1);
    return rows[0] ?? null;
  }

  async function create(data) {
    const item = buildItemWithDefaults(data);

    const result = await db.insert(itemsTable).values({
      device: item.device,
      status: item.status,
      room: item.room,
      description: item.description,
      image: item.image,
    });

    return findById(result[0].insertId);
  }

  async function update(id, data) {
    const fields = UPDATABLE_FIELDS.filter((field) => field in data);

    if (!fields.length) {
      return findById(id);
    }

    const values = Object.fromEntries(fields.map((field) => [field, data[field]]));

    const result = await db.update(itemsTable).set(values).where(eq(itemsTable.id, id));

    if (result.affectedRows === 0) {
      return null;
    }

    return findById(id);
  }

  async function remove(id) {
    const result = await db.delete(itemsTable).where(eq(itemsTable.id, id));
    return result.affectedRows > 0;
  }

  async function removeAll() {
    await db.delete(itemsTable);
  }

  function streamAll() {
    return Readable.from(
      (async function* readAllItems() {
        let offset = 0;

        while (true) {
          const rows = await db
            .select()
            .from(itemsTable)
            .orderBy(asc(itemsTable.id))
            .limit(STREAM_PAGE_SIZE)
            .offset(offset);

          if (!rows.length) {
            break;
          }

          for (const row of rows) {
            yield row;
          }

          offset += rows.length;
        }
      })(),
      { objectMode: true },
    );
  }

  async function getUploadsRootPath() {
    await ensureDirectory(uploadsDirectoryPath);
    return uploadsDirectoryPath;
  }

  return {
    findAll,
    findById,
    create,
    update,
    remove,
    removeAll,
    streamAll,
    getUploadsRootPath,
  };
}

export { createDeviceRepository };
