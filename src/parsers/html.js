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
  color as colorNode,
  size as sizeNode,
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
      case 'Color':
      case 'Size':
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

function parseStyleMap(styleStr = '') {
  const map = {};
  String(styleStr)
    .split(';')
    .forEach((pair) => {
      const i = pair.indexOf(':');
      if (i > 0) {
        const k = pair.slice(0, i).trim().toLowerCase();
        const val = pair.slice(i + 1).trim();
        if (k) map[k] = val;
      }
    });
  return map;
}

function extractMeta(attrs) {
  const style = parseStyleMap(getAttr('style', attrs));

  const colorAttr = getAttr('color', attrs);
  if (colorAttr && !style.color) style.color = colorAttr;

  const sizeAttr = getAttr('size', attrs);
  if (sizeAttr && !style['font-size']) style['font-size'] = sizeAttr;

  const className = getAttr('class', attrs);

  return { style, className: className || null };
}

const BLOCK_TYPES = new Set([
  'Paragraph',
  'Blockquote',
  'List',
  'ListItem',
  'Heading',
  'CodeBlock',
  'ThematicBreak',
]);

function hasBlock(nodes = []) {
  return nodes.some((n) => n && BLOCK_TYPES.has(n.type));
}

function applyInlineStyle(children = [], style = {}) {
  let res = children;
  if (style['font-size']) res = [sizeNode(style['font-size'], res)];
  if (style.color) res = [colorNode(style.color, res)];
  return res;
}

