import { parsePlaintext } from './plaintext.js';

// v1 заглушка: грубо выбрасываем теги (только для стартовых тестов)
export function parseHTML(input = '') {
  const stripped = String(input).replace(/<[^>]*>/g, '');
  return parsePlaintext(stripped);
}
