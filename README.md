# textxform# textxform

Конвертер **Plain text / Markdown / BBCode / HTML** на чистом JavaScript.  
Быстрый, безопасный по умолчанию (safe HTML), расширяемый через плагины.

[![CI](https://github.com/feather-tail/textxform/actions/workflows/ci.yml/badge.svg)](https://github.com/feather-tail/textxform/actions/workflows/ci.yml)

---

## Особенности

- 📚 Поддерживаемые форматы: **plaintext**, **markdown**, **bbcode**, **html**
- 🧩 Единый AST, чёткое разделение парсеров/рендереров, простой пайплайн
- 🔒 Безопасный HTML-рендер по умолчанию: экранирование + `sanitizeUrl`
  - Разрешены `http:`, `https:`, `mailto:`
  - Для `<img>` разрешён `data:image/*`
  - Ссылки получают `rel="noopener noreferrer nofollow"` (опция)
- 🧪 Тесты: unit, round-trip, cross-trip, security, CLI; coverage (V8)
- 🛠️ CLI: `textxform --from … --to …` (+ чтение из stdin/файла)
- 🔌 Плагины: хуки `beforeParse/afterParse/beforeRender/afterRender`
  - В комплекте: `autolink` (голые URL → ссылки), `emoji` (`:smile:` → 🙂)

---

## Установка

> Проект собирается и тестируется на **Node 20 LTS** (`.nvmrc` в репо).

Локально (как библиотеку из исходников):

```bash
# клонировать
git clone https://github.com/feather-tail/textxform
cd textxform
nvm use    # подхватит Node 20 из .nvmrc
npm ci
npm run build
```

В соседнем проекте можно попробовать как зависимость из локального пути:

```bash
# в папке вашего тест-проекта
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
  // опции HTML-рендера:
  safe?: boolean,                 // sanitize URL'ы (по умолчанию true)
  linkRel?: string | null,        // rel для <a> (по умолчанию "noopener noreferrer nofollow")
  linkTarget?: string | null      // target для <a> (по умолчанию null)
}): string
```

Доступны также низкоуровневые функции:

```ts
parse(input: string, { from }): AST        // распарсить в AST
render(ast: AST, { to, ...opts }): string  // отрендерить AST в целевой формат
use(plugin): void                          // подключить плагин(ы)
```

---

## CLI

Утилита поставляется в `bin/textxform.mjs`.

```bash
# из stdin
echo "**bold**" | node bin/textxform.mjs --from markdown --to html --stdin

# файл → файл
echo "[b]hi[/b]" > in.txt
node bin/textxform.mjs --from bbcode --to html --in in.txt --out out.html

# помощь
node bin/textxform.mjs --help
```

Вывод `--help`:

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
| Жирный       | `**text**`             | `[b]text[/b]`            | `<strong>text</strong>`        |
| Курсив       | `*text*`               | `[i]text[/i]`            | `<em>text</em>`                |
| Подчёркнутый | _(нет стандарта)_      | `[u]text[/u]`            | `<u>text</u>`                  |
| Зачёркнутый  | `~~text~~`             | `[s]text[/s]`            | `<s>text</s>`                  |
| Инлайн-код   | `` `code` ``           | _(нет стандарта)_        | `<code>code</code>`            |
| Ссылка       | `[t](https://a)`       | `[url=https://a]t[/url]` | `<a href="https://a">t</a>`    |
| Картинка     | `![alt](https://i)`    | `[img]https://i[/img]`   | `<img src="https://i" alt="">` |
| Цитата       | `> text`               | `[quote]text[/quote]`    | `<blockquote>…</blockquote>`   |
| Список (•)   | `- item`               | `[list][*]item[/list]`   | `<ul><li>…</li></ul>`          |
| Список (1.)  | `1. item`              | `[list=1][*]item[/list]` | `<ol><li>…</li></ol>`          |
| Код-блок     | три бэктика и переносы | `[code]code[/code]`      | `<pre><code>…</code></pre>`    |
| Заголовок    | `## Title`             | _(нет стандарта)_        | `<h2>Title</h2>`               |

> Примечание: для устойчивого round-trip Markdown упорядоченные списки рендерятся как `1.` у каждого пункта.

---

## Безопасность

HTML-рендерер по умолчанию **безопасен**:

- Экранирование текстов и атрибутов (`escapeHtml`, `escapeAttr`)
- `sanitizeUrl()` разрешает `http/https/mailto` и `data:image/*` (только для `<img>`)
- `javascript:` и опасные `data:` в ссылках заменяются на `href="#"`
- Ссылки получают `rel="noopener noreferrer nofollow"` (настраивается)

Тонкая настройка:

```js
convert(md, {
  from: 'markdown',
  to: 'html',
  safe: true,
  linkRel: '',
  linkTarget: '_blank',
});
```

---

## Плагины

Плагины подключаются через `use(plugin)` и могут реализовать любые из хуков:

- `beforeParse(input: string) => string`
- `afterParse(ast) => ast`
- `beforeRender(ast) => ast`
- `afterRender(output: string) => string`

### Встроенные плагины

- **autolink** — превращает «голые» URL в ссылки  
  Пример: `See http://example.com` → ссылка.

- **emoji** — заменяет коды `:smile:`, `:heart:`, … на эмодзи

Подключение (внутри репозитория):

```js
import { use, convert } from './src/index.js';
import { autolink } from './src/plugins/autolink.js';
import { emoji } from './src/plugins/emoji.js';

use(autolink);
use(emoji);

console.log(convert('See http://example.com :smile:', { from: 'markdown', to: 'html' }));
// <p>See <a href="http://example.com" rel="noopener noreferrer nofollow">http://example.com</a> 🙂</p>
```

> После публикации пакета импорты плагинов будут вида:  
> `import { autolink } from 'textxform/plugins/autolink'`.

---

## Примеры

В репозитории есть мини-примеры:

```bash
# быстрый старт
npm run ex:quick

# демонстрация API (parse/render/convert)
npm run ex:api
```

Содержимое см. в `examples/quick-start.mjs`, `examples/api-demo.mjs`.

---

## Разработка

```bash
npm run build      # сборки ESM/CJS/IIFE
npm test           # тесты (Vitest)
npm run test:cov   # тесты с покрытием (V8), отчёты в coverage/
npm run lint       # ESLint
npm run size       # Size-Limit
```

CI (GitHub Actions) прогоняет линтер, тесты с покрытием, сборку и size-limit; lcov-отчёт прикладывается артефактом к сборке.

---

## Дорожная карта (ближняя)

- Плагины: публичный реестр и пресеты
- Расширение Markdown (tables, автоссылки расширенные) и BBCode (color/size — с белыми списками)
- Пресеты безопасности (строгий/умеренный)
- Release flow (changesets/semantic-release) + CHANGELOG

---

## Лицензия

MIT © 2025-present feather-tail
