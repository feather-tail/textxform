# textxform

Конвертер **Plain text / Markdown / BBCode / HTML** на чистом JavaScript.  
Быстрый, безопасный по умолчанию (safe HTML), расширяемый через **плагины** (хуки).

> ⚠️ Примечание по плагинам: `autolink` и `emoji` **не являются встроенными**. В этом репозитории присутствуют их референс‑реализации для разработки и примеров. В публикуемом пакете они будут поставляться как **отдельные плагины** через отдельные точки импорта.

---

## Особенности

- Поддерживаемые форматы: `plaintext`, `markdown`, `bbcode`, `html`.
- Единый AST и чёткое разделение: `parse → AST → render`.
- Безопасный HTML‑рендер по умолчанию (экранирование + `sanitizeUrl()`):
  - Разрешены схемы `http:`, `https:`, `mailto:`.
  - Для `<img>` разрешён `data:image/*`.
  - `javascript:` и опасные `data:` в ссылках отклоняются (подменяются на `href="#"`).
  - Ссылки получают `rel="noopener noreferrer nofollow"` (можно изменить).
- CLI‑утилита: `textxform --from … --to …` (stdin/файлы, `--safe`/`--raw`).
- Плагины через хуки пайплайна: `beforeParse`, `afterParse`, `beforeRender`, `afterRender`.
- Тесты: unit / round‑trip / cross‑trip / security / CLI (Vitest), покрытие (V8).

---

## Установка

Проект собирается и тестируется на **Node 20 LTS** (`.nvmrc` в репозитории).

```bash
# клонировать
git clone https://github.com/feather-tail/textxform
cd textxform
nvm use
npm ci
npm run build
```

Локальная зависимость в соседнем проекте:

```bash
# внутри вашего тест‑проекта
npm init -y
npm i ../textxform
```

---

## Быстрый старт

```js
// Внутри репозитория (dev): импорт из src
import { convert } from './src/index.js';

// После сборки можно импортировать из dist:
// import { convert } from './dist/index.js';

const html = convert('**hi** [link](https://example.com)', {
  from: 'markdown',
  to: 'html',
});
// <p><strong>hi</strong> <a href="https://example.com" rel="noopener noreferrer nofollow">link</a></p>
```

---

## API

```ts
convert(input: string, opts: {
  from: 'plaintext' | 'markdown' | 'bbcode' | 'html',
  to:   'plaintext' | 'markdown' | 'bbcode' | 'html',
  // опции HTML‑рендера:
  safe?: boolean,                 // sanitize URL (по умолчанию true)
  linkRel?: string | null,        // rel для <a> (по умолчанию "noopener noreferrer nofollow")
  linkTarget?: string | null      // target для <a> (по умолчанию null)
}): string

// Низкоуровневые функции
parse(input: string, { from }): AST
render(ast: AST, { to, ...opts }): string
use(plugin): void
```

Пример тонкой настройки HTML‑рендера:

```js
const out = convert(md, {
  from: 'markdown',
  to: 'html',
  safe: true,
  linkRel: '',
  linkTarget: '_blank',
});
```

---

## CLI

Утилита находится в `bin/textxform.mjs`.

```bash
# из stdin
echo "**bold**" | node bin/textxform.mjs --from markdown --to html --stdin

# файл → файл
echo "[b]hi[/b]" > in.txt
node bin/textxform.mjs --from bbcode --to html --in in.txt --out out.html

# помощь
node bin/textxform.mjs --help
```

Справка по ключам:

```
Usage: textxform [--from <fmt>] [--to <fmt>] [--safe|--raw] (--stdin | --in <file>) [--out <file>]
Formats:
  --from, --to: plaintext | markdown | bbcode | html
Flags:
  --safe (default)   Render HTML safely (sanitize href/src)
  --raw              Disable safe mode in HTML renderer
  --stdin            Read input from STDIN
  --in <file>        Read input from file
  --out <file>       Write output to file (else prints to STDOUT)
```

