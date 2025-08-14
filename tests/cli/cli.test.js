import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import fs from 'node:fs/promises';

const BIN = resolve(process.cwd(), 'bin/textxform.mjs');

function runCLI(args, input = '') {
  return new Promise((resolveP) => {
    const child = spawn(process.execPath, [BIN, ...args], { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '', err = '';
    child.stdout.on('data', (d) => (out += d.toString()));
    child.stderr.on('data', (d) => (err += d.toString()));
    child.on('close', (code) => resolveP({ code, out, err }));
    if (input) child.stdin.write(input);
    child.stdin.end();
  });
}

describe('CLI', () => {
  it('stdin md->html', async () => {
    const { code, out, err } = await runCLI(['--from','markdown','--to','html','--stdin'], '**hi**');
    expect(code).toBe(0);
    expect(out.trim()).toBe('<p><strong>hi</strong></p>');
    expect(err).toBe('');
  });

  it('file in/out bbcode->html', async () => {
    const tmpIn = 'tmp_in.txt';
    const tmpOut = 'tmp_out.html';
    await fs.writeFile(tmpIn, '[b]hi[/b]', 'utf8');
    const { code, err } = await runCLI(['--from','bbcode','--to','html','--in', tmpIn, '--out', tmpOut]);
    expect(code).toBe(0);
    expect(err).toBe('');
    const content = (await fs.readFile(tmpOut, 'utf8')).trim();
    expect(content).toBe('<p><strong>hi</strong></p>');
    await fs.unlink(tmpIn); await fs.unlink(tmpOut);
  });

  it('--help prints usage', async () => {
    const r = await runCLI(['--help']);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/Usage: textxform/);
  });
});
