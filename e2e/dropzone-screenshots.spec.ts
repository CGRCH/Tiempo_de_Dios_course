import { expect, test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { loginAs } from './helpers/login';

const shots = '/opt/cursor/artifacts/dropzone';

async function login(page: Parameters<typeof loginAs>[0], username: string) {
  await loginAs(page, username);
}

test.describe.configure({ timeout: 120_000 });

test.beforeAll(() => {
  fs.mkdirSync(shots, { recursive: true });
});

test('dropzone UI screenshots', async ({ page }) => {
  await login(page, 'f.rojas');
  await page.goto('/panel/profesor/cursos/hebreos-mejor-pacto');
  await expect(page.getByTestId('course-builder')).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId('builder-cover-upload-dropzone')).toBeVisible();
  await page.screenshot({ path: path.join(shots, '01-course-cover-dropzone.png'), fullPage: true });

  await page.getByTestId('builder-tab-curriculum').click();
  if (await page.getByTestId('curriculum-empty').isVisible().catch(() => false)) {
    await page.getByTestId('create-module').click();
    await expect(page.getByTestId('builder-toast')).toContainText(/Módulo creado/i, { timeout: 10000 });
  }
  await page.getByTestId('create-lesson').first().click();
  await expect(page.getByTestId('upload-video-dropzone')).toBeVisible();
  await page.screenshot({ path: path.join(shots, '02-lesson-video-dropzone.png'), fullPage: true });
  await page.getByRole('button', { name: 'Cerrar' }).click();

  await page.goto('/panel/profesor/perfil');
  await expect(page.getByTestId('profile-avatar-upload-dropzone')).toBeVisible();
  await page.screenshot({ path: path.join(shots, '03-profile-avatar-dropzone.png'), fullPage: true });
});
