import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';

import { attachFileFromStep } from '@utils';
import { test as baseTest } from '@playwright/test';

type AttachedFile = {
  name: string;
  body: Buffer;
  contentType: string;
};

type MockTestInfo = {
  attach: (name: string, options: { body: Buffer; contentType: string }) => Promise<void>;
};

describe('attachments', () => {
  let originalStep: typeof baseTest.step;

  beforeEach(() => {
    originalStep = baseTest.step;
  });

  afterEach(() => {
    baseTest.step = originalStep;
  });

  const createMockSetup = () => {
    const attachedFiles: AttachedFile[] = [];
    const mockTestInfo: MockTestInfo = {
      attach: async (name: string, options: { body: Buffer; contentType: string }) => {
        attachedFiles.push({ name, body: options.body, contentType: options.contentType });
      },
    };

    const stepFunction = mock(
      (title: string, callback: (testInfo: MockTestInfo) => Promise<void>) => {
        return callback(mockTestInfo);
      },
    );

    baseTest.step = stepFunction as unknown as typeof baseTest.step;

    return { attachedFiles, stepFunction };
  };

  describe('attachFileFromStep', () => {
    test('should attach file with default content type', async () => {
      const { attachedFiles, stepFunction } = createMockSetup();

      await attachFileFromStep('test-file.json', '{"key": "value"}');

      expect(stepFunction).toHaveBeenCalledTimes(1);
      expect(stepFunction.mock.calls[0]?.[0]).toBe('Attach test-file.json');
      expect(attachedFiles).toHaveLength(1);

      const [file] = attachedFiles;
      expect(file?.name).toBe('test-file.json');
      expect(file?.contentType).toBe('application/json');
      expect(file?.body.toString()).toBe('{"key": "value"}');
    });

    test('should attach file with custom content type', async () => {
      const { attachedFiles } = createMockSetup();

      await attachFileFromStep('test-file.txt', 'file content', 'text/plain');

      const [file] = attachedFiles;
      expect(file?.name).toBe('test-file.txt');
      expect(file?.contentType).toBe('text/plain');
      expect(file?.body.toString()).toBe('file content');
    });

    test('should convert string content to Buffer', async () => {
      const { attachedFiles } = createMockSetup();

      await attachFileFromStep('test.txt', 'test content');

      const [file] = attachedFiles;
      expect(file?.body).toBeInstanceOf(Buffer);
      expect(file?.body.toString('utf8')).toBe('test content');
    });

    test('should throw error when attach fails', async () => {
      const mockTestInfo: MockTestInfo = {
        attach: async () => {
          throw new Error('Attachment failed');
        },
      };

      const stepFunction = mock(
        (title: string, callback: (testInfo: MockTestInfo) => Promise<void>) => {
          return callback(mockTestInfo);
        },
      );
      baseTest.step = stepFunction as unknown as typeof baseTest.step;

      await expect(attachFileFromStep('test.json', 'content')).rejects.toThrow('Attachment failed');
    });
  });
});
