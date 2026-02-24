import { type Page, type Locator, expect } from '@playwright/test';

export class TransactionPage {
  readonly page: Page;
  readonly addButton: Locator;
  readonly amountInput: Locator;
  readonly descriptionInput: Locator;
  readonly categorySelect: Locator;
  readonly accountSelect: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addButton = page.getByTestId('btn-add-transaction').first();
    this.amountInput = page.getByTestId('input-amount');
    this.descriptionInput = page.getByTestId('input-description');
    this.categorySelect = page.getByTestId('select-category');
    this.accountSelect = page.getByTestId('select-account');
    this.saveButton = page.getByTestId('btn-save-transaction');
  }

  async createTransaction(data: {
    amount: number;
    description: string;
    category?: string;
    account?: string;
    date?: string;
    type: 'receita' | 'despesa';
  }) {
    await this.addButton.click();
    
    // Select type
    await this.page.getByRole('button', { name: data.type, exact: true }).click();
    
    // Fill text inputs
    await this.amountInput.fill(String(data.amount));
    await this.descriptionInput.fill(data.description);
    
    // Fill Date
    const dateToFill = data.date || (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();
    await this.page.getByLabel('Data').fill(dateToFill);
    
    // Fill category if provided
    if (data.category) {
      await this.categorySelect.selectOption({ label: data.category });
    } else {
      await this.categorySelect.selectOption({ index: 1 });
    }
    
    // Fill account if provided
    if (data.account) {
      await this.accountSelect.selectOption({ label: data.account });
    } else {
      await this.accountSelect.selectOption({ index: 1 });
    }
    
    
    await this.saveAndWait();
  }

  async saveAndWait() {
    await this.saveButton.click();
    await expect(this.saveButton).not.toBeVisible();
  }
}
