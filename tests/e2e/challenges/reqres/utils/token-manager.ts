import type { APIRequestContext } from '@playwright/test';

import { environment } from '@world';

export class TokenManager {
  private static token: string | undefined = undefined;

  static async getToken(request: APIRequestContext): Promise<string> {
    if (!this.token) {
      const response = await request.post('/api/login', {
        data: {
          email: environment('REQRES_TEST_EMAIL') || 'eve.holt@reqres.in',
          // cspell:ignore cityslicka
          password: environment('REQRES_TEST_PASSWORD') || 'cityslicka',
        },
      });
      const body = await response.json();
      this.token = body.token;
      if (!this.token) {
        throw new Error('Failed to retrieve authentication token');
      }
    }
    return this.token;
  }

  static clearToken(): void {
    this.token = undefined;
  }

  static hasToken(): boolean {
    return this.token !== undefined;
  }
}
