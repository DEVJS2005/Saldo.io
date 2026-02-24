import { test, expect } from '@playwright/test';
import { TransactionPage } from '../pages/TransactionPage';

test.describe('Parcelamentos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('deve criar despesa com 3 parcelas e verificar', async ({ page }) => {
    const transactionPage = new TransactionPage(page);
    const desc = `Parcelada Teste ${Date.now()}`;
    
    await transactionPage.addButton.click();
    await page.getByRole('button', { name: 'despesa', exact: true }).click();
    await transactionPage.amountInput.fill('300'); // total
    await transactionPage.descriptionInput.fill(desc);
    await transactionPage.categorySelect.selectOption({ index: 1 });
    await transactionPage.accountSelect.selectOption({ index: 1 });
    
    // Set installments
    // It's the input right after "Total de Parcelas" label. But it doesn't have an ID or testId.
    // The previous implementation used an input element with min="1" max="60".
    // Let's locate it by label or type
    await page.locator('input[type="number"][max="60"]').fill('3');
    
    await transactionPage.saveAndWait();

    await page.goto('/transactions');
    
    // Test if we see Parcel 1/3
    await expect(page.locator(`[data-testid^="transaction-item"]:visible`).filter({ hasText: desc }).first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator(`[data-testid^="transaction-item"]:visible`).filter({ hasText: '1/3' }).first()).toBeVisible();
  });
});
