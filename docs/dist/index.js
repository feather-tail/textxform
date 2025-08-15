var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/ast/nodes.js
var nodes_exports = {};
__export(nodes_exports, {
  blockquote: () => blockquote,
  codeBlock: () => codeBlock,
  color: () => color,
  doc: () => doc,
  emphasis: () => emphasis,
  heading: () => heading,
  image: () => image,
  inlineCode: () => inlineCode,
  lineBreak: () => lineBreak,
  link: () => link,
  list: () => list,
  listItem: () => listItem,
  paragraph: () => paragraph,
  quote: () => quote,
  size: () => size,
  spoiler: () => spoiler,
  strike: () => strike,
  strong: () => strong,
  text: () => text,
  thematicBreak: () => thematicBreak,
  underline: () => underline
});
var doc = (children = []) => ({ type: "Document", children });
var paragraph = (children = [], meta = null) => ({ type: "Paragraph", children, meta });
var text = (value = "") => ({ type: "Text", value });
var strong = (children = []) => ({ type: "Strong", children });
var emphasis = (children = []) => ({ type: "Emphasis", children });
var underline = (children = []) => ({ type: "Underline", children });
var strike = (children = []) => ({ type: "Strike", children });
var link = (href = "", children = [], title = null) => ({
  type: "Link",
  href,
  title,
  children
});
var image = (src = "", alt = "") => ({ type: "Image", src, alt });
var inlineCode = (value = "") => ({ type: "InlineCode", value });
var codeBlock = (value = "", lang = null) => ({ type: "CodeBlock", value, lang });
var blockquote = (children = []) => ({ type: "Blockquote", children });
var quote = (children = [], author = null) => ({ type: "Quote", author, children });
var list = (ordered = false, children = []) => ({ type: "List", ordered, children });
var listItem = (children = []) => ({ type: "ListItem", children });
var lineBreak = () => ({ type: "LineBreak" });
var spoiler = (children = [], label = null) => ({ type: "Spoiler", label, children });
var heading = (value = "", depth = 1) => ({
  type: "Heading",
  value,
  depth: Math.min(6, Math.max(1, depth))
});
var thematicBreak = () => ({ type: "ThematicBreak" });
var color = (value, children = []) => ({ type: "Color", value, children });
var size = (value, children = []) => ({ type: "Size", value, children });

