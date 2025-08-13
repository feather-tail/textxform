import { doc, paragraph, text } from '../ast/nodes.js';

export function parsePlaintext(input = '') {
  const blocks = String(input).split(/\n{2,}/);
  const children = blocks.map((b) => paragraph([text(b.replace(/\n/g, ' ').trim())]));
  return doc(children);
}
