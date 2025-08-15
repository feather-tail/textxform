import { describe, it, expect } from 'vitest';
import { convert } from '../../src/index.js';

describe('Markdown incomplete link/image should not hang', () => {
  it('incomplete link [label](', () => {
    const html = convert('**hi** [link](', { from: 'markdown', to: 'html' });
    expect(html).toContain('<strong>hi</strong>');
  });
  it('incomplete image ![alt](', () => {
    const html = convert('![alt](', { from: 'markdown', to: 'html' });
    expect(html).toBe('<p>![alt](</p>');
  });
});
