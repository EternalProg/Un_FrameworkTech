import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addDevice,
  importItemsFromBuffer,
  listDevices,
  listDevicesPaginated,
  removeDevice,
  setDeviceRepository,
  setDeviceServiceDependencies,
  updateDevice,
} from '#services/device.service';

describe('device.service', () => {
  let repository;
  let redis;

  beforeEach(() => {
    repository = {
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    };

    redis = {
      get: vi.fn(),
      set: vi.fn(),
      scan: vi.fn(),
      del: vi.fn(),
    };

    setDeviceRepository(repository);
    setDeviceServiceDependencies({ redis });
  });

  it('filters devices by room case-insensitively', async () => {
    repository.findAll.mockResolvedValue([
      { id: 1, room: 'Kitchen' },
      { id: 2, room: 'Bedroom' },
    ]);

    const result = await listDevices({ room: 'kitchen' });

    expect(result).toEqual([{ id: 1, room: 'Kitchen' }]);
  });

  it('caches paginated v2 result in redis and reuses cache', async () => {
    const query = { page: 1, limit: 2 };
    repository.findAll.mockResolvedValue([
      { id: 1, room: 'Kitchen' },
      { id: 2, room: 'Bedroom' },
      { id: 3, room: 'Hall' },
    ]);
    redis.get
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(
        JSON.stringify({ items: [{ id: 1 }], total: 3, page: 1, limit: 2, totalPages: 2 }),
      );

    const first = await listDevicesPaginated(query);
    const second = await listDevicesPaginated(query);

    expect(first.total).toBe(3);
    expect(first.items).toHaveLength(2);
    expect(redis.set).toHaveBeenCalledOnce();
    expect(repository.findAll).toHaveBeenCalledOnce();
    expect(second).toEqual({ items: [{ id: 1 }], total: 3, page: 1, limit: 2, totalPages: 2 });
  });

  it('invalidates v2 cache after create/update/delete mutations', async () => {
    repository.create.mockResolvedValue({ id: 9, device: 'new' });
    repository.update.mockResolvedValue({ id: 9, device: 'updated' });
    repository.remove.mockResolvedValue(true);
    redis.scan.mockResolvedValue(['0', ['cache:v2:items:page=1:limit=10:room=']]);

    await addDevice({ device: 'new', room: 'Lab' });
    await updateDevice(9, { device: 'updated' });
    await removeDevice(9);

    expect(redis.del).toHaveBeenCalledTimes(3);
  });

  it('imports valid records and reports rejected rows', async () => {
    repository.create.mockResolvedValue({ id: 1 });
    redis.scan.mockResolvedValue(['0', []]);

    const report = await importItemsFromBuffer(
      'items.json',
      JSON.stringify([{ device: 'Lamp', room: 'Kitchen', status: 'on' }, { room: 'Kitchen' }]),
    );

    expect(report.importedCount).toBe(1);
    expect(report.rejectedCount).toBe(1);
    expect(repository.create).toHaveBeenCalledTimes(1);
  });
});
