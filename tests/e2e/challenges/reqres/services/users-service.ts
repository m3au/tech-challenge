import type { APIRequestContext } from '@playwright/test';

import { expect, Fixture, Given, Then, When, Step } from '@world';

import { setLastResponse, getLastResponse } from '../utils/response-tracker';
import { ResponseVerifier } from '../utils/response-verifier';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar: string;
}

export interface UserListResponse {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  data: User[];
  support?: {
    url: string;
    text: string;
  };
}

export interface SingleUserResponse {
  data: User;
  support?: {
    url: string;
    text: string;
  };
}

export interface CreateUserRequest {
  name: string;
  job: string;
}

export interface CreateUserResponse {
  name: string;
  job: string;
  id: string;
  createdAt: string;
}

@Fixture('UsersService')
export class UsersService {
  constructor(private request: APIRequestContext) {}

  private readonly usersEndpoint = '/api/users';
  private readonly userByIdEndpoint = (id: number) => `/api/users/${id}`;

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
  private lastUserList: UserListResponse | undefined = undefined;
  private lastUser: SingleUserResponse | undefined = undefined;
  private lastCreateResponse: CreateUserResponse | undefined = undefined;

  @Given('I retrieve all users')
  async getAllUsers(): Promise<void> {
    const response = await this.request.get(this.usersEndpoint);
    this.lastResponse = response;
    setLastResponse(response);
    await ResponseVerifier.verifyResponseIsOk(response);
    this.lastUserList = await response.json();
  }

  @Given('I retrieve users from page {int}')
  async getUsersByPage(page: number): Promise<void> {
    const response = await this.request.get(this.usersEndpoint, {
      params: { page: page.toString() },
    });
    this.lastResponse = response;
    setLastResponse(response);
    await ResponseVerifier.verifyResponseIsOk(response);
    this.lastUserList = await response.json();
  }

  @Given('I retrieve user with ID {int}')
  async getUserById(id: number): Promise<void> {
    const response = await this.request.get(this.userByIdEndpoint(id));
    this.lastResponse = response;
    setLastResponse(response);
    await ResponseVerifier.verifyResponseIsOk(response);
    this.lastUser = await response.json();
  }

  @Given('user with ID {int} exists')
  async verifyUserExists(id: number): Promise<void> {
    await this.getUserById(id);
  }

  @When('I create a new user with name {string} and job {string}')
  async createUser(name: string, job: string): Promise<void> {
    const response = await this.request.post(this.usersEndpoint, {
      data: { name, job },
    });
    this.lastResponse = response;
    setLastResponse(response);
    await ResponseVerifier.verifyResponseStatus(response, 201);
    this.lastCreateResponse = await response.json();
  }

  @When('I update user {int} with name {string} and job {string}')
  async updateUser(id: number, name: string, job: string): Promise<void> {
    const response = await this.request.put(this.userByIdEndpoint(id), {
      data: { name, job },
    });
    this.lastResponse = response;
    setLastResponse(response);
    await ResponseVerifier.verifyResponseIsOk(response);
    this.lastCreateResponse = await response.json();
  }

  @When('I delete user {int}')
  async deleteUser(id: number): Promise<void> {
    const response = await this.request.delete(this.userByIdEndpoint(id));
    this.lastResponse = response;
    setLastResponse(response);
    // DELETE returns 204 No Content, but we verify status in the step
  }

  @Then('I should receive a list of users')
  async verifyUsersList(): Promise<void> {
    if (!this.lastUserList) {
      throw new Error('No users retrieved. Call "I retrieve all users" first.');
    }
    await this.iVerifyUsersList(this.lastUserList);
  }

  @Then('the user list should have page {int}')
  async verifyUserListPage(expectedPage: number): Promise<void> {
    if (!this.lastUserList) {
      throw new Error('No user list retrieved. Call "I retrieve users from page" first.');
    }
    await this.iVerifyUserListPage(this.lastUserList, expectedPage);
  }

