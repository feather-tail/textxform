import fsp from 'node:fs/promises';

function parseArgs(argv) {
  const opts = {
    from: 'plaintext',
    to: 'html',
    safe: true,
    stdin: false,
    in: null,
    out: null,
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--from') opts.from = argv[++i] || opts.from;
    else if (a === '--to') opts.to = argv[++i] || opts.to;
    else if (a === '--safe') opts.safe = true;
    else if (a === '--raw') opts.safe = false;
    else if (a === '--stdin') opts.stdin = true;
    else if (a === '--in') opts.in = argv[++i] || null;
    else if (a === '--out') opts.out = argv[++i] || null;
    else if (a === '-h' || a === '--help') opts.help = true;
    else (opts._unknown ??= []).push(a);
  }
  return opts;
}

function printHelp() {
  console.log(`Usage: textxform [--from <fmt>] [--to <fmt>] [--safe|--raw] (--stdin | --in <file>) [--out <file>]

Formats:
  --from, --to: plaintext | markdown | bbcode | html
Flags:
  --safe (default)   Render HTML safely (sanitize href/src)
  --raw              Disable safe mode in HTML renderer
  --stdin            Read input from STDIN
  --in <file>        Read input from file
  --out <file>       Write output to file (else prints to STDOUT)
  -h, --help         Show this help

Examples:
  echo '**bold**' | textxform --from markdown --to html --stdin
  textxform --from bbcode --to html --in input.txt --out out.html
`);
}

async function readStdin() {
  return await new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

async function main() {
  const opts = parseArgs(process.argv);
  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  let input = '';
  try {
    if (opts.in) {
      input = await fsp.readFile(opts.in, 'utf8');
    } else if (opts.stdin || !process.stdin.isTTY) {
      input = await readStdin();
    } else {
      throw new Error('No input. Use --stdin or --in <file>.');
    }
  } catch (e) {
    console.error('Error reading input:', e.message);
    process.exit(2);
  }

  let convert;
  try {
    ({ convert } = await import('../dist/index.js'));
  } catch {
    ({ convert } = await import('../src/index.js'));
  }

  let output = '';
  try {
    output = convert(input, { from: opts.from, to: opts.to, safe: opts.safe });
  } catch (e) {
    console.error('Error converting:', e.message);
    process.exit(2);
  }

  try {
    if (opts.out) await fsp.writeFile(opts.out, output, 'utf8');
    else process.stdout.write(output);
  } catch (e) {
    console.error('Error writing output:', e.message);
    process.exit(2);
  }
}

main().catch((e) => {
  console.error(e?.stack || e?.message || String(e));
  process.exit(2);
});
