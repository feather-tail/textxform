import { parseMarkdown } from './parsers/markdown.js';
import { parseBBCode } from './parsers/bbcode.js';
import { parsePlaintext } from './parsers/plaintext.js';
import { parseHTML } from './parsers/html.js';

import { renderHTML } from './renderers/html.js';
import { renderMarkdown } from './renderers/markdown.js';
import { renderBBCode } from './renderers/bbcode.js';
import { renderPlaintext } from './renderers/plaintext.js';

import { use as registerPlugin, runHook } from './core/plugins.js';

export function use(plugin) {
  registerPlugin(plugin);
}

export function parse(input = '', { from = 'plaintext' } = {}) {
  const prepared = runHook('beforeParse', String(input), { from });

  let ast;
  switch (from) {
    case 'markdown':
      ast = parseMarkdown(prepared);
      break;
    case 'bbcode':
      ast = parseBBCode(prepared);
      break;
    case 'html':
      ast = parseHTML(prepared);
      break;
    case 'plaintext':
    default:
      ast = parsePlaintext(prepared);
      break;
  }

  return runHook('afterParse', ast, { from });
}

export function render(ast, { to = 'html', ...opts } = {}) {
  const readyAst = runHook('beforeRender', ast, { to, opts });

  let out;
  switch (to) {
    case 'markdown':
      out = renderMarkdown(readyAst, opts);
      break;
    case 'bbcode':
      out = renderBBCode(readyAst, opts);
      break;
    case 'html':
      out = renderHTML(readyAst, opts);
      break;
    case 'plaintext':
    default:
      out = renderPlaintext(readyAst, opts);
      break;
  }

  return runHook('afterRender', out, { to, opts });
}

export function convert(input, opts = {}) {
  const ast = parse(input, { from: opts.from || 'plaintext' });
  return render(ast, { to: opts.to || 'html', ...opts });
}
