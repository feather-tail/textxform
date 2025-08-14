import { convert } from '../src/index.js'; // dev; либо ../dist/index.js после build
const md = '**hi** [link](https://example.com)';
console.log(convert(md, { from: 'markdown', to: 'html' }));
