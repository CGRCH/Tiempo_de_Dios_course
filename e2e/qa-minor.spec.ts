import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/login';
import { apiToken, patchSiteSettings, readTeacherEarningsVisible } from './helpers/api';

async function login(page: Parameters<typeof loginAs>[0], username: string) {
  await loginAs(page, username);
}

test.describe.configure({ timeout: 90_000 });

async function logout(page) {
  await page.goto('/');
  const avatar = page.getByTestId('avatar-menu-button');
  if (await avatar.isVisible()) {
    await avatar.click();
    await page.getByTestId('logout-button').click();
    await expect(page.getByTestId('header-login')).toBeVisible({ timeout: 15000 });
  }
}

test.describe('QA minor fixes', () => {
  test('8 Admin monthly revenue chart has bars', async ({ page }) => {
    await login(page, 'carlos.mendez');
    await page.goto('/panel/admin');
    await expect(page.getByTestId('revenue-monthly-chart')).toBeVisible();
    const bars = page.locator('[data-testid="revenue-monthly-chart"] [class*="rounded-t-lg"]');
    await expect(bars.first()).toBeVisible();
    const h = await bars.last().evaluate((el) => el.getBoundingClientRect().height);
    expect(h).toBeGreaterThan(3);
  });

  test('9 Admin certificates table or empty state', async ({ page }) => {
    await login(page, 'marta.ibanez');
    await page.goto('/panel/administracion/certificados');
    await expect(page.getByTestId('admin-certificates-page')).toBeVisible();
    const table = page.locator('table');
    const empty = page.getByTestId('certificates-empty');
    await expect(table.or(empty)).toBeVisible();
    if (await table.isVisible()) {
      await expect(page.getByTestId(/^reissue-cert-/)).toBeVisible();
    }
  });

  test('10 Admin config save confirmation', async ({ page }) => {
    await login(page, 'carlos.mendez');
    await page.goto('/panel/admin/configuracion');
    await page.getByTestId('save-settings').click();
    await expect(page.getByTestId('settings-saved')).toContainText(/guardad/i);
  });

  test('11 Teacher questions and reviews', async ({ page }) => {
    await login(page, 'f.rojas');
    await page.goto('/panel/profesor/preguntas');
    await expect(page.getByTestId('teacher-questions-page')).toBeVisible();
    await expect(page.locator('text=¿Cómo aplico Romanos')).toBeVisible();
    await page.goto('/panel/profesor/resenas');
    await expect(page.getByTestId('teacher-reviews-page')).toBeVisible();
    await expect(page.locator('text=Profundidad bíblica')).toBeVisible();
  });

  test('12 Lesson page no console errors after checkout', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    const uid = `les${Date.now()}`;
    await page.goto('/registro');
    await page.getByTestId('register-username').fill(uid);
    await page.getByTestId('register-email').fill(`${uid}@test.local`);
    await page.getByTestId('register-password').fill('Demo2026!QA');
    await page.getByTestId('register-first_name').fill('Les');
    await page.getByTestId('register-last_name').fill('Test');
    await page.getByTestId('register-submit').click();
    await page.waitForURL('**/mis-cursos', { timeout: 30000 });
    await expect(page.getByTestId('avatar-menu-button')).toBeVisible({ timeout: 15000 });
    await page.goto('/cursos/liderazgo-con-proposito');
    await page.getByTestId('enroll-button').click();
    await page.waitForURL('**/checkout/**');
    await page.getByTestId('checkout-confirm').click();
    await expect(page.getByTestId('checkout-message')).toContainText(/insc/i);
    await page.goto('/cursos/liderazgo-con-proposito');
    const lessonLink = page.locator('a[href*="/aprender/liderazgo-con-proposito/leccion/"]').first();
    await expect(lessonLink).toBeVisible({ timeout: 10000 });
    const href = await lessonLink.getAttribute('href');
    await page.goto(href!);
    await expect(page.getByTestId('lesson-video')).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(2000);
    expect(errors.filter((e) => !/favicon/i.test(e))).toEqual([]);
  });

  test('13 Ganancias redirects when earnings hidden', async ({ page, request }) => {
    const adminToken = await apiToken(request, 'carlos.mendez');
    await patchSiteSettings(request, adminToken, { teacher_earnings_visible: false });
    await expect
      .poll(() => readTeacherEarningsVisible(request), { timeout: 15000 })
      .toBe(false);

    await logout(page);
    await login(page, 'f.rojas');
    await page.goto('/panel/profesor/ganancias');
    await expect(page).toHaveURL(/\/panel\/profesor\/?$/, { timeout: 15000 });

    await patchSiteSettings(request, adminToken, { teacher_earnings_visible: true });
    await expect.poll(() => readTeacherEarningsVisible(request), { timeout: 15000 }).toBe(true);
  });
});
