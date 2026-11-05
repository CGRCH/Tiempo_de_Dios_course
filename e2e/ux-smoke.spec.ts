import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/login';

test.describe('UX smoke', () => {
  test('public course detail without session', async ({ page }) => {
    await page.goto('/cursos/estudio-de-romanos');
    await expect(page.getByTestId('enroll-button')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Estudio de Romanos').first()).toBeVisible();
  });

  test('ayuda redirects to login when logged out', async ({ page }) => {
    await page.goto('/ayuda');
    await page.waitForURL('**/ingresar**', { timeout: 15000 });
    expect(page.url()).toContain('next=%2Fayuda');
  });

  test('student cannot access teacher panel UI', async ({ page }) => {
    await loginAs(page, 'camila.m');
    await page.goto('/panel/profesor');
    await expect(page).toHaveURL(/\/mis-cursos/, { timeout: 15000 });
  });

  test('role home after login', async ({ page }) => {
    await loginAs(page, 'f.rojas');
    await expect(page).toHaveURL(/\/panel\/profesor\/?$/);
    await page.goto('/ingresar');
    await page.getByTestId('login-username').fill('marta.ibanez');
    await page.getByTestId('login-password').fill('Demo2026!');
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL(/\/panel\/administracion/, { timeout: 30000 });
  });

  test('footer legal links resolve', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Términos' }).click();
    await expect(page).toHaveURL(/\/terminos/);
    await page.goto('/');
    await page.getByRole('link', { name: 'Privacidad' }).click();
    await expect(page).toHaveURL(/\/privacidad/);
  });
});
