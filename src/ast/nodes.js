export const doc = (children = []) => ({ type: 'Document', children });
export const paragraph = (children = []) => ({ type: 'Paragraph', children });
export const text = (value = '') => ({ type: 'Text', value });

export const strong = (children = []) => ({ type: 'Strong', children });
export const emphasis = (children = []) => ({ type: 'Emphasis', children });
export const underline = (children = []) => ({ type: 'Underline', children });
export const strike = (children = []) => ({ type: 'Strike', children });

export const link = (href = '', children = [], title = null) => ({
  type: 'Link',
  href,
  title,
  children,
});
export const image = (src = '', alt = '') => ({ type: 'Image', src, alt });

export const inlineCode = (value = '') => ({ type: 'InlineCode', value });
export const codeBlock = (value = '', lang = null) => ({ type: 'CodeBlock', value, lang });

export const blockquote = (children = []) => ({ type: 'Blockquote', children });
export const quote = (children = [], author = null) => ({ type: 'Quote', author, children });

export const list = (ordered = false, children = []) => ({ type: 'List', ordered, children });
export const listItem = (children = []) => ({ type: 'ListItem', children });

export const lineBreak = () => ({ type: 'LineBreak' });

export const spoiler = (children = [], label = null) => ({ type: 'Spoiler', label, children });

export const heading = (value = '', depth = 1) => ({
  type: 'Heading',
  value,
  depth: Math.min(6, Math.max(1, depth)),
});

export const thematicBreak = () => ({ type: 'ThematicBreak' });

export const color = (value, children = []) => ({ type: 'Color', value, children });
export const size = (value, children = []) => ({ type: 'Size', value, children });
