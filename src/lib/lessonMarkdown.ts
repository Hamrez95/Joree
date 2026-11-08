export interface InlinePart {
  kind: 'text' | 'code' | 'strong' | 'link';
  text: string;
  href?: string;
  download?: boolean;
}
export interface LessonBlock {
  kind: 'paragraph' | 'heading' | 'list' | 'code' | 'image';
  text: string;
  items?: string[];
  src?: string;
}
const CONTENT_ROOT = '/lessons/company-ai/';

/** Accepts web links and bundled lesson assets. HTML, executable schemes and filesystem paths stay inert. */
export function lessonUrl(value: string, image = false): string | undefined {
  if (/^https?:\/\//i.test(value) && !image) {
    try {
      return new URL(value).href;
    } catch {
      return undefined;
    }
  }
  const relative = value.replace(/^\.\//, '');
  const path = relative.startsWith(CONTENT_ROOT) ? relative : CONTENT_ROOT + relative;
  if (
    !/^\/lessons\/company-ai\/(?:images\/[a-z-]+\.svg|lab\/(?:lab\.mjs|data\.json)|[a-z0-9-]+\.md)$/.test(
      path,
    )
  )
    return undefined;
  if (image && !path.endsWith('.svg')) return undefined;
  return path;
}

export function inlineParts(text: string): InlinePart[] {
  const pattern = /`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^\s)]+)\)/g;
  const parts: InlinePart[] = [];
  let offset = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index! > offset) parts.push({ kind: 'text', text: text.slice(offset, match.index) });
    if (match[1]) parts.push({ kind: 'code', text: match[1] });
    else if (match[2]) parts.push({ kind: 'strong', text: match[2] });
    else {
      const href = lessonUrl(match[4]);
      parts.push(
        href
          ? { kind: 'link', text: match[3], href, download: href.startsWith(CONTENT_ROOT) }
          : { kind: 'text', text: match[3] },
      );
    }
    offset = match.index! + match[0].length;
  }
  if (offset < text.length) parts.push({ kind: 'text', text: text.slice(offset) });
  return parts;
}

/** Parses the documented lesson subset without ever interpreting raw HTML. */
export function lessonBlocks(markdown: string): LessonBlock[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: LessonBlock[] = [];
  let paragraph: string[] = [];
  const flush = () => {
    if (paragraph.length) blocks.push({ kind: 'paragraph', text: paragraph.join('\n') });
    paragraph = [];
  };
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (line.startsWith('```')) {
      flush();
      const code: string[] = [];
      while (++index < lines.length && !lines[index].startsWith('```')) code.push(lines[index]);
      blocks.push({ kind: 'code', text: code.join('\n') });
    } else if (!line.trim()) flush();
    else if (/^#{1,6}\s/.test(line)) {
      flush();
      blocks.push({ kind: 'heading', text: line.replace(/^#+\s*/, '') });
    } else if (/^-\s/.test(line)) {
      flush();
      const last = blocks.at(-1);
      if (last?.kind === 'list') last.items!.push(line.slice(2));
      else blocks.push({ kind: 'list', text: '', items: [line.slice(2)] });
    } else {
      const image = line.match(/^!\[([^\]]+)\]\(([^\s)]+)\)\s*$/);
      if (image) {
        flush();
        const src = lessonUrl(image[2], true);
        blocks.push(
          src ? { kind: 'image', text: image[1], src } : { kind: 'paragraph', text: image[1] },
        );
      } else paragraph.push(line);
    }
  }
  flush();
  return blocks;
}
