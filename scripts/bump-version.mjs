#!/usr/bin/env node

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

import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Parse commit type from conventional commit message
 * @param {string} commitMessage - The commit message to parse
 * @returns {string | undefined} The commit type or undefined if invalid
 */
export function parseCommitType(commitMessage) {
  return commitMessage.match(
    /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?(!)?:/,
  )?.[1];
}

/**
 * Check if commit message indicates a breaking change
 * @param {string} commitMessage - The commit message to check
 * @returns {boolean} True if breaking change detected
 */
export function isBreakingChange(commitMessage) {
  return (
    commitMessage.includes('BREAKING CHANGE') ||
    commitMessage.includes('BREAKING:') ||
    /^(feat|fix|perf|refactor)(\(.+\))?!:/.test(commitMessage)
  );
}

/**
 * Calculate new version based on commit message
 * @param {string} currentVersion - Current semver version (e.g., "1.2.3")
 * @param {string} commitMessage - Conventional commit message
 * @returns {string | undefined} New version or undefined if no bump needed
 */
export function calculateNewVersion(currentVersion, commitMessage) {
  const [major, minor, patch] = currentVersion.split('.').map(Number);
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

/**
 * Update package.json version based on commit message
 * @param {string} packageJsonPath - Path to package.json
 * @param {string} commitMessage - Conventional commit message
 * @returns {{ updated: boolean, oldVersion: string, newVersion?: string, message?: string }} Result object
 */
export function updatePackageVersion(packageJsonPath, commitMessage) {
  if (!commitMessage.trim()) {
    return { updated: false, oldVersion: '', message: 'No commit message provided' };
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
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
  const commitTypeMetadata = {
    feat: { emoji: '✨', name: 'Feature' },
    fix: { emoji: '🐛', name: 'Fix' },
    perf: { emoji: '⚡', name: 'Performance' },
    refactor: { emoji: '🔧', name: 'Refactor' },
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
    process.stdout.write(result.newVersion);
  } catch (error) {
    console.error('⚠️  Error bumping version:', error.message);
    process.exit(0);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
