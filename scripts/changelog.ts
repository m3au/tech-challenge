#!/usr/bin/env bun

/**
 * Automatic changelog generator based on Conventional Commits
 * Updates CHANGELOG.md with new entries based on commit messages
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

interface CommitInfo {
  type: string;
  scope?: string;
  breaking: boolean;
  subject: string;
}

export const categoryMap: Record<string, string> = {
  feat: 'Added',
  fix: 'Fixed',
  docs: 'Documentation',
  style: 'Style',
  refactor: 'Refactored',
  test: 'Tests',
  chore: 'Chore',
  perf: 'Performance',
  ci: 'CI/CD',
  build: 'Build',
  revert: 'Reverted',
};

/**
 * Parse conventional commit message
 */
export function parseCommitMessage(commitMessage: string): CommitInfo | undefined {
  const commitMatch = commitMessage.match(
    /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\((.+?)\))?(!)?:\s*(.+)/,
  );

  if (!commitMatch) {
    return;
  }

  const [, type, , scope, breaking, subject] = commitMatch;
  if (!type || !subject) {
    return;
  }
  const isBreaking =
    breaking === '!' ||
    commitMessage.includes('BREAKING CHANGE') ||
    commitMessage.includes('BREAKING:');

  return { type, scope, breaking: isBreaking, subject };
}

/**
 * Format changelog entry with optional scope
 */
export function formatEntry(scope: string | undefined, subject: string): string {
  return scope ? `- **${scope}**: ${subject}` : `- ${subject}`;
}

interface UpdateChangelogResult {
  updated: boolean;
  message?: string;
}

/**
 * Update changelog with new entry
 */
// eslint-disable-next-line sonarjs/cognitive-complexity -- Complex changelog logic required
export function updateChangelog(
  changelogPath: string,
  commitMessage: string,
  newVersion: string,
): UpdateChangelogResult {
  if (!commitMessage.trim() || !newVersion) {
    return { updated: false, message: 'Missing commit message or version' };
  }

  const parsed = parseCommitMessage(commitMessage);
  if (!parsed) {
    return { updated: false, message: 'Invalid commit format' };
  }

  const { type, scope, breaking: isBreaking, subject } = parsed;
  const today = new Date().toISOString().split('T')[0];
  const category = categoryMap[type] || 'Changed';
  const entry = formatEntry(scope, subject);

  let changelogContent = '';
  changelogContent = existsSync(changelogPath)
    ? readFileSync(changelogPath, 'utf8')
    : `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

`;

  const versionHeader = `## [${newVersion}] - ${today}`;
  const versionSectionRegex = /^## \[[\d.]+\] - \d{4}-\d{2}-\d{2}/m;

  if (versionSectionRegex.test(changelogContent)) {
    const lines = changelogContent.split('\n');
    let targetVersionIndex = -1;
    let insertIndex = -1;

    // First, check if a version section for newVersion already exists
    for (const [index, currentLine] of lines.entries()) {
      if (currentLine && currentLine.startsWith(`## [${newVersion}]`)) {
        targetVersionIndex = index;
        break;
      }
    }

    if (targetVersionIndex >= 0) {
      // Version section exists - insert into it
      insertIndex = targetVersionIndex + 1;
      let categoryFound = false;

      for (let index_ = targetVersionIndex + 1; index_ < lines.length; index_++) {
        const line = lines[index_];
        if (
          line &&
          /^### (?:Added|Fixed|Changed|Deprecated|Removed|Security|Documentation|Style|Refactored|Tests|Chore|Performance|CI\/CD|Build|Reverted)/.test(
            line,
          ) &&
          line.includes(category)
        ) {
          categoryFound = true;
          insertIndex = index_ + 1;
          break;
        }
        if (line && /^## \[[\d.]+\] - \d{4}-\d{2}-\d{2}/.test(line)) {
          break;
        }
      }

      if (!categoryFound && insertIndex >= 0) {
        for (let index_ = targetVersionIndex + 1; index_ < lines.length; index_++) {
          const line = lines[index_];
          if (line && /^## \[[\d.]+\] - \d{4}-\d{2}-\d{2}/.test(line)) {
            break;
          }
          if (line && line.startsWith('### ')) {
            insertIndex = index_;
            break;
          }
        }
        if (insertIndex >= 0 && insertIndex < lines.length) {
          lines.splice(insertIndex, 0, `### ${category}`, '');
          insertIndex += 2;
        }
      }

      if (insertIndex >= 0 && insertIndex <= lines.length) {
        lines.splice(insertIndex, 0, entry);
      }
      changelogContent = lines.join('\n');
    } else {
      // Version section doesn't exist - create new one at the top
      const firstVersionIndex = lines.findIndex(
        (line) => line && /^## \[[\d.]+\] - \d{4}-\d{2}-\d{2}/.test(line),
      );
      const newSection = `${versionHeader}
${isBreaking ? '### ⚠️ BREAKING CHANGES' : `### ${category}`}
${entry}

`;

      const hasFirstVersion = firstVersionIndex !== -1;
      if (hasFirstVersion) {
        lines.splice(firstVersionIndex, 0, newSection.trimEnd());
      } else {
        // No version sections found, add after header
        const headerIndex = lines.findIndex((line) => line.startsWith('# Changelog'));
        const hasHeader = headerIndex !== -1;
        if (hasHeader) {
          lines.splice(headerIndex + 1, 0, '', newSection.trimEnd());
        }
      }
      changelogContent = lines.join('\n');
    }
  } else {
    const newSection = `${versionHeader}
${isBreaking ? '### ⚠️ BREAKING CHANGES' : `### ${category}`}
${entry}

`;
    changelogContent = changelogContent.replace(/^# Changelog\n/, `# Changelog\n\n${newSection}`);
  }

  writeFileSync(changelogPath, changelogContent);

  return { updated: true, message: `Changelog updated for version ${newVersion}` };
}

function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');

  try {
    const commitMessage = process.argv[2] || '';
    const newVersion = process.argv[3] || '';
    const result = updateChangelog(changelogPath, commitMessage, newVersion);

    if (!result.updated) {
      console.log(`⚠️  ${result.message}`);
      process.exit(0);
    }

    console.log(`✅ ${result.message}`);

    // Format changelog with Prettier (using absolute path to avoid PATH issues)
    try {
      const prettierBin = path.join(__dirname, '..', 'node_modules', '.bin', 'prettier');
      // eslint-disable-next-line sonarjs/os-command -- Safe: using local prettier binary with fixed args
      execSync(`"${prettierBin}" --write CHANGELOG.md`, {
        cwd: path.join(__dirname, '..'),
        stdio: 'ignore',
      });
    } catch {
      // Prettier formatting failed, but changelog is still updated
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('⚠️  Error updating changelog:', message);
    process.exit(0);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
