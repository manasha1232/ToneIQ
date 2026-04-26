import { test, expect } from '@playwright/test';

test.describe('ToneIQ E2E — mocked STT/AI/TTS', () => {
  test('home page loads with scenario cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('ToneIQ');
    const cards = page.locator('button:has-text("Start practice")');
    await expect(cards).toHaveCount(6);
  });

  test('start scenario navigates to session view', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("Start practice")').first().click();
    await expect(page.locator('text=Turn 0 / 6')).toBeVisible({ timeout: 5000 });
  });

  test('session view shows record button', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("Start practice")').first().click();
    // Mic button present
    await expect(page.locator('text=Tap to record')).toBeVisible({ timeout: 5000 });
  });

  test('report page accessible after direct API call', async ({ request }) => {
    // Start session via API (mocked backend)
    const start = await request.post('http://localhost:3001/api/session/start', {
      data: { scenarioId: 'missed-deadline', scenarioText: 'You missed a deadline.' },
    });
    const { sessionId } = await start.json();
    expect(sessionId).toBeTruthy();

    const report = await request.get(`http://localhost:3001/api/session/${sessionId}/report`);
    expect(report.ok()).toBeTruthy();
    const data = await report.json();
    expect(data.session).toBeTruthy();
  });
});
