import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  initialState,
  parseLesson,
  normalizeSearch,
  isSavedState,
  scheduleReview,
} from '../src/lib/lessons.ts';
import { ArcadeEngine } from '../src/lib/games.ts';
test('Markdown cards keep bodies and stable identities within the imported course', () => {
  const course = parseLesson('# اول\nمتن اول\n---\n# دوم\nمتن دوم', 'درس');
  assert.equal(course.cards.length, 2);
  assert.equal(course.cards[0].title, 'اول');
  assert.equal(course.cards[1].body, 'متن دوم');
  assert.notEqual(course.cards[0].id, course.cards[1].id);
});
test('question answers parse without exposing the answer in the body', () => {
  const card = parseLesson('# پرسش؟\nفکر کن\nپاسخ: جواب', 'پرسش').cards[0];
  assert.equal(card.question, 'پرسش؟');
  assert.equal(card.body, 'فکر کن');
  assert.equal(card.answer, 'جواب');
});
test('empty and incomplete lesson cards report useful errors', () => {
  assert.throws(() => parseLesson('', ''), /خالی/);
  assert.throws(() => parseLesson('# عنوان', 'درس'), /کارت 1/);
  assert.throws(() => parseLesson('x'.repeat(2_000_001), 'درس'), /بزرگ/);
});
test('Persian search normalizes Arabic characters and ZWNJ', () => {
  assert.equal(normalizeSearch('يادگيري كارت‌ها'), normalizeSearch('یادگیری کارت ها'));
});
test('backup validation rejects corrupt positions, preferences, notes and review times', () => {
  const state = initialState();
  assert.equal(isSavedState(state), true);
  const bad = structuredClone(state);
  bad.courses[0].position = 900;
  assert.equal(isSavedState(bad), false);
  assert.equal(isSavedState({ ...state, preferences: {} }), false);
  assert.equal(isSavedState({ ...state, notes: { a: { text: 33 } } }), false);
  assert.equal(isSavedState({ ...state, reviews: { a: { rating: 'good', due: 'bad' } } }), false);
});
test('review dates reflect rating with deterministic time input', () => {
  const now = new Date('2026-11-04T08:00:00Z');
  assert.equal(scheduleReview('again', now).due, '2026-11-04T08:10:00.000Z');
  assert.equal(scheduleReview('hard', now).due, '2026-11-05T08:00:00.000Z');
  assert.equal(scheduleReview('good', now).due, '2026-11-07T08:00:00.000Z');
});
test('snake rejects reversal, grows after food, and ends on wall collision', () => {
  const game = new ArcadeEngine('snake');
  game.key('ArrowLeft');
  assert.deepEqual(game.queuedDirection, { x: 1, y: 0 });
  game.food = { x: 8, y: 7 };
  for (let step = 0; step < 10; step++) game.tick(1);
  assert.equal(game.score, 10);
  assert.equal(game.snake.length, 5);
  for (let step = 0; step < 200; step++) game.tick(1);
  assert.equal(game.over, true);
});
test('blocks cannot cross the board and hard drop locks the active piece', () => {
  const game = new ArcadeEngine('blocks');
  for (let i = 0; i < 20; i++) game.key('ArrowLeft');
  assert.ok(game.piece.every((cell) => cell.x + game.pieceOrigin.x >= 0));
  game.key(' ');
  assert.ok(game.board.some((row) => row.some((cell) => cell !== null)));
});
test('pong awards a point and finishes at five', () => {
  const game = new ArcadeEngine('pong');
  game.score = 4;
  game.ball = { x: 402, y: 100, vx: 3, vy: 0 };
  game.tick(1);
  assert.equal(game.score, 5);
  assert.equal(game.over, true);
});
