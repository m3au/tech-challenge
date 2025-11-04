import { CableSelectorPopup } from '@components/cable-selector-popup';
import { Fixture, Given, Then, expect, type Page, type Locator, When, Step } from '@world';
import { getRandomIndex, setTestContext } from '@utils';
import { getEnvironment } from '@data/config';

@Fixture('CableConfiguratorPage')
export class CableConfiguratorPage {
  private cableBeginningButton: Locator;
  private cableEndButton: Locator;
  private cableBeginningImageLocator: Locator;
  private cableEndImageLocator: Locator;
  private cableSelectorPopup: CableSelectorPopup;
  private productCountLocator: Locator;
  private loadingSpinnerLocator: Locator;
  private manufacturerSectionLocator: Locator;
  private manufacturerItemsLocator: Locator;
  private manufacturerItemLocator: Locator;
  private manufacturerPaginationArrowLocator: Locator;
  private manufacturerPaginationLeftArrowLocator: Locator;
  private manufacturerPaginationRightArrowLocator: Locator;
  private productListLocator: Locator;
  private productLinkLocator: Locator;
  private productPaginationLocator: Locator;
  private productPaginationNextLocator: Locator;
  private selectedManufacturerCount: number | undefined;
  private selectedManufacturerName: string | undefined;
  private serverProductCount: number | undefined;

  constructor(protected page: Page) {
    this.cableBeginningButton = this.page.getByRole('button', { name: 'cable beginning' });
    this.cableEndButton = this.page.getByRole('button', { name: 'cable end' });
    this.cableBeginningImageLocator = this.page
      .locator('.cg-plugButton--left')
      .locator('.cg-plugImage');
    this.cableEndImageLocator = this.page.locator('.cg-plugButton--right').locator('.cg-plugImage');
    this.cableSelectorPopup = new CableSelectorPopup(page);
    this.productCountLocator = this.page.locator('.cg-count');
    this.loadingSpinnerLocator = this.page.locator('.cg-filter img[alt="loading"][src*="loader"]');
    this.manufacturerSectionLocator = this.page.locator('.cg-brands');
    this.manufacturerItemsLocator = this.manufacturerSectionLocator.locator('.items');
    this.manufacturerItemLocator = this.manufacturerItemsLocator.locator('.item');
    this.manufacturerPaginationArrowLocator =
      this.manufacturerSectionLocator.locator('.scroll .arrow');
    this.manufacturerPaginationLeftArrowLocator = this.manufacturerSectionLocator
      .locator('.scroll .arrow:has(.chevron)')
      .first();
    this.manufacturerPaginationRightArrowLocator =
      this.manufacturerSectionLocator.locator('.scroll .arrow.active');
    this.productListLocator = this.page.locator('.cg-articles-list .fx-product-list-entry');
    this.productLinkLocator = this.page.locator('.cg-articles-list a.product__content');
    this.productPaginationLocator = this.page.locator(
      '.cg-articles-list .pagination, .cg-articles-list .fx-pagination',
    );
    this.productPaginationNextLocator = this.page.locator(
      '.cg-articles-list .pagination a[rel="next"], .cg-articles-list .fx-pagination a[rel="next"], .cg-articles-list .pagination .next, .cg-articles-list .fx-pagination .next',
    );
  }

  @Given('I navigate to the cable guy page')
  async navigate() {
    const { environment } = getEnvironment();
    const cableGuyUrl = `${environment.baseUrl}/intl/cableguy.html`;
    await this.page.goto(cableGuyUrl, { waitUntil: 'domcontentloaded' });
  }

  @When('I select a cable beginning of type {string}')
  async selectBeginningCableType(type: string) {
    await this.iVerifyCableConfiguratorReady();
    await this.iClickCableBeginning();
    await this.cableSelectorPopup.iSeeTheCableSelectorPopup();
    const actualType = await this.cableSelectorPopup.iSelectCableOfType(type);
    setTestContext({ cableBeginningType: actualType });
  }

  @Step
  private async iVerifyCableConfiguratorReady() {
    await expect(this.cableBeginningButton).toBeVisible();
    await expect(this.cableEndButton).toBeVisible();
  }