---

## Соответствия форматов (минимальный срез)

| Семантика    | Markdown               | BBCode                   | HTML                           |
| ------------ | ---------------------- | ------------------------ | ------------------------------ |
| **Жирный**   | `**text**`             | `[b]text[/b]`            | `<strong>text</strong>`        |
| _Курсив_     | `*text*`               | `[i]text[/i]`            | `<em>text</em>`                |
| Подчёркнутый | —                      | `[u]text[/u]`            | `<u>text</u>`                  |
| Зачёркнутый  | `~~text~~`             | `[s]text[/s]`            | `<s>text</s>`                  |
| Инлайн‑код   | `code`                 | —                        | `<code>code</code>`            |
| Ссылка       | `[t](https://a)`       | `[url=https://a]t[/url]` | `<a href="https://a">t</a>`    |
| Картинка     | `![alt](https://i)`    | `[img]https://i[/img]`   | `<img src="https://i" alt="">` |
| Цитата       | `> text`               | `[quote]text[/quote]`    | `<blockquote>…</blockquote>`   |
| Список (•)   | `- item`               | `[list][*]item[/list]`   | `<ul><li>…</li></ul>`          |
| Список (1.)  | `1. item`              | `[list=1][*]item[/list]` | `<ol><li>…</li></ol>`          |
| Код‑блок     | три бэктика / переносы | `[code]code[/code]`      | `<pre><code>…</code></pre>`    |
| Заголовок    | `## Title`             | —                        | `<h2>Title</h2>`               |

> Для устойчивого round‑trip упорядоченные списки при HTML‑рендере задаются как `1.` у каждого пункта.

---

## Безопасность (HTML)

Рендерер формирует HTML строго из AST и **не пропускает сырой HTML из входа**. Гарантии:

- Экранирование текстов и атрибутов (`escapeHtml`, `escapeAttr`).
- Санитизация URL: `http/https/mailto` и `data:image/*` (только для `<img>`), остальное — блокируется.
- `javascript:`/опасные `data:` режутся, `href/src` подменяются безопасными значениями.
- Для ссылок по умолчанию: `rel="noopener noreferrer nofollow"`, `target` — по выбору.

---

## Плагины

Плагины подключаются через `use(plugin)` и дают возможность перехватывать этапы пайплайна:

- `beforeParse(input: string) => string`
- `afterParse(ast) => ast`
- `beforeRender(ast) => ast`
- `afterRender(output: string) => string`

### Примеры плагинов (референсы в репозитории)

В репозитории есть примерные реализации плагинов `autolink` (голые URL → ссылки) и `emoji` (`:smile:` → 😊). Они включены **только как примеры** и для локальной разработки.

```js
import { use, convert } from './src/index.js';
import { autolink } from './src/plugins/autolink.js';
import { emoji } from './src/plugins/emoji.js';

use(autolink);
use(emoji);

console.log(convert('See http://example.com :smile:', { from: 'markdown', to: 'html' }));
// <p>See <a href="http://example.com" rel="noopener noreferrer nofollow">http://example.com</a> 😊</p>
```

> После публикации в npm планируется импорт из отдельных точек:
> `import { autolink } from 'textxform/plugins/autolink'` и т. п.

---

## Примеры

```bash
npm run ex:quick   # быстрый старт
npm run ex:api     # демонстрация API (parse/render/convert)
```

Смотрите `examples/quick-start.mjs` и `examples/api-demo.mjs`.

---

## Разработка

```bash
npm run build      # сборки ESM/CJS/IIFE
npm test           # тесты (Vitest)
npm run test:cov   # тесты с покрытием (V8), отчёты в coverage/
npm run lint       # ESLint
npm run size       # Size-Limit
```

CI (GitHub Actions) прогоняет линтер, тесты с покрытием, сборку и size‑limit; lcov‑отчёт прикладывается как артефакт.

---

## Лицензия

MIT © 2025‑present feather‑tail
