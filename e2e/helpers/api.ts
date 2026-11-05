import { APIRequestContext, expect } from '@playwright/test';

const API = process.env.E2E_API_URL || 'http://localhost:8000/api';

export async function apiToken(request: APIRequestContext, username: string, password = 'Demo2026!') {
  const res = await request.post(`${API}/auth/token/`, {
    data: { username, password },
  });
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  return data.access as string;
}

export async function patchSiteSettings(
  request: APIRequestContext,
  token: string,
  body: { teacher_earnings_visible?: boolean },
) {
  const res = await request.patch(`${API}/admin/settings/`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
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
