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

  test('comunidad page loads', async ({ page }) => {
    await page.goto('/comunidad');
    await expect(page.getByTestId('comunidad-coming-soon')).toBeVisible();
    await expect(page.getByRole('heading', { name: /comunidad/i })).toBeVisible();
  });
});

test.describe('Mobile navigation', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('opens menu, navigates, and closes', async ({ page }) => {
    await page.goto('/');
    const menuBtn = page.getByTestId('mobile-menu-button');
    await expect(menuBtn).toBeVisible();
    await expect(menuBtn).toHaveAttribute('aria-expanded', 'false');

    await menuBtn.click();
    await expect(menuBtn).toHaveAttribute('aria-expanded', 'true');
    const nav = page.getByTestId('mobile-nav');
    await expect(nav).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Cursos', exact: true })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Mis cursos' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Profesores' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Comunidad' })).toBeVisible();
    await expect(page.getByTestId('header-register-mobile')).toBeVisible();
    await expect(page.getByTestId('header-login-mobile')).toBeVisible();

    await nav.getByRole('link', { name: 'Profesores' }).click();
    await expect(page).toHaveURL(/\/profesores/);
    await expect(nav).not.toBeVisible();
    await expect(menuBtn).toHaveAttribute('aria-expanded', 'false');
  });

  test('escape and backdrop close menu', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('mobile-menu-button').click();
    await expect(page.getByTestId('mobile-nav')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('mobile-nav')).not.toBeVisible();

    await page.getByTestId('mobile-menu-button').click();
    await page.getByTestId('mobile-nav-backdrop').click({ force: true });
    await expect(page.getByTestId('mobile-nav')).not.toBeVisible();
  });

  test('logged-in menu shows panel link without duplicate login', async ({ page }) => {
    await loginAs(page, 'f.rojas', undefined, '/mis-cursos');
    await page.goto('/');
    await page.getByTestId('mobile-menu-button').click();
    const nav = page.getByTestId('mobile-nav');
    await expect(nav.getByTestId('mobile-panel-link')).toHaveText('Profesor');
    await expect(nav.getByTestId('header-login-mobile')).not.toBeVisible();
    await expect(page.getByTestId('avatar-menu-button')).toBeVisible();
  });
});
