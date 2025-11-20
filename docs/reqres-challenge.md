# ReqRes.in API Challenge Documentation

## Overview

The ReqRes.in API challenge demonstrates **authentication and pagination testing patterns** using [ReqRes.in](https://reqres.in/), a hosted REST API designed for testing and prototyping. This challenge extends the API testing framework established in the JSONPlaceholder challenge, adding authentication flows, token management, and pagination testing.

## Challenge Structure

```text
tests/e2e/challenges/reqres/
├── features/
│   ├── authentication.feature    # Authentication scenarios
│   ├── users.feature             # User management scenarios
│   └── pagination.feature        # Pagination scenarios
├── services/
│   ├── auth-service.ts           # Authentication service (login, register)
│   └── users-service.ts          # Users API service
├── utils/
│   ├── token-manager.ts          # Token management utility
│   ├── response-verifier.ts     # Response verification utilities
│   └── response-tracker.ts      # Response tracking utilities
└── world.ts                      # API world fixture (APIRequestContext)
```

## API Endpoints

### Authentication Endpoints

- **POST** `/api/login` - User login
- **POST** `/api/register` - User registration

### Users Endpoints

- **GET** `/api/users` - List all users (with pagination)
- **GET** `/api/users?page={page}` - Get users by page
- **GET** `/api/users/{id}` - Get user by ID
- **POST** `/api/users` - Create user
- **PUT** `/api/users/{id}` - Update user
- **DELETE** `/api/users/{id}` - Delete user

## Test Scenarios

### Authentication Feature (4 scenarios)

**Note**: Currently skipped due to ReqRes.in API returning 401 responses.

1. **Successful login** - Login with valid credentials and receive token
2. **Successful registration** - Register new user and receive token
3. **Failed login with missing password** - Test validation error handling
4. **Failed registration with missing email** - Test validation error handling

### Users Feature (6 scenarios)

**Note**: Write operations (create, update, delete) are currently skipped due to API 401 responses.

1. **Retrieve all users** - Get paginated list of users
2. **Retrieve a specific user by ID** - Get single user details
3. **Retrieve users from specific page** - Test pagination
4. **Create a new user** - POST operation (skipped)
5. **Update an existing user** - PUT operation (skipped)
6. **Delete a user** - DELETE operation (skipped)

### Pagination Feature (3 scenarios)

1. **Retrieve first page of users** - Test initial page load
2. **Retrieve second page of users** - Test page navigation
3. **Retrieve last page of users** - Test boundary conditions

## Implementation Details

### Authentication Service

The `AuthService` class handles authentication operations:

```typescript
@Fixture('AuthService')
export class AuthService {
  @Given('I login with email {string} and password {string}')
  async login(email: string, password: string): Promise<void>

  @Given('I register with email {string} and password {string}')
  async register(email: string, password: string): Promise<void>

  @Then('I should receive an authentication token')
  async verifyTokenReceived(): Promise<void>
}
```

### Users Service

The `UsersService` class handles user management operations:

```typescript
@Fixture('UsersService')
export class UsersService {
  @Given('I retrieve all users')
  async getAllUsers(): Promise<void>

  @Given('I retrieve users from page {int}')
  async getUsersByPage(page: number): Promise<void>

  @Given('I retrieve user with ID {int}')
  async getUserById(id: number): Promise<void>
}
```

### Token Manager

The `TokenManager` utility provides token management:

```typescript
export class TokenManager {
  static async getToken(request: APIRequestContext): Promise<string>;
  static clearToken(): void;
  static hasToken(): boolean;
}
```

## API Object Model (AOM) Pattern

Following the same AOM pattern as JSONPlaceholder:

- **Service Classes**: One service per API resource (`AuthService`, `UsersService`)
- **BDD Decorators**: `@Given`, `@When`, `@Then` for step definitions
- **Step Methods**: `@Step` for internal helper methods
- **Response Tracking**: Global response tracker for shared step definitions
- **Response Verification**: Centralized verification utilities

## World Fixture

The ReqRes.in world fixture extends the base world but uses `APIRequestContext` instead of `Page`:

```typescript
export const test = bddTest.extend<{
  request: APIRequestContext;
  AuthService: AuthService;
  UsersService: UsersService;
  world: {
    request: APIRequestContext;
    data: ReturnType<typeof getEnvironment>;
    testContext: TestContext;
    testInfo: TestInfo;
  };
}>({
  request: async ({ playwright }, use) => {
    const baseURL = environment('BASE_URL_REQRES')!;
    const requestContext = await playwright.request.newContext({
      baseURL,
    });
    await use(requestContext);
    await requestContext.dispose();
  },
  // ... service fixtures
});
```

## Key Differences from UI Challenges

- **No Browser**: Uses `APIRequestContext` instead of `Page`
- **No Screenshots**: API tests don't generate screenshots or videos
- **Response Attachments**: Optional response body attachments for debugging
- **Faster Execution**: No browser launch overhead

## Environment Configuration

Required environment variable:

```bash
BASE_URL_REQRES=https://reqres.in
```

Optional authentication credentials (for future use):

```bash
REQRES_TEST_EMAIL=eve.holt@reqres.in
REQRES_TEST_PASSWORD=cityslicka
```

## Running Tests

```bash
# Run all ReqRes.in API tests
bun run test -- --project=reqres-api

# Run specific feature
bun run test -- --project=reqres-api --grep "Authentication"

# Run with UI mode
bun run test -- --project=reqres-api --ui
```

## Current Status

- ✅ **5 tests passing** - GET operations (retrieve users, pagination)
- ⏸️ **6 tests skipped** - Authentication and write operations (API returning 401)

The test structure and patterns are complete. Tests are skipped until ReqRes.in API authentication issues are resolved.

## References

- [ReqRes.in API Documentation](https://reqres.in/)
- [Playwright API Testing](https://playwright.dev/docs/test-api-testing)
- [API Challenges Plan](./api-challenges-plan.md)
