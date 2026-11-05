import { expect, test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { loginAs } from './helpers/login';

const shots = '/opt/cursor/artifacts/course-builder';

test.describe.configure({ timeout: 120_000 });

test.beforeAll(() => {
  fs.mkdirSync(shots, { recursive: true });
});

test('teacher course builder full flow', async ({ page }) => {
  await loginAs(page, 'f.rojas');
  await page.goto('/panel/profesor/crear');
  const title = `Builder ${Date.now()}`;
  await page.getByTestId('course-title').fill(title);
  await page.getByTestId('create-course-submit').click();
  await page.waitForURL(/\/panel\/profesor\/cursos\/[^/]+$/, { timeout: 15000 });

  await expect(page.getByTestId('course-builder')).toBeVisible();
  await page.screenshot({ path: path.join(shots, '01-builder-info.png'), fullPage: true });

  await page.getByTestId('builder-tab-curriculum').click();
  await page.getByTestId('create-module').click();
  await expect(page.getByTestId('builder-toast')).toContainText(/Módulo creado/i, { timeout: 10000 });
  await page.screenshot({ path: path.join(shots, '02-curriculum-module.png'), fullPage: true });

  await page.getByTestId('create-lesson').click();
  await expect(page.getByTestId('lesson-editor-modal')).toBeVisible({ timeout: 10000 });

  const sampleVideo = path.join(__dirname, 'fixtures', 'sample.mp4');
  await page.getByTestId('upload-video').setInputFiles(sampleVideo);
  await expect
    .poll(async () => page.getByTestId('video-status').textContent(), { timeout: 90_000 })
    .toContain('Listo');

  await page.screenshot({ path: path.join(shots, '03-lesson-video-ready.png'), fullPage: true });
  await page.getByRole('button', { name: 'Cerrar' }).click();

  await page.getByTestId('builder-tab-review').click();
  await page.screenshot({ path: path.join(shots, '04-review-checklist.png'), fullPage: true });
  await page.getByTestId('submit-review').click();
  await expect(page.getByTestId('builder-toast')).toContainText(/revisión/i, { timeout: 15000 });
  await page.screenshot({ path: path.join(shots, '05-submitted.png'), fullPage: true });
});
