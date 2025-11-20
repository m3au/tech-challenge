#!/usr/bin/env bun

/**
 * Package.json version bumper based on Conventional Commits
 * Automatically bumps package.json version on commit:
 * - feat: minor (0.1.0 -> 0.2.0)
 * - fix: patch (0.1.0 -> 0.1.1)
 * - perf: patch (0.1.0 -> 0.1.1) - performance improvements
 * - refactor: patch (0.1.0 -> 0.1.1) - code refactoring
 * - BREAKING CHANGE or feat!: major (0.1.0 -> 1.0.0)
 * - Other types: no bump
 */

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

interface CommitTypeMetadata {
  emoji: string;
  name: string;
}

/**
 * Parse commit type from conventional commit message
 */
export function parseCommitType(commitMessage: string): string | undefined {
  return commitMessage.match(
    /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?(!)?:/,
  )?.[1];
}

/**
 * Check if commit message indicates a breaking change
 */
export function isBreakingChange(commitMessage: string): boolean {
  return (
    commitMessage.includes('BREAKING CHANGE') ||
    commitMessage.includes('BREAKING:') ||
    /^(?:feat|fix|perf|refactor)(?:\(.+\))?!:/.test(commitMessage)
  );
}

/**
 * Calculate new version based on commit message
 */
export function calculateNewVersion(
  currentVersion: string,
  commitMessage: string,
): string | undefined {
  const parts = currentVersion.split('.').map(Number);
  if (parts.length !== 3 || parts.some((p) => Number.isNaN(p))) {
    return;
  }
  const [major, minor, patch] = parts;
  if (major === undefined || minor === undefined || patch === undefined) {
    return;
  }
  const commitType = parseCommitType(commitMessage);
  const isBreaking = isBreakingChange(commitMessage);

  if (isBreaking && commitType) {
    return `${major + 1}.0.0`;
  }
  if (commitType === 'feat') {
    return `${major}.${minor + 1}.0`;
  }
  if (commitType === 'fix' || commitType === 'perf' || commitType === 'refactor') {
    return `${major}.${minor}.${patch + 1}`;
  }
}

interface UpdateResult {
  updated: boolean;
  oldVersion: string;
  newVersion?: string;
  message?: string;
}

/**
 * Update package.json version based on commit message
 */
export function updatePackageVersion(packageJsonPath: string, commitMessage: string): UpdateResult {
  if (!commitMessage.trim()) {
    return { updated: false, oldVersion: '', message: 'No commit message provided' };
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { version: string };
  const currentVersion = packageJson.version;
  const newVersion = calculateNewVersion(currentVersion, commitMessage);

  if (!newVersion) {
    const commitType = parseCommitType(commitMessage);
    return {
      updated: false,
      oldVersion: currentVersion,
      message: `Commit type "${commitType}" does not trigger version bump`,
    };
  }

  const commitType = parseCommitType(commitMessage);
  const isBreaking = isBreakingChange(commitMessage);
  const commitTypeMetadata: Record<string, CommitTypeMetadata> = {
    feat: { emoji: '✨', name: 'Feature' }, // Introduce new features
    fix: { emoji: '🐛', name: 'Fix' }, // Fix a bug
    docs: { emoji: '📝', name: 'Documentation' }, // Add or update documentation
    style: { emoji: '🎨', name: 'Style' }, // Improve structure / format of the code
    refactor: { emoji: '♻️', name: 'Refactor' }, // Refactor code
    test: { emoji: '✅', name: 'Tests' }, // Add, update, or pass tests
    chore: { emoji: '🔨', name: 'Chore' }, // Add or update development scripts
    perf: { emoji: '⚡', name: 'Performance' }, // Improve performance
    ci: { emoji: '👷', name: 'CI/CD' }, // Add or update CI build system
    build: { emoji: '📦', name: 'Build' }, // Add or update compiled files or packages
    revert: { emoji: '⏪', name: 'Revert' }, // Revert changes
  };

  let logMessage = '';
  if (isBreaking && commitType) {
    logMessage = `🚀 BREAKING CHANGE detected: ${currentVersion} -> ${newVersion}`;
  } else if (commitType && commitTypeMetadata[commitType]) {
    const metadata = commitTypeMetadata[commitType];
    logMessage = `${metadata.emoji} ${metadata.name} detected: ${currentVersion} -> ${newVersion}`;
  }

  packageJson.version = newVersion;
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, undefined, 2) + '\n');

  return { updated: true, oldVersion: currentVersion, newVersion, message: logMessage };
}

function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const packageJsonPath = path.join(__dirname, '..', 'package.json');

  try {
    const commitMessage = process.argv[2] || '';
    const result = updatePackageVersion(packageJsonPath, commitMessage);

    if (!result.updated) {
      console.log(`⚠️  ${result.message}`);
      process.exit(0);
    }

    console.log(result.message);
    console.error(result.message);
    process.stdout.write(result.newVersion ?? '');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('⚠️  Error bumping version:', message);
    process.exit(0);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
