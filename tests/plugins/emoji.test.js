import { describe, it, expect, beforeEach } from 'vitest';
import { convert, use } from '../../src/index.js';
import { _resetPlugins } from '../../src/core/plugins.js';
import { emoji } from '../../src/plugins/emoji.js';
import { autolink } from '../../src/plugins/autolink.js';

describe('Plugin: emoji', () => {
  beforeEach(() => _resetPlugins());

  it('replaces :smile: inside text (md -> html)', () => {
    use(emoji);
    const out = convert('Hello :smile:', { from: 'markdown', to: 'html' });
    expect(out).toBe('<p>Hello 🙂</p>');
  });

  it('works together with autolink', () => {
    use(autolink);
    use(emoji);
    const out = convert('URL http://example.com :heart:', { from: 'markdown', to: 'html' });
    expect(out).toBe(
      '<p>URL <a href="http://example.com" rel="noopener noreferrer nofollow">http://example.com</a> ❤️</p>'
    );
  });
});
