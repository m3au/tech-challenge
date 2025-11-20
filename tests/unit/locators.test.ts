/* eslint-disable unicorn/no-null -- Testing null handling in utility function */
import { describe, expect, mock, test } from 'bun:test';

import { hasClass, isDisabled, isValidTextItem } from '@utils';

describe('locators', () => {
  describe('isValidTextItem', () => {
    test('should return true for valid visible text', () => {
      expect(isValidTextItem('valid text', true)).toBe(true);
    });

    test.each([
      { text: null, label: 'null' },
      { text: undefined as unknown as string, label: 'undefined' },
      { text: '', label: 'empty string' },
      { text: '   ', label: 'spaces only' },
      { text: '\t\n', label: 'tabs and newlines' },
    ])('should return false for $label text', ({ text }) => {
      expect(isValidTextItem(text, true)).toBe(false);
    });

    test('should return false when not visible', () => {
      expect(isValidTextItem('valid text', false)).toBe(false);
    });

    test('should handle default excludeTexts parameter', () => {
      expect(isValidTextItem('valid text', true)).toBe(true);
      expect(isValidTextItem('valid text', true, [])).toBe(true);
    });

    describe('excludeTexts', () => {
      test.each([
        ['exclude', 'exclude'],
        ['EXCLUDE', 'exclude'],
        ['Exclude', 'exclude'],
        ['exclude', 'EXCLUDE'],
      ])(
        'should exclude "%s" when excludeTexts contains "%s" (case-insensitive)',
        (text, excludeText) => {
          expect(isValidTextItem(text, true, [excludeText])).toBe(false);
        },
      );

      test('should return true for text not in excludeTexts', () => {
        expect(isValidTextItem('include', true, ['exclude'])).toBe(true);
      });

      test('should handle empty excludeTexts array', () => {
        expect(isValidTextItem('valid text', true, [])).toBe(true);
      });

      test.each([
        { text: 'text1', expected: false },
        { text: 'text2', expected: false },
        { text: 'text3', expected: true },
      ])('should handle multiple exclude texts: $text -> $expected', ({ text, expected }) => {
        expect(isValidTextItem(text, true, ['text1', 'text2'])).toBe(expected);
      });

      test.each([
        [' text ', 'text with spaces in excludeTexts'],
        ['TEXT', 'uppercase in excludeTexts'],
      ])('should match "text" when excludeTexts contains %s', (excludeText) => {
        expect(isValidTextItem('text', true, [excludeText])).toBe(false);
      });

      test('should trim text before comparison', () => {
        expect(isValidTextItem('  exclude  ', true, ['exclude'])).toBe(false);
      });

      test.each([
        ['test@example.com', 'test@example.com'],
        ['test@example.com', 'TEST@EXAMPLE.COM'],
      ])('should handle special characters: "%s" matches "%s"', (text, excludeText) => {
        expect(isValidTextItem(text, true, [excludeText])).toBe(false);
      });
    });
  });

  describe('hasClass', () => {
    test('should return true when element has the class', async () => {
      const mockLocator = {
        evaluate: mock(async () => true),
      };

      const result = await hasClass(mockLocator as any, 'test-class');
      expect(result).toBe(true);
      expect(mockLocator.evaluate).toHaveBeenCalledTimes(1);
    });

    test('should return false when element does not have the class', async () => {
      const mockLocator = {
        evaluate: mock(async () => false),
      };

      const result = await hasClass(mockLocator as any, 'test-class');
      expect(result).toBe(false);
    });

    test('should return false when evaluation throws error', async () => {
      const mockLocator = {
        evaluate: mock(async () => {
          throw new Error('Element not found');
        }),
      };

      const result = await hasClass(mockLocator as any, 'test-class');
      expect(result).toBe(false);
    });
  });

  describe('isDisabled', () => {
    test('should return true when element has disabled class', async () => {
      const mockElement = {
        classList: { contains: (cls: string) => cls === 'disabled' },
        hasAttribute: () => false,
        getAttribute: () => null,
      };
      const mockLocator = {
        evaluate: mock(async (callback: (element: any) => boolean) => callback(mockElement)),
      };

      const result = await isDisabled(mockLocator as any);
      expect(result).toBe(true);
    });

    test('should return true when element has disabled attribute', async () => {
      const mockElement = {
        classList: { contains: () => false },
        hasAttribute: (attribute: string) => attribute === 'disabled',
        getAttribute: () => null,
      };
      const mockLocator = {
        evaluate: mock(async (callback: (element: any) => boolean) => callback(mockElement)),
      };

      const result = await isDisabled(mockLocator as any);
      expect(result).toBe(true);
    });

    test('should return true when element has aria-disabled="true"', async () => {
      const mockElement = {
        classList: { contains: () => false },
        hasAttribute: () => false,
        getAttribute: (attribute: string) => (attribute === 'aria-disabled' ? 'true' : null),
      };
      const mockLocator = {
        evaluate: mock(async (callback: (element: any) => boolean) => callback(mockElement)),
      };

      const result = await isDisabled(mockLocator as any);
      expect(result).toBe(true);
    });

    test('should return false when element is not disabled', async () => {
      const mockElement = {
        classList: { contains: () => false },
        hasAttribute: () => false,
        getAttribute: () => null,
      };
      const mockLocator = {
        evaluate: mock(async (callback: (element: any) => boolean) => callback(mockElement)),
      };

      const result = await isDisabled(mockLocator as any);
      expect(result).toBe(false);
    });

    test('should return false when evaluation throws error', async () => {
      const mockLocator = {
        evaluate: mock(async () => {
          throw new Error('Element not found');
        }),
      };

      const result = await isDisabled(mockLocator as any);
      expect(result).toBe(false);
    });
  });
});
