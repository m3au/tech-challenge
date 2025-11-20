#!/usr/bin/env bun

/**
 * Create git tag and optionally GitHub release for current version
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

interface PackageJson {
  version: string;
}

function getVersion(): string {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  if (!existsSync(packageJsonPath)) {
    throw new Error('package.json not found');
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as PackageJson;
  if (!packageJson.version) {
    throw new Error('Version not found in package.json');
  }

  return packageJson.version;
}

function tagExists(version: string): boolean {
  try {
    // eslint-disable-next-line sonarjs/os-command -- Safe: git rev-parse is required for tag check
    execSync(`git rev-parse "v${version}"`, {
      cwd: projectRoot,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

function createTag(version: string): void {
  console.log(`🏷️  Creating tag v${version}...`);
  // eslint-disable-next-line sonarjs/os-command -- Safe: git tag is required for release tagging
  execSync(`git tag -a "v${version}" -m "Release v${version}"`, {
    cwd: projectRoot,
    stdio: 'inherit',
  });
}

function pushTag(version: string): void {
  console.log('📤 Pushing tag to remote...');
  // eslint-disable-next-line sonarjs/os-command -- Safe: git push is required for tag publishing
  execSync(`git push origin "v${version}"`, {
    cwd: projectRoot,
    stdio: 'inherit',
  });
}

function hasGitHubCLI(): boolean {
  try {
    // eslint-disable-next-line sonarjs/no-os-command-from-path -- Safe: checking for gh CLI availability
    execSync('command -v gh', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function promptGitHubRelease(version: string): Promise<void> {
  if (!hasGitHubCLI()) {
    return;
  }

  // For non-interactive environments, skip prompt
  if (!process.stdin.isTTY) {
    return;
  }

  const { createInterface } = await import('node:readline');
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise<void>((resolve) => {
    rl.question('Create GitHub release? (y/n) ', (answer) => {
      rl.close();

      if (/^Y$/i.test(answer.trim())) {
        console.log(`🏷️  Creating GitHub release v${version}...`);
        // eslint-disable-next-line sonarjs/os-command -- Safe: gh release create is required for GitHub releases
        execSync(`gh release create "v${version}" --generate-notes --title "v${version}"`, {
          cwd: projectRoot,
          stdio: 'inherit',
        });
        console.log('✅ GitHub release created!');
      }
      resolve();
    });
  });
}

async function main(): Promise<void> {
  try {
    const version = getVersion();

    if (!version) {
      console.error('❌ Could not read version from package.json');
      process.exit(1);
    }

    if (tagExists(version)) {
      console.log(`✅ Tag v${version} already exists`);
      process.exit(0);
    }

    createTag(version);
    pushTag(version);
    console.log(`✅ Tag v${version} created and pushed!`);

    await promptGitHubRelease(version);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error:', message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // eslint-disable-next-line unicorn/prefer-top-level-await -- Cannot use top-level await in script entry point check
  void main();
}
