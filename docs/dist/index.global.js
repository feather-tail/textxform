var textxform = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/index.js
  var index_exports = {};
  __export(index_exports, {
    convert: () => convert,
    parse: () => parse,
    render: () => render,
    use: () => use2
  });

  // src/ast/nodes.js
  var doc = (children = []) => ({ type: "Document", children });
  var paragraph = (children = []) => ({ type: "Paragraph", children });
  var text = (value = "") => ({ type: "Text", value });
  var strong = (children = []) => ({ type: "Strong", children });
  var emphasis = (children = []) => ({ type: "Emphasis", children });
  var underline = (children = []) => ({ type: "Underline", children });
  var strike = (children = []) => ({ type: "Strike", children });
  var link = (href = "", children = [], title = null) => ({ type: "Link", href, title, children });
  var image = (src = "", alt = "") => ({ type: "Image", src, alt });
  var inlineCode = (value = "") => ({ type: "InlineCode", value });
  var codeBlock = (value = "", lang = null) => ({ type: "CodeBlock", value, lang });
  var blockquote = (children = []) => ({ type: "Blockquote", children });
  var quote = (children = [], author = null) => ({ type: "Quote", author, children });
  var list = (ordered = false, children = []) => ({ type: "List", ordered, children });
  var listItem = (children = []) => ({ type: "ListItem", children });
  var lineBreak = () => ({ type: "LineBreak" });
  var spoiler = (children = [], label = null) => ({ type: "Spoiler", label, children });
  var heading = (value = "", depth = 1) => ({ type: "Heading", value, depth: Math.min(6, Math.max(1, depth)) });
  var thematicBreak = () => ({ type: "ThematicBreak" });

  // src/parsers/markdown.js
  function isHr(line) {
    const s = line.trim();
    return /^(?:\*\s*){3,}$/.test(s) || /^(?:-\s*){3,}$/.test(s) || /^(?:_\s*){3,}$/.test(s);
  }
  function findClosing(s, start, open = "[", close = "]") {
    let depth = 0;
    for (let i = start; i < s.length; i++) {
      const ch = s[i];
      if (ch === "\\") {
        i++;
        continue;
      }
      if (ch === open) depth++;
      else if (ch === close) {
        depth--;
        if (depth < 0) return i;
      }
    }
    return -1;
  }
  function findParenEnd(s, start) {
    let depth = 0;
    for (let i = start; i < s.length; i++) {
      const ch = s[i];
      if (ch === "\\") {
        i++;
        continue;
      }
      if (ch === "(") depth++;
      else if (ch === ")") {
        if (depth === 0) return i;
        depth--;
      }
    }
    return -1;
  }
  function parseInlines(s) {
    const out = [];
    let i = 0;
    s = String(s || "");
    const pushText = (str) => {
      if (str) out.push(text(str));
    };
    while (i < s.length) {
      if (s[i] === "\\" && i + 1 < s.length) {
        pushText(s[i + 1]);
        i += 2;
        continue;
      }
      if (s[i] === "!" && s[i + 1] === "[") {
        const altStart = i + 2;
        const altEnd = findClosing(s, altStart, "[", "]");
        if (altEnd !== -1 && s[altEnd + 1] === "(") {
          const urlStart = altEnd + 2;
          const urlEnd = findParenEnd(s, urlStart);
          if (urlEnd !== -1) {
            const inside = s.slice(urlStart, urlEnd).trim();
            const m = inside.match(/^(\S+)(?:\s+"([^"]+)")?$/);
            const srcVal = m ? m[1] : inside;
            const altVal = s.slice(altStart, altEnd);
            out.push(image(srcVal, altVal));
            i = urlEnd + 1;
            continue;
          }
        }
      }
      if (s[i] === "[") {
        const txtStart = i + 1;
        const txtEnd = findClosing(s, txtStart, "[", "]");
        if (txtEnd !== -1 && s[txtEnd + 1] === "(") {
          const urlStart = txtEnd + 2;
          const urlEnd = findParenEnd(s, urlStart);
          if (urlEnd !== -1) {
            const inside = s.slice(urlStart, urlEnd).trim();
            const m = inside.match(/^(\S+)(?:\s+"([^"]+)")?$/);
            const hrefVal = m ? m[1] : inside;
            const txt = s.slice(txtStart, txtEnd);
            out.push(link(hrefVal, parseInlines(txt)));
            i = urlEnd + 1;
            continue;
          }
        }
      }
      if (s[i] === "`") {
        const end = s.indexOf("`", i + 1);
        if (end !== -1) {
          out.push(inlineCode(s.slice(i + 1, end)));
          i = end + 1;
          continue;
        }
      }
      if (s.startsWith("**", i) || s.startsWith("__", i)) {
        const delim = s.slice(i, i + 2);
        const end = s.indexOf(delim, i + 2);
        if (end !== -1) {
          out.push(strong(parseInlines(s.slice(i + 2, end))));
          i = end + 2;
          continue;
        }
      }
      if (s.startsWith("~~", i)) {
        const end = s.indexOf("~~", i + 2);
        if (end !== -1) {
          out.push(strike(parseInlines(s.slice(i + 2, end))));
          i = end + 2;
          continue;
        }
      }
      if (s[i] === "*" || s[i] === "_") {
        const delim = s[i];
        const end = s.indexOf(delim, i + 1);
        if (end !== -1) {
          out.push(emphasis(parseInlines(s.slice(i + 1, end))));
          i = end + 1;
          continue;
        }
      }
      const next = s.slice(i).search(/(\\|!\[|\[|`|\*\*|__|\*|_|~~)/);
      if (next === -1) {
        pushText(s.slice(i));
        break;
      } else {
        pushText(s.slice(i, i + next));
        i += next;
      }
    }
    return out;
  }
  function parseBlocks(src) {
    const lines = String(src || "").replace(/\r/g, "").split("\n");
    const nodes = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) {
        i++;
        continue;
      }
      let m = line.match(/^ {0,3}(```|~~~)\s*([A-Za-z0-9_-]+)?\s*$/);
      if (m) {
        const fence = m[1];
        const lang = m[2] || null;
        i++;
        const body = [];
        while (i < lines.length && !new RegExp(`^ {0,3}${fence}\\s*$`).test(lines[i])) {
          body.push(lines[i]);
          i++;
        }
        if (i < lines.length) i++;
        nodes.push(codeBlock(body.join("\n"), lang));
        continue;
      }
      m = line.match(/^ {0,3}(#{1,6})\s+(.+)$/);
      if (m) {
        nodes.push(heading(m[2].trim(), m[1].length));
        i++;
        continue;
      }
      if (isHr(line)) {
        nodes.push(thematicBreak());
        i++;
        continue;
      }
      if (/^ {0,3}>\s?/.test(line)) {
        const buf2 = [];
        while (i < lines.length && /^ {0,3}>\s?/.test(lines[i])) {
          buf2.push(lines[i].replace(/^ {0,3}>\s?/, ""));
          i++;
        }
        const inner = parseBlocks(buf2.join("\n"));
        nodes.push(blockquote(inner));
        continue;
      }
      const ulRe = /^ {0,3}[-*+]\s+(.+)$/;
      const olRe = /^ {0,3}\d+\.\s+(.+)$/;
      if (ulRe.test(line) || olRe.test(line)) {
        const ordered = olRe.test(line);
        const items = [];
        while (i < lines.length && (ordered && olRe.test(lines[i]) || !ordered && ulRe.test(lines[i]))) {
          const content = (ordered ? lines[i].match(olRe)[1] : lines[i].match(ulRe)[1]) || "";
          items.push(listItem([paragraph(parseInlines(content))]));
          i++;
        }
        nodes.push(list(ordered, items));
        continue;
      }
      const buf = [line];
      i++;
      while (i < lines.length) {
        const l = lines[i];
        if (!l.trim()) {
          i++;
          break;
        }
        if (/^ {0,3}(```|~~~)/.test(l) || /^ {0,3}(#{1,6})\s+/.test(l) || isHr(l) || /^ {0,3}>\s?/.test(l) || ulRe.test(l) || olRe.test(l)) {
          break;
        }
        buf.push(l);
        i++;
      }
      nodes.push(paragraph(parseInlines(buf.join(" "))));
    }
    return nodes;
  }
  function parseMarkdown(input = "") {
    return doc(parseBlocks(input));
  }

  // src/parsers/bbcode.js
  function findMatching(src, tag, from) {
    const re = new RegExp(`\\[(?:${tag}(?:=[^\\]]+)?)\\]|\\[\\/${tag}\\]`, "gi");
    re.lastIndex = from;
    let depth = 1;
    let m;
    while (m = re.exec(src)) {
      const token = m[0];
      const isClose = token[1] === "/";
      if (isClose) {
        depth--;
        if (depth === 0) {
          return { start: m.index, end: re.lastIndex };
        }
      } else {
        depth++;
      }
    }
    return null;
  }
  function parseInline(src) {
    const out = [];
    let i = 0;
    const pushText = (s) => {
      if (!s) return;
      out.push(text(s));
    };
    const inlineSet = /* @__PURE__ */ new Set(["b", "i", "u", "s", "url", "img", "spoiler"]);
    while (i < src.length) {
      const lb = src.indexOf("[", i);
      if (lb === -1) {
        pushText(src.slice(i));
        break;
      }
      pushText(src.slice(i, lb));
      const rb = src.indexOf("]", lb + 1);
      if (rb === -1) {
        pushText(src.slice(lb));
        break;
      }
      const raw = src.slice(lb + 1, rb);
      const rawLower = raw.toLowerCase();
      if (rawLower.startsWith("/")) {
        pushText(src.slice(lb, rb + 1));
        i = rb + 1;
        continue;
      }
      const eq = raw.indexOf("=");
      const name = (eq === -1 ? raw : raw.slice(0, eq)).trim().toLowerCase();
      const arg = eq === -1 ? "" : raw.slice(eq + 1).trim();
      if (!inlineSet.has(name)) {
        pushText(src.slice(lb, rb + 1));
        i = rb + 1;
        continue;
      }
      const match = findMatching(src, name, rb + 1);
      if (!match) {
        pushText(src.slice(lb, rb + 1));
        i = rb + 1;
        continue;
      }
      const inner = src.slice(rb + 1, match.start);
      const after = match.end;
      if (name === "b") {
        out.push(strong(parseInline(inner)));
      } else if (name === "i") {
        out.push(emphasis(parseInline(inner)));
      } else if (name === "u") {
        out.push(underline(parseInline(inner)));
      } else if (name === "s") {
        out.push(strike(parseInline(inner)));
      } else if (name === "img") {
        const srcUrl = arg || inner.trim();
        out.push(image(srcUrl, ""));
      } else if (name === "url") {
        const href = arg || inner.trim();
        const textChildren = arg ? parseInline(inner) : [text(inner)];
        out.push(link(href, textChildren));
      } else if (name === "spoiler") {
        const label = arg || null;
        out.push(spoiler(parseInline(inner), label));
      }
      i = after;
    }
    return out;
  }
  function parseParagraphsInline(block) {
    const parts = String(block).split(/\n{2,}/);
    const res = [];
    for (const p of parts) {
      const trimmed = p.replace(/\r/g, "").trim();
      if (!trimmed) continue;
      res.push(paragraph(parseInline(trimmed)));
    }
    return res;
  }
  function parseListInner(inner, ordered = false) {
    const rawItems = inner.split(/\[\*\]/i).map((s) => s.trim()).filter(Boolean);
    const items = rawItems.map((it) => listItem(parseParagraphsInline(it)));
    return list(ordered, items);
  }
  function parseBBCode(input = "") {
    const src = String(input);
    const out = [];
    let i = 0;
    const pushTextAsParas = (s) => {
      const paras = parseParagraphsInline(s);
      out.push(...paras);
    };
    while (i < src.length) {
      const reOpen = /\[(quote|code|list)(?:=[^\]]+)?\]/gi;
      reOpen.lastIndex = i;
      const m = reOpen.exec(src);
      if (!m) {
        pushTextAsParas(src.slice(i));
        break;
      }
      const tagOpenIdx = m.index;
      const openRaw = m[0];
      const tagName = m[1].toLowerCase();
      if (tagOpenIdx > i) {
        pushTextAsParas(src.slice(i, tagOpenIdx));
      }
      const argMatch = openRaw.match(/=(.+)]$/);
      const arg = argMatch ? argMatch[1].trim() : "";
      const close = findMatching(src, tagName, tagOpenIdx + openRaw.length);
      if (!close) {
        pushTextAsParas(openRaw);
        i = tagOpenIdx + openRaw.length;
        continue;
      }
      const inner = src.slice(tagOpenIdx + openRaw.length, close.start);
      if (tagName === "code") {
        out.push(codeBlock(inner.replace(/\r/g, "")));
      } else if (tagName === "quote") {
        const quotedChildren = parseBBCode(inner).children;
        out.push(quote(quotedChildren, arg || null));
      } else if (tagName === "list") {
        const ordered = Boolean(arg);
        out.push(parseListInner(inner, ordered));
      }
      i = close.end;
    }
    return doc(out);
  }

  // src/parsers/plaintext.js
  function parsePlaintext(input = "") {
    const blocks = String(input).split(/\n{2,}/);
    const children = blocks.map((b) => paragraph([text(b.replace(/\n/g, " ").trim())]));
    return doc(children);
  }

  // src/core/utils.js
  function escapeHtml(s = "") {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function escapeAttr(s = "") {
    return escapeHtml(String(s)).replace(/`/g, "&#96;");
  }
  function sanitizeUrl(url = "") {
    const u = String(url || "").trim();
    if (!u) return "#";
    const l = u.toLowerCase();
    if (l.startsWith("http://")) return u;
    if (l.startsWith("https://")) return u;
    if (l.startsWith("mailto:")) return u;
    if (l.startsWith("data:image/")) return u;
    return "#";
  }

  // src/parsers/html.js
  function decodeEntities(s = "") {
    return String(s).replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
  }
  function getAttr(name, s) {
    const re = new RegExp(`${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>/]+))`, "i");
    const m = re.exec(s || "");
    return m ? m[1] ?? m[2] ?? m[3] ?? "" : "";
  }
  function getText(nodes) {
    const acc = [];
    const walk = (n) => {
      if (!n) return;
      if (Array.isArray(n)) return n.forEach(walk);
      switch (n.type) {
        case "Text":
          acc.push(n.value || "");
          break;
        case "Paragraph":
        case "Strong":
        case "Emphasis":
        case "Underline":
        case "Strike":
        case "Link":
        case "Blockquote":
        case "ListItem":
        case "List":
        case "Spoiler":
          (n.children || []).forEach(walk);
          break;
        case "InlineCode":
        case "CodeBlock":
          acc.push(n.value || "");
          break;
        default:
          break;
      }
    };
    walk(nodes);
    return acc.join("");
  }
  function ensureParagraphs(children) {
    const hasPara = (children || []).some((c) => c && c.type === "Paragraph");
    return hasPara ? children : [paragraph(children || [])];
  }
  function finalizeRoot(children) {
    const out = [];
    let buf = [];
    const flush = () => {
      if (buf.length) {
        out.push(paragraph(buf));
        buf = [];
      }
    };
    for (const n of children) {
      if (!n) continue;
      const isBlock = [
        "Paragraph",
        "Blockquote",
        "List",
        "Heading",
        "CodeBlock",
        "ThematicBreak"
      ].includes(n.type);
      if (isBlock) {
        flush();
        out.push(n);
      } else {
        buf.push(n);
      }
    }
    flush();
    return out;
  }
  function parseHTML(input = "") {
    const src = String(input);
    const root = { tag: "#root", children: [] };
    const stack = [root];
    const top = () => stack[stack.length - 1];
    const pushChild = (node) => {
      if (node) top().children.push(node);
    };
    const pushFrame = (tag, meta = {}) => stack.push({ tag, meta, children: [] });
    const popToTag = (tag) => {
      for (let k = stack.length - 1; k > 0; k--) {
        if (stack[k].tag === tag) {
          const frame = stack.pop();
          return frame;
        } else {
          const dangling = stack.pop();
          pushChild(text(getText(dangling.children)));
        }
      }
      return null;
    };
    const handleStartTag = (tag, attrs) => {
      switch (tag) {
        case "br":
          pushChild(lineBreak());
          return;
        case "hr":
          pushChild(thematicBreak());
          return;
        case "img": {
          const s = sanitizeUrl(getAttr("src", attrs));
          const alt = getAttr("alt", attrs);
          if (s !== "#") pushChild(image(s, alt));
          return;
        }
        case "a": {
          const href = sanitizeUrl(getAttr("href", attrs));
          const title = getAttr("title", attrs) || null;
          pushFrame("a", { href, title });
          return;
        }
        case "b":
        case "strong":
        case "i":
        case "em":
        case "u":
        case "s":
        case "strike":
        case "code":
          pushFrame(tag);
          return;
        case "p":
        case "blockquote":
        case "ul":
        case "ol":
        case "li":
        case "pre":
        case "h1":
        case "h2":
        case "h3":
        case "h4":
        case "h5":
        case "h6":
          pushFrame(tag);
          return;
        default:
          return;
      }
    };
    const handleCloseTag = (tag) => {
      switch (tag) {
        case "a": {
          const frame = popToTag("a");
          if (!frame) return;
          const { href, title } = frame.meta || {};
          pushChild(link(href || "#", frame.children, title));
          return;
        }
        case "b":
        case "strong": {
          const f = popToTag(tag);
          if (!f) return;
          pushChild(strong(f.children));
          return;
        }
        case "i":
        case "em": {
          const f = popToTag(tag);
          if (!f) return;
          pushChild(emphasis(f.children));
          return;
        }
        case "u": {
          const f = popToTag("u");
          if (!f) return;
          pushChild(underline(f.children));
          return;
        }
        case "s":
        case "strike": {
          const f = popToTag(tag);
          if (!f) return;
          pushChild(strike(f.children));
          return;
        }
        case "code": {
          const f = popToTag("code");
          if (!f) return;
          pushChild(inlineCode(getText(f.children)));
          return;
        }
        case "p": {
          const f = popToTag("p");
          if (!f) return;
          pushChild(paragraph(f.children));
          return;
        }
        case "blockquote": {
          const f = popToTag("blockquote");
          if (!f) return;
          pushChild(blockquote(ensureParagraphs(f.children)));
          return;
        }
        case "li": {
          const f = popToTag("li");
          if (!f) return;
          pushChild(listItem(ensureParagraphs(f.children)));
          return;
        }
        case "ul": {
          const f = popToTag("ul");
          if (!f) return;
          const items = (f.children || []).map(
            (c) => c.type === "ListItem" ? c : listItem(ensureParagraphs([c]))
          );
          pushChild(list(false, items));
          return;
        }
        case "ol": {
          const f = popToTag("ol");
          if (!f) return;
          const items = (f.children || []).map(
            (c) => c.type === "ListItem" ? c : listItem(ensureParagraphs([c]))
          );
          pushChild(list(true, items));
          return;
        }
        case "pre": {
          const f = popToTag("pre");
          if (!f) return;
          pushChild(codeBlock(getText(f.children)));
          return;
        }
        case "h1":
        case "h2":
        case "h3":
        case "h4":
        case "h5":
        case "h6": {
          const f = popToTag(tag);
          if (!f) return;
          const depth = Number(tag.slice(1)) || 1;
          pushChild(heading(getText(f.children).trim(), depth));
          return;
        }
        default:
          return;
      }
    };
    const appendText = (raw) => {
      const s = decodeEntities(raw);
      if (s) pushChild(text(s));
    };
    let i = 0;
    while (i < src.length) {
      const lt = src.indexOf("<", i);
      if (lt === -1) {
        appendText(src.slice(i));
        break;
      }
      if (lt > i) appendText(src.slice(i, lt));
      const gt = src.indexOf(">", lt + 1);
      if (gt === -1) {
        appendText(src.slice(lt));
        break;
      }
      const inside = src.slice(lt + 1, gt).trim();
      if (!inside) {
        i = gt + 1;
        continue;
      }
      if (inside.startsWith("!")) {
        i = gt + 1;
        continue;
      }
      if (inside[0] === "/") {
        handleCloseTag(inside.slice(1).toLowerCase());
        i = gt + 1;
        continue;
      }
      const m = inside.match(/^([a-zA-Z][a-zA-Z0-9]*)\b([\s\S]*)$/);
      if (!m) {
        appendText(src.slice(lt, gt + 1));
        i = gt + 1;
        continue;
      }
      const tag = m[1].toLowerCase();
      const rest = m[2] || "";
      handleStartTag(tag, rest);
      i = gt + 1;
    }
    while (stack.length > 1) {
      const dangling = stack.pop();
      pushChild(text(getText(dangling.children)));
    }
    return doc(finalizeRoot(root.children));
  }

  // src/core/visitor.js
  function visit(node, handlers, ctx) {
    const recur = (n) => visit(n, handlers, ctx);
    if (Array.isArray(node)) return node.map(recur).join("");
    if (!node || typeof node !== "object") return "";
    const handler = handlers[node.type] || handlers.__unknown || (() => "");
    return handler(node, ctx, recur);
  }

  // src/renderers/html.js
  function renderHTML(ast, opts = {}) {
    const { safe = true, linkRel = "noopener noreferrer nofollow", linkTarget = null } = opts;
    const h = {
      Document: (n, _c, r) => n.children.map(r).join("\n"),
      Paragraph: (n, _c, r) => `<p>${n.children.map(r).join("")}</p>`,
      Text: (n) => escapeHtml(n.value ?? ""),
      Heading: (n) => {
        const d = n.depth ?? 1;
        return `<h${d}>${escapeHtml(n.value ?? "")}</h${d}>`;
      },
      ThematicBreak: () => `<hr/>`,
      Strong: (n, _c, r) => `<strong>${n.children.map(r).join("")}</strong>`,
      Emphasis: (n, _c, r) => `<em>${n.children.map(r).join("")}</em>`,
      Underline: (n, _c, r) => `<u>${n.children.map(r).join("")}</u>`,
      Strike: (n, _c, r) => `<s>${n.children.map(r).join("")}</s>`,
      InlineCode: (n) => `<code>${escapeHtml(n.value ?? "")}</code>`,
      CodeBlock: (n) => `<pre><code>${escapeHtml(n.value ?? "")}</code></pre>`,
      LineBreak: () => `<br/>`,
      Link: (n, _c, r) => {
        const href = safe ? sanitizeUrl(n.href) : String(n.href || "");
        const title = n.title ? ` title="${escapeAttr(n.title)}"` : "";
        const rel = linkRel ? ` rel="${escapeAttr(linkRel)}"` : "";
        const target = linkTarget ? ` target="${escapeAttr(linkTarget)}"` : "";
        return `<a href="${escapeAttr(href)}"${title}${rel}${target}>${n.children.map(r).join("")}</a>`;
      },
      Image: (n) => {
        const src = safe ? sanitizeUrl(n.src) : String(n.src || "");
        if (src === "#") return "";
        const alt = n.alt ? ` alt="${escapeAttr(n.alt)}"` : ' alt=""';
        return `<img src="${escapeAttr(src)}"${alt}>`;
      },
      Blockquote: (n, _c, r) => `<blockquote>${n.children.map(r).join("")}</blockquote>`,
      Quote: (n, _c, r) => {
        const a = n.author ? ` data-author="${escapeAttr(n.author)}"` : "";
        return `<blockquote${a}>${n.children.map(r).join("")}</blockquote>`;
      },
      List: (n, _c, r) => {
        const tag = n.ordered ? "ol" : "ul";
        return `<${tag}>${n.children.map(r).join("")}</${tag}>`;
      },
      ListItem: (n, _c, r) => `<li>${n.children.map(r).join("")}</li>`,
      Spoiler: (n, _c, r) => {
        const summary = `<summary>${escapeHtml(n.label ?? "\u0421\u043F\u043E\u0439\u043B\u0435\u0440")}</summary>`;
        return `<details>${summary}${n.children.map(r).join("")}</details>`;
      },
      __unknown: () => ""
    };
    return visit(ast, h, {});
  }

  // src/renderers/markdown.js
  function renderMarkdown(ast, _opts = {}) {
    const h = {
      Document: (n, _c, r) => n.children.map(r).join("\n\n"),
      Paragraph: (n, _c, r) => n.children.map(r).join(""),
      Text: (n) => String(n.value ?? ""),
      Heading: (n) => "#".repeat(Math.min(6, Math.max(1, n.depth || 1))) + " " + (n.value || ""),
      ThematicBreak: () => "---",
      Strong: (n, _c, r) => `**${n.children.map(r).join("")}**`,
      Emphasis: (n, _c, r) => `*${n.children.map(r).join("")}*`,
      Underline: (n, _c, r) => `<u>${n.children.map(r).join("")}</u>`,
      Strike: (n, _c, r) => `~~${n.children.map(r).join("")}~~`,
      InlineCode: (n) => "`" + String(n.value ?? "").replace(/`/g, "\\`") + "`",
      CodeBlock: (n) => "```\n" + String(n.value ?? "") + "\n```",
      LineBreak: () => "  \n",
      Link: (n, _c, r) => `[${n.children.map(r).join("")}](${n.href || "#"})`,
      Image: (n) => `![${n.alt || ""}](${n.src || ""})`,
      Blockquote: (n, _c, r) => n.children.map(r).join("\n").split("\n").map((l) => `> ${l}`).join("\n"),
      Quote: (n, _c, r) => n.children.map(r).join("\n").split("\n").map((l) => `> ${l}`).join("\n"),
      List: (n, _c, r) => {
        const renderItem = (li) => r(li).replace(/\n/g, "\n   ");
        if (n.ordered) {
          return n.children.map((li) => `1. ${renderItem(li)}`).join("\n");
        }
        return n.children.map((li) => `- ${renderItem(li)}`).join("\n");
      },
      ListItem: (n, _c, r) => n.children.map(r).join(""),
      Spoiler: (n, _c, r) => `>! ${n.label ? n.label + ": " : ""}${n.children.map(r).join("")}`,
      __unknown: () => ""
    };
    return visit(ast, h, {});
  }

  // src/renderers/bbcode.js
  function renderBBCode(ast, _opts = {}) {
    const h = {
      Document: (n, _c, r) => n.children.map(r).join("\n\n"),
      Paragraph: (n, _c, r) => n.children.map(r).join(""),
      Text: (n) => String(n.value ?? ""),
      Heading: (n) => `[b]${n.value || ""}[/b]`,
      ThematicBreak: () => `[hr]`,
      Strong: (n, _c, r) => `[b]${n.children.map(r).join("")}[/b]`,
      Emphasis: (n, _c, r) => `[i]${n.children.map(r).join("")}[/i]`,
      Underline: (n, _c, r) => `[u]${n.children.map(r).join("")}[/u]`,
      Strike: (n, _c, r) => `[s]${n.children.map(r).join("")}[/s]`,
      InlineCode: (n) => `[code]${String(n.value ?? "")}[/code]`,
      CodeBlock: (n) => `[code]${String(n.value ?? "")}[/code]`,
      LineBreak: () => `
`,
      Link: (n, _c, r) => n.href ? `[url=${n.href}]${n.children.map(r).join("")}[/url]` : n.children.map(r).join(""),
      Image: (n) => `[img]${n.src || ""}[/img]`,
      Blockquote: (n, _c, r) => `[quote]${n.children.map(r).join("")}[/quote]`,
      Quote: (n, _c, r) => n.author ? `[quote=${n.author}]${n.children.map(r).join("")}[/quote]` : `[quote]${n.children.map(r).join("")}[/quote]`,
      List: (n, _c, r) => n.ordered ? `[list=1]${n.children.map(r).join("")}[/list]` : `[list]${n.children.map(r).join("")}[/list]`,
      ListItem: (n, _c, r) => `[*]${n.children.map(r).join("")}`,
      Spoiler: (n, _c, r) => n.label ? `[spoiler=${n.label}]${n.children.map(r).join("")}[/spoiler]` : `[spoiler]${n.children.map(r).join("")}[/spoiler]`,
      __unknown: () => ""
    };
    return visit(ast, h, {});
  }

  // src/renderers/plaintext.js
  function renderPlaintext(ast, _opts = {}) {
    const handlers = {
      Document: (node, _ctx, recur) => node.children.map(recur).join("\n\n"),
      Paragraph: (node, _ctx, recur) => node.children.map(recur).join(""),
      Text: (node) => String(node.value ?? "")
    };
    return visit(ast, handlers, {});
  }

  // src/core/plugins.js
  var _plugins = [];
  function use(plugin) {
    if (!plugin || typeof plugin !== "object") return;
    if (_plugins.includes(plugin)) return;
    _plugins.push(plugin);
  }
  function runHook(name, value, ctx) {
    let v = value;
    for (const p of _plugins) {
      const fn = p && p[name];
      if (typeof fn === "function") {
        const res = fn(v, ctx);
        if (typeof res !== "undefined") v = res;
      }
    }
    return v;
  }

  // src/index.js
  function use2(plugin) {
    use(plugin);
  }
  function parse(input = "", { from = "plaintext" } = {}) {
    const prepared = runHook("beforeParse", String(input), { from });
    let ast;
    switch (from) {
      case "markdown":
        ast = parseMarkdown(prepared);
        break;
      case "bbcode":
        ast = parseBBCode(prepared);
        break;
      case "html":
        ast = parseHTML(prepared);
        break;
      case "plaintext":
      default:
        ast = parsePlaintext(prepared);
        break;
    }
    return runHook("afterParse", ast, { from });
  }
  function render(ast, { to = "html", ...opts } = {}) {
    const readyAst = runHook("beforeRender", ast, { to, opts });
    let out;
    switch (to) {
      case "markdown":
        out = renderMarkdown(readyAst, opts);
        break;
      case "bbcode":
        out = renderBBCode(readyAst, opts);
        break;
      case "html":
        out = renderHTML(readyAst, opts);
        break;
      case "plaintext":
      default:
        out = renderPlaintext(readyAst, opts);
        break;
    }
    return runHook("afterRender", out, { to, opts });
  }
  function convert(input, opts = {}) {
    const ast = parse(input, { from: opts.from || "plaintext" });
    return render(ast, { to: opts.to || "html", ...opts });
  }
  return __toCommonJS(index_exports);
})();
