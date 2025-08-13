import { convert } from '../src/index.js';

const input = `Hello **world**!

Second paragraph.`;
console.log('HTML:');
console.log(convert(input, { from: 'plaintext', to: 'html' }));