  @When('I select a cable end of type {string}')
  async selectEndCableType(type: string) {
    await this.iClickCableEnd();
    await this.cableSelectorPopup.iSeeTheCableSelectorPopup();
    const actualType = await this.cableSelectorPopup.iSelectCableOfType(type, true);
    setTestContext({ cableEndType: actualType });
  }

  @When('I select a cable beginning connector of type {string}')
  async selectCableBeginning(connector: string) {
    const isPopupOpen = await this.cableSelectorPopup.iSeeTheCableSelectorPopupIsOpen();

    if (!isPopupOpen) {
      await this.iClickCableBeginning();
      await this.cableSelectorPopup.iSeeTheCableSelectorPopup();
    }

    const actualConnector = await this.cableSelectorPopup.iSelectConnector(connector);
    await this.iSeeTheBeginningConnectorSelected();
    setTestContext({ cableBeginningConnector: actualConnector });
  }

  @When('I select a cable end connector of type {string}')
  async selectCableEnd(connector: string) {
    const isPopupOpen = await this.cableSelectorPopup.iSeeTheCableSelectorPopupIsOpen();

    if (!isPopupOpen) {
      await this.iClickCableEnd();
      await this.cableSelectorPopup.iSeeTheCableSelectorPopup();
    }

    const actualConnector = await this.cableSelectorPopup.iSelectConnector(connector);
    await this.iSeeTheEndConnectorSelected();
    await this.iWaitForManufacturerListUpdate();
    await this.iWaitForLoadingSpinnerToDisappear();
    setTestContext({ cableEndConnector: actualConnector });
  }

  @Step
  private async iSeeTheBeginningConnectorSelected() {
    await expect(this.cableBeginningImageLocator).toBeAttached({ timeout: 5000 });
    await expect(this.cableBeginningImageLocator).toHaveAttribute('src', /.+/);
  }

  @Step
  private async iSeeTheEndConnectorSelected() {
    await expect(this.cableEndImageLocator).toBeAttached({ timeout: 5000 });
    await expect(this.cableEndImageLocator).toHaveAttribute('src', /.+/);
  }

  @Step
  private async iClickCableBeginning() {
    await this.cableBeginningButton.click();
  }

  @Step
  private async iClickCableEnd() {
    await this.cableEndButton.click();
  }

  @Step
  private async iWaitForLoadingSpinnerToDisappear() {
    const loaderVisible = await this.loadingSpinnerLocator.isVisible().catch(() => false);
    if (loaderVisible) {
      await expect(this.loadingSpinnerLocator).toBeHidden({ timeout: 10_000 });
    }
    await expect(this.productCountLocator).toBeVisible({ timeout: 10_000 });
  }

  @When('I select a manufacturer of type {string}')
  async selectManufacturer(type: string) {
    await this.iWaitForManufacturerSectionVisible();
    await (type.toLowerCase() === 'random'
      ? this.iSelectRandomManufacturer()
      : this.iSelectSpecificManufacturer(type));
    await this.iWaitForApiResponseAndCaptureCount();
    await this.iWaitForLoadingSpinnerToDisappear();
  }

  @Step
  private async iWaitForApiResponseAndCaptureCount() {
    try {
      const response = await this.page.waitForResponse(
        (response) =>
          response.url().includes('cableguy_ajax.html') && response.request().method() === 'GET',
        { timeout: 10_000 },
      );

      const json = (await response.json()) as {
        data?: { result?: { articles?: { count?: number } } };
      };

      const count = json.data?.result?.articles?.count;
      if (typeof count === 'number') {
        this.serverProductCount = count;
      }
    } catch {
      // Continue if API response already completed
    }
  }

  /**
   * Waits for manufacturer list update after selecting end connector.
   * The list updates via AJAX - waits for both backend response and frontend DOM update.
   */
  @Step
  private async iWaitForManufacturerListUpdate() {
    await this.iWaitForManufacturerAjaxResponse();
    await this.iWaitForManufacturerFrontendUpdate();
  }

