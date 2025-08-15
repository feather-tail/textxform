import { describe, it, expect } from 'vitest';
import { convert } from '../../src/index.js';

describe('HTML style distribution', () => {
  it('div[style=color] with inner paragraph stays valid HTML', () => {
    const html = '<div style="color:red"><p><i>Second text</i></p></div>';
    const out = convert(html, { from: 'html', to: 'html' });
    expect(out).toBe('<p><span style="color:red"><em>Second text</em></span></p>');
  });

  it('div[style=color] -> bbcode distributes color into inline', () => {
    const html = '<div style="color:red"><p><i>Second text</i></p></div>';
    const out = convert(html, { from: 'html', to: 'bbcode' });
    expect(out).toBe('[color=red][i]Second text[/i][/color]');
  });
});
