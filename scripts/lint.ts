#!/usr/bin/env bun

import { spawn } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

function runTypeScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('Running TypeScript type checking...');
    const tscBin = existsSync(path.join(projectRoot, 'node_modules', '.bin', 'tsc'))
      ? path.join(projectRoot, 'node_modules', '.bin', 'tsc')
      : 'tsc';

    const tscProcess = spawn(tscBin, ['--noEmit'], {
      stdio: 'inherit',
      cwd: projectRoot,
    });

    tscProcess.on('error', (error) => {
      reject(new Error(`Error running tsc: ${error.message}`));
    });

    tscProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`TypeScript type checking failed with exit code ${code ?? 0}`));
      }
    });
  });
}

function runESLint(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('\nRunning ESLint...');
    const eslintBin = existsSync(path.join(projectRoot, 'node_modules', '.bin', 'eslint'))
      ? path.join(projectRoot, 'node_modules', '.bin', 'eslint')
      : 'eslint';

    const eslintProcess = spawn(eslintBin, ['.', '--debug'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: projectRoot,
    });

    const fileNames = new Set<string>();
    let eslintOutput = '';

    eslintProcess.stderr.on('data', (data) => {
      const output = data.toString();
      const lines = output.split('\n');

      for (const line of lines) {
        const match = line.match(/Linting code for (.+?)( \(pass \d+\))?$/);
        if (match) {
          const filePath = match[1];
          if (!fileNames.has(filePath)) {
            fileNames.add(filePath);
            const relativePath = filePath.replace(projectRoot + '/', '');
            console.log(relativePath);
          }
        }

        // Capture markdown files which emit different debug messages
        const markdownMatch = line.match(/Calculating config for file (.+\.mdc?)$/);
        if (markdownMatch) {
          const filePath = markdownMatch[1];
          if (!fileNames.has(filePath)) {
            fileNames.add(filePath);
            const relativePath = filePath.replace(projectRoot + '/', '');
            console.log(relativePath);
          }
        }
      }

      eslintOutput += output;
    });

    eslintProcess.stdout.on('data', (data) => {
      eslintOutput += data.toString();
    });

    eslintProcess.on('error', (error) => {
      reject(new Error(`Error running eslint: ${error.message}`));
    });

    eslintProcess.on('close', (code) => {
      // Filter out debug lines and show only actual lint output
      const lines = eslintOutput.split('\n');
      const filtered = lines.filter(
        (line) =>
          !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z eslint:/.test(line) &&
          !/Linting code for/.test(line) &&
          line.trim() !== '',
      );

      if (filtered.length > 0) {
        console.log(filtered.join('\n'));
      }

      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ESLint failed with exit code ${code ?? 0}`));
      }
    });
  });
}

function runShellCheck(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('\nRunning ShellCheck...');
    const shellCheckBin = existsSync(path.join(projectRoot, 'node_modules', '.bin', 'shellcheck'))
      ? path.join(projectRoot, 'node_modules', '.bin', 'shellcheck')
      : 'shellcheck';

    // Discover all files in .husky directory (excluding subdirectories)
    const huskyDirectory = path.join(projectRoot, '.husky');
    const files = readdirSync(huskyDirectory)
      .map((file) => path.join(huskyDirectory, file))
      .filter((file) => statSync(file).isFile())
      .map((file) => path.relative(projectRoot, file));

    if (files.length === 0) {
      console.log('No husky files found to check');
      resolve();
      return;
    }

    // Print files being checked
    for (const file of files) {
      console.log(file);
    }

    const shellCheckProcess = spawn(shellCheckBin, files, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: projectRoot,
    });

    let output = '';

    shellCheckProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    shellCheckProcess.stderr.on('data', (data) => {
      output += data.toString();
    });

    shellCheckProcess.on('error', (error) => {
      reject(new Error(`Error running shellcheck: ${error.message}`));
    });

    shellCheckProcess.on('close', (code) => {
      if (output.trim()) {
        console.log('\n' + output.trim());
      }

      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ShellCheck failed with exit code ${code ?? 0}`));
      }
    });
  });
}

try {
  await runTypeScript();
  await runESLint();
  await runShellCheck();
  console.log('\n✓ All linting checks passed');
  process.exit(0);
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(`\n✗ ${message}`);
  process.exit(1);
}
