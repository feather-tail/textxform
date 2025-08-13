import { parsePlaintext } from './plaintext.js';

export function parseBBCode(input = '') {
  return parsePlaintext(input);
}
