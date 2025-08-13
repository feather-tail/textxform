import { parsePlaintext } from '../parsers/plaintext.js';
import { parseMarkdown } from '../parsers/markdown.js';
import { parseBBCode } from '../parsers/bbcode.js';
import { parseHTML } from '../parsers/html.js';

import { renderPlaintext } from '../renderers/plaintext.js';
import { renderMarkdown } from '../renderers/markdown.js';
import { renderBBCode } from '../renderers/bbcode.js';
import { renderHTML } from '../renderers/html.js';

const PARSERS = {
  plaintext: parsePlaintext,
  markdown: parseMarkdown,
  bbcode: parseBBCode,
  html: parseHTML,
  mixed: parsePlaintext // временно
};

const RENDERERS = {
  plaintext: renderPlaintext,
  markdown: renderMarkdown,
  bbcode: renderBBCode,
  html: renderHTML
};

export function parse(input, { from = 'plaintext' } = {}) {
  const fn = PARSERS[from];
  if (!fn) throw new Error(`Unknown input format: ${from}`);
  return fn(input);
}

export function render(ast, { to = 'plaintext', ...opts } = {}) {
  const fn = RENDERERS[to];
  if (!fn) throw new Error(`Unknown output format: ${to}`);
  return fn(ast, opts);
}

export function convert(input, { from = 'plaintext', to = 'html', ...opts } = {}) {
  const ast = parse(input, { from });
  return render(ast, { to, ...opts });
}

// Заглушка для будущих плагинов
export function use(_plugin) {
  // В v1 каркаса ничего не делаем
  return () => {};
}
