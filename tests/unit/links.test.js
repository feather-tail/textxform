import { describe, it, expect } from 'vitest';
import { convert } from '../../src/index.js';

describe('HTML link security options', () => {
  it('adds rel by default', () => {
    const md = '[x](https://example.com)';
    const html = convert(md, { from: 'markdown', to: 'html' });
    expect(html).toBe(
      '<p><a href="https://example.com" rel="noopener noreferrer nofollow">x</a></p>'
    );
  });

  it('can override/remove rel', () => {
    const md = '[x](https://example.com)';
    const html = convert(md, { from: 'markdown', to: 'html', linkRel: '' });
    expect(html).toBe('<p><a href="https://example.com">x</a></p>');
  });

  it('can set target', () => {
    const md = '[x](https://example.com)';
    const html = convert(md, { from: 'markdown', to: 'html', linkTarget: '_blank' });
    expect(html).toBe(
      '<p><a href="https://example.com" rel="noopener noreferrer nofollow" target="_blank">x</a></p>'
    );
  });
});
