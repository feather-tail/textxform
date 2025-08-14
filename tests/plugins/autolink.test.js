import { describe, it, expect, beforeEach } from 'vitest';
import { convert, use } from '../../src/index.js';
import { _resetPlugins } from '../../src/core/plugins.js';
import { autolink } from '../../src/plugins/autolink.js';

describe('Plugin: autolink', () => {
  beforeEach(() => _resetPlugins());

  it('turns bare URLs into links (md -> html)', () => {
    use(autolink);
    const out = convert('See http://example.com now', { from: 'markdown', to: 'html' });
    expect(out).toBe(
      '<p>See <a href="http://example.com" rel="noopener noreferrer nofollow">http://example.com</a> now</p>'
    );
  });

  it('does not break when no URLs present', () => {
    use(autolink);
    const out = convert('Nothing here', { from: 'markdown', to: 'html' });
    expect(out).toBe('<p>Nothing here</p>');
  });
});
