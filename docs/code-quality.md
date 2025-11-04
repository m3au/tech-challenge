# Code Quality Files Reference <!-- omit from toc -->

This document describes all code quality configuration files in the project and what they do.

![Placeholder](https://placecats.com/millie_neo/400/200)

## Table of Contents <!-- omit from toc -->

- [Overview](#overview)
- [Linting \& Formatting](#linting--formatting)
  - [`eslint.config.js`](#eslintconfigjs)
  - [`prettier.config.js`](#prettierconfigjs)
  - [`.lintstagedrc.json`](#lintstagedrcjson)
  - [`.markdownlint.jsonc`](#markdownlintjsonc)
- [Type Checking](#type-checking)
  - [`tsconfig.json`](#tsconfigjson)
- [Unit Testing](#unit-testing)
- [Spell Checking](#spell-checking)
  - [`.cspell.jsonc`](#cspelljsonc)
- [Editor Configuration](#editor-configuration)
  - [`.editorconfig`](#editorconfig)
  - [`.gitattributes`](#gitattributes)
- [IDE Integration](#ide-integration)
- [Pre-commit Hooks](#pre-commit-hooks)
  - [`.husky/pre-commit`](#huskypre-commit)
  - [`.husky/commit-msg`](#huskycommit-msg)
  - [`.husky/prepare-commit-msg`](#huskyprepare-commit-msg)
  - [`.husky/pre-push`](#huskypre-push)

---

## Overview

Code quality tools enforce consistent standards, catch errors early, and maintain code maintainability. The project uses a layered approach combining linting, formatting, type checking, and spell checking to ensure all code meets quality standards before it reaches the repository.

| File                  | Purpose             | Runs On             |
| --------------------- | ------------------- | ------------------- |
| `eslint.config.js`    | Code linting        | Commit, manually    |
| `.markdownlint.jsonc` | Markdown linting    | Commit, manually    |
| `prettier.config.js`  | Code formatting     | Commit, manually    |
| `.lintstagedrc.json`  | Staged file linting | Commit              |
| `tsconfig.json`       | Type checking       | Manually, IDE       |
| `.cspell.jsonc`       | Spell checking      | Commit (via ESLint) |
| `tests/unit/`         | Unit tests          | Manually, CI/CD     |
| `.husky/pre-commit`   | Pre-commit hook     | Commit              |

```bash
- `bun lint` - Run all quality checks in order: type-check → ESLint → markdownlint
- `bun lint:fix` - Auto-fix ESLint and markdownlint errors
- `bun lint:typescript` - TypeScript type checking only
- `bun lint:eslint` - ESLint only
- `bun lint:markdown` - markdownlint only
- `bun test` - Run unit tests (coverage enabled by default via bunfig.toml)
```

Automated checks run on every commit via Git hooks, providing immediate feedback. All tools can also be run manually for local development and CI/CD pipelines.

## Linting & Formatting

### [`eslint.config.js`](../eslint.config.js)

**Purpose**: ESLint configuration for code linting and quality checks.

**What it does**:

- Configures ESLint with TypeScript support
- Integrates multiple ESLint plugins for comprehensive code quality
- Defines rules for TypeScript, JavaScript, and E2E test files
- Sets up ignores for build artifacts and generated files

**Integrated ESLint Plugins**:

- [`@typescript-eslint/eslint-plugin`](https://typescript-eslint.io/) - TypeScript linting and type-aware analysis
- [`eslint-plugin-sonarjs`](https://github.com/SonarSource/eslint-plugin-sonarjs) - Code quality and bug detection (includes cognitive complexity analysis)
- [`eslint-plugin-unicorn`](https://github.com/sindresorhus/eslint-plugin-unicorn) - JavaScript best practices and modern patterns
- [`@cspell/eslint-plugin`](https://github.com/streetsidesoftware/vscode-spell-checker/tree/main/packages/%40cspell/eslint-plugin) - Spell checking (checks comments and strings)
- [`eslint-plugin-playwright`](https://github.com/playwright-community/eslint-plugin-playwright) - Playwright-specific rules and globals

File-specific configurations apply different plugin sets to TypeScript, JavaScript, and test files. See [`eslint.config.js`](../eslint.config.js) for details.

### [`prettier.config.js`](../prettier.config.js)

**Purpose**: Prettier configuration for automatic code formatting.

**What it does**:

- Sets formatting rules (semicolons, quotes, line width, etc.)
- Configures file-specific overrides (JSON files)
- Ensures consistent code style across the project

### [`.lintstagedrc.json`](../.lintstagedrc.json)

**Purpose**: Configures which files are linted/formatted on commit.

**What it does**:

- Runs ESLint and Prettier on staged TypeScript/JavaScript files
- Runs markdownlint-cli2 --fix and Prettier on staged Markdown files
- Runs Prettier on staged JSON, MDX, CSS, HTML, YAML files
- Only processes files that are staged for commit
- Enforces zero warnings (`--max-warnings=0`) - fails on any ESLint warnings

### [`.markdownlint.jsonc`](../.markdownlint.jsonc)

**Purpose**: Markdownlint configuration for markdown file linting.

**What it does**:

- Configures markdownlint rules for consistent markdown formatting
- Enforces heading styles, list formatting, and blank line rules
- Validates link fragments and reference definitions
- Ensures code blocks have language specified

## Type Checking

### [`tsconfig.json`](../tsconfig.json)

**Purpose**: TypeScript compiler configuration.

**What it does**:

- Configures TypeScript compilation options
- Enables strict type checking
- Sets module resolution and target
- Configures decorator support for playwright-bdd
- Defines includes/excludes for type checking

> Run `bun lint:typescript` to verify types without building.

## Unit Testing

The project uses Bun's built-in test runner for unit testing utility functions. Unit tests achieve **100% code coverage** for all utility modules in `tests/e2e/utils/`.

**Test Structure**:

- **Test files**: Located in `tests/unit/` directory (`*.test.ts` files)
- **Coverage**: Enabled by default via `bunfig.toml`, reports function and line coverage
- **Covered modules**: `format.ts`, `random.ts`, `locators.ts`

**Running Tests**:

```bash
# Run unit tests (bunfig.toml sets root = "tests/unit", so just "bun test" works)
bun test
```

> Unit tests are separate from E2E tests (Playwright). Unit tests focus on testing pure utility functions, while E2E tests validate end-to-end workflows.

## Spell Checking

### [`.cspell.jsonc`](../.cspell.jsonc)

**Purpose**: CSpell configuration for spell checking.

**What it does**:

- Configures dictionaries for multiple languages and domains
- Defines project-specific words (brand names, technical terms)
- Sets up regex patterns to ignore (URLs, selectors, etc.)
- Ignores build artifacts and node_modules
- Integrated with ESLint via `@cspell/eslint-plugin`

**Configured Dictionaries**:

Includes standard dictionaries (`en_US`, `typescript`, `node`, `npm`, `html`, `css`) plus:

- `de-de` - German language support
- `software-terms` - General software development terms

Project-specific words and regex patterns are defined in [`.cspell.jsonc`](../.cspell.jsonc).

## Editor Configuration

### [`.editorconfig`](../.editorconfig)

**Purpose**: Editor configuration for consistent formatting.

**What it does**:

- Ensures consistent file formatting across editors
- Sets UTF-8 charset and LF line endings
- Configures 2-space indentation
- Trims trailing whitespace (except markdown files)
- Inserts final newline
- Works with most modern editors

> Complements Prettier configuration.

### [`.gitattributes`](../.gitattributes)

**Purpose**: Git attributes for consistent file handling and line endings.

**What it does**:

- Ensures LF line endings for all text files (prevents CRLF issues)
- Auto-detects text files and normalizes line endings (`text=auto eol=lf`)
- Explicitly marks source code files as text (`.ts`, `.js`, `.json`, `.jsonc`, `.md`)
- Marks binary files appropriately (images, fonts) to prevent corruption
- Treats SVG files as text for version control

> Works with EditorConfig to ensure consistent line endings across all environments and Git operations.

## IDE Integration

Code quality tools integrate with IDEs through workspace settings and extensions. For detailed editor setup and recommended extensions, see [Editor Integration](../docs/development.md#code-quality) in the development documentation.

## Pre-commit Hooks

### [`.husky/pre-commit`](../.husky/pre-commit)

**Purpose**: Git pre-commit hook configuration.

**What it does**:

- Ensures code quality gate passes by executing `bun test` and `lint-staged`
- Prevents commits with failing tests or linting/formatting errors

> See [`.husky/pre-commit`](../.husky/pre-commit) for the actual hook file. Requires Husky to be installed and configured. See `package.json` `prepare` script.

### [`.husky/commit-msg`](../.husky/commit-msg)

**Purpose**: Git commit message validation hook.

**What it does**:

- Validates conventional commit format
- Ensures commits follow `type(scope): subject` format
- Provides helpful error messages with examples

> See [`.husky/commit-msg`](../.husky/commit-msg) for the actual hook file. For commit guidelines and examples, see [Commit Guidelines](../docs/development.md#commit-guidelines) in the development documentation. Works with `.husky/pre-commit` to enforce commit standards.

### [`.husky/prepare-commit-msg`](../.husky/prepare-commit-msg)

**Purpose**: Automatic version bumping and changelog generation hook.

**What it does**:

- Validates commit message format (must follow Conventional Commits)
- Skips processing for merge commits and reverts
- Bumps `package.json` version based on commit type (see [Automatic Version Bumping](../docs/development.md#automatic-version-bumping) for details)
- Automatically updates `CHANGELOG.md` with new entries
- Stages updated `package.json` and `CHANGELOG.md` files
- Only processes commits that follow Conventional Commits format (skips invalid formats)

**Scripts**:

- [`scripts/bump-version.mjs`](../scripts/bump-version.mjs) - Semantic version bumping logic
- [`scripts/changelog.mjs`](../scripts/changelog.mjs) - Changelog generation based on Conventional Commits

> See [`.husky/prepare-commit-msg`](../.husky/prepare-commit-msg) for the actual hook file. For version bumping details, see [Automatic Version Bumping](../docs/development.md#automatic-version-bumping) in the development documentation. Runs automatically on commit. No manual version management required - just follow Conventional Commits format.

### [`.husky/pre-push`](../.husky/pre-push)

**Purpose**: Git pre-push hook for type checking.

**What it does**:

- Runs `bun run lint:typescript` before push
- Catches type errors early
- Prevents pushing code with TypeScript errors

> See [`.husky/pre-push`](../.husky/pre-push) for the actual hook file. Complements pre-commit hooks by catching type errors before remote push.
