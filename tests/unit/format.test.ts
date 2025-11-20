import { describe, expect, test } from 'bun:test';

import { formatParameterValue, toTitleCase } from '@utils';

describe('format', () => {
  describe('toTitleCase', () => {
    test.each([
      { input: 'iClickButton', expected: 'I Click Button', description: 'camelCase' },
      {
        input: 'CableConfiguratorPage',
        expected: 'Cable Configurator Page',
        description: 'PascalCase',
      },
      { input: 'button', expected: 'Button', description: 'single word' },
      { input: 'I', expected: 'I', description: 'single uppercase letter' },
      { input: '', expected: '', description: 'empty string' },
      { input: 'camelCase', expected: 'Camel Case', description: 'string starting with lowercase' },
    ])('should convert $description to Title Case', ({ input, expected }) => {
      expect(toTitleCase(input)).toBe(expected);
    });

    test('should handle string with spaces', () => {
      // Function adds space before capitals, so existing spaces become double spaces
      expect(toTitleCase('already Title Case')).toBe('Already  Title  Case');
    });
  });

  describe('formatParameterValue', () => {
    describe('primitive types', () => {
      test.each([
        { value: 'test', expected: '"test"', description: 'string values with quotes' },
        { value: '', expected: '""', description: 'empty string with quotes' },
        { value: 42, expected: '42', description: 'positive number' },
        { value: 0, expected: '0', description: 'zero' },
        { value: -1, expected: '-1', description: 'negative number' },
        { value: 3.14, expected: '3.14', description: 'decimal number' },
        { value: true, expected: 'true', description: 'true' },
        { value: false, expected: 'false', description: 'false' },
      ])('should format $description', ({ value, expected }) => {
        expect(formatParameterValue(value)).toBe(expected);
      });

      test('should format null', () => {
        // eslint-disable-next-line unicorn/no-null -- Testing null handling
        expect(formatParameterValue(null)).toBe('null');
      });

      test('should format undefined', () => {
        // eslint-disable-next-line unicorn/no-useless-undefined -- Need to pass undefined explicitly to test the function
        expect(formatParameterValue(undefined)).toBe('undefined');
      });
    });

    describe('complex types', () => {
      test.each([
        { value: { key: 'value' }, expected: '{"key":"value"}', description: 'simple object' },
        {
          value: { nested: { data: 123 } },
          expected: '{"nested":{"data":123}}',
          description: 'nested object',
        },
        { value: {}, expected: '{}', description: 'empty object' },
        { value: [1, 2, 3], expected: '[1,2,3]', description: 'number array' },
        { value: ['a', 'b'], expected: '["a","b"]', description: 'string array' },
      ])('should format $description as JSON', ({ value, expected }) => {
        expect(formatParameterValue(value)).toBe(expected);
      });

      test('should format function as string', () => {
        // eslint-disable-next-line sonarjs/no-nested-functions, unicorn/consistent-function-scoping -- Testing function formatting
        const testFunction = () => {};
        const result = formatParameterValue(testFunction);
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      });

      test('should format symbol as string', () => {
        const result = formatParameterValue(Symbol('test'));
        expect(result).toMatch(/Symbol/);
      });
    });
  });
});
