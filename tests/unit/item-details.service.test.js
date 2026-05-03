import { beforeEach, describe, expect, it, vi } from 'vitest';

const findDeviceById = vi.fn();

vi.mock('#services/device.service', () => ({
  findDeviceById,
}));

describe('item-details.service', () => {
  let redis;
  let getItemDetails;
  let setItemDetailsDependencies;

  beforeEach(async () => {
    redis = {
      get: vi.fn(),
      set: vi.fn(),
    };

    const service = await import('#services/item-details.service');
    getItemDetails = service.getItemDetails;
    setItemDetailsDependencies = service.setItemDetailsDependencies;
    setItemDetailsDependencies({ redis });

    findDeviceById.mockReset();
    vi.unstubAllGlobals();
  });

  it('returns null when item does not exist', async () => {
    findDeviceById.mockResolvedValue(null);

    const result = await getItemDetails(1, 'http://external.test/deviceTypes');

    expect(result).toBeNull();
    expect(redis.get).not.toHaveBeenCalled();
  });

  it('uses cached external reference when present in redis', async () => {
    findDeviceById.mockResolvedValue({ id: 1, device: 'smart lamp', room: 'Kitchen' });
    redis.get.mockResolvedValue(JSON.stringify([{ id: 5, type: 'lamp', powerWatt: 9 }]));

    const result = await getItemDetails(1, 'http://external.test/deviceTypes');

    expect(result.external).toEqual({ id: 5, type: 'lamp', powerWatt: 9 });
    expect(redis.set).not.toHaveBeenCalled();
  });

  it('fetches and caches external data when cache is empty', async () => {
    findDeviceById.mockResolvedValue({ id: 2, device: 'plug', room: 'Hall' });
    redis.get.mockResolvedValue(null);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ id: 10, type: 'plug', powerWatt: 42 }],
      }),
    );

    const result = await getItemDetails(2, 'http://external.test/deviceTypes');

    expect(result.external).toEqual({ id: 10, type: 'plug', powerWatt: 42 });
    expect(redis.set).toHaveBeenCalledWith(
      'cache:external-reference',
      JSON.stringify([{ id: 10, type: 'plug', powerWatt: 42 }]),
      'EX',
      120,
    );
  });
});
