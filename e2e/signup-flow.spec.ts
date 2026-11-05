import { expect, test } from '@playwright/test';

test.describe.configure({ timeout: 90_000 });

test.describe('Registration discovery', () => {
  test('sign up from home header Crear cuenta', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('header-register')).toBeVisible();
    await page.getByTestId('header-register').click();
    await expect(page).toHaveURL(/\/registro\/?$/);

    const uid = `home${Date.now()}`;
    await page.getByTestId('register-username').fill(uid);
    await page.getByTestId('register-email').fill(`${uid}@test.local`);
    await page.getByTestId('register-password').fill('Demo2026!QA');
    await page.getByTestId('register-first_name').fill('Home');
    await page.getByTestId('register-last_name').fill('Signup');
    await page.getByTestId('register-submit').click();

    await page.waitForURL('**/mis-cursos', { timeout: 30000 });
    await expect(page.getByTestId('avatar-menu-button')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('header-login')).toHaveCount(0);
  });

  test('login page links to registro and back', async ({ page }) => {
    await page.goto('/ingresar');
    await page.getByTestId('login-register-link').click();
    await expect(page).toHaveURL(/\/registro/);
    await page.getByTestId('register-login-link').click();
    await expect(page).toHaveURL(/\/ingresar/);
  });

  test('logged-out enroll offers registration with next', async ({ page }) => {
    await page.goto('/cursos/liderazgo-con-proposito');
    await page.getByTestId('course-register-link').click();
    await expect(page).toHaveURL(/\/registro\?next=/);
    expect(decodeURIComponent(page.url())).toContain('/checkout/liderazgo-con-proposito');
  });
});
