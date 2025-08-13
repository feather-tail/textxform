import { convert } from '../src/index.js';

const sample = Array.from({ length: 1000 }, (_, i) => `Line ${i}`).join('\n\n');
console.time('convert plaintext->html');
const out = convert(sample, { from: 'plaintext', to: 'html' });
console.timeEnd('convert plaintext->html');
console.log('length:', out.length);
