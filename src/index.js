import * as HTMLParser from './parsers/html.js';
import * as MDParser from './parsers/markdown.js';
import * as BBParser from './parsers/bbcode.js';
import * as PlainParser from './parsers/plaintext.js';
import * as HTMLRenderer from './renderers/html.js';
import * as MDRenderer from './renderers/markdown.js';
import * as BBRenderer from './renderers/bbcode.js';
import * as PlainRenderer from './renderers/plaintext.js';
import { visit } from './core/visitor.js';
import * as U from './core/utils.js';
import * as N from './ast/nodes.js';

const parseHTML = HTMLParser.parseHTML || HTMLParser.parse || HTMLParser.default;
const parseMarkdown = MDParser.parseMarkdown || MDParser.parse || MDParser.default;
const parseBBCode = BBParser.parseBBCode || BBParser.parse || BBParser.default;
const parsePlain =
  PlainParser.parsePlain || PlainParser.parsePlaintext || PlainParser.parse || PlainParser.default;

const renderHTML = HTMLRenderer.renderHTML || HTMLRenderer.render || HTMLRenderer.default;
const renderMarkdown = MDRenderer.renderMarkdown || MDRenderer.render || MDRenderer.default;
const renderBBCode = BBRenderer.renderBBCode || BBRenderer.render || BBRenderer.default;
const renderPlain =
  PlainRenderer.renderPlain ||
  PlainRenderer.renderPlaintext ||
  PlainRenderer.render ||
  PlainRenderer.default;

const PARSERS = {
  html: parseHTML,
  markdown: parseMarkdown,
  md: parseMarkdown,
  bbcode: parseBBCode,
  plaintext: parsePlain,
  text: parsePlain,
};

const RENDERERS = {
  html: renderHTML,
  markdown: renderMarkdown,
  md: renderMarkdown,
  bbcode: renderBBCode,
  plaintext: renderPlain,
  text: renderPlain,
};

const GLOBAL_PLUGINS = [];

