import {
  doc,
  paragraph,
  text as t,
  strong,
  emphasis,
  underline,
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
  lineBreak,
} from '../ast/nodes.js';
import { sanitizeUrl } from '../core/utils.js';

function decodeEntities(s = '') {
  return String(s)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function getAttr(name, s) {
  const re = new RegExp(`${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>/]+))`, 'i');
  const m = re.exec(s || '');
  return m ? (m[1] ?? m[2] ?? m[3] ?? '') : '';
}

function getText(nodes) {
  const acc = [];
  const walk = (n) => {
    if (!n) return;
    if (Array.isArray(n)) return n.forEach(walk);
    switch (n.type) {
      case 'Text':
        acc.push(n.value || '');
        break;
      case 'Paragraph':
      case 'Strong':
      case 'Emphasis':
      case 'Underline':
      case 'Strike':
      case 'Link':
      case 'Blockquote':
      case 'ListItem':
      case 'List':
      case 'Spoiler':
        (n.children || []).forEach(walk);
        break;
      case 'InlineCode':
      case 'CodeBlock':
        acc.push(n.value || '');
        break;
      default:
        break;
    }
  };
  walk(nodes);
  return acc.join('');
}

function ensureParagraphs(children) {
  const hasPara = (children || []).some((c) => c && c.type === 'Paragraph');
  return hasPara ? children : [paragraph(children || [])];
}

function finalizeRoot(children) {
  const out = [];
  let buf = [];
  const flush = () => {
    if (buf.length) {
      out.push(paragraph(buf));
      buf = [];
    }
  };
  for (const n of children) {
    if (!n) continue;
    const isBlock = [
      'Paragraph',
      'Blockquote',
      'List',
      'Heading',
      'CodeBlock',
      'ThematicBreak',
    ].includes(n.type);
    if (isBlock) {
      flush();
      out.push(n);
    } else {
      buf.push(n);
    }
  }
  flush();
  return out;
}

export function parseHTML(input = '') {
  const src = String(input);
  const root = { tag: '#root', children: [] };
  const stack = [root];

  const top = () => stack[stack.length - 1];
  const pushChild = (node) => {
    if (node) top().children.push(node);
  };
  const pushFrame = (tag, meta = {}) => stack.push({ tag, meta, children: [] });
  const popToTag = (tag) => {
    for (let k = stack.length - 1; k > 0; k--) {
      if (stack[k].tag === tag) {
        const frame = stack.pop();
        return frame;
      } else {
        const dangling = stack.pop();
        pushChild(t(getText(dangling.children)));
      }
    }
    return null;
  };

  const handleStartTag = (tag, attrs) => {
    switch (tag) {
      case 'br':
        pushChild(lineBreak());
        return;
      case 'hr':
        pushChild(thematicBreak());
        return;
      case 'img': {
        const s = sanitizeUrl(getAttr('src', attrs));
        const alt = getAttr('alt', attrs);
        if (s !== '#') pushChild(image(s, alt));
        return;
      }
      case 'a': {
        const href = sanitizeUrl(getAttr('href', attrs));
        const title = getAttr('title', attrs) || null;
        pushFrame('a', { href, title });
        return;
      }
      case 'b':
      case 'strong':
      case 'i':
      case 'em':
      case 'u':
      case 's':
      case 'strike':
      case 'code':
        pushFrame(tag);
        return;
      case 'p':
      case 'blockquote':
      case 'ul':
      case 'ol':
      case 'li':
      case 'pre':
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        pushFrame(tag);
        return;
      default:
        return;
    }
  };

  const handleCloseTag = (tag) => {
    switch (tag) {
      case 'a': {
        const frame = popToTag('a');
        if (!frame) return;
        const { href, title } = frame.meta || {};
        pushChild(link(href || '#', frame.children, title));
        return;
      }
      case 'b':
      case 'strong': {
        const f = popToTag(tag);
        if (!f) return;
        pushChild(strong(f.children));
        return;
      }
      case 'i':
      case 'em': {
        const f = popToTag(tag);
        if (!f) return;
        pushChild(emphasis(f.children));
        return;
      }
      case 'u': {
        const f = popToTag('u');
        if (!f) return;
        pushChild(underline(f.children));
        return;
      }
      case 's':
      case 'strike': {
        const f = popToTag(tag);
        if (!f) return;
        pushChild(strike(f.children));
        return;
      }
      case 'code': {
        const f = popToTag('code');
        if (!f) return;
        pushChild(inlineCode(getText(f.children)));
        return;
      }
      case 'p': {
        const f = popToTag('p');
        if (!f) return;
        pushChild(paragraph(f.children));
        return;
      }
      case 'blockquote': {
        const f = popToTag('blockquote');
        if (!f) return;
        pushChild(blockquote(ensureParagraphs(f.children)));
        return;
      }
      case 'li': {
        const f = popToTag('li');
        if (!f) return;
        pushChild(listItem(ensureParagraphs(f.children)));
        return;
      }
      case 'ul': {
        const f = popToTag('ul');
        if (!f) return;
        const items = (f.children || []).map((c) =>
          c.type === 'ListItem' ? c : listItem(ensureParagraphs([c]))
        );
        pushChild(list(false, items));
        return;
      }
      case 'ol': {
        const f = popToTag('ol');
        if (!f) return;
        const items = (f.children || []).map((c) =>
          c.type === 'ListItem' ? c : listItem(ensureParagraphs([c]))
        );
        pushChild(list(true, items));
        return;
      }
      case 'pre': {
        const f = popToTag('pre');
        if (!f) return;
        pushChild(codeBlock(getText(f.children)));
        return;
      }
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6': {
        const f = popToTag(tag);
        if (!f) return;
        const depth = Number(tag.slice(1)) || 1;
        pushChild(heading(getText(f.children).trim(), depth));
        return;
      }
      default:
        return;
    }
  };

  const appendText = (raw) => {
    const s = decodeEntities(raw);
    if (s) pushChild(t(s));
  };

  let i = 0;
  while (i < src.length) {
    const lt = src.indexOf('<', i);
    if (lt === -1) {
      appendText(src.slice(i));
      break;
    }
    if (lt > i) appendText(src.slice(i, lt));

    const gt = src.indexOf('>', lt + 1);
    if (gt === -1) {
      appendText(src.slice(lt));
      break;
    }

    const inside = src.slice(lt + 1, gt).trim();
    if (!inside) {
      i = gt + 1;
      continue;
    }

    if (inside.startsWith('!')) {
      i = gt + 1;
      continue;
    }

    if (inside[0] === '/') {
      handleCloseTag(inside.slice(1).toLowerCase());
      i = gt + 1;
      continue;
    }

    const m = inside.match(/^([a-zA-Z][a-zA-Z0-9]*)\b([\s\S]*)$/);
    if (!m) {
      appendText(src.slice(lt, gt + 1));
      i = gt + 1;
      continue;
    }
    const tag = m[1].toLowerCase();
    const rest = m[2] || '';

    handleStartTag(tag, rest);
    i = gt + 1;
  }

  while (stack.length > 1) {
    const dangling = stack.pop();
    pushChild(t(getText(dangling.children)));
  }

  return doc(finalizeRoot(root.children));
}
