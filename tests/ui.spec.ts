import { test, expect, type Page } from '@playwright/test';
async function ready(page: Page) {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
}
async function screenshot(page: Page, name: string) {
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `docs/screenshots/${name}.png`, animations: 'disabled' });
}
test('library, search, chapters, study, notes and persistence', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await ready(page);
  await screenshot(page, '01-library');
  await page.getByRole('textbox', { name: 'جست‌وجوی درس' }).fill('هوش مصنوعی داخلی');
  await expect(page.locator('.course-card')).toHaveCount(1);
  await page.getByRole('textbox', { name: 'جست‌وجوی درس' }).fill('بدون نتیجه');
  await expect(page.getByText('درسی پیدا نشد')).toBeVisible();
  await page.getByRole('textbox', { name: 'جست‌وجوی درس' }).fill('');
  await page.locator('.course-card').filter({ hasText: 'از مسئلهٔ شرکت تا مدل زبانی' }).click();
  await screenshot(page, '02-course');
  await page.getByRole('button', { name: 'آموزش و مثال‌ها' }).click();
  await expect(page.getByRole('heading', { name: 'مدل، برنامه و دستیار چه فرقی دارن؟' })).toBeVisible();
  await screenshot(page, '03-study');
  await page.getByRole('button', { name: 'نشان‌کردن کارت' }).click();
  await page.getByRole('button', { name: 'یادداشت کارت', exact: true }).click();
  await page.getByRole('textbox', { name: 'یادداشت من' }).fill('هدف و قالب خروجی را دقیق بنویسم.');
  await screenshot(page, '04-note');
  await page.getByRole('button', { name: 'ذخیرهٔ یادداشت' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'ادامهٔ یادگیری', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'مدل، برنامه و دستیار چه فرقی دارن؟' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'نشان‌کردن کارت' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'یادداشت کارت', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'یادداشت من' })).toHaveValue(
    'هدف و قالب خروجی را دقیق بنویسم.',
  );
  expect(errors).toEqual([]);
});
test('Markdown import preview, commit and malformed file state', async ({ page }) => {
  await ready(page);
  await page.getByRole('button', { name: 'افزودن درس', exact: true }).click();
  await screenshot(page, '05-import');
  await page
    .locator('input[type=file][accept=".md,.markdown,.txt"]')
    .setInputFiles({
      name: 'my-course.md',
      mimeType: 'text/markdown',
      buffer: Buffer.from(
        '# کارت من\nاین یک متن آموزشی است.\n---\n# پرسش من؟\nفکر کن\nپاسخ: جواب من',
      ),
    });
  await expect(page.getByRole('heading', { name: 'پیش‌نمایش درس' })).toBeVisible();
  await screenshot(page, '06-import-preview');
  await page.getByRole('button', { name: 'افزودن به کتابخانه' }).click();
  await expect(page.locator('.course-card').filter({ hasText: 'my-course' })).toBeVisible();
  await page.reload();
  await expect(page.locator('.course-card').filter({ hasText: 'my-course' })).toBeVisible();
  await page.getByRole('button', { name: 'افزودن درس', exact: true }).click();
  await page
    .locator('input[type=file][accept=".md,.markdown,.txt"]')
    .setInputFiles({
      name: 'bad.md',
      mimeType: 'text/markdown',
      buffer: Buffer.from('# تنها عنوان'),
    });
  await expect(page.getByRole('heading', { name: 'این فایل نیاز به اصلاح دارد' })).toBeVisible();
  await screenshot(page, '07-import-error');
});
test('question reveal, rating, review and progress', async ({ page }) => {
  await ready(page);
  await page.locator('.course-card').filter({ hasText: 'از مسئلهٔ شرکت تا مدل زبانی' }).click();
  await page.getByRole('button', { name: 'خودآزمایی' }).click();
  await expect(page.getByRole('button', { name: 'نمایش پاسخ' })).toBeVisible();
  await screenshot(page, '08-question');
  await page.getByRole('button', { name: 'نمایش پاسخ' }).click();
  await screenshot(page, '09-answer');
  await page.getByRole('button', { name: 'بلدم', exact: true }).click();
  await page.getByRole('button', { name: 'پیشرفت', exact: true }).click();
  await screenshot(page, '10-progress');
  await expect(page.locator('.stats-grid article').nth(1)).toContainText('۱');
  await page.locator('.progress-tip').click();
  await screenshot(page, '11-rewards');
  await page.getByRole('button', { name: 'مرور کارت‌ها', exact: true }).click();
  await screenshot(page, '12-review');
  await expect(page.getByText('مرورهای امروزت تمام شده!')).toBeVisible();
});
test('settings, theme, text sizes, motion and compact layout', async ({ page }) => {
  await ready(page);
  await page.getByRole('button', { name: 'تنظیمات', exact: true }).click();
  await screenshot(page, '13-settings');
  await page.getByRole('button', { name: 'خیلی بزرگ', exact: true }).click();
  await page.getByRole('button', { name: 'کم', exact: true }).click();
  await page.getByRole('button', { name: 'پوسته‌ها و رنگ کنسول' }).click();
  await screenshot(page, '14-themes');
  await page.getByRole('button', { name: 'بنفش', exact: true }).click();
  await expect(page.locator('.console')).toHaveClass(/theme-lavender/);
  await page.reload();
  await expect(page.locator('.console')).toHaveClass(/theme-lavender/);
  await page.getByRole('button', { name: 'حالت کوچک مطالعه' }).click();
  await screenshot(page, '15-compact');
  await expect(page.locator('.console')).toHaveClass(/compact/);
  await page.getByRole('button', { name: 'حالت بزرگ', exact: true }).click();
  await expect(page.locator('.console')).not.toHaveClass(/compact/);
});
test('all games start, pause, resume and return', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await ready(page);
  await page.getByRole('button', { name: 'زنگ تفریح', exact: true }).click();
  await expect(page.locator('.game-cartridge')).toHaveCount(3);
  await screenshot(page, '16-arcade');
  for (const [index, name] of ['بلوک‌ها', 'مار', 'پونگ'].entries()) {
    await page
      .locator('.game-cartridge')
      .filter({ hasText: name })
      .getByRole('button', { name: 'شروع' })
      .click();
    await expect(page.locator('canvas')).toBeVisible();
    await page.locator('canvas').focus();
    await page.keyboard.press('ArrowRight');
    await screenshot(page, `17-game-${index}`);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'بازی متوقف شد' })).toBeVisible();
    if (index === 0) await screenshot(page, '18-game-paused');
    await page.getByRole('button', { name: 'ادامهٔ بازی' }).click();
    await page.locator('.game-footer').getByRole('button', { name: 'انتخاب بازی' }).click();
  }
  expect(errors).toEqual([]);
});
test('backup download and validated restore', async ({ page }) => {
  await ready(page);
  await page.getByRole('button', { name: 'تنظیمات', exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'گرفتن نسخهٔ پشتیبان' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/joree-backup/);
  await page.getByRole('button', { name: 'بازیابی', exact: true }).click();
  await page
    .getByLabel('فایل پشتیبان')
    .setInputFiles({
      name: 'bad.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"version":99}'),
    });
  await expect(page.getByRole('alert')).toContainText('سازگار نیست');
});
test('scaled desktop sizes fit the console without horizontal overflow', async ({ page }) => {
  await ready(page);
  for (const [width, height] of [
    [1280, 900],
    [1024, 768],
    [800, 600],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);
    const rect = await page.locator('.console').boundingBox();
    expect(rect!.x).toBeGreaterThanOrEqual(0);
    expect(rect!.y).toBeGreaterThanOrEqual(0);
    expect(rect!.y + rect!.height).toBeLessThanOrEqual(height);
  }
});

