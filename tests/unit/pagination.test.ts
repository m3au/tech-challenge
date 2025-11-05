import { calculateTargetPageIndex, navigateToPageIndex, waitForDOMStabilization } from '@utils';
import { describe, expect, mock, test } from 'bun:test';

describe('pagination utilities', () => {
  describe('calculateTargetPageIndex', () => {
    test('calculates correct page index for first page', () => {
      expect(calculateTargetPageIndex(0, 20, 4)).toBe(0);
      expect(calculateTargetPageIndex(1, 20, 4)).toBe(0);
      expect(calculateTargetPageIndex(4, 20, 4)).toBe(0);
    });

    test('calculates correct page index for middle pages', () => {
      expect(calculateTargetPageIndex(5, 20, 4)).toBe(1);
      expect(calculateTargetPageIndex(9, 20, 4)).toBe(1);
      expect(calculateTargetPageIndex(10, 20, 4)).toBe(2);
    });

    test('calculates correct page index for last page', () => {
      expect(calculateTargetPageIndex(15, 20, 4)).toBe(3);
      expect(calculateTargetPageIndex(19, 20, 4)).toBe(3);
    });

    test('handles single pagination control', () => {
      expect(calculateTargetPageIndex(0, 10, 1)).toBe(0);
      expect(calculateTargetPageIndex(5, 10, 1)).toBe(0);
      expect(calculateTargetPageIndex(9, 10, 1)).toBe(0);
    });

    test('handles uneven distribution', () => {
      expect(calculateTargetPageIndex(0, 21, 4)).toBe(0);
      expect(calculateTargetPageIndex(5, 21, 4)).toBe(0);
      expect(calculateTargetPageIndex(6, 21, 4)).toBe(1);
    });
  });

  describe('navigateToPageIndex', () => {
    test('navigates right when target is ahead', async () => {
      const navigateRight = mock(async () => true);
      const navigateLeft = mock(async () => false);

      await navigateToPageIndex(0, 2, navigateRight, navigateLeft);

      expect(navigateRight).toHaveBeenCalledTimes(1);
      expect(navigateLeft).not.toHaveBeenCalled();
    });

    test('navigates left when target is behind', async () => {
      const navigateRight = mock(async () => false);
      const navigateLeft = mock(async () => true);

      await navigateToPageIndex(2, 0, navigateRight, navigateLeft);

      expect(navigateLeft).toHaveBeenCalledTimes(1);
      expect(navigateRight).not.toHaveBeenCalled();
    });

    test('does nothing when already at target', async () => {
      const navigateRight = mock(async () => false);
      const navigateLeft = mock(async () => false);

      await navigateToPageIndex(1, 1, navigateRight, navigateLeft);

      expect(navigateRight).not.toHaveBeenCalled();
      expect(navigateLeft).not.toHaveBeenCalled();
    });

    test('stops navigating if navigation fails', async () => {
      const navigateRight = mock(async () => false);
      const navigateLeft = mock(async () => false);

      await navigateToPageIndex(0, 5, navigateRight, navigateLeft);

      expect(navigateRight).toHaveBeenCalledTimes(1);
      expect(navigateLeft).not.toHaveBeenCalled();
    });

    test('handles navigation failure gracefully', async () => {
      const navigateRight = mock(async () => false);
      const navigateLeft = mock(async () => false);

      expect(async () => {
        await navigateToPageIndex(0, 5, navigateRight, navigateLeft);
      }).not.toThrow();
    });
  });

  describe('waitForDOMStabilization', () => {
    test('should call waitForTimeout with default timeout', async () => {
      const mockPage = {
        waitForTimeout: mock(async () => {}),
      };

      await waitForDOMStabilization(mockPage as any);

      expect(mockPage.waitForTimeout).toHaveBeenCalledTimes(1);
      expect(mockPage.waitForTimeout).toHaveBeenCalledWith(500);
    });

    test('should call waitForTimeout with custom timeout', async () => {
      const mockPage = {
        waitForTimeout: mock(async () => {}),
      };

      await waitForDOMStabilization(mockPage as any, 1000);

      expect(mockPage.waitForTimeout).toHaveBeenCalledTimes(1);
      expect(mockPage.waitForTimeout).toHaveBeenCalledWith(1000);
    });
  });
});
