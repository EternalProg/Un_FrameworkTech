import { Readable } from 'node:stream';
import mongoose from 'mongoose';
import { ItemModel } from '../db/models/item.model.js';
import { buildItemWithDefaults } from '../src/models/item.model.js';
import { ensureDirectory } from '../src/utils/file.utils.js';
import { uploadsDirectoryPath } from '../src/utils/path.utils.js';

function normalizeItem(document) {
  if (!document) {
    return null;
  }

  return {
    id: document._id.toString(),
    device: document.device,
    status: document.status,
    room: document.room,
    description: document.description,
    image: document.image,
  };
}

function createDeviceRepository(db) {
  const itemModel = db.models.Item ?? ItemModel;

  async function findAll() {
    const items = await itemModel.find().sort({ _id: 1 }).lean();
    return items.map(normalizeItem);
  }

  async function findById(id) {
    if (!mongoose.isValidObjectId(id)) {
      return null;
    }

    const item = await itemModel.findById(id).lean();
    return normalizeItem(item);
  }

  async function create(data) {
    const item = buildItemWithDefaults(data);
    delete item.id;

    const createdItem = await itemModel.create(item);
    const normalized = normalizeItem(createdItem.toObject());
    return normalized;
  }

  async function update(id, data) {
    if (!mongoose.isValidObjectId(id)) {
      return null;
    }

    const updatedItem = await itemModel.findByIdAndUpdate(id, data, { new: true, lean: true });
    return normalizeItem(updatedItem);
  }

  async function remove(id) {
    if (!mongoose.isValidObjectId(id)) {
      return false;
    }

    const deletedItem = await itemModel.findByIdAndDelete(id);
    return Boolean(deletedItem);
  }

  async function removeAll() {
    await itemModel.deleteMany({});
  }

  function streamAll() {
    return Readable.from(
      (async function* readAllItems() {
        const cursor = itemModel.find().sort({ _id: 1 }).lean().cursor();

        for await (const item of cursor) {
          yield normalizeItem(item);
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
