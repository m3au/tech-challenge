import { Fixture, Then, When, Step, expect, type Page, type Locator } from '@world';
import { waitForAjaxResponseFromHost, waitForDOMStabilization } from '@utils';
import { getEnvironment } from '@data/config';

@Fixture('ProductDetailPage')
export class ProductDetailPage {
  private productTitleLocator: Locator;
  private addToBasketButtonLocator: Locator;
  private basketNotificationLocator: Locator;

  constructor(protected page: Page) {
    this.productTitleLocator = this.page.getByRole('heading', { level: 1 });
    this.addToBasketButtonLocator = this.page.getByRole('button', {
      name: 'ADD TO BASKET',
    });
    // Use a more flexible locator that can match text even if split across elements
    this.basketNotificationLocator = this.page
      .locator('text=/is now in the shopping basket/i')
      .first();
  }

  @Then('I see the product page')
  async verifyProductPageOpened(): Promise<void> {
    await this.iSeeTheProductPage();
  }

  @Step
  async iSeeTheProductPage(): Promise<void> {
    await expect(this.productTitleLocator).toBeVisible({ timeout: 10_000 });
    await expect(this.productTitleLocator).toHaveText(/.+/);
  }

  @When('I add the product to shopping basket')
  async addToShoppingBasket(): Promise<void> {
    await expect(this.addToBasketButtonLocator).toBeVisible({ timeout: 10_000 });
    await this.addToBasketButtonLocator.scrollIntoViewIfNeeded();
    await this.addToBasketButtonLocator.click({ timeout: 5000, noWaitAfter: true });
    // Notification appears via AJAX after basket update - wait for backend response and DOM update
    await this.iWaitForBasketNotificationToAppear();
  }

  @Then('I see the product in my shopping basket')
  async verifyProductInShoppingBasket(): Promise<void> {
    await this.iSeeTheBasketNotificationPopup();
  }

  /**
   * Waits for basket notification to appear after adding product.
   * Notification appears after AJAX request completes and frontend updates DOM.
   * We verify it immediately when it appears, before it auto-dismisses.
   */
  @Step
  private async iWaitForBasketNotificationToAppear(): Promise<void> {
    await this.iWaitForBasketAjaxResponse();
    // Wait for notification element to be added to DOM (may take time after AJAX)
    await this.basketNotificationLocator.waitFor({ state: 'attached', timeout: 10_000 });
    // Verify it's visible (element exists but might still be hidden initially)
    await expect(this.basketNotificationLocator).toBeVisible({ timeout: 3000 });
    await this.iWaitForBasketNotificationDOMUpdate();
  }

  /**
   * Waits for AJAX response that processes basket addition and returns updated basket data.
   */
  @Step
  private async iWaitForBasketAjaxResponse(): Promise<void> {
    const { environment } = getEnvironment();
    const hostname = new URL(environment.baseUrl).hostname;

    await waitForAjaxResponseFromHost(this.page, environment.baseUrl, 'basket', {
      timeout: 10_000,
    });

    // Also try cart/ajax endpoints if basket didn't match
    await this.page
      .waitForResponse(
        (response) => {
          const url = response.url();
          return (
            url.includes(hostname) &&
            (url.includes('cart') || url.includes('ajax') || response.request().method() === 'POST')
          );
        },
        { timeout: 1000 },
      )
      .catch(() => {
        // Response may have already completed
      });
  }

  /**
   * Waits for frontend to render basket notification in DOM after basket update.
   */
  @Step
  private async iWaitForBasketNotificationDOMUpdate(): Promise<void> {
    await waitForDOMStabilization(this.page);
  }

  @Step
  private async iSeeTheBasketNotificationPopup(): Promise<void> {
    // Notification was already verified in iWaitForBasketNotificationToAppear
    // This step is now a no-op since we check it immediately when it appears
  }
}
