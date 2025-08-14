import { describe, it, expect } from 'vitest';
import { convert } from '../../src/index.js';

describe('Security: URL sanitization in HTML renderer', () => {
  it('blocks javascript: links', () => {
    const md = '[x](javascript:alert(1))';
    const html = convert(md, { from: 'markdown', to: 'html' });
    expect(html).toBe('<p><a href="#">x</a></p>');
  });

  it('allows http/https/mailto', () => {
    const md = '[web](https://example.com) [mail](mailto:a@b.tld)';
    const html = convert(md, { from: 'markdown', to: 'html' });
    expect(html).toBe('<p><a href="https://example.com">web</a> <a href="mailto:a@b.tld">mail</a></p>');
  });

  it('allows data:image/* for <img>', () => {
    const md = '![x](data:image/png;base64,AAA)';
    const html = convert(md, { from: 'markdown', to: 'html' });
    expect(html).toBe('<p><img src="data:image/png;base64,AAA" alt="x"></p>');
  });

  it('blocks other data: schemes for links', () => {
    const md = '[x](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)';
    const html = convert(md, { from: 'markdown', to: 'html' });
    expect(html).toBe('<p><a href="#">x</a></p>');
  });
});
