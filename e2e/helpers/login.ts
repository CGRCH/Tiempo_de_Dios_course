import { Page, expect } from '@playwright/test';

export const DEMO_PASSWORD = 'Demo2026!';

const POST_LOGIN_PATHS = ['/mis-cursos', '/panel/profesor', '/panel/administracion', '/panel/admin'];

/** Wait for client hydration before filling controlled login inputs. */
export async function loginAs(
  page: Page,
  username: string,
  password = DEMO_PASSWORD,
  next?: string,
) {
  const qs = next ? `?next=${encodeURIComponent(next)}` : '';
  await page.goto(`/ingresar${qs}`);
  await expect(page.getByTestId('login-form')).toBeVisible();
  const userField = page.getByTestId('login-username');
  const passField = page.getByTestId('login-password');
  await userField.click();
  await userField.fill(username);
  await passField.click();
  await passField.fill(password);
  await expect(userField).toHaveValue(username);
  await page.getByTestId('login-submit').click();
  if (next) {
    await page.waitForURL(`**${next.split('?')[0]}**`, { timeout: 30000 });
    return;
  }
  await page.waitForURL(
    (url) => POST_LOGIN_PATHS.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`)),
    { timeout: 30000 },
  );
}
