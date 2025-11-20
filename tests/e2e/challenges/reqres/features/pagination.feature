Feature: ReqRes.in Pagination
  As a test automation engineer
  I want to test pagination functionality
  So that I can validate paginated data retrieval

  Scenario: Retrieve first page of users
    Given I retrieve users from page 1
    Then the response status should be 200
    And I should receive a list of users
    And the user list should have page 1
    And the user list should have per_page 6

  Scenario: Retrieve second page of users
    Given I retrieve users from page 2
    Then the response status should be 200
    And I should receive a list of users
    And the user list should have page 2
    And the user list should have per_page 6

  Scenario: Retrieve last page of users
    Given I retrieve users from page 2
    Then the response status should be 200
    And I should receive a list of users
    And the user list should have page 2

