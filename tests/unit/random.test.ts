import { describe, expect, test } from 'bun:test';

import { getRandomIndex } from '@utils';

describe('random', () => {
  describe('getRandomIndex', () => {
    test('should return index within range [0, max)', () => {
      const max = 10;
      const index = getRandomIndex(max);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(max);
    });

    test('should return 0 for max = 1', () => {
      const index = getRandomIndex(1);
      expect(index).toBe(0);
    });

    test('should return 0 for max = 0', () => {
      const index = getRandomIndex(0);
      expect(index).toBe(0);
    });

    test('should return 0 for negative max', () => {
      const index = getRandomIndex(-1);
      expect(index).toBe(0);
    });

    test('should return different values on multiple calls', () => {
      const max = 100;
      const iterations = 100;
      const indices = new Set<number>();

      for (let iteration = 0; iteration < iterations; iteration++) {
        indices.add(getRandomIndex(max));
      }

      expect(indices.size).toBeGreaterThan(1);
    });

    test('should handle various max values', () => {
      const testCases = [2, 5, 10, 50, 100, 1000];

      for (const max of testCases) {
        const index = getRandomIndex(max);
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(max);
      }
    });
  });
});
