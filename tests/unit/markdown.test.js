import { describe, it, expect } from 'vitest';
import { convert } from '../../src/index.js';

describe('Markdown parser → HTML renderer', () => {
  it('heading + paragraph', () => {
    const md = '# Title\n\nHello';
    expect(convert(md, { from: 'markdown', to: 'html' })).toBe('<h1>Title</h1>\n<p>Hello</p>');
  });

  it('hr + emphasis/strong/strike + code', () => {
    const md = '---\n*em* **b** ~~s~~ `c`';
    expect(convert(md, { from: 'markdown', to: 'html' })).toBe(
      '<hr/>\n<p><em>em</em> <strong>b</strong> <s>s</s> <code>c</code></p>'
    );
  });

  it('links and images', () => {
    const md = '![alt](https://img) [ex](https://example.com)';
    expect(convert(md, { from: 'markdown', to: 'html' })).toBe(
      '<p><img src="https://img" alt="alt"> <a href="https://example.com" rel="noopener noreferrer nofollow">ex</a></p>'
    );
  });

  it('lists ul/ol', () => {
    const md = '- A\n- B\n\n1. C\n1. D';
    expect(convert(md, { from: 'markdown', to: 'html' })).toBe(
      '<ul><li><p>A</p></li><li><p>B</p></li></ul>\n<ol><li><p>C</p></li><li><p>D</p></li></ol>'
    );
  });

  it('blockquote + fenced code', () => {
    const md = '> q\n\n```\ncode\n```';
    expect(convert(md, { from: 'markdown', to: 'html' })).toBe(
      '<blockquote><p>q</p></blockquote>\n<pre><code>code</code></pre>'
    );
  });
});
