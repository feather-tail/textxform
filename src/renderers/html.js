import { visit } from '../core/visitor.js';
import { escapeHtml } from '../core/utils.js';

export function renderHTML(ast, _opts = {}) {
  const handlers = {
    Document: (node, _ctx, recur) => node.children.map(recur).join('\n'),
    Paragraph: (node, _ctx, recur) => `<p>${node.children.map(recur).join('')}</p>`,
    Text: (node) => escapeHtml(node.value ?? '')
  };
  return visit(ast, handlers, {});
}
