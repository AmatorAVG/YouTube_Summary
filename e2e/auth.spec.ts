import { test, expect } from '@playwright/test';

// Generate unique email for each test run to avoid conflicts
const TEST_EMAIL = `test_${Date.now()}@example.com`;
const TEST_PASSWORD = 'testpassword123';

test.describe('Authentication', () => {
  test('should redirect to login page when not authenticated', async ({ page }) => {
    await page.goto('/');
    
    // Should be redirected to login page
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.getByRole('heading', { name: 'Вход в аккаунт' })).toBeVisible();
  });

  test('should register a new user', async ({ page }) => {
    await page.goto('/login');
    
    // Click on register link
    await page.getByRole('link', { name: 'Зарегистрироваться' }).click();
    
    // Wait for register page to load
    await expect(page).toHaveURL(/.*\/register/);
    await expect(page.getByRole('heading', { name: 'Регистрация' })).toBeVisible();
    
    // Fill registration form
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Пароль').fill(TEST_PASSWORD);
    await page.getByLabel('Подтвердите пароль').fill(TEST_PASSWORD);
    
    // Submit form
    await page.getByRole('button', { name: 'Зарегистрироваться' }).click();
    
    // Should be redirected to home page after successful registration
    await expect(page).toHaveURL('/', { timeout: 30000 });
  });

  test('should login with existing user', async ({ page }) => {
    await page.goto('/login');
    
    // Fill login form
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Пароль').fill(TEST_PASSWORD);
    
    // Submit form
    await page.getByRole('button', { name: 'Войти' }).click();
    
    // Should be redirected to home page
    await expect(page).toHaveURL('/', { timeout: 15000 });
  });

  test('should show home page after login', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Пароль').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Войти' }).click();
    await expect(page).toHaveURL('/', { timeout: 15000 });
    
    // Verify home page elements
    await expect(page.getByRole('heading', { name: 'YouTube Summary' })).toBeVisible();
    await expect(page.getByPlaceholder('https://www.youtube.com/watch?v=...')).toBeVisible();
    await expect(page.getByRole('button', { name: /Краткое содержание/ })).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Пароль').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Войти' }).click();
    await expect(page).toHaveURL('/', { timeout: 15000 });
    
    // Logout
    await page.getByRole('button', { name: 'Выйти' }).click();
    
    // Should be redirected to login page
    await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 });
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill with invalid credentials
    await page.getByLabel('Email').fill('invalid@example.com');
    await page.getByLabel('Пароль').fill('wrongpassword');
    
    // Submit form
    await page.getByRole('button', { name: 'Войти' }).click();
    
    // Should show error message
    await expect(page.getByText('Неверный email или пароль', { exact: false })).toBeVisible({ timeout: 10000 });
  });
});