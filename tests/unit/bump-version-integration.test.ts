import { readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';

import { updatePackageVersion } from '@scripts/bump-version.ts';

describe('bump-version.ts integration', () => {
  const testPackageJson = path.join(process.cwd(), 'package.json');
  let originalPackageJson: string;

  beforeEach(() => {
    originalPackageJson = readFileSync(testPackageJson, 'utf8');
  });

  afterEach(() => {
    writeFileSync(testPackageJson, originalPackageJson);
  });

  test('should bump major version for breaking change', () => {
    const packageData = JSON.parse(originalPackageJson);
    const originalVersion = packageData.version;
    const [major] = originalVersion.split('.').map(Number);

    const result = updatePackageVersion(testPackageJson, 'feat!: breaking change');

    expect(result.updated).toBe(true);
    expect(result.oldVersion).toBe(originalVersion);
    expect(result.newVersion).toBe(`${major + 1}.0.0`);
    expect(result.message).toContain('BREAKING CHANGE');

    const updatedPackage = JSON.parse(readFileSync(testPackageJson, 'utf8'));
    expect(updatedPackage.version).toBe(`${major + 1}.0.0`);
  });

  test('should bump minor version for feat', () => {
    const packageData = JSON.parse(originalPackageJson);
    const originalVersion = packageData.version;
    const [major, minor] = originalVersion.split('.').map(Number);

    const result = updatePackageVersion(testPackageJson, 'feat: new feature');

    expect(result.updated).toBe(true);
    expect(result.newVersion).toBe(`${major}.${minor + 1}.0`);
    expect(result.message).toContain('Feature');

    const updatedPackage = JSON.parse(readFileSync(testPackageJson, 'utf8'));
    expect(updatedPackage.version).toBe(`${major}.${minor + 1}.0`);
  });

  test('should bump patch version for fix', () => {
    const packageData = JSON.parse(originalPackageJson);
    const originalVersion = packageData.version;
    const [major, minor, patch] = originalVersion.split('.').map(Number);

    const result = updatePackageVersion(testPackageJson, 'fix: bug fix');

    expect(result.updated).toBe(true);
    expect(result.newVersion).toBe(`${major}.${minor}.${patch + 1}`);
    expect(result.message).toContain('Fix');

    const updatedPackage = JSON.parse(readFileSync(testPackageJson, 'utf8'));
    expect(updatedPackage.version).toBe(`${major}.${minor}.${patch + 1}`);
  });

  test('should bump patch version for perf', () => {
    const packageData = JSON.parse(originalPackageJson);
    const originalVersion = packageData.version;
    const [major, minor, patch] = originalVersion.split('.').map(Number);

    const result = updatePackageVersion(testPackageJson, 'perf: optimize code');

    expect(result.updated).toBe(true);
    expect(result.newVersion).toBe(`${major}.${minor}.${patch + 1}`);
    expect(result.message).toContain('Performance');
  });

  test('should bump patch version for refactor', () => {
    const packageData = JSON.parse(originalPackageJson);
    const originalVersion = packageData.version;
    const [major, minor, patch] = originalVersion.split('.').map(Number);

    const result = updatePackageVersion(testPackageJson, 'refactor: restructure');

    expect(result.updated).toBe(true);
    expect(result.newVersion).toBe(`${major}.${minor}.${patch + 1}`);
    expect(result.message).toContain('Refactor');
  });

  test('should not bump version for docs', () => {
    const packageData = JSON.parse(originalPackageJson);
    const originalVersion = packageData.version;

    const result = updatePackageVersion(testPackageJson, 'docs: update readme');

    expect(result.updated).toBe(false);
    expect(result.oldVersion).toBe(originalVersion);
    expect(result.message).toContain('does not trigger version bump');

    const updatedPackage = JSON.parse(readFileSync(testPackageJson, 'utf8'));
    expect(updatedPackage.version).toBe(originalVersion);
  });

  test('should return false for empty commit message', () => {
    const result = updatePackageVersion(testPackageJson, '');

    expect(result.updated).toBe(false);
    expect(result.message).toContain('No commit message provided');
  });

  test('should handle error when package.json does not exist', () => {
    expect(() => {
      updatePackageVersion('/nonexistent/package.json', 'feat: test');
    }).toThrow();
  });

  test('should handle error when package.json is invalid JSON', () => {
    const invalidPackageJson = path.join(process.cwd(), 'test-invalid-package.json');
    writeFileSync(invalidPackageJson, 'invalid json content');

    try {
      expect(() => {
        updatePackageVersion(invalidPackageJson, 'feat: test');
      }).toThrow();
    } finally {
      unlinkSync(invalidPackageJson);
    }
  });
});
