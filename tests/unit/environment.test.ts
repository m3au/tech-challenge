import { describe, expect, test } from 'bun:test';

import { environment } from '@utils';

describe('env', () => {
  describe('environment', () => {
    test('should return string value when variable exists', () => {
      process.env['TEST_VAR'] = 'test-value';
      expect(environment('TEST_VAR')).toBe('test-value');
      delete process.env['TEST_VAR'];
    });

    test('should return empty string when variable is empty', () => {
      process.env['TEST_VAR'] = '';
      expect(environment('TEST_VAR')).toBe('');
      delete process.env['TEST_VAR'];
    });

    test('should throw error when variable is missing', () => {
      delete process.env['TEST_VAR'];
      expect(() => {
        environment('TEST_VAR');
      }).toThrow('TEST_VAR environment variable is required');
    });

    test('should throw error when variable is undefined', () => {
      process.env['TEST_VAR'] = undefined as unknown as string;
      expect(() => {
        environment('TEST_VAR');
      }).toThrow('TEST_VAR environment variable is required');
      delete process.env['TEST_VAR'];
    });

    test('should return string value for numeric environment variables', () => {
      process.env['TEST_NUM'] = '42';
      expect(environment('TEST_NUM')).toBe('42');
      expect(typeof environment('TEST_NUM')).toBe('string');
      delete process.env['TEST_NUM'];
    });

    test('should return string value for float environment variables', () => {
      process.env['TEST_FLOAT'] = '3.14';
      expect(environment('TEST_FLOAT')).toBe('3.14');
      expect(typeof environment('TEST_FLOAT')).toBe('string');
      delete process.env['TEST_FLOAT'];
    });
  });
});
