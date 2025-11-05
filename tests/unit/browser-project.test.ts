import { beforeEach, describe, expect, test } from 'bun:test';

import { getBrowserProject, type BrowserProject } from '@utils';

function getSlowMo(project: BrowserProject): number | undefined {
  return (project.use as { slowMo?: number })?.slowMo;
}

describe('browser-project', () => {
  describe('getBrowserProject', () => {
    beforeEach(() => {
      process.env['SLOW_MO'] = '0';
    });

    describe('browser configurations', () => {
      test('should return chromium project with device settings', () => {
        const project = getBrowserProject('chromium', 'Desktop Chrome');

        expect(project.name).toBe('chromium');
        expect(project.use?.viewport).toBeDefined();
        expect(project.use?.userAgent).toBeDefined();
      });

      test('should return firefox project with device settings', () => {
        const project = getBrowserProject('firefox', 'Desktop Firefox');

        expect(project.name).toBe('firefox');
        expect(project.use?.viewport).toBeDefined();
      });

      test('should return webkit project with device settings', () => {
        const project = getBrowserProject('webkit', 'Desktop Safari');

        expect(project.name).toBe('webkit');
        expect(project.use?.viewport).toBeDefined();
      });
    });

    describe('slowMo configuration', () => {
      test('should include slowMo when SLOW_MO is greater than 0', () => {
        process.env['SLOW_MO'] = '100';
        const project = getBrowserProject('chromium', 'Desktop Chrome');

        expect(getSlowMo(project)).toBe(100);
      });

      test('should not include slowMo when SLOW_MO is 0', () => {
        process.env['SLOW_MO'] = '0';
        const project = getBrowserProject('chromium', 'Desktop Chrome');

        expect(getSlowMo(project)).toBeUndefined();
      });

      test('should not include slowMo when SLOW_MO is empty', () => {
        process.env['SLOW_MO'] = '';
        const project = getBrowserProject('chromium', 'Desktop Chrome');

        expect(getSlowMo(project)).toBeUndefined();
      });
    });
  });
});
