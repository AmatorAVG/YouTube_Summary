import { test, expect } from '@playwright/test';

test.describe('Simple smoke tests', () => {
  test.afterEach(async ({ page }) => {
    // Explicit cleanup to prevent memory leaks
    await page.close().catch(() => {});
  });

  test('should load home page', async ({ page }) => {
    await page.goto('/');
    
    // Should show home page (either logged in or redirected to login)
    const url = page.url();
    if (url.includes('/login')) {
      await expect(page.getByRole('heading', { name: 'Вход в аккаунт' })).toBeVisible();
    } else {
      await expect(page.getByRole('heading', { name: 'YouTube Summary' })).toBeVisible();
    }
  });

  test('should have valid page title', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/YouTube/);
  });

  test('should display login form elements', async ({ page }) => {
    await page.goto('/login');
    
    // Check email input
    await expect(page.getByLabel('Email')).toBeVisible();
    
    // Check password input
    await expect(page.getByLabel('Пароль')).toBeVisible();
    
    // Check login button
    await expect(page.getByRole('button', { name: 'Войти' })).toBeVisible();
    
    // Check register link (use first() to avoid strict mode violation)
    await expect(page.getByRole('link', { name: 'Зарегистрироваться' }).first()).toBeVisible();
  });
});
