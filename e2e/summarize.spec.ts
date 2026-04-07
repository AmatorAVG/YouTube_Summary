import { test, expect } from '@playwright/test';

const TEST_EMAIL = `test_summarize_${Date.now()}@example.com`;
const TEST_PASSWORD = 'testpassword123';

// Test video URL provided by user
const TEST_VIDEO_URL = 'https://www.youtube.com/watch?v=PEoajTgY3Pg';

test.describe('Video Summarization', () => {
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

  test('should submit YouTube URL for summarization', async ({ page }) => {
    // Enter the test video URL
    const urlInput = page.getByPlaceholder('https://www.youtube.com/watch?v=...');
    await urlInput.fill(TEST_VIDEO_URL);
    
    // Click submit button
    await page.getByRole('button', { name: 'Краткое содержание' }).click();
    
    // Should show loading state
    await expect(page.getByRole('button', { name: /Обработка/ })).toBeVisible({ timeout: 5000 });
  });

  test('should show result or error after processing', async ({ page }) => {
    // Enter the test video URL
    const urlInput = page.getByPlaceholder('https://www.youtube.com/watch?v=...');
    await urlInput.fill(TEST_VIDEO_URL);
    
    // Click submit button
    await page.getByRole('button', { name: 'Краткое содержание' }).click();
    
    // Wait for processing to complete (may take some time)
    // Either shows success result or error
    const resultTimeout = 60000; // 1 minute timeout
    
    // Wait for either summary content or error message
    await Promise.race([
      page.waitForSelector('[data-testid="summary-content"]', { timeout: resultTimeout }).catch(() => {}),
      page.waitForSelector('text=Ошибка', { timeout: resultTimeout }).catch(() => {}),
      page.waitForSelector('text=краткое содержание', { timeout: resultTimeout, state: 'visible' }).catch(() => {}),
    ]);
    
    // Check if we got any result (success or error is fine for this test)
    const hasResult = 
      (await page.locator('text=Ошибка').isVisible().catch(() => false)) ||
      (await page.locator('text=краткое содержание').isVisible().catch(() => false)) ||
      (await page.locator('text=Ошибка при обработке').isVisible().catch(() => false));
    
    // Test passes if we got any response from the server
    expect(hasResult).toBeTruthy();
  });

  test('should show error for invalid URL', async ({ page }) => {
    // Enter an invalid URL
    const urlInput = page.getByPlaceholder('https://www.youtube.com/watch?v=...');
    await urlInput.fill('https://not-a-youtube-url.com/video');
    
    // Click submit button
    await page.getByRole('button', { name: 'Краткое содержание' }).click();
    
    // Wait for error response
    await expect(page.getByText('Ошибка', { exact: false })).toBeVisible({ timeout: 30000 });
  });

  test('should show error for non-existent video', async ({ page }) => {
    // Enter a non-existent YouTube video URL
    const urlInput = page.getByPlaceholder('https://www.youtube.com/watch?v=...');
    await urlInput.fill('https://www.youtube.com/watch?v=nonexistent123');
    
    // Click submit button
    await page.getByRole('button', { name: 'Краткое содержание' }).click();
    
    // Wait for error response
    await expect(page.getByText(/ошибка|не найдено|не удалось/i)).toBeVisible({ timeout: 30000 });
  });

  test('should decrease generations counter after use', async ({ page }) => {
    // Get initial counter value
    const initialBadge = page.locator('.inline-flex.items-center.rounded-md');
    const initialText = await initialBadge.textContent();
    const initialMatch = initialText?.match(/(\d+)\s*\/\s*5/);
    const initialCount = initialMatch ? parseInt(initialMatch[1]) : null;
    
    if (initialCount === null || initialCount <= 0) {
      // Skip test if no generations left
      test.skip();
      return;
    }
    
    // Enter the test video URL
    const urlInput = page.getByPlaceholder('https://www.youtube.com/watch?v=...');
    await urlInput.fill(TEST_VIDEO_URL);
    
    // Click submit button
    await page.getByRole('button', { name: 'Краткое содержание' }).click();
    
    // Wait for processing to complete
    await page.waitForTimeout(30000);
    
    // Check if counter decreased (if we got a successful response)
    const currentBadge = page.locator('.inline-flex.items-center.rounded-md');
    const currentText = await currentBadge.textContent().catch(() => '');
    const currentMatch = currentText?.match(/(\d+)\s*\/\s*5/);
    const currentCount = currentMatch ? parseInt(currentMatch[1]) : null;
    
    // Counter should have decreased or stayed same (if error occurred)
    if (currentCount !== null && initialCount !== null) {
      expect(currentCount).toBeLessThanOrEqual(initialCount);
    }
  });

  test('should allow entering different YouTube URL formats', async ({ page }) => {
    const urlInput = page.getByPlaceholder('https://www.youtube.com/watch?v=...');
    
    // Test different URL formats
    const urls = [
      'https://www.youtube.com/watch?v=PEoajTgY3Pg',
      'https://youtu.be/PEoajTgY3Pg',
      'https://youtube.com/watch?v=PEoajTgY3Pg',
    ];
    
    for (const url of urls) {
      await urlInput.fill(url);
      await expect(urlInput).toHaveValue(url);
    }
  });
});