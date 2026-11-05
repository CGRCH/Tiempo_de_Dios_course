import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/login';

test.describe.configure({ timeout: 90_000 });

test('Ver detalles opens course builder on review tab', async ({ page }) => {
  await loginAs(page, 'f.rojas');
  await page.goto('/panel/profesor');
  await expect(page.getByTestId('review-banner-cartas-de-pablo-ii')).toBeVisible({ timeout: 15000 });
  await page.getByTestId('review-details-cartas-de-pablo-ii').click();
  await expect(page).toHaveURL(/\/panel\/profesor\/cursos\/cartas-de-pablo-ii\?tab=review/);
  await expect(page.getByTestId('builder-tab-review')).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByTestId('builder-review-readonly')).toBeVisible();
  await expect(page.getByTestId('builder-review-status')).toContainText('En revisión');
  await expect(page.getByTestId('builder-review-panel')).toBeVisible();
});
