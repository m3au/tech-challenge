#!/usr/bin/env bun

import * as fs from 'node:fs';
import { existsSync } from 'node:fs';
import path from 'node:path';

import dotenv from 'dotenv';

import { getSharedStyles, themes } from './template-utils';

// Load environment variables
if (existsSync('.env')) {
  dotenv.config({ path: '.env' });
} else if (existsSync('.env.production')) {
  dotenv.config({ path: '.env.production' });
}

interface Challenge {
  name: string;
  url: string;
  description: string;
}

function getChallengeUrl(name: string): string {
  const environmentVariable = `BASE_URL_${name.toUpperCase()}`;
  const url = process.env[environmentVariable];
  if (!url) {
    throw new Error(`${environmentVariable} environment variable is required`);
  }
  return url;
}

function getChallengeDescription(name: string): string {
  const environmentVariable = `CHALLENGE_DESC_${name.toUpperCase()}`;
  const description = process.env[environmentVariable];
  if (!description) {
    throw new Error(`${environmentVariable} environment variable is required`);
  }
  return description;
}

const challengeNames = ['uitestingplayground', 'automationexercise'];

const challenges: Challenge[] = challengeNames.map((name) => ({
  name,
  url: getChallengeUrl(name),
  description: getChallengeDescription(name),
}));

const outputDirectory = path.join(process.cwd(), 'test-output');
const challengesDirectory = path.join(outputDirectory, 'challenges');

fs.mkdirSync(challengesDirectory, { recursive: true });

function sanitizeName(name: string): string {
  const segments = name.toLowerCase().match(/[a-z0-9]+/g);
  return segments?.join('-') ?? 'challenge';
}

const templatePath = path.join(process.cwd(), '.github', 'templates', 'challenge-summary.html');

if (!existsSync(templatePath)) {
  throw new Error(`Template not found: ${templatePath}`);
}

let html = fs.readFileSync(templatePath, 'utf8');

const listItems = challenges
  .map((challenge) => {
    const description = challenge.description
      ? `<div class="target-description">${challenge.description} - <a href="${challenge.url}" class="target-url" target="_blank" rel="noopener noreferrer">${challenge.url}</a></div>`
      : `<div class="target-description"><a href="${challenge.url}" class="target-url" target="_blank" rel="noopener noreferrer">${challenge.url}</a></div>`;
    return `<li>
      <div style="display: flex; gap: 0.75rem; align-items: center; padding: 1rem 1.25rem;">
        <a href="../playwright-report/index.html?project=${challenge.name}-chromium" class="target-link" style="flex: 1;">${challenge.name}</a>
        <a href="${challenge.name}-bugs.html" style="padding: 0.5rem 1rem; background: rgba(239, 68, 68, 0.2); color: #fca5a5; text-decoration: none; border-radius: 6px; font-size: 0.875rem; font-weight: 500; white-space: nowrap;">🐛 Bugs</a>
      </div>
      ${description}
    </li>`;
  })
  .join('\n');

const descriptionHtml = `
      <p>
        Practice testing sites and real-world scenarios implemented using Playwright with
        Behavior-Driven Development (Gherkin). Each challenge focuses on different aspects of
        web application testing:
      </p>
      <ul style="list-style: disc; padding-left: 1.5rem; margin-top: 1rem;">
        ${challenges
          .map(
            (challenge) =>
              `<li style="margin-bottom: 0.5rem;"><strong>${challenge.name}</strong> - ${challenge.description}</li>`,
          )
          .join('\n        ')}
      </ul>
      <p style="margin-top: 1rem;">
        Each challenge report includes comprehensive test results, screenshots, and full
        interaction traces for debugging. Tests are written using Gherkin feature files with
        Page Object Model patterns.
      </p>`;

const notesHtml = `
      <p class="note">
        Each link opens the full Playwright HTML report filtered by challenge. The report includes
        all test results, traces, and screenshots for that specific challenge. The 🐛 Bugs button
        opens the bugs report for that challenge showing all test failures.
      </p>`;

// Replace placeholders
const sharedStyles = getSharedStyles(themes.challenge);
html = html.replaceAll('{{SHARED_STYLES}}', sharedStyles);
html = html.replaceAll('{{DESCRIPTION}}', descriptionHtml);
html = html.replaceAll('{{LIST_ITEMS}}', listItems);
html = html.replaceAll('{{NOTES}}', notesHtml);

const summaryPath = path.join(challengesDirectory, 'index.html');
fs.writeFileSync(summaryPath, html);
console.log(`Generated challenge summary at ${summaryPath}`);
