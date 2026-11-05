import { expect, test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { DEMO_PASSWORD, loginAs } from './helpers/login';

const API = process.env.E2E_API_URL || 'http://localhost:8000/api';

async function login(page: Parameters<typeof loginAs>[0], username: string, password = DEMO_PASSWORD) {
  await loginAs(page, username, password);
}

async function apiToken(request, username: string, password = DEMO_PASSWORD) {
  const res = await request.post(`${API}/auth/token/`, {
    data: { username, password },
  });
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  return data.access as string;
}

test.describe('MVP QA', () => {
  test('Alumno: registro, catálogo, inscripción, lección, certificado, ticket', async ({
    page,
    request,
  }) => {
    const uid = `qa${Date.now()}`;
    await page.goto('/registro');
    await page.getByTestId('register-username').fill(uid);
    await page.getByTestId('register-email').fill(`${uid}@test.local`);
    await page.getByTestId('register-password').fill('Demo2026!QA');
    await page.getByTestId('register-first_name').fill('QA');
    await page.getByTestId('register-last_name').fill('Alumno');
    await page.getByTestId('register-submit').click();
    await page.waitForURL('**/ingresar');

    await login(page, uid, 'Demo2026!QA');

    await page.goto('/');
    await page.getByTestId('catalog-search').fill('Fundamentos');
    await page.getByTestId('filter-Fundamentos').click();
    await expect(page.locator('text=Fundamentos de la Fe').first()).toBeVisible();

    await page.goto('/cursos/fundamentos-de-la-fe');
    await page.getByTestId('enroll-button').click();
    await expect(page.getByTestId('enroll-message')).toContainText(/insc/i);

    const token = await apiToken(request, uid, 'Demo2026!QA');
    const courseRes = await request.get(`${API}/courses/fundamentos-de-la-fe/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const course = await courseRes.json();
    const lessons = course.modules.flatMap((m: { lessons: { id: number }[] }) => m.lessons);
    const first = lessons[0];

    for (const l of lessons) {
      await request.post(`${API}/lessons/${l.id}/progress/`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { completed: true, last_position_seconds: 60 },
      });
    }

    await page.goto(`/aprender/fundamentos-de-la-fe/leccion/${first.id}`);
    await expect(page.getByTestId('complete-course')).toBeVisible({ timeout: 30000 });
    await page.locator('input[placeholder*="nota"]').fill('Nota en video QA');
    await page.locator('button:has-text("＋")').click();

    await page.waitForTimeout(3000);
    await page.goto('/mis-certificados');
    await expect(page.getByTestId('cert-list')).toContainText(/Fundamentos|Generando/i);

    await page.goto('/ayuda');
    await page.getByTestId('ticket-subject').fill('Consulta QA');
    await page.getByTestId('ticket-body').fill('Necesito ayuda de prueba');
    await page.getByTestId('ticket-submit').click();
    await expect(page.getByTestId('ticket-list')).toContainText('Consulta QA');

    await page.goto('/cursos/liderazgo-con-proposito');
    await page.getByTestId('enroll-button').click();
    await expect(page.getByTestId('enroll-message')).toContainText(/inscri/i);
  });

  test('Profesor: crear curso, subir video, transcodificar, enviar revisión, ver estudiantes', async ({
    page,
    request,
  }) => {
    await expect
      .poll(async () => (await request.get(`${API}/courses/`)).status(), { timeout: 60000 })
      .toBe(200);

    await login(page, 'f.rojas');
    const profToken = await apiToken(request, 'f.rojas');
    const catsBody = await (await request.get(`${API}/categories/`)).json();
    const category = (catsBody.results || catsBody)[0].id;
    const courseRes = await request.post(`${API}/teacher/courses/`, {
      headers: { Authorization: `Bearer ${profToken}` },
      data: {
        title: `Curso E2E ${Date.now()}`,
        description: 'Curso QA',
        category,
        learning_objectives: ['Objetivo QA'],
        proposed_price_clp: 19990,
      },
    });
    expect(courseRes.ok()).toBeTruthy();
    const course = await courseRes.json();
    const slug = course.slug;

    await page.goto('/panel/profesor/crear');
    await expect(page.getByTestId('create-course-form')).toBeVisible();

    const modRes = await request.post(`${API}/teacher/courses/${slug}/modules/`, {
      headers: { Authorization: `Bearer ${profToken}` },
      data: { title: 'Modulo QA' },
    });
    const mod = await modRes.json();
    const lessonRes = await request.post(`${API}/teacher/modules/${mod.id}/lessons/`, {
      headers: { Authorization: `Bearer ${profToken}` },
      data: { title: 'Leccion QA', duration_seconds: 5, is_preview: true },
    });
    const lesson = await lessonRes.json();

    const fixture = path.join(__dirname, 'fixtures', 'sample.mp4');
    const videoBytes = fs.readFileSync(fixture);
    await request.post(`${API}/teacher/lessons/${lesson.id}/video/`, {
      headers: { Authorization: `Bearer ${profToken}` },
      multipart: {
        video: {
          name: 'sample.mp4',
          mimeType: 'video/mp4',
          buffer: videoBytes,
        },
        duration_seconds: '5',
      },
    });

    await expect
      .poll(async () => {
        const r = await request.get(`${API}/lessons/${lesson.id}/`, {
          headers: { Authorization: `Bearer ${profToken}` },
        });
        const d = await r.json();
        return d.video_status as string;
      }, { timeout: 90000 })
      .toMatch(/ready/i);

    await page.goto(`/panel/profesor/cursos/${slug}`);
    await page.getByTestId('submit-review').click();
    await page.goto('/panel/profesor/estudiantes');
    await expect(page.getByTestId('teacher-students-table')).toBeVisible();
  });

  test('Administración: sin montos en API, aprobar curso, ticket, certificado', async ({
    page,
    request,
  }) => {
    const token = await apiToken(request, 'marta.ibanez');
    const courses = await request.get(`${API}/courses/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await courses.json();
    const list = body.results || body;
    for (const c of list) {
      expect(c.price_clp).toBeNull();
    }

    await login(page, 'marta.ibanez');
    await page.goto('/panel/administracion');
    await expect(page.getByTestId('support-dashboard')).toBeAttached();

    const pending = await request.get(`${API}/admin/courses/pending/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const pendingList = await pending.json();
    const item = (pendingList.results || pendingList)[0];
    if (item?.slug) {
      await page.getByTestId(`approve-${item.slug}`).click();
    }

    await page.goto('/panel/administracion/certificados');
    const firstReissue = page.locator('[data-testid^="reissue-cert-"]').first();
    if (await firstReissue.count()) {
      page.once('dialog', (d) => d.accept());
      await firstReissue.click();
    }
  });

  test('Admin: ingresos, CSV, precio, roles, configuración', async ({ page, request }) => {
    await login(page, 'carlos.mendez');
    await page.goto('/panel/admin');
    await expect(page.locator('text=Ingresos totales').first()).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('export-csv').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.csv');

    await page.goto('/panel/admin/cursos');
    await page.getByTestId('set-price-romanos').click();

    await page.goto('/panel/admin/roles');
    await page.locator('[data-testid^="role-select-"]').first().selectOption('Estudiante');

    await page.goto('/panel/admin/configuracion');
    await page.getByTestId('toggle-teacher-earnings').check();
    await page.getByTestId('save-settings').click();

    const adminToken = await apiToken(request, 'carlos.mendez');
    const settings = await request.get(`${API}/admin/settings/`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(settings.ok()).toBeTruthy();
  });
});
