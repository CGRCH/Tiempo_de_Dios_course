import { APIRequestContext, expect } from '@playwright/test';

const API = process.env.E2E_API_URL || 'http://localhost:8000/api';

export const DEMO_PASSWORD = 'Demo2026!';

/** Cookie session login for API request context (uses Set-Cookie from backend). */
export async function apiLogin(
  request: APIRequestContext,
  username: string,
  password = DEMO_PASSWORD,
) {
  const res = await request.post(`${API}/auth/token/`, {
    data: { username, password },
  });
  expect(res.ok()).toBeTruthy();
}

/** @deprecated use apiLogin — kept for tests that only need an authenticated request context */
export async function apiToken(request: APIRequestContext, username: string, password = DEMO_PASSWORD) {
  await apiLogin(request, username, password);
  return 'cookie';
}

export async function patchSiteSettings(
  request: APIRequestContext,
  _token: string | null,
  body: { teacher_earnings_visible?: boolean },
) {
  const res = await request.patch(`${API}/admin/settings/`, {
    data: body,
  });
  expect(res.ok()).toBeTruthy();
}

export async function readTeacherEarningsVisible(request: APIRequestContext): Promise<boolean> {
  const res = await request.get(`${API}/settings/`);
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  return !!data.teacher_earnings_visible;
}
