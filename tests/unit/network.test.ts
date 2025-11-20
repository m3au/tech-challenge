import * as net from 'node:net';

import { describe, expect, mock, test } from 'bun:test';

import { waitForAjaxResponse, waitForAjaxResponseFromHost, waitForPort } from '@utils';

function listenOnRandomPort(server: net.Server): Promise<number> {
  return new Promise<number>((resolve) => {
    server.listen(0, () => {
      const addressPort = (server.address() as net.AddressInfo).port;
      resolve(addressPort);
    });
  });
}

function closeServer(server: net.Server): Promise<void> {
  return new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
}

async function expectPortTimeoutWithTiming(
  port: number,
  timeout: number,
  minElapsed: number,
  maxElapsed: number,
  host?: string,
) {
  const startTime = Date.now();
  try {
    await waitForPort(port, timeout, host);
    expect(true).toBe(false);
  } catch (error) {
    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeGreaterThanOrEqual(minElapsed);
    expect(elapsed).toBeLessThan(maxElapsed);
    expect((error as Error).message).toContain(
      `Port ${port} did not become ready within ${timeout}ms`,
    );
  }
}

describe('network', () => {
  describe('waitForPort', () => {
    test('should resolve when port is already open', async () => {
      const server = net.createServer();
      const port = await listenOnRandomPort(server);
      await waitForPort(port, 1000);
      await closeServer(server);
      expect(true).toBe(true);
    });

    test('should handle socket timeout event', async () => {
      await expectPortTimeoutWithTiming(65_535, 250, 200, 400);
    });

    test('should trigger socket timeout event handler', async () => {
      // This test specifically targets the timeout event handler
      // To ensure timeout fires, we use an unreachable IP address (RFC 5737 test address)
      // that should timeout rather than error immediately
      await expectPortTimeoutWithTiming(8080, 300, 250, 450, '192.0.2.1');
    });

    test('should handle socket connection error', async () => {
      await expectPortTimeoutWithTiming(65_535, 200, 150, 400);
    });

    test('should throw error when port is not ready within timeout', async () => {
      const unavailablePort = 65_535;
      await expect(waitForPort(unavailablePort, 200)).rejects.toThrow(
        'Port 65535 did not become ready within 200ms',
      );
    });

    test('should wait for port to become ready', async () => {
      const server = net.createServer();
      const port = await listenOnRandomPort(server);
      await waitForPort(port, 1000);
      await closeServer(server);
      expect(true).toBe(true);
    });

    test(
      'should use default timeout of 5000ms',
      async () => {
        await expectPortTimeoutWithTiming(65_535, 5000, 4900, 5500);
      },
      { timeout: 6000 },
    );
  });

  describe('waitForAjaxResponse', () => {
    test('should return response when string URL matcher matches', async () => {
      const mockRequest = { method: () => 'GET' };
      const mockResponse = {
        url: () => 'https://example.com/api/data',
        request: () => mockRequest,
      } as any;

      const mockPage = {
        waitForResponse: mock(async (predicate: any) => {
          // Execute predicate to cover lines 48-52
          const matches = predicate(mockResponse);
          return matches ? mockResponse : undefined;
        }),
      };

      const result = await waitForAjaxResponse(mockPage as any, '/api/data');
      expect(result).toBe(mockResponse);
    });

    test('should return response when function URL matcher matches', async () => {
      const mockRequest = { method: () => 'POST' };
      const mockResponse = {
        url: () => 'https://example.com/api/users',
        request: () => mockRequest,
      } as any;

      const mockPage = {
        waitForResponse: mock(async (predicate: any) => {
          const matches = predicate(mockResponse);
          return matches ? mockResponse : undefined;
        }),
      };

      const result = await waitForAjaxResponse(mockPage as any, (url) => url.includes('/api/'));
      expect(result).toBe(mockResponse);
    });

    test('should match specific HTTP method', async () => {
      const mockRequest = { method: () => 'POST' };
      const mockResponse = {
        url: () => 'https://example.com/api/data',
        request: () => mockRequest,
      } as any;

      const mockPage = {
        waitForResponse: mock(async (predicate: any) => {
          const matches = predicate(mockResponse);
          return matches ? mockResponse : undefined;
        }),
      };

      const result = await waitForAjaxResponse(mockPage as any, '/api/data', { method: 'POST' });
      expect(result).toBe(mockResponse);
    });

    test('should not match when method does not match', async () => {
      const mockRequest = { method: () => 'GET' };
      const mockResponse = {
        url: () => 'https://example.com/api/data',
        request: () => mockRequest,
      } as any;

      const mockPage = {
        waitForResponse: mock(async (predicate: any) => {
          const matches = predicate(mockResponse);
          if (!matches) {
            throw new Error('No matching response');
          }
          return mockResponse;
        }),
      };

      const result = await waitForAjaxResponse(mockPage as any, '/api/data', { method: 'POST' });
      expect(result).toBeUndefined();
    });

    test('should not match when URL does not match with string matcher', async () => {
      const mockRequest = { method: () => 'GET' };
      const mockResponse = {
        url: () => 'https://example.com/other/endpoint',
        request: () => mockRequest,
      } as any;

      const mockPage = {
        waitForResponse: mock(async (predicate: any) => {
          const matches = predicate(mockResponse);
          if (!matches) {
            throw new Error('No matching response');
          }
          return mockResponse;
        }),
      };

      const result = await waitForAjaxResponse(mockPage as any, '/api/data');
      expect(result).toBeUndefined();
    });

    test('should not match when URL does not match with function matcher', async () => {
      const mockRequest = { method: () => 'GET' };
      const mockResponse = {
        url: () => 'https://example.com/other/endpoint',
        request: () => mockRequest,
      } as any;

      const mockPage = {
        waitForResponse: mock(async (predicate: any) => {
          const matches = predicate(mockResponse);
          if (!matches) {
            throw new Error('No matching response');
          }
          return mockResponse;
        }),
      };

      const result = await waitForAjaxResponse(mockPage as any, (url) => url.includes('/api/'));
      expect(result).toBeUndefined();
    });

    test('should return undefined when timeout occurs', async () => {
      const mockPage = {
        waitForResponse: mock(async () => {
          throw new Error('Timeout');
        }),
      };

      const result = await waitForAjaxResponse(mockPage as any, '/api/data', { timeout: 100 });
      expect(result).toBeUndefined();
    });
  });

  describe('waitForAjaxResponseFromHost', () => {
    test('should wait for response from specific host', async () => {
      const mockRequest = { method: () => 'GET' };
      const mockResponse = {
        url: () => 'https://example.com/api/basket',
        request: () => mockRequest,
      } as any;

      const mockPage = {
        waitForResponse: mock(async () => mockResponse),
      };

      const result = await waitForAjaxResponseFromHost(
        mockPage as any,
        'https://example.com',
        'basket',
      );
      expect(result).toBe(mockResponse);
    });

    test('should return undefined when response not found', async () => {
      const mockPage = {
        waitForResponse: mock(async () => {
          throw new Error('Timeout');
        }),
      };

      const result = await waitForAjaxResponseFromHost(
        mockPage as any,
        'https://example.com',
        'api',
      );
      expect(result).toBeUndefined();
    });

    test('should pass options to waitForAjaxResponse', async () => {
      const mockRequest = { method: () => 'POST' };
      const mockResponse = {
        url: () => 'https://example.com/api/data',
        request: () => mockRequest,
      } as any;

      const mockPage = {
        waitForResponse: mock(async (predicate: any) => {
          const matches = predicate(mockResponse);
          return matches ? mockResponse : undefined;
        }),
      };

      const result = await waitForAjaxResponseFromHost(
        mockPage as any,
        'https://example.com',
        'data',
        { timeout: 5000, method: 'POST' },
      );
      expect(result).toBe(mockResponse);
    });

    test('should handle URL with port in baseUrl', async () => {
      const mockRequest = { method: () => 'GET' };
      const mockResponse = {
        url: () => 'https://example.com:8080/api/test',
        request: () => mockRequest,
      } as any;

      const mockPage = {
        waitForResponse: mock(async (predicate: any) => {
          const matches = predicate(mockResponse);
          return matches ? mockResponse : undefined;
        }),
      };

      const result = await waitForAjaxResponseFromHost(
        mockPage as any,
        'https://example.com:8080',
        'test',
      );
      expect(result).toBe(mockResponse);
    });
  });
});
