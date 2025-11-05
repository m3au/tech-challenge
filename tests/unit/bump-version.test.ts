import { calculateNewVersion, isBreakingChange, parseCommitType } from '@scripts/bump-version.mjs';
import { describe, expect, test } from 'bun:test';

describe('bump-version.mjs', () => {
  const testVersion = '1.2.3';

  describe('version bumping logic', () => {
    test('bumps major version for BREAKING CHANGE', () => {
      const newVersion = calculateNewVersion(testVersion, 'feat!: breaking change');
      expect(newVersion).toBe('2.0.0');
    });

    test('bumps minor version for feat', () => {
      const newVersion = calculateNewVersion(testVersion, 'feat: add feature');
      expect(newVersion).toBe('1.3.0');
    });

    test('bumps patch version for fix', () => {
      const newVersion = calculateNewVersion(testVersion, 'fix: bug fix');
      expect(newVersion).toBe('1.2.4');
    });

    test('bumps patch version for perf', () => {
      const newVersion = calculateNewVersion(testVersion, 'perf: improve performance');
      expect(newVersion).toBe('1.2.4');
    });

    test('bumps patch version for refactor', () => {
      const newVersion = calculateNewVersion(testVersion, 'refactor: restructure code');
      expect(newVersion).toBe('1.2.4');
    });

    test('does not bump version for docs', () => {
      const commitMessage = 'docs: update readme';
      const newVersion = calculateNewVersion(testVersion, commitMessage);

      expect(newVersion).toBeUndefined();
    });
  });

  describe('commit message parsing', () => {
    test('extracts commit type from standard format', () => {
      const commitMessage = 'feat: add feature';
      const commitType = parseCommitType(commitMessage);

      expect(commitType).toBe('feat');
    });

    test('extracts commit type with scope', () => {
      const commitMessage = 'feat(auth): add login';
      const commitType = parseCommitType(commitMessage);

      expect(commitType).toBe('feat');
    });

    test('detects breaking change with !', () => {
      const commitMessage = 'feat!: breaking change';
      const isBreaking_ = isBreakingChange(commitMessage);

      expect(isBreaking_).toBe(true);
    });

    test('detects breaking change in body', () => {
      const commitMessage = 'feat: add feature\n\nBREAKING CHANGE: removed old API';
      const isBreaking_ = isBreakingChange(commitMessage);

      expect(isBreaking_).toBe(true);
    });

    test('returns undefined for invalid format', () => {
      const commitMessage = 'invalid commit message';
      const commitType = parseCommitType(commitMessage);

      expect(commitType).toBeUndefined();
    });
  });

  describe('version string manipulation', () => {
    test('correctly parses version numbers', () => {
      const version = '1.2.3';
      const [major, minor, patch] = version.split('.').map(Number);

      expect(major).toBe(1);
      expect(minor).toBe(2);
      expect(patch).toBe(3);
    });

    test('handles single-digit versions', () => {
      const version = '0.0.1';
      const [major, minor, patch] = version.split('.').map(Number);

      expect(major).toBe(0);
      expect(minor).toBe(0);
      expect(patch).toBe(1);
    });

    test('handles multi-digit versions', () => {
      const version = '12.345.6789';
      const [major, minor, patch] = version.split('.').map(Number);

      expect(major).toBe(12);
      expect(minor).toBe(345);
      expect(patch).toBe(6789);
    });
  });
});