test('long lessons show local diagrams, clickable sources, and downloadable practice files', async ({ page }) => {
  await ready(page);
  await expect(page.locator('.course-card')).toHaveCount(8);
  await page.locator('.course-card').filter({ hasText: 'ساخت RAG' }).click();
  await page.getByRole('button', { name: 'آموزش و مثال‌ها' }).click();
  const reading = page.getByRole('region', { name: 'محتوای آموزشی' });
  const diagram = reading.locator('img');
  await expect.poll(() => diagram.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  await diagram.scrollIntoViewIfNeeded();
  await expect(diagram).toBeVisible();
  await expect(reading.getByRole('link')).toHaveAttribute('target', '_blank');
  await screenshot(page, '20-rag-diagram');
  await reading.focus();
  const before = await reading.evaluate(element => element.scrollTop);
  await page.keyboard.press('Home');
  await expect.poll(() => reading.evaluate(element => element.scrollTop)).toBeLessThan(before);
  await page.getByRole('button', { name: 'کتابخانه', exact: true }).click();
  await page.locator('.course-card').filter({ hasText: 'پروژهٔ پایانی' }).click();
  await page.getByRole('button', { name: 'آموزش و مثال‌ها' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'آزمایش اجرایی' }).click();
  expect((await downloadPromise).suggestedFilename()).toBe('lab.mjs');
});

test('window sizes and compact mode have no horizontal scrolling inside the console', async ({ page }) => {
  await ready(page);
  for (const compact of [false, true]) {
    if (compact) await page.getByRole('button', { name: 'حالت کوچک مطالعه' }).click();
    for (const [width, height] of [[570, 465], [800, 600], [1280, 900], [390, 844]]) {
      await page.setViewportSize({ width, height });
      for (const destination of ['کتابخانه', 'تنظیمات', 'پیشرفت', 'مرور کارت‌ها']) {
        await page.getByRole('button', { name: destination, exact: true }).click();
        const scrollbars = await page.locator('.console-screen').evaluate(screen =>
          [screen, ...screen.querySelectorAll('*')].filter(element => {
            const style = getComputedStyle(element);
            return ['auto', 'scroll'].includes(style.overflowX) && element.scrollWidth > element.clientWidth + 1;
          }).map(element => element.className));
        expect(scrollbars, `${destination}: ${width}x${height}, compact=${compact}`).toEqual([]);
      }
    }
  }
});
