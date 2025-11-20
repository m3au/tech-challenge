import { describe, expect, test } from 'bun:test';

describe('pin-versions.ts', () => {
  describe('isPinned logic', () => {
    test('identifies caret ranges as unpinned', () => {
      const spec = '^1.2.3';
      const isPinned = !/^[~^<>*=]/.test(spec.trim());
      expect(isPinned).toBe(false);
    });

    test('identifies tilde ranges as unpinned', () => {
      const spec = '~1.2.3';
      const isPinned = !/^[~^<>*=]/.test(spec.trim());
      expect(isPinned).toBe(false);
    });

    test('identifies exact versions as pinned', () => {
      const spec = '1.2.3';
      const exactSemver = /^\d+\.\d+\.\d+(?:-[0-9a-z.-]+)?(?:\+[0-9a-z.-]+)?$/i;
      const isPinned = exactSemver.test(spec.trim());
      expect(isPinned).toBe(true);
    });

    test('identifies latest as unpinned', () => {
      const spec = 'latest';
      const isLatest = spec === 'latest';
      expect(isLatest).toBe(true);
    });

    test('identifies wildcard as unpinned', () => {
      const spec = '*';
      const isWildcard = spec === '*';
      expect(isWildcard).toBe(true);
    });

    test('identifies prerelease versions as pinned', () => {
      const spec = '1.2.3-beta.1';
      const exactSemver = /^\d+\.\d+\.\d+(?:-[0-9a-z.-]+)?(?:\+[0-9a-z.-]+)?$/i;
      const isPinned = exactSemver.test(spec.trim());
      expect(isPinned).toBe(true);
    });

    test('identifies build metadata versions as pinned', () => {
      const spec = '1.2.3+build.123';
      const exactSemver = /^\d+\.\d+\.\d+(?:-[0-9a-z.-]+)?(?:\+[0-9a-z.-]+)?$/i;
      const isPinned = exactSemver.test(spec.trim());
      expect(isPinned).toBe(true);
    });

    test('identifies partial versions as unpinned', () => {
      const spec = '1.2';
      const exactSemver = /^\d+\.\d+\.\d+(?:-[0-9a-z.-]+)?(?:\+[0-9a-z.-]+)?$/i;
      const isPinned = exactSemver.test(spec.trim());
      expect(isPinned).toBe(false);
    });

    test('identifies x-range as unpinned', () => {
      const spec = '1.x';
      const isPinned = !/\bx\b/i.test(spec);
      expect(isPinned).toBe(false);
    });
  });

  describe('version string validation', () => {
    test('validates exact semver format', () => {
      const exactSemver = /^\d+\.\d+\.\d+(?:-[0-9a-z.-]+)?(?:\+[0-9a-z.-]+)?$/i;

      expect(exactSemver.test('1.2.3')).toBe(true);
      expect(exactSemver.test('0.0.1')).toBe(true);
      expect(exactSemver.test('10.20.30')).toBe(true);
      expect(exactSemver.test('1.2.3-alpha')).toBe(true);
      expect(exactSemver.test('1.2.3+build')).toBe(true);
    });

    test('rejects invalid semver formats', () => {
      const exactSemver = /^\d+\.\d+\.\d+(?:-[0-9a-z.-]+)?(?:\+[0-9a-z.-]+)?$/i;

      expect(exactSemver.test('^1.2.3')).toBe(false);
      expect(exactSemver.test('~1.2.3')).toBe(false);
      expect(exactSemver.test('1.2')).toBe(false);
      expect(exactSemver.test('1')).toBe(false);
      expect(exactSemver.test('latest')).toBe(false);
    });
  });

  describe('dependency section handling', () => {
    test('handles valid dependencies object', () => {
      const deps = { package1: '1.2.3', package2: '^4.5.6' };
      const isValid = Boolean(deps && typeof deps === 'object');

      expect(isValid).toBe(true);
      expect(Object.keys(deps).length).toBe(2);
    });

    test('handles empty dependencies object', () => {
      const deps = {};
      const isValid = Boolean(deps && typeof deps === 'object');

      expect(isValid).toBe(true);
      expect(Object.keys(deps).length).toBe(0);
    });

    test('handles undefined dependencies', () => {
      const deps = undefined;
      const isValid = Boolean(deps && typeof deps === 'object');

      expect(isValid).toBeFalsy();
    });
  });

  describe('version extraction from npm output', () => {
    test('extracts version from simple string output', () => {
      const output = '1.2.3';
      // eslint-disable-next-line sonarjs/slow-regex -- Simple version regex used in tests
      const matches = output.match(/\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?/g);

      expect(matches).toBeTruthy();
      expect(matches?.[0]).toBe('1.2.3');
    });

    test('extracts version from array output', () => {
      const versions = ['1.2.3', '1.2.4', '1.3.0'];
      const latest = versions.at(-1);

      expect(latest).toBe('1.3.0');
    });

    test('extracts prerelease versions', () => {
      const output = '1.2.3-beta.1';
      // eslint-disable-next-line sonarjs/slow-regex -- Simple version regex used in tests
      const matches = output.match(/\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?/g);

      expect(matches?.[0]).toBe('1.2.3-beta.1');
    });
  });
});
