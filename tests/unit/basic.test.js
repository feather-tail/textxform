import { describe, it, expect } from 'vitest';
import { convert, parse, render } from '../../src/index.js';

describe('textxform basic', () => {
  it('plaintext -> html (paragraphs)', () => {
    const out = convert('Hello\n\nWorld', { from: 'plaintext', to: 'html' });
    expect(out).toBe('<p>Hello</p>\n<p>World</p>');
  });

  it('roundtrip plaintext', () => {
    const ast = parse('A\n\nB', { from: 'plaintext' });
    const back = render(ast, { to: 'plaintext' });
    expect(back).toBe('A\n\nB');
  });
});
