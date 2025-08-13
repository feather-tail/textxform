import { visit } from '../core/visitor.js';

export function renderPlaintext(ast, _opts = {}) {
  const handlers = {
    Document: (node, _ctx, recur) => node.children.map(recur).join('\n\n'),
    Paragraph: (node, _ctx, recur) => node.children.map(recur).join(''),
    Text: (node) => String(node.value ?? '')
  };
  return visit(ast, handlers, {});
}
