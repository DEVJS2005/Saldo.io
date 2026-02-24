import { test, expect } from '@playwright/test';
import { TransactionPage } from '../pages/TransactionPage';

test.describe('Transações Simples', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
    await page.goto('/');
  });

  test('deve criar uma despesa simples e refleti-la na listagem', async ({ page }) => {
    const transactionPage = new TransactionPage(page);
    const desc = `Compra Teste ${Date.now()}`;
    
    await transactionPage.createTransaction({
      amount: 150.50,
      description: desc,
      type: 'despesa',
    });

    // Go to transactions to check if it's there
    await page.goto('/transactions');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'DEBUG_create_1.png', fullPage: true });

    await expect(page.locator(`[data-testid^="transaction-item"]:visible`).filter({ hasText: desc }).first()).toBeVisible({ timeout: 15000 });
  });

  test('deve criar uma receita e deletar', async ({ page }) => {
    const transactionPage = new TransactionPage(page);
    const desc = `Salário Teste ${Date.now()}`;
    
    await transactionPage.createTransaction({
      amount: 5000,
      description: desc,
      type: 'receita',
    });

    await page.goto('/transactions');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'DEBUG_create_2.png', fullPage: true });

    await expect(page.locator(`[data-testid^="transaction-item"]:visible`).filter({ hasText: desc }).first()).toBeVisible({ timeout: 15000 });
    
    // Find item and delete (we might need a more precise locator, but getByText works for finding the row)
    const item = page.locator(`[data-testid^="transaction-item"]:visible`).filter({ hasText: desc }).first();
    
    // Click delete
    page.once('dialog', dialog => dialog.accept());
    await item.getByRole('button', { name: 'Excluir' }).click();
    
    // Since it's a simple transaction, it uses window.confirm. Playwright auto-accepts window.confirm.
    // Wait for the row to disappear or have different text
    await expect(page.locator(`[data-testid^="transaction-item"]:visible`).filter({ hasText: desc })).toHaveCount(0);
  });
});
