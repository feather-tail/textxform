export const doc = (children = []) => ({ type: 'Document', children });
export const paragraph = (children = []) => ({ type: 'Paragraph', children });
export const text = (value = '') => ({ type: 'Text', value });
