import { type Page } from '@playwright/test';

export async function loginUser(page: Page) {
  const email = process.env.TEST_EMAIL || 'test@example.com';
  const password = process.env.TEST_PASSWORD || 'password123';

  await page.goto('/login');
  await page.getByTestId('input-email').fill(email);
  await page.getByTestId('input-password').fill(password);
  await page.getByTestId('btn-login').click();

  await page.waitForURL(/\/(dashboard)?$/, { timeout: 8000 });
}