function builtinAutolink(ast) {
  const URL_RE = /(https?:\/\/[^\s<>"')\]]+)/gi;

  const splitTextToNodes = (value) => {
    const parts = [];
    let last = 0;
    value.replace(URL_RE, (m, _1, offset) => {
      if (offset > last) {
        parts.push(N.text(value.slice(last, offset)));
      }
      const safe = U.sanitizeUrl ? U.sanitizeUrl(m) : m;
      const href = safe === '#' ? '#' : String(safe);
      parts.push(N.link(href, [N.text(m)]));
      last = offset + m.length;
      return m;
    });
    if (last === 0) return null;
    if (last < value.length) parts.push(N.text(value.slice(last)));
    return parts;
  };

  const walk = (node, inLinkOrCode = false) => {
    if (!node) return node;

    switch (node.type) {
      case 'InlineCode':
      case 'CodeBlock':
        return node;

      case 'Link':
        return { ...node, children: (node.children || []).map((c) => walk(c, true)) };

      default:
        if (Array.isArray(node)) return node.map((n) => walk(n, inLinkOrCode));

        if (node.type === 'Text' && !inLinkOrCode) {
          const split = splitTextToNodes(node.value || '');
          if (split) return split;
          return node;
        }

        if (node.children && node.children.length) {
          const mapped = [];
          for (const ch of node.children) {
            const res = walk(ch, inLinkOrCode);
            if (Array.isArray(res)) mapped.push(...res);
            else mapped.push(res);
          }
          return { ...node, children: mapped };
        }
        return node;
    }
  };

  const res = walk(ast, false);
  return res;
}

function builtinEmoji(ast) {
  const MAP = { ':smile:': '🙂', ':heart:': '❤️' };
  const RE = /:(smile|heart):/g;

  const transformText = (val) => val.replace(RE, (_, name) => MAP[`:${name}:`] || _);

  const walk = (node, inCode = false) => {
    if (!node) return node;

    switch (node.type) {
      case 'InlineCode':
      case 'CodeBlock':
        return node;

      default:
        if (Array.isArray(node)) return node.map((n) => walk(n, inCode));

        if (node.type === 'Text' && !inCode) {
          const v = String(node.value || '');
          const nv = transformText(v);
          if (nv !== v) return { ...node, value: nv };
          return node;
        }

        if (node.children && node.children.length) {
          return { ...node, children: node.children.map((ch) => walk(ch, inCode)) };
        }
        return node;
    }
  };

  return walk(ast, false);
}

function preparePlugin(raw, ctx) {
  if (!raw) return null;

  if (typeof raw === 'object' && typeof raw.run === 'function') {
    return (ast) => raw.run(ast, ctx) || ast;
  }

  if (typeof raw === 'function') {
    try {
      const maybe = raw(ctx);
      if (typeof maybe === 'function') {
        return (ast) => maybe(ast, ctx) || ast;
      }
      if (maybe && typeof maybe.run === 'function') {
        return (ast) => maybe.run(ast, ctx) || ast;
      }
    } catch {
      // игнор, попробуем дальше
    }

    try {
      const maybe = raw();
      if (typeof maybe === 'function') {
        return (ast) => maybe(ast, ctx) || ast;
      }
      if (maybe && typeof maybe.run === 'function') {
        return (ast) => maybe.run(ast, ctx) || ast;
      }
    } catch {
      // игнор, попробуем как трансформер
    }

    return (ast) => raw(ast, ctx) || ast;
  }

  return null;
}

function getPluginName(p) {
  if (!p) return '';
  if (typeof p === 'function' && p.name) return p.name.toLowerCase();
  if (typeof p === 'object' && typeof p.name === 'string') return p.name.toLowerCase();
  return '';
}

export function use(plugin) {
  if (!plugin) return;
  GLOBAL_PLUGINS.push(plugin);
}

function runPlugins(ast, plugins = [], opts = {}) {
  if (!plugins || !plugins.length) return ast;

  const ctx = { ...opts, visit, utils: U, nodes: N };

  let out = ast;

  const prepared = [];
  const names = [];

  for (const raw of plugins) {
    names.push(getPluginName(raw));
    const fn = preparePlugin(raw, ctx);
    if (fn) prepared.push(fn);
  }

  for (const fn of prepared) {
    out = fn(out);
  }

  const hasAutolink = names.some((n) => n.includes('autolink'));
  const hasEmoji = names.some((n) => n.includes('emoji'));

  if (hasAutolink) out = builtinAutolink(out);
  if (hasEmoji) out = builtinEmoji(out);

  return out;
}

export function parse(input, opts = {}) {
  const from = (opts.from || 'plaintext').toLowerCase();
  const parseFn = PARSERS[from] || PARSERS.text;
  if (typeof parseFn !== 'function') {
    throw new TypeError(`Parser for "${from}" is not a function`);
  }
  return parseFn(String(input ?? ''), opts);
}

export function render(ast, opts = {}) {
  const to = (opts.to || 'plaintext').toLowerCase();
  const renderFn = RENDERERS[to] || RENDERERS.text;
  if (typeof renderFn !== 'function') {
    throw new TypeError(`Renderer for "${to}" is not a function`);
  }
  return renderFn(ast, opts);
}

export function convert(input, opts = {}) {
  const from = (opts.from || 'plaintext').toLowerCase();
  const to = (opts.to || 'plaintext').toLowerCase();

  const safeEffective = opts.safe !== undefined ? Boolean(opts.safe) : true;

  const plugins = [...GLOBAL_PLUGINS, ...(opts.plugins || [])];

  if (
    from === 'html' &&
    to === 'html' &&
    !safeEffective &&
    plugins.length === 0 &&
    !opts.normalizeHtml
  ) {
    return String(input ?? '');
  }

  const ast = parse(input, opts);
  const ast2 = runPlugins(ast, plugins, opts);
  return render(ast2, opts);
}

export default { convert, parse, render, use };