  /**
   * Waits for AJAX response that updates manufacturer list based on cable configuration.
   */
  @Step
  private async iWaitForManufacturerAjaxResponse() {
    try {
      const { environment } = getEnvironment();
      const baseUrlHostname = new URL(environment.baseUrl).hostname;

      await this.page.waitForResponse(
        (response) => {
          const url = response.url();
          return (
            url.includes(baseUrlHostname) &&
            url.includes('cableguy_ajax.html') &&
            response.request().method() === 'GET'
          );
        },
        { timeout: 10_000 },
      );
    } catch {
      // Continue if AJAX response already completed
    }
  }

  /**
   * Waits for frontend to finish updating manufacturer list DOM after AJAX response.
   * The frontend adds/removes manufacturers based on availability - waits until all items are rendered.
   */
  @Step
  private async iWaitForManufacturerFrontendUpdate() {
    await expect(this.manufacturerSectionLocator).toBeVisible({ timeout: 10_000 });

    await this.page
      .waitForFunction(
        () => {
          // eslint-disable-next-line no-undef -- document is available in browser context
          const manufacturerItems = document.querySelectorAll('.cg-brands .items .item');
          if (manufacturerItems.length === 0) return false;

          // Count items that have been rendered (have image or text content)
          let processedCount = 0;
          for (const item of manufacturerItems) {
            const hasImage = item.querySelector('img') !== null;
            const hasContent = item.textContent && item.textContent.trim().length > 0;
            if (hasImage || hasContent) {
              processedCount++;
            }
          }

          return processedCount === manufacturerItems.length && processedCount > 0;
        },
        { timeout: 5000 },
      )
      .catch(() => {});

    // Additional delay to ensure DOM mutations have settled
    await this.page.waitForTimeout(500);
  }

  @Step
  private async iWaitForManufacturerSectionVisible() {
    await expect(this.manufacturerSectionLocator).toBeVisible({ timeout: 10_000 });
    await expect(this.manufacturerItemLocator.first()).toBeVisible({ timeout: 5000 });
  }

  @Step
  private async iSelectRandomManufacturer() {
    const totalCount = await this.manufacturerItemLocator.count();
    if (totalCount === 0) throw new Error('No manufacturers available to select');

    const randomIndex = getRandomIndex(totalCount);
    const manufacturer = this.manufacturerItemLocator.nth(randomIndex);
    await manufacturer.waitFor({ state: 'attached', timeout: 5000 });
    const manufacturerName = await this.iGetManufacturerName(manufacturer);
    await this.iClickManufacturer(randomIndex, manufacturerName);
  }

  @Step
  private async iSelectSpecificManufacturer(manufacturerName: string) {
    const manufacturerLocator = this.manufacturerItemLocator.filter({
      has: this.page.locator(`img[alt="${manufacturerName}"]`),
    });

    const isVisible = await manufacturerLocator
      .first()
      .isVisible()
      .catch(() => false);
    if (!isVisible) {
      await this.iFindAndNavigateToManufacturer(manufacturerName);
      const refreshedLocator = this.manufacturerItemLocator.filter({
        has: this.page.locator(`img[alt="${manufacturerName}"]`),
      });
      await this.iClickManufacturerByLocator(refreshedLocator.first(), manufacturerName);
      return;
    }

    await this.iClickManufacturerByLocator(manufacturerLocator.first(), manufacturerName);
  }

  @Step
  private async iFindAndNavigateToManufacturer(manufacturerName: string) {
    const totalCount = await this.manufacturerItemLocator.count();
    for (let index = 0; index < totalCount; index++) {
      const item = this.manufacturerItemLocator.nth(index);
      const altText = await item.locator('img').getAttribute('alt');
      if (altText?.toLowerCase() === manufacturerName.toLowerCase()) {
        await this.iNavigateToManufacturerPage(index, totalCount);
        return;
      }
    }
    throw new Error(`Manufacturer "${manufacturerName}" not found`);
  }

  @Step
  private async iNavigateToManufacturerPage(
    manufacturerIndex: number,
    _totalManufacturers: number,
  ) {
    const itemsPerPage = await this.iGetManufacturersPerPage();
    const targetPageIndex = Math.floor(manufacturerIndex / itemsPerPage);
    const currentPageIndex = await this.iGetCurrentManufacturerPageIndex();

    await this.iNavigateToManufacturerPageIndex(currentPageIndex, targetPageIndex);
  }

