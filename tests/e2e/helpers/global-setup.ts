import { chromium } from '@playwright/test';
import { loginUser } from './auth.helper';
import * as path from 'path';
import * as fs from 'fs';

export default async function globalSetup() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: 'http://localhost:5173' });
  const page = await context.newPage();
  
  if (!process.env.TEST_EMAIL || !process.env.TEST_PASSWORD) {
    console.warn('TEST_EMAIL or TEST_PASSWORD not set. Using fallback for local dev.');
    process.env.TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
    process.env.TEST_PASSWORD = process.env.TEST_PASSWORD || 'password123';
  }

  await loginUser(page);

  // Wait for Supabase to save the session asynchronously to localStorage
  await page.waitForFunction(() => {
    return Object.keys(window.localStorage).some(key => key.includes('supabase.auth.token') || key.includes('-auth-token'));
  }, { timeout: 10000 });

  const authDirPath = path.resolve('tests/.auth');
  if (!fs.existsSync(authDirPath)) {
    fs.mkdirSync(authDirPath, { recursive: true });
  }

  await page.context().storageState({
    path: 'tests/.auth/user.json'
  });
  await browser.close();
}
