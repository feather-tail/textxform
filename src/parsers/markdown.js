import {
  doc,
  paragraph,
  text as t,
  strong,
  emphasis,
  strike,
  link,
  image,
  inlineCode,
  codeBlock,
  blockquote,
  list,
  listItem,
  heading,
  thematicBreak,
} from '../ast/nodes.js';

function isHr(line) {
  const s = line.trim();
  return /^(?:\*\s*){3,}$/.test(s) || /^(?:-\s*){3,}$/.test(s) || /^(?:_\s*){3,}$/.test(s);
}

function findClosing(s, start, open = '[', close = ']') {
  let depth = 0;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (ch === '\\') {
      i++;
      continue;
    }
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth < 0) return i;
    }
  }
  return -1;
}

function findParenEnd(s, start) {
  let depth = 0;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (ch === '\\') {
      i++;
      continue;
    }
    if (ch === '(') depth++;
    else if (ch === ')') {
      if (depth === 0) return i;
      depth--;
    }
  }
  return -1;
}

function parseInlines(s) {
  const out = [];
  let i = 0;
  s = String(s || '');

  const pushText = (str) => {
    if (str) out.push(t(str));
  };

  while (i < s.length) {
    if (s[i] === '\\' && i + 1 < s.length) {
      pushText(s[i + 1]);
      i += 2;
      continue;
    }

    if (s[i] === '!' && s[i + 1] === '[') {
      const altStart = i + 2;
      const altEnd = findClosing(s, altStart, '[', ']');
      if (altEnd !== -1 && s[altEnd + 1] === '(') {
        const urlStart = altEnd + 2;
        const urlEnd = findParenEnd(s, urlStart);
        if (urlEnd !== -1) {
          const inside = s.slice(urlStart, urlEnd).trim();
          const m = inside.match(/^(\S+)(?:\s+"([^"]+)")?$/);
          const srcVal = m ? m[1] : inside;
          const altVal = s.slice(altStart, altEnd);
          out.push(image(srcVal, altVal));
          i = urlEnd + 1;
          continue;
        }
      }
      pushText('!');
      i += 1;
      continue;
    }

    if (s[i] === '[') {
      const txtStart = i + 1;
      const txtEnd = findClosing(s, txtStart, '[', ']');
      if (txtEnd !== -1 && s[txtEnd + 1] === '(') {
        const urlStart = txtEnd + 2;
        const urlEnd = findParenEnd(s, urlStart);
        if (urlEnd !== -1) {
          const inside = s.slice(urlStart, urlEnd).trim();
          const m = inside.match(/^(\S+)(?:\s+"([^"]+)")?$/);
          const hrefVal = m ? m[1] : inside;
          const titleVal = m && m[2] != null ? m[2] : null;
          const txt = s.slice(txtStart, txtEnd);
          out.push(link(hrefVal, parseInlines(txt), titleVal));
          i = urlEnd + 1;
          continue;
        }
      }
      pushText('[');
      i += 1;
      continue;
    }

    if (s[i] === '`') {
      const end = s.indexOf('`', i + 1);
      if (end !== -1) {
        out.push(inlineCode(s.slice(i + 1, end)));
        i = end + 1;
        continue;
      }
      pushText('`');
      i += 1;
      continue;
    }

    if (s.startsWith('**', i) || s.startsWith('__', i)) {
      const delim = s.slice(i, i + 2);
      const end = s.indexOf(delim, i + 2);
      if (end !== -1) {
        out.push(strong(parseInlines(s.slice(i + 2, end))));
        i = end + 2;
        continue;
      }
      pushText(s[i]);
      i += 1;
      continue;
    }

    if (s.startsWith('~~', i)) {
      const end = s.indexOf('~~', i + 2);
      if (end !== -1) {
        out.push(strike(parseInlines(s.slice(i + 2, end))));
        i = end + 2;
        continue;
      }
      pushText('~');
      i += 1;
      continue;
    }

    if (s[i] === '*' || s[i] === '_') {
      const delim = s[i];
      const end = s.indexOf(delim, i + 1);
      if (end !== -1) {
        out.push(emphasis(parseInlines(s.slice(i + 1, end))));
        i = end + 1;
        continue;
      }
      pushText(delim);
      i += 1;
      continue;
    }

    const nextRel = s.slice(i + 1).search(/(\\|!\[|\[|`|\*\*|__|\*|_|~~)/);
    if (nextRel === -1) {
      pushText(s.slice(i));
      break;
    } else {
      pushText(s.slice(i, i + 1 + nextRel));
      i += 1 + nextRel;
    }
  }

  return out;
}

function parseBlocks(src) {
  const lines = String(src || '')
    .replace(/\r/g, '')
    .split('\n');
  const nodes = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    let m = line.match(/^ {0,3}(```|~~~)\s*([A-Za-z0-9_-]+)?\s*$/);
    if (m) {
      const fence = m[1];
      const lang = m[2] || null;
      i++;
      const body = [];
      while (i < lines.length && !new RegExp(`^ {0,3}${fence}\\s*$`).test(lines[i])) {
        body.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      nodes.push(codeBlock(body.join('\n'), lang));
      continue;
    }

    m = line.match(/^ {0,3}(#{1,6})\s+(.+)$/);
    if (m) {
      nodes.push(heading(m[2].trim(), m[1].length));
      i++;
      continue;
    }

    if (isHr(line)) {
      nodes.push(thematicBreak());
      i++;
      continue;
    }

    if (/^ {0,3}>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^ {0,3}>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^ {0,3}>\s?/, ''));
        i++;
      }
      const inner = parseBlocks(buf.join('\n'));
      nodes.push(blockquote(inner));
      continue;
    }

    const ulRe = /^ {0,3}[-*+]\s+(.+)$/;
    const olRe = /^ {0,3}\d+\.\s+(.+)$/;
    if (ulRe.test(line) || olRe.test(line)) {
      const ordered = olRe.test(line);
      const items = [];
      while (
        i < lines.length &&
        ((ordered && olRe.test(lines[i])) || (!ordered && ulRe.test(lines[i])))
      ) {
        const content = (ordered ? lines[i].match(olRe)[1] : lines[i].match(ulRe)[1]) || '';
        items.push(listItem([paragraph(parseInlines(content))]));
        i++;
      }
      nodes.push(list(ordered, items));
      continue;
    }

    const buf = [line];
    i++;
    while (i < lines.length) {
      const l = lines[i];
      if (!l.trim()) {
        i++;
        break;
      }
      if (
        /^ {0,3}(```|~~~)/.test(l) ||
        /^ {0,3}(#{1,6})\s+/.test(l) ||
        isHr(l) ||
        /^ {0,3}>\s?/.test(l) ||
        ulRe.test(l) ||
        olRe.test(l)
      ) {
        break;
      }
      buf.push(l);
      i++;
    }
    nodes.push(paragraph(parseInlines(buf.join(' '))));
  }

  return nodes;
}

export function parseMarkdown(input = '') {
  return doc(parseBlocks(input));
}
