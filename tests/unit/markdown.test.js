import { describe, it, expect } from 'vitest';
import { convert } from '../../src/index.js';

describe('Markdown parser → HTML renderer', () => {
  it('heading + paragraph', () => {
    const md = '# Title\n\nHello world';
    const html = convert(md, { from: 'markdown', to: 'html' });
    expect(html).toBe('<h1>Title</h1>\n<p>Hello world</p>');
  });

  it('hr + emphasis/strong/strike + code', () => {
    const md = '---\n\n**bold** *em* ~~del~~ `code`';
    const html = convert(md, { from: 'markdown', to: 'html' });
    expect(html).toBe('<hr/>\n<p><strong>bold</strong> <em>em</em> <s>del</s> <code>code</code></p>');
  });

  it('links and images', () => {
    const md = '![alt](https://img) [ex](https://example.com)';
    const html = convert(md, { from: 'markdown', to: 'html' });
    expect(html).toBe('<p><img src="https://img" alt="alt"> <a href="https://example.com">ex</a></p>');
  });

  it('lists ul/ol', () => {
    const md = '- A\n- B\n\n1. C\n1. D';
    const html = convert(md, { from: 'markdown', to: 'html' });
    expect(html).toBe('<ul><li><p>A</p></li><li><p>B</p></li></ul>\n<ol><li><p>C</p></li><li><p>D</p></li></ol>');
  });

  it('blockquote + fenced code', () => {
    const md = '> quote line\n\n```\ncode\n```';
    const html = convert(md, { from: 'markdown', to: 'html' });
    expect(html).toBe('<blockquote><p>quote line</p></blockquote>\n<pre><code>code</code></pre>');
  });
});
