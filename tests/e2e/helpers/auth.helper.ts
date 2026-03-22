import { type Page } from '@playwright/test';

export async function loginUser(page: Page) {
  const email = process.env.TEST_EMAIL || 'test@example.com';
  const password = process.env.TEST_PASSWORD || 'password123';

  await page.goto('/login');
  await page.getByTestId('input-email').fill(email);
  await page.getByTestId('input-password').fill(password);
  await page.getByTestId('btn-login').click();

  // Wait until URL changes from /login or stays on dashboard
  await page.waitForURL(url => !url.href.endsWith('/login'), { timeout: 8000 }).catch(() => {});
}
