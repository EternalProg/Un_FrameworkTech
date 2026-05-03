import { mkdtemp, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { Readable } from 'node:stream';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildJwtBlacklistKey,
  buildJwtRefreshKey,
  buildV2ItemsCacheKey,
} from '#constants/redis-keys';
import { writeJsonFileAtomic } from '#src-utils/file.utils';
import { toPublicImageUrl, withPublicImageUrl } from '#src-utils/image-url.utils';
import { getUploadDirectoryPath } from '#src-utils/path.utils';
import { NdjsonTransform } from '../../src/transforms/ndjson.transform.js';
import { SmartHomeActiveTransform } from '../../src/transforms/smart-home-active.transform.js';

describe('utils and transforms', () => {
  let temporaryDirectory;

  beforeEach(async () => {
    temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'lab10-tests-'));
  });

  it('builds redis cache keys from query and auth identifiers', () => {
    expect(buildV2ItemsCacheKey({ page: 2, limit: 20, room: 'Kitchen' })).toBe(
      'cache:v2:items:page=2:limit=20:room=Kitchen',
    );
    expect(buildJwtBlacklistKey('jti-123')).toBe('auth:jwt:blacklist:jti-123');
    expect(buildJwtRefreshKey(15)).toBe('auth:jwt:refresh:15');
  });

  it('writes json atomically with trailing newline', async () => {
    const targetPath = path.join(temporaryDirectory, 'target.json');
    const tempPath = path.join(temporaryDirectory, 'temp.json');

    await writeJsonFileAtomic(targetPath, tempPath, { ok: true });

    const content = await readFile(targetPath, 'utf-8');
    expect(content).toBe(`{
  "ok": true
}\n`);
    await rm(temporaryDirectory, { recursive: true, force: true });
  });

  it('maps local image paths to public urls', () => {
    const request = { protocol: 'http', host: 'localhost:3000' };

    expect(toPublicImageUrl(null, request)).toBeNull();
    expect(toPublicImageUrl('https://cdn.example.com/img.png', request)).toBe(
      'https://cdn.example.com/img.png',
    );
    expect(toPublicImageUrl('/1/image.png', request)).toBe(
      'http://localhost:3000/uploads/1/image.png',
    );
    expect(withPublicImageUrl({ id: 1, image: '/1/image.png' }, request)).toEqual({
      id: 1,
      image: 'http://localhost:3000/uploads/1/image.png',
    });
  });

  it('returns upload path with item id', () => {
    const uploadPath = getUploadDirectoryPath(123);
    expect(uploadPath.endsWith(path.join('uploads', '123'))).toBe(true);
  });

  it('converts objects to ndjson', async () => {
    const chunks = [];

    for await (const chunk of Readable.from([{ id: 1 }, { id: 2 }]).pipe(new NdjsonTransform())) {
      chunks.push(chunk.toString());
    }

    expect(chunks.join('')).toBe('{"id":1}\n{"id":2}\n');
  });

  it('adds isActive flag based on status', async () => {
    const output = [];

    for await (const item of Readable.from([
      { id: 1, status: 'on' },
      { id: 2, status: 'off' },
    ]).pipe(new SmartHomeActiveTransform())) {
      output.push(item);
    }

    expect(output).toEqual([
      { id: 1, status: 'on', isActive: true },
      { id: 2, status: 'off', isActive: false },
    ]);
  });
});
