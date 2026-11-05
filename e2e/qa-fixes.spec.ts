import { expect, test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { loginAs } from './helpers/login';

const shots = path.join(__dirname, '..', 'docs', 'screenshots', 'qa-fix');

async function login(page: Parameters<typeof loginAs>[0], username: string) {
  await loginAs(page, username);
  await expect(page.getByTestId('avatar-menu-button')).toBeVisible({ timeout: 15000 });
}

test.describe.configure({ timeout: 90_000 });

test.beforeAll(() => {
  fs.mkdirSync(shots, { recursive: true });
});

test.describe('QA fixes UI', () => {
  test('1 Logout and avatar initials', async ({ page }) => {
    await login(page, 'camila.m');
    await page.goto('/');
    await expect(page.getByTestId('avatar-menu-button')).toHaveText('CM');
    await page.getByTestId('avatar-menu-button').click();
    await page.screenshot({ path: path.join(shots, '01-avatar-menu.png'), fullPage: true });
    await page.getByTestId('logout-button').click();
    await expect(page.getByTestId('header-login')).toBeVisible();
    await page.screenshot({ path: path.join(shots, '01-logged-out.png'), fullPage: true });
  });

  test('2 Course images and catalog count', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('course-count-label')).not.toContainText('48');
    await expect(page.locator('img[src*="covers"]').first()).toBeVisible();
    await page.screenshot({ path: path.join(shots, '02-catalog-covers.png'), fullPage: true });
  });

  test('3 Paid checkout and free enroll feedback', async ({ page }) => {
    const uid = `pay${Date.now()}`;
    await page.goto('/registro');
    await page.getByTestId('register-username').fill(uid);
    await page.getByTestId('register-email').fill(`${uid}@test.local`);
    await page.getByTestId('register-password').fill('Demo2026!QA');
    await page.getByTestId('register-first_name').fill('Pay');
    await page.getByTestId('register-last_name').fill('Test');
    await page.getByTestId('register-submit').click();
    await page.waitForURL('**/mis-cursos', { timeout: 30000 });
    await expect(page.getByTestId('avatar-menu-button')).toBeVisible({ timeout: 15000 });

    await page.goto('/cursos/fundamentos-de-la-fe');
    await page.getByTestId('enroll-button').click();
    await expect(page.getByTestId('enroll-message')).toContainText(/insc/i);

    await page.goto('/cursos/liderazgo-con-proposito');
    await page.getByTestId('enroll-button').click();
    await page.waitForURL('**/checkout/liderazgo-con-proposito');
    await page.screenshot({ path: path.join(shots, '03-checkout.png'), fullPage: true });
    await page.getByTestId('checkout-confirm').click();
    await expect(page.getByTestId('checkout-message')).toContainText(/insc/i);
  });

  test('4 Player progress feedback', async ({ page }) => {
    await login(page, 'camila.m');
    await page.goto('/');
    await page.getByRole('link', { name: /Continuar/i }).click();
    await page.getByTestId('mark-lesson-complete').click();
    await expect(page.getByTestId('player-feedback')).toContainText(/completada/i, { timeout: 10000 });
    await page.screenshot({ path: path.join(shots, '04-lesson-progress.png'), fullPage: true });
  });

  test('5 Teacher create course flow', async ({ page }) => {
    await login(page, 'f.rojas');
    await page.goto('/panel/profesor/crear');
    const title = `UI Curso ${Date.now()}`;
    await page.getByTestId('course-title').fill(title);
    await page.getByTestId('create-course-submit').click();
    await page.waitForURL(/\/panel\/profesor\/cursos\/[^/]+$/, { timeout: 15000 });
    await expect(page.url()).not.toContain('undefined');

    await page.getByTestId('builder-tab-curriculum').click();
    await page.getByTestId('create-module').click();
    await expect(page.getByTestId('builder-toast')).toContainText(/Módulo creado/i, { timeout: 10000 });

    await page.getByTestId('create-lesson').click();
    await expect(page.getByTestId('lesson-editor-modal')).toBeVisible();
    const sampleVideo = path.join(__dirname, 'fixtures', 'sample.mp4');
    await page.getByTestId('upload-video').setInputFiles(sampleVideo);
    await expect
      .poll(async () => page.getByTestId('video-status').textContent(), { timeout: 120_000 })
      .toContain('Listo');

    await page.getByRole('button', { name: 'Cerrar' }).click();
    await page.getByTestId('builder-tab-review').click();
    await page.getByTestId('submit-review').click();
    await expect(page.getByTestId('builder-toast')).toContainText(/revisión/i, { timeout: 15000 });

    await page.goto('/panel/profesor');
    await expect(page.locator('table')).toContainText(title);
    await page.screenshot({ path: path.join(shots, '05-teacher-course.png'), fullPage: true });
  });

  test('6 Administración pages', async ({ page }) => {
    await login(page, 'marta.ibanez');
    await expect(page.getByTestId('header-panel-link')).toBeVisible();
    for (const route of ['usuarios', 'tickets', 'aprobacion']) {
      await page.goto(`/panel/administracion/${route}`);
      await expect(page.locator('h1')).toBeVisible();
    }
    await page.goto('/panel/administracion');
    await expect(page.getByTestId('support-dashboard')).toBeAttached();
    await page.screenshot({ path: path.join(shots, '06-soporte.png'), fullPage: true });
  });

  test('7 Admin revenue, transactions, prices', async ({ page }) => {
    await login(page, 'carlos.mendez');
    await page.goto('/panel/admin');
    await expect(page.locator('text=Ingresos totales').first()).toBeVisible();
    await expect
      .poll(async () => page.locator('b').filter({ hasText: '$' }).first().textContent(), { timeout: 10000 })
      .not.toBe('—');
    await page.goto('/panel/admin/transacciones', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('admin-transactions-page')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('td').filter({ hasText: '$' }).first()).toBeVisible();
    await page.goto('/panel/admin/cursos');
    await page.getByTestId('save-price-estudio-de-romanos').click();
    await page.screenshot({ path: path.join(shots, '07-admin-prices.png'), fullPage: true });
  });
});