  @Step
  private async iGetManufacturersPerPage(): Promise<number> {
    const visibleCount = await this.manufacturerItemLocator.count();
    const paginationCount = await this.manufacturerPaginationArrowLocator.count();
    return paginationCount > 0 ? Math.ceil(visibleCount / paginationCount) : visibleCount;
  }

  @Step
  private async iGetCurrentManufacturerPageIndex(): Promise<number> {
    const arrowCount = await this.manufacturerPaginationArrowLocator.count();
    for (let index = 0; index < arrowCount; index++) {
      const arrow = this.manufacturerPaginationArrowLocator.nth(index);
      const isActive = await arrow.evaluate((element) => {
        return element.classList.contains('active');
      });
      if (isActive) return index;
    }
    return 0;
  }

  @Step
  private async iNavigateToManufacturerPageIndex(
    currentPageIndex: number,
    targetPageIndex: number,
  ) {
    while (currentPageIndex !== targetPageIndex) {
      if (currentPageIndex < targetPageIndex) {
        const navigated = await this.iNavigateManufacturerRight();
        if (!navigated) break;
        currentPageIndex = targetPageIndex;
        continue;
      }

      const navigated = await this.iNavigateManufacturerLeft();
      if (!navigated) break;
      currentPageIndex = targetPageIndex;
    }
  }

  @Step
  private async iNavigateManufacturerRight(): Promise<boolean> {
    const hasRightArrow = await this.manufacturerPaginationRightArrowLocator.isVisible();
    if (!hasRightArrow) return false;

    await this.manufacturerPaginationRightArrowLocator.click();
    await expect(this.manufacturerItemLocator.first()).toBeVisible({ timeout: 5000 });
    return true;
  }

  @Step
  private async iNavigateManufacturerLeft(): Promise<boolean> {
    const hasLeftArrow = await this.manufacturerPaginationLeftArrowLocator.isVisible();
    if (!hasLeftArrow) return false;

    await this.manufacturerPaginationLeftArrowLocator.click();
    await expect(this.manufacturerItemLocator.first()).toBeVisible({ timeout: 5000 });
    return true;
  }

  @Step
  private async iClickManufacturer(index: number, _manufacturerName: string) {
    const manufacturer = this.manufacturerItemLocator.nth(index);
    await manufacturer.waitFor({ state: 'attached', timeout: 5000 });
    await expect(manufacturer).toBeVisible();
    await this.iCaptureManufacturerCount(manufacturer);
    await this.iCaptureManufacturerName(manufacturer);
    await this.iClickManufacturerItem(manufacturer);
  }

  @Step
  private async iClickManufacturerByLocator(manufacturer: Locator, _manufacturerName: string) {
    await manufacturer.waitFor({ state: 'attached', timeout: 5000 });
    await expect(manufacturer).toBeVisible();
    await this.iCaptureManufacturerCount(manufacturer);
    await this.iCaptureManufacturerName(manufacturer);
    await this.iClickManufacturerItem(manufacturer);
  }

  @Step
  private async iCaptureManufacturerCount(manufacturer: Locator) {
    const countLocator = manufacturer.locator('.cg-brands__item__count');
    const countText = await countLocator.textContent();
    if (countText) {
      this.selectedManufacturerCount = Number.parseInt(countText.trim(), 10);
    }
  }

  @Step
  private async iCaptureManufacturerName(manufacturer: Locator) {
    // Try to get manufacturer name from image alt text first
    const imageAlt = await manufacturer
      .locator('img')
      .getAttribute('alt')
      .catch(() => {
        return '';
      });
    if (imageAlt) {
      this.selectedManufacturerName = imageAlt;
      return;
    }
    // Fallback to text content if image alt is not available
    const textContent = await manufacturer.textContent();
    if (textContent) {
      this.selectedManufacturerName = textContent.trim();
    }
  }

