import { describe, it, expect } from 'vitest';
import { parse, render } from '../../src/index.js';

describe('Round-trip basics', () => {
  it('markdown -> ast -> markdown (inline + heading + hr)', () => {
    const md = '# Title\n\n**bold** *em* ~~del~~ `code`\n\n---';
    const ast = parse(md, { from: 'markdown' });
    const back = render(ast, { to: 'markdown' });
    expect(back).toBe('# Title\n\n**bold** *em* ~~del~~ `code`\n\n---');
  });

  it('bbcode -> ast -> bbcode (inline + list)', () => {
    const bb = '[b]bold[/b] [i]em[/i]\n\n[list][*]One[*]Two[/list]';
    const ast = parse(bb, { from: 'bbcode' });
    const back = render(ast, { to: 'bbcode' });
    expect(back).toBe('[b]bold[/b] [i]em[/i]\n\n[list][*]One[*]Two[/list]');
  });

  it('plaintext -> ast -> plaintext (paragraph split)', () => {
    const txt = 'A\n\nB';
    const ast = parse(txt, { from: 'plaintext' });
    const back = render(ast, { to: 'plaintext' });
    expect(back).toBe('A\n\nB');
  });

  it('markdown list round-trip', () => {
    const md = '- A\n- B\n\n1. C\n1. D';
    const ast = parse(md, { from: 'markdown' });
    const back = render(ast, { to: 'markdown' });
    expect(back).toBe('- A\n- B\n\n1. C\n1. D');
  });

  it('blockquote + fenced code round-trip (md)', () => {
    const md = '> quote line\n\n```\ncode\n```';
    const ast = parse(md, { from: 'markdown' });
    const back = render(ast, { to: 'markdown' });
    expect(back).toBe('> quote line\n\n```\ncode\n```');
  });
});
