import { test, expect } from '@playwright/test';

test('legacy arrivals preserve fragment precedence, replace history and never fetch the old hall', async ({ page }) => {
  const hall: string[] = [];
  page.on('request', r => { if (/\/library\/hall(?:-low)?\.glb/.test(r.url())) hall.push(r.url()); });
  await page.goto('/resume');
  await page.goto('/?view=world&zone=periodicals#cabinet');
  await expect(page).toHaveURL(/\/library#cabinet$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/resume$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/library#cabinet$/);
  await page.reload();
  await expect(page).toHaveURL(/\/library#cabinet$/);
  expect(hall).toEqual([]);
});

test('text destinations and unknown books normalize safely', async ({ page }) => {
  await page.goto('/library?view=world&zone=periodicals');
  await expect(page).toHaveURL(/\/blog$/);
  await expect(page.getByRole('heading', { name: 'Library catalog' })).toBeVisible();
  await page.goto('/library?book=unknown-hidden-book&page=%2F%2Fevil.invalid');
  await expect(page).toHaveURL(/\/library$/);
  await expect(page.getByRole('link', { name: 'Enter the library', exact: true }).first()).toBeVisible();
});

test('native world without WebGL retains plain reading', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      return type === 'webgl2' ? null : original.apply(this, [type, ...rest] as Parameters<typeof original>);
    } as typeof original;
  });
  await page.goto('/library#cabinet');
  await expect(page.getByText('The 3D library could not be opened on this device.', { exact: false })).toBeVisible({ timeout: 60000 });
  await expect(page.getByRole('link', { name: /catalog/i }).first()).toBeVisible();
});
