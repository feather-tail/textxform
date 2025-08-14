import { describe, it, expect } from 'vitest';
import { convert } from '../../src/index.js';

describe('Cross-trip conversions', () => {
  it('markdown -> bbcode -> html', () => {
    const md = '**hi** [link](https://example.com)';
    const bb = convert(md, { from: 'markdown', to: 'bbcode' });
    const html = convert(bb, { from: 'bbcode', to: 'html' });
    expect(html).toBe('<p><strong>hi</strong> <a href="https://example.com">link</a></p>');
  });

  it('bbcode -> markdown -> html (image + quote)', () => {
    const bb = '[img]https://site.tld/a.png[/img]\n\n[quote=Alice]Hello[/quote]';
    const md = convert(bb, { from: 'bbcode', to: 'markdown' });
    const html = convert(md, { from: 'markdown', to: 'html' });
    expect(html).toBe('<p><img src="https://site.tld/a.png" alt=""></p>\n<blockquote><p>Hello</p></blockquote>');
  });

  it('lists: md -> bb -> md', () => {
    const md = '- A\n- B';
    const bb = convert(md, { from: 'markdown', to: 'bbcode' });
    const back = convert(bb, { from: 'bbcode', to: 'markdown' });
    expect(back).toBe('- A\n- B');
  });
});
