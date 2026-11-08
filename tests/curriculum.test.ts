import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initialState, migrateCurriculum, parseLesson } from '../src/lib/lessons.ts';
import { inlineParts, lessonBlocks, lessonUrl } from '../src/lib/lessonMarkdown.ts';
import { generate, retrieve } from '../public/lessons/company-ai/lab/lab.mjs';

test('all eight published lessons retain their Markdown, three hidden answers and resolvable diagrams', () => {
  const state = initialState();
  assert.equal(state.courses.length, 8);
  assert.equal(state.courses.flatMap((item) => item.cards).length, 83);
  for (const course of state.courses) {
    assert.equal(course.cards.filter((card) => card.question).length, 3);
    for (const card of course.cards) {
      if (card.question) {
        assert.ok(card.answer);
        assert.ok(!card.body.includes('پاسخ:'));
      }
      for (const block of lessonBlocks(card.body)) {
        if (block.src)
          assert.ok(
            readFileSync(new URL('../public' + block.src, import.meta.url), 'utf8').includes(
              '<svg',
            ),
          );
      }
    }
  }
});

test('demo migration preserves imported work and preferences and runs only once', () => {
  const custom = parseLesson('# درس شخصی\nمحتوای شخصی', 'شخصی');
  const legacy = initialState();
  delete legacy.curriculumVersion;
  legacy.courses = [{ ...custom, id: 'ai', cards: [{ ...custom.cards[0], id: 'ai-0' }] }, custom];
  legacy.bookmarks = ['ai-0', custom.cards[0].id];
  legacy.notes = {
    'ai-0': { text: 'نمونه', source: 'نمونه' },
    [custom.cards[0].id]: { text: 'من', source: 'شخصی' },
  };
  legacy.reviews = { 'ai-0': { rating: 'good', due: '2026-11-08' } };
  legacy.preferences.color = 'lavender';
  const next = migrateCurriculum(legacy);
  assert.equal(next.courses.length, 9);
  assert.ok(!next.courses.some((course) => course.id === 'ai'));
  assert.deepEqual(next.courses.at(-1), custom);
  assert.equal(next.preferences.color, 'lavender');
  assert.deepEqual(next.bookmarks, [custom.cards[0].id]);
  assert.equal(next.notes[custom.cards[0].id].text, 'من');
  assert.equal(next.notes['ai-0'], undefined);
  assert.deepEqual(next.reviews, {});
  next.courses.shift();
  assert.equal(migrateCurriculum(next), next);
  assert.equal(next.courses.length, 8); // User deletion does not repopulate bundled lessons.
  assert.equal(legacy.courses.length, 2);
});

test('lesson rendering never activates HTML, script schemes, remote images or filesystem paths', () => {
  for (const url of [
    'javascript:alert(1)',
    'data:text/html,test',
    'file:///C:/Windows',
    '//example.com',
    '../../secret',
    'https://example.com/image.svg',
  ]) {
    assert.equal(lessonUrl(url, true), undefined);
  }
  assert.equal(lessonUrl('javascript:test'), undefined);
  assert.equal(lessonUrl('images/rag.svg', true), '/lessons/company-ai/images/rag.svg');
  assert.equal(lessonUrl('https://docs.ollama.com/api/chat'), 'https://docs.ollama.com/api/chat');
  assert.equal(inlineParts('[متن](javascript:test)')[0].kind, 'text');
  assert.equal(lessonBlocks('<script>alert(1)</script>')[0].kind, 'paragraph');
  const blocks = lessonBlocks('```js\n<script>example</script>\n```\n\n![نمودار](images/rag.svg)');
  assert.equal(blocks[0].kind, 'code');
  assert.equal(blocks[1].kind, 'image');
});

test('optional local generation sends only prefiltered evidence and reports service failures', async () => {
  const data = JSON.parse(
    readFileSync(new URL('../public/lessons/company-ai/lab/data.json', import.meta.url), 'utf8'),
  );
  const evidence = retrieve(data.documents, 'مرخصی سالانه', 'employee');
  const request = async (url: string | URL | Request, options?: RequestInit) => {
    assert.equal(url, 'http://127.0.0.1:11434/api/chat');
    const body = JSON.parse(String(options?.body));
    assert.equal(body.stream, false);
    assert.ok(!body.messages[1].content.includes('salary'));
    assert.ok(!body.messages[1].content.includes('leave-v1'));
    return new Response(JSON.stringify({ message: { content: 'پاسخ آزمایشی' } }));
  };
  assert.equal(await generate('مرخصی سالانه', evidence, 'mock-model', request), 'پاسخ آزمایشی');
  await assert.rejects(generate('پرسش', evidence, '', request), /JOREE_OLLAMA_MODEL/);
  await assert.rejects(
    generate('پرسش', evidence, 'mock-model', async () => new Response('', { status: 503 })),
    /503/,
  );
  await assert.rejects(
    generate('پرسش', evidence, 'mock-model', async () => new Response('{}')),
    /معتبر/,
  );
});
