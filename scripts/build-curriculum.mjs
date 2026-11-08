import { readFile, readdir, writeFile } from 'node:fs/promises';

const root = new URL('../public/lessons/company-ai/', import.meta.url);
const files = (await readdir(root)).filter(name => /^\d\d-.+\.md$/.test(name)).sort();

function makeCard(block, index, id, count) {
  const [heading, ...lines] = block.trim().split('\n');
  const title = heading.replace(/^#\s+/, '');
  const [body, answer] = lines.join('\n').trim().split(/^پاسخ:\s*/m);
  if (!title || !body) throw new Error(`Incomplete card: ${id}/${index}`);
  const chapter = index === 0 ? 'شروع درس' : answer ? 'خودآزمایی' : index === count - 4 ? 'مرور و تمرین' : 'آموزش و مثال‌ها';
  return { id: `${id}-${index}`, title, body: body.trim(), chapter,
    ...(answer ? { question: title, answer: answer.trim() } : {}) };
}

async function makeCourse(file) {
  const markdown = await readFile(new URL(file, root), 'utf8');
  const id = 'company-ai-' + file.slice(0, 2);
  const blocks = markdown.trim().split(/^\s*---\s*$/m);
  const cards = blocks.map((block, index) => makeCard(block, index, id, blocks.length));
  return { id, title: cards[0].title, kind: 'ai', description: 'مسیر هوش مصنوعی شرکتی · مبانی تا پروژه', cards, position: 0, seen: [] };
}

const courses = [];
for (const file of files) courses.push(await makeCourse(file));
const sources = [];
for (const file of files) sources.push((await readFile(new URL(file, root), 'utf8')).trim());
const complete = '# هوش مصنوعی شرکتی؛ از مبانی تا پروژهٔ قابل‌آزمایش\n\nاین مجموعه، هشت درس پیوسته برای شروع کار با مدل‌های زبانی، بازیابی اسناد، زیرساخت داخلی و ایجنت‌هاست. درس‌ها را به ترتیب بخونید و تمرین‌های پایان هر درس را انجام بدید. مثال‌ها ساختگی‌ان و منابع کنار توضیح مربوط قرار دارن.\n\n---\n\n' + sources.join('\n\n---\n\n') + '\n';
const generated = '// Generated from public/lessons/company-ai/*.md by scripts/build-curriculum.mjs.\nexport const curriculum = ' + JSON.stringify(courses, null, 2) + ';\n';
const output = new URL('../src/lib/curriculum.ts', import.meta.url);
const completeOutput = new URL('company-ai-complete.md', root);
if (process.argv.includes('--check')) {
  if (await readFile(output, 'utf8') !== generated) throw new Error('Run node scripts/build-curriculum.mjs to refresh curriculum.');
  if (await readFile(completeOutput, 'utf8') !== complete) throw new Error('Combined Markdown is out of date.');
} else { await writeFile(output, generated); await writeFile(completeOutput, complete); }
console.log(`${courses.length} lessons, ${courses.reduce((sum, course) => sum + course.cards.length, 0)} cards`);
