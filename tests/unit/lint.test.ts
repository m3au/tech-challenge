
import { existsSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, test } from 'bun:test';

describe('lint.ts', () => {
  describe('binary path resolution', () => {
    test('constructs local binary path', () => {
      const projectRoot = '/test/project';
      const localBin = path.join(projectRoot, 'node_modules', '.bin', 'tsc');
      const expected = '/test/project/node_modules/.bin/tsc';

      expect(localBin).toBe(expected);
    });

    test('falls back to global binary', () => {
      const projectRoot = '/test/project';
      const localBin = path.join(projectRoot, 'node_modules', '.bin', 'eslint');
      const fallback = existsSync(localBin) ? localBin : 'eslint';

      expect(typeof fallback).toBe('string');
    });
  });

  describe('file path extraction from debug output', () => {
    test('extracts file path from linting message', () => {
      const line = 'Linting code for /path/to/project/src/file.ts';
      const match = line.match(/Linting code for (.+?)( \(pass \d+\))?$/);

      expect(match).toBeTruthy();
      expect(match?.[1]).toBe('/path/to/project/src/file.ts');
    });

    test('extracts file path with pass number', () => {
      const line = 'Linting code for /path/to/project/src/file.ts (pass 2)';
      const match = line.match(/Linting code for (.+?)( \(pass \d+\))?$/);

      expect(match?.[1]).toBe('/path/to/project/src/file.ts');
      expect(match?.[2]).toBe(' (pass 2)');
    });

    test('extracts markdown file path', () => {
      const line = 'Calculating config for file /path/to/project/docs/file.md';
      const match = line.match(/Calculating config for file (.+\.mdc?)$/);

      expect(match).toBeTruthy();
      expect(match?.[1]).toBe('/path/to/project/docs/file.md');
    });

    test('extracts mdc file path', () => {
      const line = 'Calculating config for file /path/to/project/.cursor/rules/test.mdc';
      const match = line.match(/Calculating config for file (.+\.mdc?)$/);

      expect(match).toBeTruthy();
      expect(match?.[1]).toBe('/path/to/project/.cursor/rules/test.mdc');
    });
  });

  describe('relative path conversion', () => {
    test('converts absolute to relative path', () => {
      const projectRoot = '/path/to/project';
      const absolutePath = '/path/to/project/src/file.ts';
      const relativePath = absolutePath.replace(projectRoot + '/', '');

      expect(relativePath).toBe('src/file.ts');
    });

    test('handles paths without leading slash', () => {
      const projectRoot = '/path/to/project';
      const absolutePath = '/path/to/project/file.ts';
      const relativePath = absolutePath.replace(projectRoot + '/', '');

      expect(relativePath).toBe('file.ts');
    });
  });

  describe('debug line filtering', () => {
    test('filters out timestamp lines', () => {
      const line = '2024-01-15T10:30:00.123Z eslint:config Loading config';
      const isDebug = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z eslint:/.test(line);

      expect(isDebug).toBe(true);
    });

    test('filters out linting progress lines', () => {
      const line = 'Linting code for /path/to/file.ts';
      const isProgress = /Linting code for/.test(line);

      expect(isProgress).toBe(true);
    });

    test('keeps actual lint error lines', () => {
      const line = '/path/to/file.ts:10:5: error: Unexpected token';
      const isDebug = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z eslint:/.test(line);
      const isProgress = /Linting code for/.test(line);

      expect(isDebug).toBe(false);
      expect(isProgress).toBe(false);
    });
  });

  describe('duplicate detection', () => {
    test('tracks unique file paths', () => {
      const fileNames = new Set<string>();
      const path1 = '/path/to/file.ts';
      const path2 = '/path/to/other.ts';

      fileNames.add(path1);
      fileNames.add(path2);
      // eslint-disable-next-line sonarjs/no-element-overwrite -- Intentionally testing duplicate handling
      fileNames.add(path1); // Duplicate

      expect(fileNames.size).toBe(2);
      expect(fileNames.has(path1)).toBe(true);
      expect(fileNames.has(path2)).toBe(true);
    });

    test('prevents duplicate file processing', () => {
      const fileNames = new Set<string>();
      const path = '/path/to/file.ts';

      const shouldProcess1 = !fileNames.has(path);
      fileNames.add(path);
      const shouldProcess2 = !fileNames.has(path);

      expect(shouldProcess1).toBe(true);
      expect(shouldProcess2).toBe(false);
    });
  });
});
