import { visit } from '../core/visitor.js';

// v1 заглушка: просто текст
export function renderBBCode(ast, _opts = {}) {
  const handlers = {
    Document: (node, _ctx, recur) => node.children.map(recur).join('\n\n'),
    Paragraph: (node, _ctx, recur) => node.children.map(recur).join(''),
    Text: (node) => String(node.value ?? '')
  };
  return visit(ast, handlers, {});
}
