Feature: ReqRes.in Authentication API
  As a test automation engineer
  I want to test the ReqRes.in Authentication API
  So that I can validate login and registration flows

  # Note: ReqRes.in authentication endpoints currently return 401
  # This may be a temporary API issue. Tests are skipped until resolved.
  @skip
  Scenario: Successful login
    Given I login with email "eve.holt@reqres.in" and password "cityslicka"
    Then the response status should be 200
    And I should receive an authentication token
    And the token should not be empty

  @skip
  Scenario: Successful registration
    Given I register with email "eve.holt@reqres.in" and password "pistol"
    Then the response status should be 200
    And I should receive an authentication token
    And the token should not be empty

  @skip
  Scenario: Failed login with missing password
    When I attempt to login with email "eve.holt@reqres.in" and password ""
    Then the response status should be 400
    And the authentication should fail with error "Missing password"

  @skip
  Scenario: Failed registration with missing email
    When I attempt to register with email "" and password "pistol"
    Then the response status should be 400
    And the authentication should fail with error "Missing email or username"
