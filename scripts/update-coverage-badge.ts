#!/usr/bin/env bun

/**
 * Update coverage badge in README.md based on actual test coverage
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get coverage percentage from test output
 */
export function getCoverage(): number {
  try {
    // Run tests with coverage
    // eslint-disable-next-line sonarjs/no-os-command-from-path -- execSync is required to run bun commands
    const output = execSync('bun test --coverage 2>&1', {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
    });

    const coverage = parseCoverageFromOutput(output);
    if (coverage === 0) {
      console.error('⚠️  Could not parse coverage from test output');
    }
    return coverage;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('⚠️  Error running tests:', message);
    return 0;
  }
}

/**
 * Get badge color based on coverage percentage
 */
export function getBadgeColor(coverage: number): string {
  if (coverage >= 90) return 'brightgreen';
  if (coverage >= 80) return 'green';
  if (coverage >= 70) return 'yellow';
  if (coverage >= 60) return 'orange';
  return 'red';
}

/**
 * Parse coverage percentage from test output
 */
export function parseCoverageFromOutput(output: string): number {
  const match = output.match(/All files\s+\|\s+[\d.]+\s+\|\s+([\d.]+)\s+\|/);
  return match?.[1] ? Number.parseFloat(match[1]) : 0;
}

/**
 * Update coverage badge in README
 */
export function updateReadme(coverage: number): void {
  const readmePath = path.join(__dirname, '..', 'README.md');
  const readme = readFileSync(readmePath, 'utf8');

  const coverageFormatted = coverage.toFixed(2);
  const color = getBadgeColor(coverage);

  // Match existing coverage badge
  const badgeRegex =
    /\[!\[Coverage\]\(https:\/\/img\.shields\.io\/badge\/Coverage-[\d.]+%25-\w+\)\]\(tests\/unit\/\)/;

  const newBadge = `[![Coverage](https://img.shields.io/badge/Coverage-${coverageFormatted}%25-${color})](tests/unit/)`;

  if (badgeRegex.test(readme)) {
    const updatedReadme = readme.replace(badgeRegex, newBadge);
    writeFileSync(readmePath, updatedReadme);
    console.log(`✅ Updated coverage badge to ${coverageFormatted}% (${color})`);
  } else {
    console.error('⚠️  Could not find coverage badge in README.md');
    process.exit(1);
  }
}

function main() {
  console.log('📊 Calculating test coverage...');
  const coverage = getCoverage();

  if (coverage > 0) {
    updateReadme(coverage);
  } else {
    console.error('❌ Failed to get coverage');
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