  @Step
  private async iGetManufacturerName(manufacturer: Locator): Promise<string> {
    // Try to get manufacturer name from image alt text first
    const imageAlt = await manufacturer
      .locator('img')
      .getAttribute('alt')
      .catch(() => {
        return '';
      });
    if (imageAlt) {
      return imageAlt;
    }
    // Fallback to text content if image alt is not available
    const textContent = await manufacturer.textContent();
    if (textContent) {
      return textContent.trim();
    }
    return 'unknown';
  }

  @Step
  private async iClickManufacturerItem(manufacturer: Locator) {
    const manufacturerImage = manufacturer.locator('.cg-brands__item');
    await manufacturerImage.click({ timeout: 10_000 });
  }

  @Then('I see the available products')
  async verifyAvailableProducts() {
    await expect(this.productCountLocator).toBeVisible({ timeout: 10_000 });
    const loaderVisible = await this.loadingSpinnerLocator.isVisible().catch(() => false);
    if (loaderVisible) {
      await expect(this.loadingSpinnerLocator).toBeHidden({ timeout: 10_000 });
    }
    const countText = await this.productCountLocator.textContent();
    if (!countText) throw new Error('Product count text is empty');
    const lowerText = countText.toLowerCase();
    expect(lowerText).toMatch(/^\d+/);
    expect(lowerText.includes('cables') && lowerText.includes('found')).toBe(true);

    if (this.selectedManufacturerCount !== undefined) {
      await this.iVerifyManufacturerProductCount();
    }
  }

  @Step
  private async iVerifyManufacturerProductCount() {
    if (this.serverProductCount === undefined) {
      throw new Error('Server product count not available from AJAX response');
    }
    if (this.selectedManufacturerCount === undefined) {
      throw new Error('Manufacturer count not available from badge');
    }

    expect
      .soft(
        this.serverProductCount,
        `Manufacturer product count mismatch: Server AJAX response indicates ${this.serverProductCount} products, but manufacturer badge shows ${this.selectedManufacturerCount} products`,
      )
      .toBe(this.selectedManufacturerCount);
  }

  /**
   * Checks if there's a next page of products available.
   */
  @Step
  private async iHasNextProductPage(): Promise<boolean> {
    const nextButtonVisible = await this.productPaginationNextLocator
      .isVisible()
      .catch(() => false);
    if (nextButtonVisible) {
      const isDisabled = await this.productPaginationNextLocator
        .evaluate((element) => {
          return (
            element.classList.contains('disabled') ||
            element.hasAttribute('disabled') ||
            element.getAttribute('aria-disabled') === 'true'
          );
        })
        .catch(() => false);
      return !isDisabled;
    }

    // Alternative: Check for pagination indicators (e.g., "page 1 of 2")
    const paginationText = await this.productPaginationLocator.textContent().catch(() => {
      return '';
    });
    if (paginationText) {
      const pageMatch = paginationText.match(/page\s+(\d+)\s+of\s+(\d+)/i);
      if (pageMatch) {
        const currentPage = Number.parseInt(pageMatch[1]!, 10);
        const totalPages = Number.parseInt(pageMatch[2]!, 10);
        return currentPage < totalPages;
      }
    }

    return false;
  }

  @Step
  private async iNavigateToNextProductPage() {
    const nextButton = this.productPaginationNextLocator.first();
    await nextButton.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {
      throw new Error('Next page button not found or not visible');
    });
    await nextButton.click({ timeout: 5000 });
    await this.page.waitForTimeout(500);
  }

  @When('I select the product {string}')
  async selectProduct(type: string) {
    const productCount = await this.productLinkLocator.count();
    if (productCount === 0) throw new Error('No products available to select');

    const productToSelect = await this.iGetProductToSelect(type);
    await this.iClickProduct(productToSelect);
  }

  @Step
  private async iGetProductToSelect(type: string): Promise<Locator> {
    return type.toLowerCase() === 'any' || type.toLowerCase() === 'random'
      ? this.productLinkLocator.first()
      : this.productLinkLocator.filter({ hasText: type }).first();
  }

  @Step
  private async iClickProduct(product: Locator) {
    await product.waitFor({ state: 'visible', timeout: 5000 });
    await product.scrollIntoViewIfNeeded();
    await product.click({ timeout: 5000 });
  }
}
