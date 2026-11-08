import { mkdir, writeFile } from 'node:fs/promises';
const directory = new URL('../public/lessons/company-ai/images/', import.meta.url);
await mkdir(directory, { recursive: true });
const diagrams = {
  decision: { title: 'از مسئله تا راهکار', steps: [
    ['رفتار یا قالب مبهمه؟', 'اول دستور و نمونه‌ها را اصلاح کنید.'],
    ['اطلاعات تازه یا اختصاصی لازمه؟', 'سند معتبر را بازیابی و به زمینه اضافه کنید.'],
    ['الگوی تخصصی هنوز درست اجرا نمیشه؟', 'با داده و معیار، آموزش تکمیلی را آزمایش کنید.']
  ], note: 'این مسیر راهنمای شروعه؛ روش‌ها می‌تونن ترکیب بشن.' },
  rag: { title: 'دو مسیر سامانهٔ بازیابی', steps: [
    ['آماده‌سازی: سند معتبر', 'استخراج متن ← قطعه‌بندی ← ثبت نسخه و مجوز'],
    ['ذخیرهٔ قطعه و نمایه', 'بردار، متن، شناسه و مشخصات منبع'],
    ['پاسخ‌گویی: سؤال و هویت معتبر', 'فیلتر دسترسی ← جست‌وجو ← انتخاب شاهد'],
    ['مدل و پاسخ مستند', 'سؤال + شاهد مجاز ← پاسخ با ارجاع یا ندانستن']
  ], note: 'حذف یا تغییر سند باید در نمایه هم اعمال بشه.' },
  internal: { title: 'اجزای دستیار در شبکهٔ شرکت', steps: [
    ['کاربر ← درگاه ورود', 'احراز هویت، سقف درخواست و ثبت شناسه'],
    ['برنامه ← بازیابی مجاز', 'کنترل نقش، سند معتبر و مخزن جست‌وجو'],
    ['برنامه ← سرویس مدل', 'سؤال و قطعه‌های مجاز، با سقف زمان و زمینه'],
    ['برنامه ← پاسخ و پایش', 'نمایش شاهد، ثبت سلامت و امکان رسیدگی انسانی']
  ], note: 'هر اتصال بیرون این مرز نیاز به بررسی جریان داده داره.' },
  agent: { title: 'حلقهٔ محدود ایجنت', steps: [
    ['هدف و وضعیت فعلی', 'مدل قدم بعدی را در محدودهٔ ابزارها پیشنهاد میده.'],
    ['کنترل برنامه', 'اعتبار ورودی، هویت، مجوز و تأیید لازم بررسی میشه.'],
    ['اجرای ابزار و مشاهده', 'نتیجه یا خطای واقعی به وضعیت برمی‌گرده.'],
    ['تصمیم بعدی یا توقف', 'تکرار با سقف قدم؛ ابهام یا عمل حساس ← انسان']
  ], note: 'پیشنهاد مدل مجوز اجرای ابزار نیست.' }
};
function box([heading, body], index) {
  const y = 88 + index * 128;
  return `<rect x="24" y="${y}" width="672" height="100" rx="12" fill="#fff" stroke="#555" stroke-width="2"/><text x="360" y="${y+35}" font-size="25" font-weight="700">${heading}</text><text x="360" y="${y+73}" font-size="20">${body}</text>${index ? `<path d="M360 ${y-24} V${y-6}" fill="none" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/>` : ''}`;
}
for (const [name, diagram] of Object.entries(diagrams)) {
  const height = 118 + diagram.steps.length * 128;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="${height}" viewBox="0 0 720 ${height}" role="img" aria-labelledby="title desc"><title id="title">${diagram.title}</title><desc id="desc">${diagram.steps.map(step=>step.join('، ')).join('؛ ')}</desc><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="none" stroke="#333"/></marker></defs><rect width="720" height="${height}" fill="#fafafa"/><g font-family="Vazirmatn, Tahoma, sans-serif" text-anchor="middle" direction="rtl" fill="#222"><text x="360" y="47" font-size="29" font-weight="700">${diagram.title}</text>${diagram.steps.map(box).join('')}<text x="360" y="${height-20}" font-size="18">${diagram.note}</text></g></svg>`;
  await writeFile(new URL(name + '.svg', directory), svg);
}
