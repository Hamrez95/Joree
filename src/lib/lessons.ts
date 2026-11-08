import { curriculum } from './curriculum.ts';

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
  collectionId?: string | null;
}
export interface Collection {
  id: string;
  name: string;
  parentId: string | null;
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
  curriculumVersion?: number;
  courses: Course[];
  collections: Collection[];
  bookmarks: string[];
  notes: Record<string, { text: string; source: string }>;
  reviews: Record<string, Review>;
  studyDays: string[];
  preferences: Preferences;
}
export function initialState(): SavedState {
  const collectionId = 'collection-ai';
  return {
    version: 1,
    curriculumVersion: 1,
    courses: structuredClone(curriculum).map((course) => ({ ...course, collectionId })),
    collections: [{ id: collectionId, name: 'هوش مصنوعی (AI)', parentId: null }],
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

/** Replaces only the four original demo IDs once; imported lessons and preferences survive. */
export function migrateCurriculum(state: SavedState): SavedState {
  let migrated = state;
  if (state.curriculumVersion !== 1) {
    const demoIds = new Set(['ai', 'english', 'excel', 'thinking']);
    const removedCards = new Set(
      state.courses
        .filter((item) => demoIds.has(item.id))
        .flatMap((item) => item.cards.map((card) => card.id)),
    );
    const retained = state.courses.filter((item) => !demoIds.has(item.id));
    const retainedIds = new Set(retained.map((item) => item.id));
    migrated = {
      ...state,
      curriculumVersion: 1,
      studyDays: retained.length ? state.studyDays : [],
      courses: [
        ...structuredClone(curriculum).filter((item) => !retainedIds.has(item.id)),
        ...retained,
      ],
      bookmarks: state.bookmarks.filter((id) => !removedCards.has(id)),
      notes: Object.fromEntries(Object.entries(state.notes).filter(([id]) => !removedCards.has(id))),
      reviews: Object.fromEntries(
        Object.entries(state.reviews).filter(([id]) => !removedCards.has(id)),
      ),
    };
  }
  return normalizeCollections(migrated);
}
function normalizeCollections(state: SavedState): SavedState {
  const hadCollections = Array.isArray(state.collections);
  const collections = hadCollections ? [...state.collections] : [];
  const needsAiCollection = !hadCollections && state.courses.some((course) => course.id.startsWith('company-ai-'));
  if (needsAiCollection && !collections.some((collection) => collection.id === 'collection-ai'))
    collections.push({ id: 'collection-ai', name: 'هوش مصنوعی (AI)', parentId: null });
  const ids = new Set(collections.map((collection) => collection.id));
  const valid = collections.map((collection) => ({
    ...collection,
    parentId: collection.parentId && ids.has(collection.parentId) && collection.parentId !== collection.id
      ? collection.parentId
      : null,
  }));
  const nextCourses = state.courses.map((course) => {
    const collectionId = course.collectionId === undefined
      ? !hadCollections && course.id.startsWith('company-ai-') ? 'collection-ai' : null
      : course.collectionId && ids.has(course.collectionId) ? course.collectionId : null;
    return course.collectionId === collectionId ? course : { ...course, collectionId };
  });
  const unchanged = hadCollections && valid.every((collection, index) =>
    collection.parentId === state.collections[index]?.parentId,
  ) && nextCourses.every((course, index) => course === state.courses[index]);
  return unchanged ? state : { ...state, collections: valid, courses: nextCourses };
}
export function normalizeSearch(text: string): string {
  return text
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[\s\u200c]+/g, ' ')
    .trim()
    .toLowerCase();
}
export function parseLesson(markdown: string, title: string, collectionId: string | null = null): Course {
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
    collectionId,
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
    (state.collections === undefined || validCollections(state.collections)) &&
    Array.isArray(state.bookmarks) &&
    state.bookmarks.every((id) => typeof id === 'string') &&
    validNotes(state.notes) &&
    validReviews(state.reviews) &&
    Array.isArray(state.studyDays) &&
    state.studyDays.every((day) => typeof day === 'string') &&
    validPreferences(state.preferences)
  );
}
function validCollections(value: unknown): value is Collection[] {
  if (!Array.isArray(value)) return false;
  const collections = value as Collection[];
  if (!collections.every((item) =>
    !!item && typeof item.id === 'string' && item.id.length > 0 &&
    typeof item.name === 'string' && !!item.name.trim() &&
    (item.parentId === null || typeof item.parentId === 'string'),
  )) return false;
  const byId = new Map(collections.map((item) => [item.id, item]));
  if (byId.size !== collections.length) return false;
  return collections.every((item) => {
    const seen = new Set([item.id]);
    let parentId = item.parentId;
    while (parentId !== null) {
      if (seen.has(parentId)) return false;
      seen.add(parentId);
      const parent = byId.get(parentId);
      if (!parent) return false;
      parentId = parent.parentId;
    }
    return true;
  });
}
function validCourse(course: Course): boolean {
  return (
    !!course &&
    typeof course.id === 'string' &&
    typeof course.title === 'string' &&
    typeof course.kind === 'string' &&
    (course.collectionId === undefined || course.collectionId === null || typeof course.collectionId === 'string') &&
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
    [0, 1, 2, 3, 4].includes(p.textSize) &&
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
  return migrateCurriculum(parsed);
}
export function scheduleReview(rating: Review['rating'], now: Date): Review {
  const minutes = { again: 10, hard: 1440, good: 4320 }[rating];
  return { rating, due: new Date(now.getTime() + minutes * 60_000).toISOString() };
}
export const fa = (value: number) => value.toLocaleString('fa-IR');
