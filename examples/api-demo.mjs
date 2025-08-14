import { parse, render, convert } from '../src/index.js';
const ast = parse('# Title\n\nHello **world**', { from: 'markdown' });
console.log('AST nodes:', ast.children.length);
console.log(render(ast, { to: 'html', linkRel: '', linkTarget: '_blank' }));
console.log(convert('[b]bold[/b] [url=https://ex.com]x[/url]', { from: 'bbcode', to: 'markdown' }));
