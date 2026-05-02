import { Readable } from 'node:stream';
import { buildItemWithDefaults } from '../src/models/item.model.js';
import { ensureDirectory } from '../src/utils/file.utils.js';
import { uploadsDirectoryPath } from '../src/utils/path.utils.js';

const STREAM_PAGE_SIZE = 100;
const UPDATABLE_FIELDS = ['device', 'status', 'room', 'description', 'image'];

function createDeviceRepository(db) {
  async function findAll() {
    const [rows] = await db.query(
      'SELECT id, device, status, room, description, image FROM items ORDER BY id ASC',
    );

    return rows;
  }

  async function findById(id) {
    const [rows] = await db.query(
      'SELECT id, device, status, room, description, image FROM items WHERE id = ? LIMIT 1',
      [id],
    );

    return rows[0] ?? null;
  }

  async function create(data) {
    const item = buildItemWithDefaults(data);

    const [result] = await db.query(
      'INSERT INTO items (device, status, room, description, image) VALUES (?, ?, ?, ?, ?)',
      [item.device, item.status, item.room, item.description, item.image],
    );

    return findById(result.insertId);
  }

  async function update(id, data) {
    const fields = UPDATABLE_FIELDS.filter((field) => field in data);

    if (!fields.length) {
      return findById(id);
    }

    const setClause = fields.map((field) => `${field} = ?`).join(', ');
    const values = fields.map((field) => data[field]);

    const [result] = await db.query(`UPDATE items SET ${setClause} WHERE id = ?`, [...values, id]);

    if (result.affectedRows === 0) {
      return null;
    }

    return findById(id);
  }

  async function remove(id) {
    const [result] = await db.query('DELETE FROM items WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  async function removeAll() {
    await db.query('DELETE FROM items');
  }

  function streamAll() {
    return Readable.from(
      (async function* readAllItems() {
        let offset = 0;

        while (true) {
          const [rows] = await db.query(
            'SELECT id, device, status, room, description, image FROM items ORDER BY id ASC LIMIT ? OFFSET ?',
            [STREAM_PAGE_SIZE, offset],
          );

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
