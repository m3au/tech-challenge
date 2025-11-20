import type { APIRequestContext } from '@playwright/test';

import { expect, Fixture, Given, Then, When, Step } from '@world';

import { setLastResponse } from '../utils/response-tracker';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  id?: number;
}

export interface ErrorResponse {
  error: string;
}

@Fixture('AuthService')
export class AuthService {
  constructor(private request: APIRequestContext) {}

  private readonly loginEndpoint = '/api/login';
  private readonly registerEndpoint = '/api/register';

  private lastResponse:
    | Awaited<
        ReturnType<
          | APIRequestContext['get']
          | APIRequestContext['post']
          | APIRequestContext['put']
          | APIRequestContext['delete']
        >
      >
    | undefined = undefined;
  private lastAuthResponse: AuthResponse | undefined = undefined;
  private lastErrorResponse: ErrorResponse | undefined = undefined;

  @Given('I login with email {string} and password {string}')
  async login(email: string, password: string): Promise<void> {
    const response = await this.request.post(this.loginEndpoint, {
      data: { email, password },
      headers: {
        'Content-Type': 'application/json',
      },
    });
    this.lastResponse = response;
    setLastResponse(response);
    const body = await response.json();
    if (response.ok()) {
      this.lastAuthResponse = body as AuthResponse;
    } else {
      this.lastErrorResponse = body as ErrorResponse;
    }
  }

  @Given('I register with email {string} and password {string}')
  async register(email: string, password: string): Promise<void> {
    const response = await this.request.post(this.registerEndpoint, {
      data: { email, password },
      headers: {
        'Content-Type': 'application/json',
      },
    });
    this.lastResponse = response;
    setLastResponse(response);
    const body = await response.json();
    if (response.ok()) {
      this.lastAuthResponse = body as AuthResponse;
    } else {
      this.lastErrorResponse = body as ErrorResponse;
    }
  }

  @When('I attempt to login with email {string} and password {string}')
  async attemptLogin(email: string, password: string): Promise<void> {
    await this.login(email, password);
  }

  @When('I attempt to register with email {string} and password {string}')
  async attemptRegister(email: string, password: string): Promise<void> {
    await this.register(email, password);
  }

  @Then('I should receive an authentication token')
  async verifyTokenReceived(): Promise<void> {
    if (!this.lastAuthResponse) {
      throw new Error('No authentication response. Perform login or register first.');
    }
    await this.iVerifyTokenReceived(this.lastAuthResponse);
  }

  @Then('the authentication should fail with error {string}')
  async verifyAuthError(expectedError: string): Promise<void> {
    if (!this.lastErrorResponse) {
      throw new Error('No error response. Perform authentication first.');
    }
    await this.iVerifyAuthError(this.lastErrorResponse, expectedError);
  }

  @Then('the token should not be empty')
  async verifyTokenNotEmpty(): Promise<void> {
    if (!this.lastAuthResponse) {
      throw new Error('No authentication response. Perform login or register first.');
    }
    await this.iVerifyTokenNotEmpty(this.lastAuthResponse);
  }

  @Step
  private async iVerifyTokenReceived(authResponse: AuthResponse): Promise<void> {
    expect(authResponse).toHaveProperty('token');
    expect(typeof authResponse.token).toBe('string');
    expect(authResponse.token.length).toBeGreaterThan(0);
  }

  @Step
  private async iVerifyAuthError(
    errorResponse: ErrorResponse,
    expectedError: string,
  ): Promise<void> {
    expect(errorResponse).toHaveProperty('error');
    expect(errorResponse.error).toBe(expectedError);
  }

  @Step
  private async iVerifyTokenNotEmpty(authResponse: AuthResponse): Promise<void> {
    expect(authResponse.token).toBeTruthy();
    expect(authResponse.token.length).toBeGreaterThan(0);
  }
}
