import { Page, expect } from '@playwright/test';

export const DEMO_PASSWORD = 'Demo2026!';

/** Wait for client hydration before filling controlled login inputs. */
export async function loginAs(page: Page, username: string, password = DEMO_PASSWORD) {
  await page.goto('/ingresar');
  await expect(page.getByTestId('login-form')).toBeVisible();
  const userField = page.getByTestId('login-username');
  const passField = page.getByTestId('login-password');
  await userField.click();
  await userField.fill(username);
  await passField.click();
  await passField.fill(password);
  await expect(userField).toHaveValue(username);
  await page.getByTestId('login-submit').click();
  await page.waitForURL('**/mis-cursos', { timeout: 30000 });
}
