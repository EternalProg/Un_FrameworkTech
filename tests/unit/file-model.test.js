import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildItemWithDefaults } from '#src-models/item.model';
import { ensureDirectory, readJsonFile, writeJsonFileAtomic } from '#src-utils/file.utils';

describe('file utils and item model', () => {
  let temporaryDirectory;

  beforeEach(async () => {
    temporaryDirectory = await mkdir(path.join(tmpdir(), `lab10-file-tests-${Date.now()}`), {
      recursive: true,
    });
  });

  it('builds item with defaults and payload overrides', () => {
    const item = buildItemWithDefaults({ device: 'Lamp', room: 'Kitchen' });

    expect(item).toEqual({
      id: null,
      device: 'Lamp',
      status: 'off',
      room: 'Kitchen',
      description: '',
      image: null,
    });
  });

  it('creates directory, writes json atomically, and reads json back', async () => {
    const nestedDirectory = path.join(temporaryDirectory, 'nested');
    const targetPath = path.join(nestedDirectory, 'data.json');
    const tempPath = path.join(nestedDirectory, 'data.tmp.json');

    await ensureDirectory(nestedDirectory);
    await writeJsonFileAtomic(targetPath, tempPath, { value: 123 });

    const rawContent = await readFile(targetPath, 'utf-8');
    expect(rawContent).toContain('"value": 123');

    const parsed = await readJsonFile(targetPath);
    expect(parsed).toEqual({ value: 123 });
  });

  it('cleans up temp file when atomic write fails', async () => {
    const missingDirectory = path.join(temporaryDirectory, 'missing');
    const targetPath = path.join(missingDirectory, 'data.json');
    const tempPath = path.join(missingDirectory, 'data.tmp.json');

    await expect(writeJsonFileAtomic(targetPath, tempPath, { value: 1 })).rejects.toBeDefined();
    await expect(readJsonFile(tempPath)).rejects.toBeDefined();
  });

  it('reads existing json file content', async () => {
    const filePath = path.join(temporaryDirectory, 'existing.json');
    await writeFile(filePath, JSON.stringify({ ok: true }), 'utf-8');

    const result = await readJsonFile(filePath);
    expect(result).toEqual({ ok: true });
  });
});
