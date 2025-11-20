#!/usr/bin/env bun

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

/**
 * Returns the installed version string for a package name.
 */
function getInstalledVersion(packageName: string, basedir: string): string | undefined {
  try {
    const request = createRequire(path.join(basedir, 'package.json'));
    const packageJsonPath = request.resolve(`${packageName}/package.json`);
    const content = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as { version?: string };
    return typeof content.version === 'string' ? content.version : undefined;
  } catch {
    return;
  }
}

/**
 * Fallback: resolve a concrete version from the registry for a given range spec.
 */
function getRegistryVersion(packageName: string, spec: string): string | undefined {
  try {
    const cmd = `npm view ${packageName}@${spec} version --json`;
    // eslint-disable-next-line sonarjs/os-command -- Safe: npm view is a standard package manager command with controlled input
    const out = execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    try {
      const parsed = JSON.parse(out);
      // eslint-disable-next-line sonarjs/slow-regex -- Simple regex, safe for version matching
      if (typeof parsed === 'string' && /\d+\.\d+\.\d+/.test(parsed)) return parsed;
      if (Array.isArray(parsed)) {
        const last = parsed.at(-1);
        // eslint-disable-next-line sonarjs/slow-regex -- Simple regex, safe for version matching
        if (typeof last === 'string' && /\d+\.\d+\.\d+/.test(last)) return last;
      }
    } catch {
      // eslint-disable-next-line sonarjs/slow-regex -- Simple regex, safe for version matching
      const matches = out.match(/\d+\.\d+\.\d+(?:-[0-9a-z.-]+)?/gi);
      // eslint-disable-next-line sonarjs/os-command -- Safe: using sanitized output from npm view command
      if (matches && matches.length > 0) return matches.at(-1);
    }
    return;
  } catch {
    return;
  }
}

/**
 * Determine if a version spec is already pinned (exact x.y.z).
 */
function isPinned(spec: unknown): boolean {
  if (typeof spec !== 'string') return true;
  const trimmed = spec.trim();
  if (/^[~^<>*=]/.test(trimmed)) return false;
  if (trimmed === 'latest' || trimmed === '*') return false;
  if (/^x$/i.test(trimmed)) return false;
  if (/\bx\b/i.test(trimmed)) return false;
  if (/^\d+$/.test(trimmed)) return false;
  if (/^\d+\.\d+$/.test(trimmed)) return false;
  const exactSemver = /^\d+\.\d+\.\d+(?:-[0-9a-z.-]+)?(?:\+[0-9a-z.-]+)?$/i;
  return exactSemver.test(trimmed);
}

/**
 * Resolve an exact version for a given spec/name or return undefined if unresolved.
 */
function resolvePinnedSpec(
  packageName: string,
  spec: string,
  packageDirectory: string,
): string | undefined {
  if (typeof spec !== 'string' || isPinned(spec)) return;
  const installed =
    getInstalledVersion(packageName, packageDirectory) ||
    getInstalledVersion(packageName, process.cwd());
  const resolved = installed || getRegistryVersion(packageName, spec);
  return resolved || undefined;
}

/**
 * Pin all deps within a single section; returns true if changes were made.
 */
function pinSection(deps: Record<string, string> | undefined, packageDirectory: string): boolean {
  if (!deps || typeof deps !== 'object') return false;
  let sectionChanged = false;
  for (const [name, spec] of Object.entries(deps)) {
    const resolved = resolvePinnedSpec(name, spec, packageDirectory);
    if (resolved && deps[name] !== resolved) {
      deps[name] = resolved;
      sectionChanged = true;
    }
  }
  return sectionChanged;
}

function pinFile(file: string): boolean {
  const packageDirectory = path.dirname(file);
  const json = JSON.parse(fs.readFileSync(file, 'utf8')) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    optionalDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
  };
  const sections = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];
  const changed = sections
    .map((section) =>
      pinSection(json[section as keyof typeof json] as Record<string, string>, packageDirectory),
    )
    .some(Boolean);

  if (changed) {
    fs.writeFileSync(file, JSON.stringify(json, undefined, 2) + '\n');
    return true;
  }
  return false;
}

const root = process.cwd();
const packageJson = path.join(root, 'package.json');

if (!fs.existsSync(packageJson)) {
  console.error('package.json not found');
  process.exit(1);
}

if (pinFile(packageJson)) {
  console.log('Pinned versions in package.json');
} else {
  console.log('All dependencies already pinned.');
}
