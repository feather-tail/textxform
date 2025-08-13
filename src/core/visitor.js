export function visit(node, handlers, ctx) {
  const recur = (n) => visit(n, handlers, ctx);
  if (Array.isArray(node)) return node.map(recur).join('');
  if (!node || typeof node !== 'object') return '';
  const handler = handlers[node.type] || handlers.__unknown || (() => '');
  return handler(node, ctx, recur);
}