  @Then('the user list should have per_page {int}')
  async verifyUserListPerPage(expectedPerPage: number): Promise<void> {
    if (!this.lastUserList) {
      throw new Error('No user list retrieved. Call "I retrieve all users" first.');
    }
    await this.iVerifyUserListPerPage(this.lastUserList, expectedPerPage);
  }

  @Then('the user should have ID {int}')
  async verifyUserId(expectedId: number): Promise<void> {
    if (!this.lastUser) {
      throw new Error('No user retrieved. Call "I retrieve user with ID" first.');
    }
    await this.iVerifyUserId(this.lastUser, expectedId);
  }

  @Then('the user should have email {string}')
  async verifyUserEmail(expectedEmail: string): Promise<void> {
    if (!this.lastUser) {
      throw new Error('No user retrieved. Perform a user operation first.');
    }
    await this.iVerifyUserEmail(this.lastUser, expectedEmail);
  }

  @Then('the created user should have name {string}')
  async verifyCreatedUserName(expectedName: string): Promise<void> {
    if (!this.lastCreateResponse) {
      throw new Error('No user created. Call "I create a new user" first.');
    }
    await this.iVerifyCreatedUserName(this.lastCreateResponse, expectedName);
  }

  @Then('each user should have id, email, first_name, last_name, and avatar')
  async verifyUsersStructure(): Promise<void> {
    if (!this.lastUserList) {
      throw new Error('No users retrieved. Call "I retrieve all users" first.');
    }
    await this.iVerifyUsersStructure(this.lastUserList);
  }

  @Then('the response status should be {int}')
  async verifyResponseStatus(status: number): Promise<void> {
    const response = getLastResponse();
    if (!response) {
      throw new Error('No response available. Perform an API request first.');
    }
    await ResponseVerifier.verifyResponseStatus(response, status);
  }

  @Step
  private async iVerifyUsersList(userList: UserListResponse): Promise<void> {
    expect(userList).toHaveProperty('data');
    expect(Array.isArray(userList.data)).toBeTruthy();
    expect(userList.data.length).toBeGreaterThan(0);
  }

  @Step
  private async iVerifyUserListPage(
    userList: UserListResponse,
    expectedPage: number,
  ): Promise<void> {
    expect(userList).toHaveProperty('page');
    expect(userList.page).toBe(expectedPage);
  }

  @Step
  private async iVerifyUserListPerPage(
    userList: UserListResponse,
    expectedPerPage: number,
  ): Promise<void> {
    expect(userList).toHaveProperty('per_page');
    expect(userList.per_page).toBe(expectedPerPage);
  }

  @Step
  private async iVerifyUserId(userResponse: SingleUserResponse, expectedId: number): Promise<void> {
    expect(userResponse).toHaveProperty('data');
    expect(userResponse.data).toHaveProperty('id');
    expect(userResponse.data.id).toBe(expectedId);
  }

  @Step
  private async iVerifyUserEmail(
    userResponse: SingleUserResponse,
    expectedEmail: string,
  ): Promise<void> {
    expect(userResponse).toHaveProperty('data');
    expect(userResponse.data).toHaveProperty('email');
    expect(userResponse.data.email).toBe(expectedEmail);
  }

  @Step
  private async iVerifyCreatedUserName(
    createResponse: CreateUserResponse,
    expectedName: string,
  ): Promise<void> {
    expect(createResponse).toHaveProperty('name');
    expect(createResponse.name).toBe(expectedName);
  }

  @Step
  private async iVerifyUsersStructure(userList: UserListResponse): Promise<void> {
    for (const user of userList.data) {
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('first_name');
      expect(user).toHaveProperty('last_name');
      expect(user).toHaveProperty('avatar');
      expect(typeof user.id).toBe('number');
      expect(typeof user.email).toBe('string');
      expect(typeof user.first_name).toBe('string');
      expect(typeof user.last_name).toBe('string');
      expect(typeof user.avatar).toBe('string');
    }
  }
}
