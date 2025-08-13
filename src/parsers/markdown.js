import { parsePlaintext } from './plaintext.js';

// v1 заглушка: используем простой текст. Реальный парсер добавим позже.
export function parseMarkdown(input = '') {
  return parsePlaintext(input);
}
