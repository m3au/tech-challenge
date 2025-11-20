#!/usr/bin/env bun

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import type { BugReport } from '../tests/utils/bug-reporter';

import { getSharedStyles, themes } from './template-utils';

const BUGS_FILE = path.join(process.cwd(), 'BUGS.json');
const OUTPUT_DIR = path.join(process.cwd(), 'test-output');
const CHALLENGES_DIR = path.join(OUTPUT_DIR, 'challenges');
const TEMPLATES_DIR = path.join(process.cwd(), '.github', 'templates');
const BUGS_REPORT_TEMPLATE = path.join(TEMPLATES_DIR, 'bugs-report.html');
const BUGS_INDEX_TEMPLATE = path.join(TEMPLATES_DIR, 'bugs-index.html');

interface Challenge {
  name: string;
  description: string;
}

const challenges: Challenge[] = [
  { name: 'uitestingplayground', description: 'UI Testing Playground' },
  { name: 'automationexercise', description: 'Automation Exercise' },
];

function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString();
  } catch {
    return timestamp;
  }
}

function escapeHtml(text: string): string {
  return (
    String(text)
      // eslint-disable-next-line unicorn/prefer-string-replace-all -- Using replace with global regex for compatibility
      .replace(/&/g, '&amp;')
      // eslint-disable-next-line unicorn/prefer-string-replace-all -- Using replace with global regex for compatibility
      .replace(/</g, '&lt;')
      // eslint-disable-next-line unicorn/prefer-string-replace-all -- Using replace with global regex for compatibility
      .replace(/>/g, '&gt;')
      // eslint-disable-next-line unicorn/prefer-string-replace-all -- Using replace with global regex for compatibility
      .replace(/"/g, '&quot;')
      // eslint-disable-next-line unicorn/prefer-string-replace-all -- Using replace with global regex for compatibility
      .replace(/'/g, '&#039;')
  );
}

function generateBugItemHtml(bug: BugReport): string {
  const stepsHtml =
    bug.stepsToReproduce && bug.stepsToReproduce.length > 0
      ? `
          <div class="bug-steps">
            <div class="bug-label">Steps to Reproduce:</div>
            <ol class="steps-list">
              ${bug.stepsToReproduce.map((step) => `<li>${escapeHtml(step)}</li>`).join('\n              ')}
            </ol>
          </div>`
      : '';

  return `
        <div class="bug-item">
          <div class="bug-header">
            <div class="bug-title">
              <strong>${escapeHtml(bug.testTitle || 'Unknown Test')}</strong>
              <span class="bug-timestamp">${formatTimestamp(bug.timestamp)}</span>
            </div>
          </div>
          <div class="bug-error">
            <div class="bug-label">Error:</div>
            <pre class="error-message">${escapeHtml(bug.error)}</pre>
          </div>
          ${stepsHtml}
          <div class="bug-config">
            <div class="bug-label">Configuration:</div>
            <div class="config-grid">
              <div class="config-item">
                <span class="config-label">Cable Beginning:</span>
                <span class="config-value">${escapeHtml(bug.cableBeginningType)} (${escapeHtml(bug.cableBeginningConnector)})</span>
              </div>
              <div class="config-item">
                <span class="config-label">Cable End:</span>
                <span class="config-value">${escapeHtml(bug.cableEndType)} (${escapeHtml(bug.cableEndConnector)})</span>
              </div>
            </div>
          </div>
        </div>`;
}

function generateFileSectionHtml(file: string, fileBugs: BugReport[]): string {
  // eslint-disable-next-line unicorn/no-array-sort -- Using sort for compatibility
  const sortedBugs = [...fileBugs].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const bugItems = sortedBugs.map((bug) => generateBugItemHtml(bug)).join('\n      ');

  return `
      <div class="file-section">
        <h3 class="file-name">${escapeHtml(file)}</h3>
        <div class="file-bugs-count">${fileBugs.length} bug${fileBugs.length === 1 ? '' : 's'}</div>
        ${bugItems}
      </div>`;
}

function generateBugsHtml(bugs: BugReport[], challengeName: string): string {
  const challengeDescription =
    challenges.find((c) => c.name === challengeName)?.description || challengeName;

  if (!existsSync(BUGS_REPORT_TEMPLATE)) {
    throw new Error(`Template not found: ${BUGS_REPORT_TEMPLATE}`);
  }

  let html = readFileSync(BUGS_REPORT_TEMPLATE, 'utf8');

  const bugsByFile: Record<string, BugReport[]> = {};
  for (const bug of bugs) {
    const file = bug.testFile || 'Unknown';
    if (!bugsByFile[file]) {
      bugsByFile[file] = [];
    }
    bugsByFile[file].push(bug);
  }

  // Generate file sections or empty state
  let contentHtml: string;
  if (bugs.length > 0) {
    const fileSections = Object.entries(bugsByFile)
      // eslint-disable-next-line unicorn/no-array-sort -- Using sort for compatibility
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([file, fileBugs]) => generateFileSectionHtml(file, fileBugs))
      .join('\n');
    contentHtml = fileSections;
  } else {
    contentHtml = `
      <div class="empty-state">
        <div class="empty-state-icon">✅</div>
        <h2>No Bugs Found</h2>
        <p>All tests are passing! No bugs have been reported for this challenge.</p>
      </div>`;
  }

  // Replace placeholders
  const sharedStyles = getSharedStyles(themes.bugs);
  html = html.replaceAll('{{SHARED_STYLES}}', sharedStyles);
  html = html.replaceAll('{{CHALLENGE_DESCRIPTION}}', escapeHtml(challengeDescription));
  html = html.replaceAll('{{TOTAL_BUGS}}', String(bugs.length));
  html = html.replaceAll('{{AFFECTED_FILES}}', String(Object.keys(bugsByFile).length));
  html = html.replaceAll('{{CONTENT}}', contentHtml);

  return html;
}

function generateAllBugsHtml(allBugs: BugReport[]): string {
  const totalBugs = allBugs.length;
  const challengeBugs: Record<string, BugReport[]> = {};
  for (const challenge of challenges) {
    challengeBugs[challenge.name] = allBugs.filter((bug) => bug.challenge === challenge.name);
  }

  if (!existsSync(BUGS_INDEX_TEMPLATE)) {
    throw new Error(`Template not found: ${BUGS_INDEX_TEMPLATE}`);
  }

  let html = readFileSync(BUGS_INDEX_TEMPLATE, 'utf8');

  const challengeItems = challenges
    .map((challenge) => {
      const bugs = challengeBugs[challenge.name] || [];
      const badgeClass = bugs.length > 0 ? 'badge-error' : 'badge-success';
      return `
    <div class="challenge-item">
      <div class="challenge-header">
        <h3>${escapeHtml(challenge.description)}</h3>
        <div class="challenge-badge ${badgeClass}">
          ${bugs.length} bug${bugs.length === 1 ? '' : 's'}
        </div>
      </div>
      <p class="challenge-description">View all reported bugs for ${escapeHtml(challenge.description)} challenge.</p>
      <a href="./${challenge.name}-bugs.html" class="challenge-link">View Bugs Report →</a>
    </div>`;
    })
    .join('\n');

  // Replace placeholders
  const sharedStyles = getSharedStyles(themes.bugs);
  html = html.replaceAll('{{SHARED_STYLES}}', sharedStyles);
  html = html.replaceAll('{{TOTAL_BUGS}}', String(totalBugs));
  html = html.replaceAll('{{TOTAL_CHALLENGES}}', String(challenges.length));
  html = html.replaceAll('{{CHALLENGE_ITEMS}}', challengeItems);

  return html;
}

function main(): void {
  if (!existsSync(BUGS_FILE)) {
    console.log('BUGS.json not found. Creating empty bugs reports.');
    mkdirSync(CHALLENGES_DIR, { recursive: true });
    for (const challenge of challenges) {
      const html = generateBugsHtml([], challenge.name);
      const outputPath = path.join(CHALLENGES_DIR, `${challenge.name}-bugs.html`);
      writeFileSync(outputPath, html, 'utf8');
    }
    const indexHtml = generateAllBugsHtml([]);
    const indexPath = path.join(CHALLENGES_DIR, 'bugs-index.html');
    writeFileSync(indexPath, indexHtml, 'utf8');
    return;
  }

  try {
    const content = readFileSync(BUGS_FILE, 'utf8');
    const bugs: BugReport[] = JSON.parse(content);

    mkdirSync(CHALLENGES_DIR, { recursive: true });

    // Generate individual challenge bugs reports
    for (const challenge of challenges) {
      const challengeBugs = bugs.filter((bug) => bug.challenge === challenge.name);
      const html = generateBugsHtml(challengeBugs, challenge.name);
      const outputPath = path.join(CHALLENGES_DIR, `${challenge.name}-bugs.html`);
      writeFileSync(outputPath, html, 'utf8');
      console.log(`Generated bugs report for ${challenge.name}: ${challengeBugs.length} bugs`);
    }

    // Generate index page for all bugs
    const indexHtml = generateAllBugsHtml(bugs);
    const indexPath = path.join(CHALLENGES_DIR, 'bugs-index.html');
    writeFileSync(indexPath, indexHtml, 'utf8');
    console.log(`Generated bugs index with ${bugs.length} total bugs`);
  } catch (error) {
    console.error('Failed to generate bugs reports:', error);
    process.exit(1);
  }
}

main();
