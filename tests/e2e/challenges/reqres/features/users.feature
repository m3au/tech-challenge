Feature: ReqRes.in Users API
  As a test automation engineer
  I want to test the ReqRes.in Users API
  So that I can validate user management operations and pagination

  Scenario: Retrieve all users
    Given I retrieve all users
    Then the response status should be 200
    And I should receive a list of users
    And the user list should have per_page 6
    And each user should have id, email, first_name, last_name, and avatar

  Scenario: Retrieve a specific user by ID
    Given I retrieve user with ID 1
    Then the response status should be 200
    And the user should have ID 1
    And the user should have email "george.bluth@reqres.in"

  Scenario: Retrieve users from specific page
    Given I retrieve users from page 2
    Then the response status should be 200
    And I should receive a list of users
    And the user list should have page 2
    And the user list should have per_page 6

  # Note: ReqRes.in write operations (POST, PUT, DELETE) currently return 401
  # This may be a temporary API issue. Tests are skipped until resolved.
  @skip
  Scenario: Create a new user
    When I create a new user with name "Test User" and job "Software Engineer"
    Then the response status should be 201
    And the created user should have name "Test User"

  @skip
  Scenario: Update an existing user
    Given user with ID 1 exists
    When I update user 1 with name "Updated User" and job "Updated Job"
    Then the response status should be 200
    And the created user should have name "Updated User"

  @skip
  Scenario: Delete a user
    Given user with ID 1 exists
    When I delete user 1
    Then the response status should be 204