function wrapByStyle(nodes = [], style = null) {
  if (!style || nodes.length === 0) return nodes;

  if (!hasBlock(nodes)) {
    return applyInlineStyle(nodes, style);
  }

  const mapNode = (n) => {
    if (!n) return n;

    switch (n.type) {
      case 'Paragraph':
        return {
          ...n,
          style: { ...(n.style || {}), ...(style || {}) },
        };

      case 'ListItem':
      case 'List':
      case 'Blockquote':
        return { ...n, children: (n.children || []).map(mapNode) };

      case 'Heading':
      case 'CodeBlock':
      case 'ThematicBreak':
        return n;

      default:
        return n;
    }
  };

  return nodes.map(mapNode);
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

  function handleStartTag(tag, attrs) {
    const START = {
      br: () => pushChild(lineBreak()),
      hr: () => pushChild(thematicBreak()),
      img: () => {
        const s = sanitizeUrl(getAttr('src', attrs));
        const alt = getAttr('alt', attrs);
        if (s !== '#') pushChild(image(s, alt));
      },
      a: () => {
        const href = sanitizeUrl(getAttr('href', attrs));
        const title = getAttr('title', attrs) || null;
        const meta = { href, title, ...extractMeta(attrs) };
        pushFrame('a', meta);
      },
      span: () => pushFrame('span', extractMeta(attrs)),
      font: () => pushFrame('font', extractMeta(attrs)),

      b: () => pushFrame('b', extractMeta(attrs)),
      strong: () => pushFrame('strong', extractMeta(attrs)),
      i: () => pushFrame('i', extractMeta(attrs)),
      em: () => pushFrame('em', extractMeta(attrs)),
      u: () => pushFrame('u', extractMeta(attrs)),
      s: () => pushFrame('s', extractMeta(attrs)),
      strike: () => pushFrame('strike', extractMeta(attrs)),
      code: () => pushFrame('code'),

      p: () => pushFrame('p', extractMeta(attrs)),
      div: () => pushFrame('div', extractMeta(attrs)),
      blockquote: () => pushFrame('blockquote', extractMeta(attrs)),
      ul: () => pushFrame('ul', extractMeta(attrs)),
      ol: () => pushFrame('ol', extractMeta(attrs)),
      li: () => pushFrame('li', extractMeta(attrs)),
      pre: () => pushFrame('pre', extractMeta(attrs)),
      h1: () => pushFrame('h1', extractMeta(attrs)),
      h2: () => pushFrame('h2', extractMeta(attrs)),
      h3: () => pushFrame('h3', extractMeta(attrs)),
      h4: () => pushFrame('h4', extractMeta(attrs)),
      h5: () => pushFrame('h5', extractMeta(attrs)),
      h6: () => pushFrame('h6', extractMeta(attrs)),
    };
    (START[tag] || (() => {}))();
  }

  function handleCloseTag(tag) {
    const CLOSE = {
      a: () => {
        const f = popToTag('a');
        if (!f) return;
        const { href, title, style } = f.meta || {};
        const kids = wrapByStyle(f.children, style);
        pushChild(link(href || '#', kids, title));
      },

      span: () => {
        const f = popToTag('span');
        if (!f) return;
        const kids = wrapByStyle(f.children, f.meta && f.meta.style);
        (kids.length === 1 ? [kids[0]] : kids).forEach(pushChild);
      },
      font: () => {
        const f = popToTag('font');
        if (!f) return;
        const kids = wrapByStyle(f.children, f.meta && f.meta.style);
        (kids.length === 1 ? [kids[0]] : kids).forEach(pushChild);
      },

      b: () => {
        const f = popToTag('b');
        if (f) pushChild(strong(wrapByStyle(f.children, f.meta?.style)));
      },
      strong: () => {
        const f = popToTag('strong');
        if (f) pushChild(strong(wrapByStyle(f.children, f.meta?.style)));
      },
      i: () => {
        const f = popToTag('i');
        if (f) pushChild(emphasis(wrapByStyle(f.children, f.meta?.style)));
      },
      em: () => {
        const f = popToTag('em');
        if (f) pushChild(emphasis(wrapByStyle(f.children, f.meta?.style)));
      },
      u: () => {
        const f = popToTag('u');
        if (f) pushChild(underline(wrapByStyle(f.children, f.meta?.style)));
      },
      s: () => {
        const f = popToTag('s');
        if (f) pushChild(strike(wrapByStyle(f.children, f.meta?.style)));
      },
      strike: () => {
        const f = popToTag('strike');
        if (f) pushChild(strike(wrapByStyle(f.children, f.meta?.style)));
      },
      code: () => {
        const f = popToTag('code');
        if (f) pushChild(inlineCode(getText(f.children)));
      },

      p: () => {
        const f = popToTag('p');
        if (!f) return;
        const para = paragraph(f.children);
        if (f.meta?.className) para.className = f.meta.className;
        const st = f.meta?.style || null;
        if (st && (st.color || st['font-size'])) {
          para.style = { ...(para.style || {}), ...st };
        }
        pushChild(para);
      },

      div: () => {
        const f = popToTag('div');
        if (!f) return;
        let blocks = finalizeRoot(f.children);

        const st = f.meta?.style || null;
        if (st && (st.color || st['font-size'])) {
          blocks = blocks.map((n) => {
            if (n && n.type === 'Paragraph') {
              return { ...n, style: { ...(n.style || {}), ...st } };
            }
            return n;
          });
        }
        blocks.forEach(pushChild);
      },

      blockquote: () => {
        const f = popToTag('blockquote');
        if (!f) return;
        const kids = ensureParagraphs(wrapByStyle(f.children, f.meta?.style));
        pushChild(blockquote(kids));
      },
      li: () => {
        const f = popToTag('li');
        if (!f) return;
        pushChild(listItem(ensureParagraphs(wrapByStyle(f.children, f.meta?.style))));
      },
      ul: () => {
        const f = popToTag('ul');
        if (!f) return;
        const items = (f.children || []).map((c) =>
          c.type === 'ListItem' ? c : listItem(ensureParagraphs([c]))
        );
        pushChild(list(false, items));
      },
      ol: () => {
        const f = popToTag('ol');
        if (!f) return;
        const items = (f.children || []).map((c) =>
          c.type === 'ListItem' ? c : listItem(ensureParagraphs([c]))
        );
        pushChild(list(true, items));
      },
      pre: () => {
        const f = popToTag('pre');
        if (f) pushChild(codeBlock(getText(f.children)));
      },
      h1: () => {
        const f = popToTag('h1');
        if (f) pushChild(heading(getText(f.children).trim(), 1));
      },
      h2: () => {
        const f = popToTag('h2');
        if (f) pushChild(heading(getText(f.children).trim(), 2));
      },
      h3: () => {
        const f = popToTag('h3');
        if (f) pushChild(heading(getText(f.children).trim(), 3));
      },
      h4: () => {
        const f = popToTag('h4');
        if (f) pushChild(heading(getText(f.children).trim(), 4));
      },
      h5: () => {
        const f = popToTag('h5');
        if (f) pushChild(heading(getText(f.children).trim(), 5));
      },
      h6: () => {
        const f = popToTag('h6');
        if (f) pushChild(heading(getText(f.children).trim(), 6));
      },
    };
    (CLOSE[tag] || (() => {}))();
  }

  const appendText = (raw) => {
    const s = decodeEntities(raw);
    if (!s) return;
    if (top().tag === '#root' && !/\S/.test(s)) return;
    pushChild(t(s));
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
