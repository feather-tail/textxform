import {
  doc,
  paragraph,
  text,
  strong,
  emphasis,
  underline,
  strike,
  link,
  image,
  codeBlock,
  quote,
  list,
  listItem,
  spoiler,
  color as colorNode,
  size as sizeNode,
} from '../ast/nodes.js';

function findMatching(src, tag, from) {
  const re = new RegExp(`\\[(?:${tag}(?:=[^\\]]+)?)\\]|\\[\\/${tag}\\]`, 'gi');
  re.lastIndex = from;

  let depth = 1;
  let m;

  while ((m = re.exec(src))) {
    const token = m[0];
    const isClose = token[1] === '/';

    if (isClose) {
      depth--;
      if (depth === 0) {
        return { start: m.index, end: re.lastIndex };
      }
    } else {
      depth++;
    }
  }
  return null;
}

function parseInline(src) {
  const out = [];
  let i = 0;

  const pushText = (s) => {
    if (s) out.push(text(s));
  };

  while (i < src.length) {
    const lb = src.indexOf('[', i);
    if (lb === -1) {
      pushText(src.slice(i));
      break;
    }
    pushText(src.slice(i, lb));

    const rb = src.indexOf(']', lb + 1);
    if (rb === -1) {
      pushText(src.slice(lb));
      break;
    }

    const raw = src.slice(lb + 1, rb);
    const rawLower = raw.toLowerCase();
    if (rawLower.startsWith('/')) {
      pushText(src.slice(lb, rb + 1));
      i = rb + 1;
      continue;
    }

    const eq = raw.indexOf('=');
    const name = (eq === -1 ? raw : raw.slice(0, eq)).trim().toLowerCase();
    const arg = eq === -1 ? '' : raw.slice(eq + 1).trim();

    const HANDLERS = {
      b: (arg, inner) => strong(parseInline(inner)),
      i: (arg, inner) => emphasis(parseInline(inner)),
      u: (arg, inner) => underline(parseInline(inner)),
      s: (arg, inner) => strike(parseInline(inner)),
      img: (arg, inner) => image(arg || inner.trim(), ''),
      url: (arg, inner) => {
        const href = arg || inner.trim();
        const kids = arg ? parseInline(inner) : [text(inner)];
        return link(href, kids);
      },
      spoiler: (arg, inner) => spoiler(parseInline(inner), arg || null),
      color: (arg, inner) => colorNode((arg || '').trim(), parseInline(inner)),
      size: (arg, inner) => sizeNode((arg || '').trim(), parseInline(inner)),
    };

    const handler = HANDLERS[name];
    if (!handler) {
      pushText(src.slice(lb, rb + 1));
      i = rb + 1;
      continue;
    }

    const match = findMatching(src, name, rb + 1);
    if (!match) {
      pushText(src.slice(lb, rb + 1));
      i = rb + 1;
      continue;
    }

    const inner = src.slice(rb + 1, match.start);
    out.push(handler(arg, inner));

    i = match.end;
  }

  return out;
}

function parseParagraphsInline(block) {
  const parts = String(block).split(/\n{2,}/);
  const res = [];
  for (const p of parts) {
    const trimmed = p.replace(/\r/g, '').trim();
    if (!trimmed) continue;
    res.push(paragraph(parseInline(trimmed)));
  }
  return res;
}

function parseListInner(inner, ordered = false) {
  const rawItems = inner
    .split(/\[\*\]/i)
    .map((s) => s.trim())
    .filter(Boolean);
  const items = rawItems.map((it) => listItem(parseParagraphsInline(it)));
  return list(ordered, items);
}

export function parseBBCode(input = '') {
  const src = String(input);
  const out = [];

  let i = 0;
  const pushTextAsParas = (s) => {
    const paras = parseParagraphsInline(s);
    out.push(...paras);
  };

  while (i < src.length) {
    const reOpen = /\[(quote|code|list)(?:=[^\]]+)?\]/gi;
    reOpen.lastIndex = i;
    const m = reOpen.exec(src);
    if (!m) {
      pushTextAsParas(src.slice(i));
      break;
    }

    const tagOpenIdx = m.index;
    const openRaw = m[0];
    const tagName = m[1].toLowerCase();

    if (tagOpenIdx > i) {
      pushTextAsParas(src.slice(i, tagOpenIdx));
    }

    const argMatch = openRaw.match(/=(.+)]$/);
    const arg = argMatch ? argMatch[1].trim() : '';

    const close = findMatching(src, tagName, tagOpenIdx + openRaw.length);
    if (!close) {
      pushTextAsParas(openRaw);
      i = tagOpenIdx + openRaw.length;
      continue;
    }

    const inner = src.slice(tagOpenIdx + openRaw.length, close.start);

    if (tagName === 'code') {
      out.push(codeBlock(inner.replace(/\r/g, '')));
    } else if (tagName === 'quote') {
      const quotedChildren = parseBBCode(inner).children;
      out.push(quote(quotedChildren, arg || null));
    } else if (tagName === 'list') {
      const ordered = Boolean(arg);
      out.push(parseListInner(inner, ordered));
    }

    i = close.end;
  }

  return doc(out);
}
