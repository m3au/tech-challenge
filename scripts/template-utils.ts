/* eslint-disable unicorn/prevent-abbreviations -- template-utils is a common abbreviation in utility files */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const TEMPLATES_DIR = path.join(process.cwd(), '.github', 'templates');
const SHARED_STYLES_PATH = path.join(TEMPLATES_DIR, 'shared-styles.css');

interface ThemeConfig {
  primaryColor?: string;
  primaryHover?: string;
  background?: string;
  containerBg?: string;
  containerShadow?: string;
  containerWidth?: string;
}

const defaultTheme: Required<ThemeConfig> = {
  primaryColor: '#a855f7',
  primaryHover: '#a855f7',
  background: '#020617',
  containerBg: 'rgba(15, 23, 42, 0.85)',
  containerShadow: 'rgba(2, 6, 23, 0.7)',
  containerWidth: '960px',
};

/**
 * Loads shared CSS file and injects theme CSS variables.
 * Returns the complete CSS with theme overrides.
 */
export function getSharedStyles(theme: ThemeConfig = {}): string {
  if (!existsSync(SHARED_STYLES_PATH)) {
    throw new Error(`Shared styles not found: ${SHARED_STYLES_PATH}`);
  }

  const sharedCss = readFileSync(SHARED_STYLES_PATH, 'utf8');
  const finalTheme = { ...defaultTheme, ...theme };

  // Generate CSS variable overrides
  const themeOverrides = `:root {
  /* Theme variables - customized per template */
  --primary-color: ${finalTheme.primaryColor};
  --primary-hover: ${finalTheme.primaryHover};
  --background: ${finalTheme.background};
  --container-bg: ${finalTheme.containerBg};
  --container-shadow: ${finalTheme.containerShadow};
  --container-width: ${finalTheme.containerWidth};
}

`;

  // Replace the :root block in shared CSS with theme overrides
  // Match :root block including comments and whitespace
  return sharedCss.replace(/:root\s*\{[^}]*\}/, themeOverrides.trim());
}

/**
 * Predefined themes for different report types
 */
export const themes = {
  challenge: {
    primaryColor: '#a855f7',
    primaryHover: '#a855f7',
    background: '#020617',
  },
  lighthouse: {
    primaryColor: '#fb923c',
    primaryHover: '#f97316',
    background: '#020617',
  },
  axe: {
    primaryColor: '#38bdf8',
    primaryHover: '#38bdf8',
    background: '#0f172a',
    containerShadow: 'rgba(15, 23, 42, 0.8)',
  },
  bugs: {
    primaryColor: '#a855f7',
    primaryHover: '#a855f7',
    background: '#020617',
    containerWidth: '1200px',
  },
} as const;

