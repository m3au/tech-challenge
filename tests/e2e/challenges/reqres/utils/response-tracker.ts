import type { APIRequestContext } from '@playwright/test';

type APIResponse = Awaited<
  ReturnType<
    | APIRequestContext['get']
    | APIRequestContext['post']
    | APIRequestContext['put']
    | APIRequestContext['delete']
  >
>;

let lastResponse: APIResponse | undefined;

export function setLastResponse(response: APIResponse): void {
  lastResponse = response;
}

export function getLastResponse(): APIResponse | undefined {
  return lastResponse;
}

export function clearLastResponse(): void {
  lastResponse = undefined;
}
