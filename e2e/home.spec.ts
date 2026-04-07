import { test, expect } from '@playwright/test';

const TEST_EMAIL = `test_home_${Date.now()}@example.com`;
const TEST_PASSWORD = 'testpassword123';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    // Register and login before each test
    await page.goto('/login');
    await page.getByRole('link', { name: 'Зарегистрироваться' }).click();
    await expect(page).toHaveURL(/.*\/register/);
    
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Пароль').fill(TEST_PASSWORD);
    await page.getByLabel('Подтвердите пароль').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Зарегистрироваться' }).click();
    await expect(page).toHaveURL('/', { timeout: 30000 });
  });

  test('should display main page elements', async ({ page }) => {
    // Check title
    await expect(page).toHaveTitle(/YouTube/);
    
    // Check main heading
    await expect(page.getByRole('heading', { name: 'YouTube Summary' })).toBeVisible();
    
    // Check subtitle
    await expect(page.getByText('Получите краткое изложение любого YouTube видео')).toBeVisible();
    
    // Check URL input field
    const urlInput = page.getByPlaceholder('https://www.youtube.com/watch?v=...');
    await expect(urlInput).toBeVisible();
    
    // Check submit button
    await expect(page.getByRole('button', { name: 'Краткое содержание' })).toBeVisible();
    
    // Check generations counter badge
    await expect(page.locator('.inline-flex.items-center.rounded-md')).toContainText(/генераций осталось/);
    
    // Check footer
    await expect(page.getByText('Бесплатный сервис для экономии вашего времени')).toBeVisible();
  });

  test('should display user email in header', async ({ page }) => {
    await expect(page.getByText(TEST_EMAIL)).toBeVisible();
  });

  test('should show logout button', async ({ page }) => {
    const logoutBtn = page.getByRole('button', { name: /Выйти/ });
    await expect(logoutBtn).toBeVisible();
    await expect(logoutBtn).toContainText('Выйти');
  });

  test('should have URL input that accepts YouTube URLs', async ({ page }) => {
    const urlInput = page.getByPlaceholder('https://www.youtube.com/watch?v=...');
    
    // Type a YouTube URL
    await urlInput.fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await expect(urlInput).toHaveValue('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  });

  test('should disable submit when URL is empty', async ({ page }) => {
    const urlInput = page.getByPlaceholder('https://www.youtube.com/watch?v=...');
    await urlInput.clear();
    
    const submitBtn = page.getByRole('button', { name: 'Краткое содержание' });
    await expect(submitBtn).toBeDisabled();
  });

  test('should show loading state during processing', async ({ page }) => {
    const urlInput = page.getByPlaceholder('https://www.youtube.com/watch?v=...');
    await urlInput.fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    
    const submitBtn = page.getByRole('button', { name: 'Краткое содержание' });
    await submitBtn.click();
    
    // Button should show loading state
    await expect(page.getByRole('button', { name: /Обработка/ })).toBeVisible({ timeout: 5000 });
  });
});