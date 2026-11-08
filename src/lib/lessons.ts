export interface Card {
  id: string;
  title: string;
  body: string;
  question?: string;
  answer?: string;
  chapter: string;
}
export interface Course {
  id: string;
  title: string;
  kind: string;
  description: string;
  cards: Card[];
  position: number;
  seen: string[];
  archived?: boolean;
}
export interface Review {
  due: string;
  rating: 'again' | 'hard' | 'good';
}
export interface Preferences {
  textSize: number;
  motion: string;
  sound: boolean;
  pinned: boolean;
  reminder: boolean;
  reminderTime: string;
  color: string;
}
export interface SavedState {
  version: 1;
  courses: Course[];
  bookmarks: string[];
  notes: Record<string, { text: string; source: string }>;
  reviews: Record<string, Review>;
  studyDays: string[];
  preferences: Preferences;
}
const aiCards: Omit<Card, 'id'>[] = [
  {
    title: 'هوش مصنوعی چیست؟',
    body: 'هوش مصنوعی به ماشین‌ها کمک می‌کند کارهایی مانند یادگیری، حل مسئله و درک زبان را انجام دهند.',
    chapter: 'مفاهیم پایه',
  },
  {
    title: 'مدل چگونه یاد می‌گیرد؟',
    body: 'مدل با دیدن نمونه‌ها، الگوها را پیدا می‌کند. کیفیت و تنوع داده‌ها بر نتیجهٔ یادگیری اثر دارد.',
    chapter: 'یادگیری ماشین',
  },
  {
    title: 'پرامپت چیست؟',
    body: 'دستور یا پرسشی که به مدل می‌دهی،\nتا پاسخ موردنظرت را تولید کند.',
    chapter: 'مدل‌های زبانی',
  },
  { title: 'یک مثال ساده', body: 'مثال: این متن را خلاصه کن', chapter: 'مدل‌های زبانی' },
  {
    title: 'پرامپت خوب چه ویژگی‌هایی دارد؟',
    body: 'اول فکر کن، بعد پاسخ را ببین',
    question: 'پرامپت خوب چه ویژگی‌هایی دارد؟',
    answer: 'هدف روشن، زمینهٔ کافی و\nشکل خروجی مشخص.',
    chapter: 'مدل‌های زبانی',
  },
  {
    title: 'پاسخ مدل را بررسی کن',
    body: 'مدل ممکن است اشتباه کند. اطلاعات مهم را با منبع معتبر مقایسه کن.',
    chapter: 'مدل‌های زبانی',
  },
];
function course(id: string, title: string, kind: string, cards: Omit<Card, 'id'>[]): Course {
  return {
    id,
    title,
    kind,
    description: 'درس نمونه',
    cards: cards.map((card, index) => ({ ...card, id: `${id}-${index}` })),
    position: 0,
    seen: [],
  };
}
export function initialState(): SavedState {
  return {
    version: 1,
    courses: [
      course('ai', 'مبانی هوش مصنوعی', 'ai', aiCards),
      course('english', 'انگلیسی روزمره', 'english', [
        {
          title: 'معرفی خود',
          body: 'Hello! My name is Sara.\nسلام! نام من سارا است.',
          chapter: 'مکالمهٔ روزمره',
        },
        {
          title: 'زمان حال ساده',
          body: 'I study every day.\nمن هر روز مطالعه می‌کنم.',
          chapter: 'مکالمهٔ روزمره',
        },
      ]),
      course('excel', 'اکسل کاربردی', 'excel', [
        {
          title: 'جمع در اکسل',
          body: 'تابع SUM مجموع اعداد یک محدوده را محاسبه می‌کند.\n=SUM(A1:A10)',
          chapter: 'فرمول‌های پایه',
        },
        {
          title: 'تابع VLOOKUP در اکسل چه کاربردی دارد؟',
          body: 'این تابع یک مقدار را در ستون اول جدول پیدا می‌کند و مقدار ستون انتخاب‌شده را از همان ردیف برمی‌گرداند.',
          chapter: 'فرمول‌های پایه',
        },
      ]),
      course('thinking', 'تفکر نقادانه', 'brain', [
        {
          title: 'پرسش از شواهد',
          body: 'پیش از پذیرفتن یک ادعا بپرس: چه شواهدی از آن پشتیبانی می‌کند؟',
          chapter: 'مفاهیم پایه',
        },
        {
          title: 'تفاوت نظر و واقعیت',
          body: 'واقعیت را می‌توان بررسی کرد؛ نظر، برداشت یا قضاوت فرد است.',
          chapter: 'مفاهیم پایه',
        },
      ]),
    ],
    bookmarks: [],
    notes: {},
    reviews: {},
    studyDays: [],
    preferences: {
      textSize: 1,
      motion: 'full',
      sound: false,
      pinned: false,
      reminder: false,
      reminderTime: '20:00',
      color: 'blue',
    },
  };
}
export function normalizeSearch(text: string): string {
  return text
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[\s\u200c]+/g, ' ')
    .trim()
    .toLowerCase();
}
export function parseLesson(markdown: string, title: string): Course {
  if (markdown.length > 2_000_000)
    throw new Error('فایل خیلی بزرگ است؛ فایل کوچک‌تر از ۲ مگابایت انتخاب کن.');
  const blocks = markdown
    .trim()
    .split(/^\s*---\s*$/m)
    .filter((block) => block.trim());
  if (!blocks.length) throw new Error('فایل خالی است. برای هر کارت یک عنوان و متن بنویس.');
  const id = crypto.randomUUID();
  const cards = blocks.map((block, index) => parseCard(block, index, id));
  return {
    id,
    title: title.trim() || cards[0].title,
    kind: 'ai',
    description: 'درس من',
    cards,
    position: 0,
    seen: [],
  };
}
function parseCard(block: string, index: number, courseId: string): Card {
  const lines = block.trim().split('\n');
  const title = lines
    .shift()
    ?.replace(/^#+\s*/, '')
    .trim();
  const body = lines.join('\n').trim();
  if (!title || !body)
    throw new Error(`کارت ${index + 1}: عنوان و متن هر دو لازم‌اند. کارت‌ها را با --- جدا کن.`);
  const answerSplit = body.split(/^پاسخ:\s*/m);
  return {
    id: `${courseId}-${index}`,
    title,
    body: answerSplit[0].trim(),
    chapter: 'فصل اول',
    ...(answerSplit.length > 1
      ? { question: title, answer: answerSplit.slice(1).join('\n').trim() }
      : {}),
  };
}
export function isSavedState(value: unknown): value is SavedState {
  if (typeof value !== 'object' || value === null) return false;
  const state = value as SavedState;
  return (
    state.version === 1 &&
    Array.isArray(state.courses) &&
    state.courses.every(validCourse) &&
    Array.isArray(state.bookmarks) &&
    state.bookmarks.every((id) => typeof id === 'string') &&
    validNotes(state.notes) &&
    validReviews(state.reviews) &&
    Array.isArray(state.studyDays) &&
    state.studyDays.every((day) => typeof day === 'string') &&
    validPreferences(state.preferences)
  );
}
function validCourse(course: Course): boolean {
  return (
    !!course &&
    typeof course.id === 'string' &&
    typeof course.title === 'string' &&
    typeof course.kind === 'string' &&
    Array.isArray(course.cards) &&
    course.cards.length > 0 &&
    course.cards.every(
      (card) =>
        typeof card.id === 'string' &&
        typeof card.title === 'string' &&
        typeof card.body === 'string' &&
        typeof card.chapter === 'string',
    ) &&
    Number.isInteger(course.position) &&
    course.position >= 0 &&
    course.position < course.cards.length &&
    Array.isArray(course.seen) &&
    course.seen.every((id) => typeof id === 'string')
  );
}
function validNotes(notes: SavedState['notes']): boolean {
  return (
    !!notes &&
    typeof notes === 'object' &&
    Object.values(notes).every(
      (note) => typeof note.text === 'string' && typeof note.source === 'string',
    )
  );
}
function validReviews(reviews: SavedState['reviews']): boolean {
  return (
    !!reviews &&
    typeof reviews === 'object' &&
    Object.values(reviews).every(
      (review) =>
        ['again', 'hard', 'good'].includes(review.rating) && !Number.isNaN(Date.parse(review.due)),
    )
  );
}
function validPreferences(p: Preferences): boolean {
  return (
    !!p &&
    [0, 1, 2].includes(p.textSize) &&
    ['full', 'reduced', 'off'].includes(p.motion) &&
    ['blue', 'lavender'].includes(p.color) &&
    typeof p.sound === 'boolean' &&
    typeof p.pinned === 'boolean' &&
    typeof p.reminder === 'boolean' &&
    /^\d{2}:\d{2}$/.test(p.reminderTime)
  );
}
export function loadState(): SavedState {
  const raw = localStorage.getItem('joree-v1');
  if (!raw) return initialState();
  const parsed: unknown = JSON.parse(raw);
  if (!isSavedState(parsed))
    throw new Error('اطلاعات ذخیره‌شده سازگار نیست. از بخش تنظیمات نسخهٔ پشتیبان را بازیابی کن.');
  return parsed;
}
export function scheduleReview(rating: Review['rating'], now: Date): Review {
  const minutes = { again: 10, hard: 1440, good: 4320 }[rating];
  return { rating, due: new Date(now.getTime() + minutes * 60_000).toISOString() };
}
export const fa = (value: number) => value.toLocaleString('fa-IR');
