import { parsePlaintext } from './plaintext.js';

export function parseHTML(input = '') {
  const stripped = String(input).replace(/<[^>]*>/g, '');
  return parsePlaintext(stripped);
}
