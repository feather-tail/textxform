import { describe, it, expect } from 'vitest';
import { convert } from '../../src/index.js';

describe('HTML parser → HTML renderer (safe)', () => {
  it('paragraph + strong + link (sanitize javascript:)', () => {
    const htmlIn = '<p>Hello <b>hi</b> <a href="javascript:alert(1)">x</a></p>';
    const out = convert(htmlIn, { from: 'html', to: 'html' });
    expect(out).toBe(
      '<p>Hello <strong>hi</strong> <a href="#" rel="noopener noreferrer nofollow">x</a></p>'
    );
  });

  it('img data:image allowed; alt kept', () => {
    const htmlIn = '<p><img src="data:image/png;base64,AAA" alt="ok"></p>';
    const out = convert(htmlIn, { from: 'html', to: 'html' });
    expect(out).toBe('<p><img src="data:image/png;base64,AAA" alt="ok"></p>');
  });

  it('headings + hr', () => {
    const htmlIn = '<h2>Title</h2><hr>';
    const out = convert(htmlIn, { from: 'html', to: 'html' });
    expect(out).toBe('<h2>Title</h2>\n<hr/>');
  });

  it('lists ul/ol wrap li content into <p>', () => {
    const htmlIn = '<ul><li>One</li><li>Two</li></ul><ol><li>A</li><li>B</li></ol>';
    const out = convert(htmlIn, { from: 'html', to: 'html' });
    expect(out).toBe(
      '<ul><li><p>One</p></li><li><p>Two</p></li></ul>\n<ol><li><p>A</p></li><li><p>B</p></li></ol>'
    );
  });

  it('blockquote + pre>code (code block)', () => {
    const htmlIn = '<blockquote>q</blockquote><pre><code>line1\nline2</code></pre>';
    const out = convert(htmlIn, { from: 'html', to: 'html' });
    expect(out).toBe('<blockquote><p>q</p></blockquote>\n<pre><code>line1\nline2</code></pre>');
  });
});
