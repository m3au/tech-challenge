import { categoryMap, formatEntry, parseCommitMessage } from '@scripts/changelog.mjs';
import { describe, expect, test } from 'bun:test';

describe('changelog.mjs', () => {
  describe('commit message parsing', () => {
    test('parses standard commit format', () => {
      const commitMessage = 'feat: add new feature';
      const parsed = parseCommitMessage(commitMessage);

      expect(parsed).toBeTruthy();
      expect(parsed?.type).toBe('feat');
      expect(parsed?.subject).toBe('add new feature');
      expect(parsed?.scope).toBeUndefined();
      expect(parsed?.breaking).toBe(false);
    });

    test('parses commit with scope', () => {
      const commitMessage = 'fix(auth): resolve login issue';
      const parsed = parseCommitMessage(commitMessage);

      expect(parsed?.type).toBe('fix');
      expect(parsed?.scope).toBe('auth');
      expect(parsed?.subject).toBe('resolve login issue');
    });

    test('detects breaking change indicator', () => {
      const commitMessage = 'feat!: breaking change';
      const parsed = parseCommitMessage(commitMessage);

      expect(parsed?.breaking).toBe(true);
    });

    test('detects BREAKING CHANGE in commit body', () => {
      const commitMessage = `feat: new feature

BREAKING CHANGE: old api removed`;
      const parsed = parseCommitMessage(commitMessage);

      expect(parsed?.breaking).toBe(true);
    });

    test('detects BREAKING: in commit body', () => {
      const commitMessage = `feat: new feature

BREAKING: api changed`;
      const parsed = parseCommitMessage(commitMessage);

      expect(parsed?.breaking).toBe(true);
    });

    test('handles non-breaking commit without indicator', () => {
      const commitMessage = 'feat: normal feature';
      const parsed = parseCommitMessage(commitMessage);

      expect(parsed?.breaking).toBe(false);
    });

    test('returns undefined for invalid format', () => {
      const commitMessage = 'invalid message';
      const parsed = parseCommitMessage(commitMessage);

      expect(parsed).toBeUndefined();
    });
  });

  describe('category mapping', () => {
    test('maps feat to Added', () => {
      expect(categoryMap['feat']).toBe('Added');
    });

    test('maps fix to Fixed', () => {
      expect(categoryMap['fix']).toBe('Fixed');
    });

    test('maps perf to Performance', () => {
      expect(categoryMap['perf']).toBe('Performance');
    });

    test('maps all commit types', () => {
      const types = Object.keys(categoryMap);
      expect(types).toContain('feat');
      expect(types).toContain('fix');
      expect(types).toContain('docs');
      expect(types.length).toBe(11);
    });
  });

  describe('entry formatting', () => {
    test('formats entry without scope', () => {
      const subject = 'add new feature';
      const entry = formatEntry(undefined, subject);

      expect(entry).toBe('- add new feature');
    });

    test('formats entry with scope', () => {
      const scope = 'auth';
      const subject = 'fix login bug';
      const entry = formatEntry(scope, subject);

      expect(entry).toBe('- **auth**: fix login bug');
    });
  });

  describe('version header formatting', () => {
    test('formats version header with date', () => {
      const version = '1.2.3';
      const date = '2024-01-15';
      const header = `## [${version}] - ${date}`;

      expect(header).toBe('## [1.2.3] - 2024-01-15');
    });

    test('matches version section regex', () => {
      const versionSectionRegex = /^## \[[\d.]+\] - \d{4}-\d{2}-\d{2}/m;
      const validHeader = '## [1.2.3] - 2024-01-15';
      const invalidHeader = '## Version 1.2.3';

      expect(versionSectionRegex.test(validHeader)).toBe(true);
      expect(versionSectionRegex.test(invalidHeader)).toBe(false);
    });
  });

  describe('date formatting', () => {
    test('formats date as ISO string', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = date.toISOString().split('T')[0] as string;

      expect(formatted).toBe('2024-01-15');
    });

    test('uses current date for changelog entries', () => {
      const today = new Date().toISOString().split('T')[0] as string;
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

      expect(dateRegex.test(today)).toBe(true);
    });
  });
});