// src/core/utils.js
var utils_exports = {};
__export(utils_exports, {
  escapeAttr: () => escapeAttr,
  escapeHtml: () => escapeHtml,
  sanitizeColor: () => sanitizeColor,
  sanitizeFontSize: () => sanitizeFontSize,
  sanitizeUrl: () => sanitizeUrl
});
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
var NAMED_COLORS = /* @__PURE__ */ new Set([
  "black",
  "silver",
  "gray",
  "white",
  "maroon",
  "red",
  "purple",
  "fuchsia",
  "green",
  "lime",
  "olive",
  "yellow",
  "navy",
  "blue",
  "teal",
  "aqua"
]);
var HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
function sanitizeColor(v) {
  if (typeof v !== "string") return null;
  const s = v.trim().toLowerCase();
  if (NAMED_COLORS.has(s)) return s;
  if (HEX_COLOR_RE.test(s)) return s;
  return null;
}
var SIZE_MAP = {
  small: "0.85em",
  normal: "1em",
  large: "1.25em",
  "x-large": "1.5em"
};
function sanitizeFontSize(v) {
  if (typeof v !== "string") return null;
  const s = v.trim().toLowerCase();
  if (SIZE_MAP[s]) return SIZE_MAP[s];
  const m = /^([1-9]\d{0,2})%$/.exec(s);
  if (m) {
    const pct = Math.max(50, Math.min(250, parseInt(m[1], 10)));
    if (pct >= 140) return SIZE_MAP["x-large"];
    if (pct >= 115) return SIZE_MAP["large"];
    if (pct <= 95) return SIZE_MAP["small"];
    return SIZE_MAP["normal"];
  }
  return null;
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
      case "Color":
      case "Size":
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
function parseStyleMap(styleStr = "") {
  const map = {};
  String(styleStr).split(";").forEach((pair) => {
    const i = pair.indexOf(":");
    if (i > 0) {
      const k = pair.slice(0, i).trim().toLowerCase();
      const val = pair.slice(i + 1).trim();
      if (k) map[k] = val;
    }
  });
  return map;
}
function extractStyleMeta(attrs) {
  const style = parseStyleMap(getAttr("style", attrs));
  const colorAttr = getAttr("color", attrs);
  if (colorAttr && !style.color) style.color = colorAttr;
  const sizeAttr = getAttr("size", attrs);
  if (sizeAttr && !style["font-size"]) style["font-size"] = sizeAttr;
  const className = (getAttr("class", attrs) || "").trim() || null;
  return { style, className };
}
var BLOCK_TYPES = /* @__PURE__ */ new Set([
  "Paragraph",
  "Blockquote",
  "List",
  "ListItem",
  "Heading",
  "CodeBlock",
  "ThematicBreak"
]);
function hasBlock(nodes = []) {
  return nodes.some((n) => n && BLOCK_TYPES.has(n.type));
}
function applyInlineStyle(children = [], style = {}) {
  let res = children;
  if (style["font-size"]) res = [size(style["font-size"], res)];
  if (style.color) res = [color(style.color, res)];
  return res;
}
function mergeStyle(existing, incoming) {
  if (!incoming) return existing || null;
  const out = { ...incoming || {} };
  if (existing) {
    for (const k of Object.keys(existing)) out[k] = existing[k];
  }
  return out;
}
function wrapByStyle(nodes = [], style = null) {
  if (!style || nodes.length === 0) return nodes;
  if (!hasBlock(nodes)) {
    return applyInlineStyle(nodes, style);
  }
  const mapNode = (n) => {
    if (!n) return n;
    switch (n.type) {
      case "Paragraph":
        return { ...n, style: mergeStyle(n.style, style) };
      case "ListItem":
      case "List":
      case "Blockquote":
        return {
          ...n,
          style: mergeStyle(n.style, style),
          children: (n.children || []).map(mapNode)
        };
      case "Heading":
      case "CodeBlock":
      case "ThematicBreak":
        return n;
      default:
        return n;
    }
  };
  return nodes.map(mapNode);
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
  function handleStartTag(tag, attrs) {
    const START = {
      br: () => pushChild(lineBreak()),
      hr: () => pushChild(thematicBreak()),
      img: () => {
        const s = sanitizeUrl(getAttr("src", attrs));
        const alt = getAttr("alt", attrs);
        if (s !== "#") pushChild(image(s, alt));
      },
      a: () => {
        const href = sanitizeUrl(getAttr("href", attrs));
        const title = getAttr("title", attrs) || null;
        const meta = { href, title, ...extractStyleMeta(attrs) };
        pushFrame("a", meta);
      },
      span: () => pushFrame("span", extractStyleMeta(attrs)),
      font: () => pushFrame("font", extractStyleMeta(attrs)),
      b: () => pushFrame("b", extractStyleMeta(attrs)),
      strong: () => pushFrame("strong", extractStyleMeta(attrs)),
      i: () => pushFrame("i", extractStyleMeta(attrs)),
      em: () => pushFrame("em", extractStyleMeta(attrs)),
      u: () => pushFrame("u", extractStyleMeta(attrs)),
      s: () => pushFrame("s", extractStyleMeta(attrs)),
      strike: () => pushFrame("strike", extractStyleMeta(attrs)),
      code: () => pushFrame("code"),
      p: () => pushFrame("p", extractStyleMeta(attrs)),
      div: () => pushFrame("div", extractStyleMeta(attrs)),
      blockquote: () => pushFrame("blockquote", extractStyleMeta(attrs)),
      ul: () => pushFrame("ul", extractStyleMeta(attrs)),
      ol: () => pushFrame("ol", extractStyleMeta(attrs)),
      li: () => pushFrame("li", extractStyleMeta(attrs)),
      pre: () => pushFrame("pre", extractStyleMeta(attrs)),
      h1: () => pushFrame("h1", extractStyleMeta(attrs)),
      h2: () => pushFrame("h2", extractStyleMeta(attrs)),
      h3: () => pushFrame("h3", extractStyleMeta(attrs)),
      h4: () => pushFrame("h4", extractStyleMeta(attrs)),
      h5: () => pushFrame("h5", extractStyleMeta(attrs)),
      h6: () => pushFrame("h6", extractStyleMeta(attrs))
    };
    (START[tag] || (() => {
    }))();
  }
  function handleCloseTag(tag) {
    const CLOSE = {
      a: () => {
        const f = popToTag("a");
        if (!f) return;
        const { href, title, style } = f.meta || {};
        const kids = wrapByStyle(f.children, style);
        pushChild(link(href || "#", kids, title));
      },
      span: () => {
        const f = popToTag("span");
        if (!f) return;
        const kids = wrapByStyle(f.children, f.meta && f.meta.style);
        (kids.length === 1 ? [kids[0]] : kids).forEach(pushChild);
      },
      font: () => {
        const f = popToTag("font");
        if (!f) return;
        const kids = wrapByStyle(f.children, f.meta && f.meta.style);
        (kids.length === 1 ? [kids[0]] : kids).forEach(pushChild);
      },
      b: () => {
        var _a, _b;
        const f = popToTag("b");
        if (f) {
          const node = strong(wrapByStyle(f.children, (_a = f.meta) == null ? void 0 : _a.style));
          node._tag = "b";
          if ((_b = f.meta) == null ? void 0 : _b.className) node.className = f.meta.className;
          pushChild(node);
        }
      },
      strong: () => {
        var _a, _b;
        const f = popToTag("strong");
        if (f) {
          const node = strong(wrapByStyle(f.children, (_a = f.meta) == null ? void 0 : _a.style));
          node._tag = "strong";
          if ((_b = f.meta) == null ? void 0 : _b.className) node.className = f.meta.className;
          pushChild(node);
        }
      },
      i: () => {
        var _a, _b;
        const f = popToTag("i");
        if (f) {
          const node = emphasis(wrapByStyle(f.children, (_a = f.meta) == null ? void 0 : _a.style));
          node._tag = "i";
          if ((_b = f.meta) == null ? void 0 : _b.className) node.className = f.meta.className;
          pushChild(node);
        }
      },
      em: () => {
        var _a, _b;
        const f = popToTag("em");
        if (f) {
          const node = emphasis(wrapByStyle(f.children, (_a = f.meta) == null ? void 0 : _a.style));
          node._tag = "em";
          if ((_b = f.meta) == null ? void 0 : _b.className) node.className = f.meta.className;
          pushChild(node);
        }
      },
      u: () => {
        var _a;
        const f = popToTag("u");
        if (f) pushChild(underline(wrapByStyle(f.children, (_a = f.meta) == null ? void 0 : _a.style)));
      },
      s: () => {
        var _a;
        const f = popToTag("s");
        if (f) pushChild(strike(wrapByStyle(f.children, (_a = f.meta) == null ? void 0 : _a.style)));
      },
      strike: () => {
        var _a;
        const f = popToTag("strike");
        if (f) pushChild(strike(wrapByStyle(f.children, (_a = f.meta) == null ? void 0 : _a.style)));
      },
      code: () => {
        const f = popToTag("code");
        if (f) pushChild(inlineCode(getText(f.children)));
      },
      p: () => {
        var _a, _b;
        const f = popToTag("p");
        if (!f) return;
        const node = paragraph(f.children);
        if ((_a = f.meta) == null ? void 0 : _a.style) node.style = f.meta.style;
        if ((_b = f.meta) == null ? void 0 : _b.className) node.className = f.meta.className;
        pushChild(node);
      },
      div: () => {
        var _a;
        const f = popToTag("div");
        if (!f) return;
        const kids = wrapByStyle(f.children, (_a = f.meta) == null ? void 0 : _a.style);
        finalizeRoot(kids).forEach(pushChild);
      },
      blockquote: () => {
        var _a, _b, _c;
        const f = popToTag("blockquote");
        if (!f) return;
        const node = blockquote(ensureParagraphs(wrapByStyle(f.children, (_a = f.meta) == null ? void 0 : _a.style)));
        if ((_b = f.meta) == null ? void 0 : _b.style) node.style = mergeStyle(node.style, f.meta.style);
        if ((_c = f.meta) == null ? void 0 : _c.className) node.className = f.meta.className;
        pushChild(node);
      },
      li: () => {
        var _a, _b, _c;
        const f = popToTag("li");
        if (!f) return;
        const node = listItem(ensureParagraphs(wrapByStyle(f.children, (_a = f.meta) == null ? void 0 : _a.style)));
        if ((_b = f.meta) == null ? void 0 : _b.style) node.style = mergeStyle(node.style, f.meta.style);
        if ((_c = f.meta) == null ? void 0 : _c.className) node.className = f.meta.className;
        pushChild(node);
      },
      ul: () => {
        var _a, _b;
        const f = popToTag("ul");
        if (!f) return;
        const items = (f.children || []).map(
          (c) => c.type === "ListItem" ? c : listItem(ensureParagraphs([c]))
        );
        const node = list(false, items);
        if ((_a = f.meta) == null ? void 0 : _a.style) node.style = mergeStyle(node.style, f.meta.style);
        if ((_b = f.meta) == null ? void 0 : _b.className) node.className = f.meta.className;
        pushChild(node);
      },
      ol: () => {
        var _a, _b;
        const f = popToTag("ol");
        if (!f) return;
        const items = (f.children || []).map(
          (c) => c.type === "ListItem" ? c : listItem(ensureParagraphs([c]))
        );
        const node = list(true, items);
        if ((_a = f.meta) == null ? void 0 : _a.style) node.style = mergeStyle(node.style, f.meta.style);
        if ((_b = f.meta) == null ? void 0 : _b.className) node.className = f.meta.className;
        pushChild(node);
      },
      pre: () => {
        const f = popToTag("pre");
        if (f) pushChild(codeBlock(getText(f.children)));
      },
      h1: () => {
        var _a;
        const f = popToTag("h1");
        if (f) {
          const n = heading(getText(f.children).trim(), 1);
          if ((_a = f.meta) == null ? void 0 : _a.className) n.className = f.meta.className;
          pushChild(n);
        }
      },
      h2: () => {
        var _a;
        const f = popToTag("h2");
        if (f) {
          const n = heading(getText(f.children).trim(), 2);
          if ((_a = f.meta) == null ? void 0 : _a.className) n.className = f.meta.className;
          pushChild(n);
        }
      },
      h3: () => {
        var _a;
        const f = popToTag("h3");
        if (f) {
          const n = heading(getText(f.children).trim(), 3);
          if ((_a = f.meta) == null ? void 0 : _a.className) n.className = f.meta.className;
          pushChild(n);
        }
      },
      h4: () => {
        var _a;
        const f = popToTag("h4");
        if (f) {
          const n = heading(getText(f.children).trim(), 4);
          if ((_a = f.meta) == null ? void 0 : _a.className) n.className = f.meta.className;
          pushChild(n);
        }
      },
      h5: () => {
        var _a;
        const f = popToTag("h5");
        if (f) {
          const n = heading(getText(f.children).trim(), 5);
          if ((_a = f.meta) == null ? void 0 : _a.className) n.className = f.meta.className;
          pushChild(n);
        }
      },
      h6: () => {
        var _a;
        const f = popToTag("h6");
        if (f) {
          const n = heading(getText(f.children).trim(), 6);
          if ((_a = f.meta) == null ? void 0 : _a.className) n.className = f.meta.className;
          pushChild(n);
        }
      }
    };
    (CLOSE[tag] || (() => {
    }))();
  }
  const appendText = (raw) => {
    const s = decodeEntities(raw);
    if (!s) return;
    if (top().tag === "#root" && !/\S/.test(s)) return;
    pushChild(text(s));
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
      pushText("!");
      i += 1;
      continue;
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
          const titleVal = m && m[2] != null ? m[2] : null;
          const txt = s.slice(txtStart, txtEnd);
          out.push(link(hrefVal, parseInlines(txt), titleVal));
          i = urlEnd + 1;
          continue;
        }
      }
      pushText("[");
      i += 1;
      continue;
    }
    if (s[i] === "`") {
      const end = s.indexOf("`", i + 1);
      if (end !== -1) {
        out.push(inlineCode(s.slice(i + 1, end)));
        i = end + 1;
        continue;
      }
      pushText("`");
      i += 1;
      continue;
    }
    if (s.startsWith("**", i) || s.startsWith("__", i)) {
      const delim = s.slice(i, i + 2);
      const end = s.indexOf(delim, i + 2);
      if (end !== -1) {
        out.push(strong(parseInlines(s.slice(i + 2, end))));
        i = end + 2;
        continue;
      }
      pushText(s[i]);
      i += 1;
      continue;
    }
    if (s.startsWith("~~", i)) {
      const end = s.indexOf("~~", i + 2);
      if (end !== -1) {
        out.push(strike(parseInlines(s.slice(i + 2, end))));
        i = end + 2;
        continue;
      }
      pushText("~");
      i += 1;
      continue;
    }
    if (s[i] === "*" || s[i] === "_") {
      const delim = s[i];
      const end = s.indexOf(delim, i + 1);
      if (end !== -1) {
        out.push(emphasis(parseInlines(s.slice(i + 1, end))));
        i = end + 1;
        continue;
      }
      pushText(delim);
      i += 1;
      continue;
    }
    const nextRel = s.slice(i + 1).search(/(\\|!\[|\[|`|\*\*|__|\*|_|~~)/);
    if (nextRel === -1) {
      pushText(s.slice(i));
      break;
    } else {
      pushText(s.slice(i, i + 1 + nextRel));
      i += 1 + nextRel;
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
    if (s) out.push(text(s));
  };
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
    const HANDLERS = {
      b: (arg2, inner2) => strong(parseInline(inner2)),
      i: (arg2, inner2) => emphasis(parseInline(inner2)),
      u: (arg2, inner2) => underline(parseInline(inner2)),
      s: (arg2, inner2) => strike(parseInline(inner2)),
      img: (arg2, inner2) => image(arg2 || inner2.trim(), ""),
      url: (arg2, inner2) => {
        const href = arg2 || inner2.trim();
        const kids = arg2 ? parseInline(inner2) : [text(inner2)];
        return link(href, kids);
      },
      spoiler: (arg2, inner2) => spoiler(parseInline(inner2), arg2 || null),
      color: (arg2, inner2) => color((arg2 || "").trim(), parseInline(inner2)),
      size: (arg2, inner2) => size((arg2 || "").trim(), parseInline(inner2))
    };
    const handler = HANDLERS[name];
    if (!handler) {
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
    out.push(handler(arg, inner));
    i = match.end;
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
  const normalize = Boolean(opts.normalizeHtml);
  const preserveTags = Boolean(opts.preserveTags);
  const styleAttr = (style) => {
    if (!style) return "";
    const parts = [];
    const add = (k, v) => {
      if (!v) return;
      parts.push(`${k}:${escapeAttr(v)}`);
    };
    if (style["font-size"]) {
      const v = safe && typeof sanitizeFontSize === "function" ? sanitizeFontSize(style["font-size"]) : style["font-size"];
      if (v) add("font-size", v);
    }
    if (style.color) {
      const v = safe && typeof sanitizeColor === "function" ? sanitizeColor(style.color) : style.color;
      if (v) add("color", v);
    }
    return parts.length ? ` style="${parts.join(";")}"` : "";
  };
  const classAttr = (n) => n && n.className ? ` class="${escapeAttr(n.className)}"` : "";
  const h = {
    Document: (n, _c, r) => n.children.map(r).join("\n"),
    Paragraph: (n, _c, r) => `<p${classAttr(n)}${styleAttr(n.style)}>${n.children.map(r).join("")}</p>`,
    Text: (n) => escapeHtml(n.value ?? ""),
    Heading: (n) => {
      const d = n.depth ?? 1;
      return `<h${d}${classAttr(n)}>${escapeHtml(n.value ?? "")}</h${d}>`;
    },
    ThematicBreak: () => `<hr/>`,
    Strong: (n, _c, r) => {
      const tag = preserveTags && !normalize && n._tag === "b" ? "b" : "strong";
      return `<${tag}${classAttr(n)}>${n.children.map(r).join("")}</${tag}>`;
    },
    Emphasis: (n, _c, r) => {
      const tag = preserveTags && !normalize && n._tag === "i" ? "i" : "em";
      return `<${tag}${classAttr(n)}>${n.children.map(r).join("")}</${tag}>`;
    },
    Underline: (n, _c, r) => `<u${classAttr(n)}>${n.children.map(r).join("")}</u>`,
    Strike: (n, _c, r) => `<s${classAttr(n)}>${n.children.map(r).join("")}</s>`,
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
    Blockquote: (n, _c, r) => `<blockquote${classAttr(n)}${styleAttr(n.style)}>${n.children.map(r).join("")}</blockquote>`,
    Quote: (n, _c, r) => {
      const a = n.author ? ` data-author="${escapeAttr(n.author)}"` : "";
      return `<blockquote${a}${classAttr(n)}>${n.children.map(r).join("")}</blockquote>`;
    },
    List: (n, _c, r) => {
      const tag = n.ordered ? "ol" : "ul";
      return `<${tag}${classAttr(n)}${styleAttr(n.style)}>${n.children.map(r).join("")}</${tag}>`;
    },
    ListItem: (n, _c, r) => `<li${classAttr(n)}${styleAttr(n.style)}>${n.children.map(r).join("")}</li>`,
    Spoiler: (n, _c, r) => {
      const summary = `<summary>${escapeHtml(n.label ?? "\u0421\u043F\u043E\u0439\u043B\u0435\u0440")}</summary>`;
      return `<details>${summary}${n.children.map(r).join("")}</details>`;
    },
    Color: (n, _c, r) => {
      const inner = n.children.map(r).join("");
      const val = typeof sanitizeColor === "function" ? sanitizeColor(n.value) : null;
      if (!val) return inner;
      return `<span style="color:${escapeAttr(val)}">${inner}</span>`;
    },
    Size: (n, _c, r) => {
      const inner = n.children.map(r).join("");
      const css = typeof sanitizeFontSize === "function" ? sanitizeFontSize(n.value) : null;
      if (!css) return inner;
      return `<span style="font-size:${escapeAttr(css)}">${inner}</span>`;
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
    Color: (n, _c, r) => n.children.map(r).join(""),
    Size: (n, _c, r) => n.children.map(r).join(""),
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
  const wrapWithStyle = (inner, style) => {
    if (!style) return inner;
    let out = inner;
    if (style["font-size"]) {
      const size2 = typeof sanitizeFontSize === "function" ? sanitizeFontSize(style["font-size"]) : style["font-size"];
      if (size2) out = `[size=${size2}]${out}[/size]`;
    }
    if (style.color) {
      const color2 = typeof sanitizeColor === "function" ? sanitizeColor(style.color) : style.color;
      if (color2) out = `[color=${color2}]${out}[/color]`;
    }
    return out;
  };
  const h = {
    Document: (n, _c, r) => n.children.map(r).join("\n\n"),
    Paragraph: (n, _c, r) => {
      const inner = n.children.map(r).join("");
      return wrapWithStyle(inner, n.style || null);
    },
    Text: (n) => String(n.value ?? ""),
    Heading: (n) => String(n.value ?? ""),
    ThematicBreak: () => "---",
    Strong: (n, _c, r) => `[b]${n.children.map(r).join("")}[/b]`,
    Emphasis: (n, _c, r) => `[i]${n.children.map(r).join("")}[/i]`,
    Underline: (n, _c, r) => `[u]${n.children.map(r).join("")}[/u]`,
    Strike: (n, _c, r) => `[s]${n.children.map(r).join("")}[/s]`,
    InlineCode: (n) => `[code]${String(n.value ?? "")}[/code]`,
    CodeBlock: (n) => `[code]
${String(n.value ?? "")}
[/code]`,
    LineBreak: () => "\n",
    Link: (n, _c, r) => {
      const href = typeof sanitizeUrl === "function" ? sanitizeUrl(n.href) : n.href || "";
      const safeHref = href === "#" ? "" : href;
      const label = n.children.map(r).join("");
      return safeHref ? `[url=${safeHref}]${label}[/url]` : label;
    },
    Image: (n) => {
      const src = typeof sanitizeUrl === "function" ? sanitizeUrl(n.src) : n.src || "";
      if (src === "#") return "";
      return `[img]${src}[/img]`;
    },
    Blockquote: (n, _c, r) => `[quote]${n.children.map(r).join("\n\n")}[/quote]`,
    List: (n, _c, r) => {
      const open = n.ordered ? "[list=1]" : "[list]";
      const close = "[/list]";
      return `${open}${n.children.map(r).join("")}${close}`;
    },
    ListItem: (n, _c, r) => `[*]${n.children.map(r).join("")}`,
    Color: (n, _c, r) => `[color=${n.value}]${n.children.map(r).join("")}[/color]`,
    Size: (n, _c, r) => `[size=${n.value}]${n.children.map(r).join("")}[/size]`,
    __unknown: () => ""
  };
  return visit(ast, h, {});
}

// src/renderers/plaintext.js
function renderPlaintext(ast) {
  const h = {
    Document: (n, _c, r) => n.children.map(r).join("\n\n"),
    Paragraph: (n, _c, r) => n.children.map(r).join(""),
    Text: (n) => String(n.value ?? ""),
    Heading: (n) => String(n.value ?? ""),
    ThematicBreak: () => "",
    Strong: (n, _c, r) => n.children.map(r).join(""),
    Emphasis: (n, _c, r) => n.children.map(r).join(""),
    Underline: (n, _c, r) => n.children.map(r).join(""),
    Strike: (n, _c, r) => n.children.map(r).join(""),
    InlineCode: (n) => String(n.value ?? ""),
    CodeBlock: (n) => String(n.value ?? ""),
    LineBreak: () => "\n",
    Link: (n, _c, r) => n.children.map(r).join(""),
    Image: (n) => n.alt ? String(n.alt) : "",
    Blockquote: (n, _c, r) => n.children.map(r).join("\n"),
    Quote: (n, _c, r) => n.children.map(r).join(""),
    List: (n, _c, r) => n.children.map(r).join("\n"),
    ListItem: (n, _c, r) => n.children.map(r).join(""),
    Spoiler: (n, _c, r) => n.children.map(r).join(""),
    Color: (n, _c, r) => n.children.map(r).join(""),
    Size: (n, _c, r) => n.children.map(r).join(""),
    __unknown: () => ""
  };
  return visit(ast, h, {});
}

// src/index.js
var parseHTML2 = parseHTML;
var parseMarkdown2 = parseMarkdown;
var parseBBCode2 = parseBBCode;
var parsePlain = parsePlaintext;
var renderHTML2 = renderHTML;
var renderMarkdown2 = renderMarkdown;
var renderBBCode2 = renderBBCode;
var renderPlain = renderPlaintext;
var PARSERS = {
  html: parseHTML2,
  markdown: parseMarkdown2,
  md: parseMarkdown2,
  bbcode: parseBBCode2,
  plaintext: parsePlain,
  text: parsePlain
};
var RENDERERS = {
  html: renderHTML2,
  markdown: renderMarkdown2,
  md: renderMarkdown2,
  bbcode: renderBBCode2,
  plaintext: renderPlain,
  text: renderPlain
};
var GLOBAL_PLUGINS = [];
function builtinAutolink(ast) {
  const URL_RE = /(https?:\/\/[^\s<>"')\]]+)/gi;
  const splitTextToNodes = (value) => {
    const parts = [];
    let last = 0;
    value.replace(URL_RE, (m, _1, offset) => {
      if (offset > last) parts.push(text(value.slice(last, offset)));
      const safe = sanitizeUrl ? sanitizeUrl(m) : m;
      const href = safe === "#" ? "#" : String(safe);
      parts.push(link(href, [text(m)]));
      last = offset + m.length;
      return m;
    });
    if (last === 0) return null;
    if (last < value.length) parts.push(text(value.slice(last)));
    return parts;
  };
  const walk = (node, inLinkOrCode = false) => {
    if (!node) return node;
    switch (node.type) {
      case "InlineCode":
      case "CodeBlock":
        return node;
      case "Link":
        return { ...node, children: (node.children || []).map((c) => walk(c, true)) };
      default:
        if (Array.isArray(node)) return node.map((n) => walk(n, inLinkOrCode));
        if (node.type === "Text" && !inLinkOrCode) {
          const split = splitTextToNodes(node.value || "");
          if (split) return split;
          return node;
        }
        if (node.children && node.children.length) {
          const mapped = [];
          for (const ch of node.children) {
            const res = walk(ch, inLinkOrCode);
            if (Array.isArray(res)) mapped.push(...res);
            else mapped.push(res);
          }
          return { ...node, children: mapped };
        }
        return node;
    }
  };
  return walk(ast, false);
}
function builtinEmoji(ast) {
  const MAP = { ":smile:": "\u{1F642}", ":heart:": "\u2764\uFE0F" };
  const RE = /:(smile|heart):/g;
  const transformText = (val) => val.replace(RE, (_, name) => MAP[`:${name}:`] || _);
  const walk = (node, inCode = false) => {
    if (!node) return node;
    switch (node.type) {
      case "InlineCode":
      case "CodeBlock":
        return node;
      default:
        if (Array.isArray(node)) return node.map((n) => walk(n, inCode));
        if (node.type === "Text" && !inCode) {
          const v = String(node.value || "");
          const nv = transformText(v);
          if (nv !== v) return { ...node, value: nv };
          return node;
        }
        if (node.children && node.children.length) {
          return { ...node, children: node.children.map((ch) => walk(ch, inCode)) };
        }
        return node;
    }
  };
  return walk(ast, false);
}
function preparePlugin(raw, ctx) {
  if (!raw) return null;
  if (typeof raw === "object" && typeof raw.run === "function") {
    return (ast) => raw.run(ast, ctx) || ast;
  }
  if (typeof raw === "function") {
    try {
      const maybe = raw(ctx);
      if (typeof maybe === "function") return (ast) => maybe(ast, ctx) || ast;
      if (maybe && typeof maybe.run === "function") return (ast) => maybe.run(ast, ctx) || ast;
    } catch {
    }
    try {
      const maybe = raw();
      if (typeof maybe === "function") return (ast) => maybe(ast, ctx) || ast;
      if (maybe && typeof maybe.run === "function") return (ast) => maybe.run(ast, ctx) || ast;
    } catch {
    }
    return (ast) => raw(ast, ctx) || ast;
  }
  return null;
}
function getPluginName(p) {
  if (!p) return "";
  if (typeof p === "function" && p.name) return p.name.toLowerCase();
  if (typeof p === "object" && typeof p.name === "string") return p.name.toLowerCase();
  return "";
}
function use(plugin) {
  if (!plugin) return;
  GLOBAL_PLUGINS.push(plugin);
}
function runPlugins(ast, plugins = [], opts = {}) {
  if (!plugins || !plugins.length) return ast;
  const ctx = { ...opts, visit, utils: utils_exports, nodes: nodes_exports };
  let out = ast;
  const prepared = [];
  const names = [];
  for (const raw of plugins) {
    names.push(getPluginName(raw));
    const fn = preparePlugin(raw, ctx);
    if (fn) prepared.push(fn);
  }
  for (const fn of prepared) out = fn(out);
  const hasAutolink = names.some((n) => n.includes("autolink"));
  const hasEmoji = names.some((n) => n.includes("emoji"));
  if (hasAutolink) out = builtinAutolink(out);
  if (hasEmoji) out = builtinEmoji(out);
  return out;
}
function parse(input, opts = {}) {
  const from = (opts.from || "plaintext").toLowerCase();
  const parseFn = PARSERS[from] || PARSERS.text;
  if (typeof parseFn !== "function") {
    throw new TypeError(`Parser for "${from}" is not a function`);
  }
  return parseFn(String(input ?? ""), opts);
}
function render(ast, opts = {}) {
  const to = (opts.to || "plaintext").toLowerCase();
  const renderFn = RENDERERS[to] || RENDERERS.text;
  if (typeof renderFn !== "function") {
    throw new TypeError(`Renderer for "${to}" is not a function`);
  }
  return renderFn(ast, opts);
}
function convert(input, opts = {}) {
  const from = (opts.from || "plaintext").toLowerCase();
  const to = (opts.to || "plaintext").toLowerCase();
  const safeEffective = opts.safe !== void 0 ? Boolean(opts.safe) : true;
  const plugins = [...GLOBAL_PLUGINS, ...opts.plugins || []];
  const forcePassthrough = Boolean(opts.htmlPassthrough);
  if (from === "html" && to === "html" && (forcePassthrough || !safeEffective && !opts.normalizeHtml)) {
    return String(input ?? "");
  }
  const ast = parse(input, opts);
  const ast2 = runPlugins(ast, plugins, opts);
  const renderOpts = from === "html" && to === "html" && !opts.normalizeHtml ? { ...opts, preserveTags: opts.preserveTags ?? true } : opts;
  return render(ast2, renderOpts);
}
var index_default = { convert, parse, render, use };
export {
  convert,
  index_default as default,
  parse,
  render,
  use
};
