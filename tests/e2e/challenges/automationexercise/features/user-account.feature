Feature: User Account Management
  As a user
  I want to manage my account information
  So that I can update my profile

  Background:
    Given I am logged in to AutomationExercise
    And I navigate to the AutomationExercise home page

  Scenario: View account dashboard
    When I click on the logged in user name
    Then I see the account dashboard
    And I see account information

  Scenario: Update account information
    Given I am on the account dashboard
    When I update my account information
    Then I see the account updated successfully message

