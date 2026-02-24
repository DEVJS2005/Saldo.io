import { test, expect } from '@playwright/test';
import { loginUser } from '../helpers/auth.helper';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe.skip('Logout', () => {
  test('deve redirecionar para /login, com sessao encerrada', async ({ page }) => {
    // Starts authenticated
    await loginUser(page);
    
    // Click on logout mapping
    await page.getByTestId('btn-logout').first().click();
    
    await expect(page).toHaveURL(/.*\/login.*/);
  });
});
