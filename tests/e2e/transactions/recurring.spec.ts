import { test, expect } from '@playwright/test';
import { TransactionPage } from '../pages/TransactionPage';

test.describe('Transações Recorrentes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('deve criar transacao recorrente e editar apenas a atual', async ({ page }) => {
    const transactionPage = new TransactionPage(page);
    const desc = `Recorrente Teste ${Date.now()}`;
    
    await transactionPage.addButton.click();
    await page.getByRole('button', { name: 'despesa', exact: true }).click();
    await transactionPage.amountInput.fill('100');
    await transactionPage.descriptionInput.fill(desc);
    await transactionPage.categorySelect.selectOption({ index: 1 });
    await transactionPage.accountSelect.selectOption({ index: 1 });
    
    await page.locator('#isRecurring').check();
    await transactionPage.saveAndWait();

    await page.goto('/transactions');
    await expect(page.locator(`[data-testid^="transaction-item"]:visible`).filter({ hasText: desc }).first()).toBeVisible({ timeout: 15000 });

    // Edit logic
    const item = page.locator(`[data-testid^="transaction-item"]:visible`).filter({ hasText: desc }).first();
    await item.getByRole('button', { name: 'Editar' }).click();
    
    await transactionPage.amountInput.fill('150');
    await transactionPage.saveButton.click();
    
    await expect(page.getByTestId('modal-confirm-recurring')).toBeVisible();
    await page.getByTestId('btn-propagate-single').click();
    
    
    await expect(page.getByTestId('modal-confirm-recurring')).not.toBeVisible();
    await expect(page.locator(`[data-testid^="transaction-item"]:visible`).filter({ hasText: desc + ' - Editado' }).first()).toBeVisible();
  });

  test('deve deletar transacao recorrente e propagar para todas', async ({ page }) => {
    const transactionPage = new TransactionPage(page);
    const desc = `Recorrente Deletar ${Date.now()}`;
    
    await transactionPage.addButton.click();
    await page.getByRole('button', { name: 'despesa', exact: true }).click();
    await transactionPage.amountInput.fill('100');
    await transactionPage.descriptionInput.fill(desc);
    await transactionPage.categorySelect.selectOption({ index: 1 });
    await transactionPage.accountSelect.selectOption({ index: 1 });
    
    await page.locator('#isRecurring').check();
    await transactionPage.saveAndWait();

    await page.goto('/transactions');
    await expect(page.locator(`[data-testid^="transaction-item"]:visible`).filter({ hasText: desc }).first()).toBeVisible({ timeout: 15000 });

    const item = page.locator(`[data-testid^="transaction-item"]:visible`).filter({ hasText: desc }).first();
    await item.getByRole('button', { name: 'Excluir' }).click();
    
    await expect(page.getByText('Como deseja excluir?')).toBeVisible();
    await page.getByTestId('btn-confirm-delete').click(); // Todas as ocorrências
    
    await expect(page.getByText('Como deseja excluir?')).not.toBeVisible();
    await expect(page.locator(`[data-testid^="transaction-item"]:visible`).filter({ hasText: desc })).toHaveCount(0);
  });
});
