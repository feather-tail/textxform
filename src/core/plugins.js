const _plugins = [];

export function use(plugin) {
  if (!plugin || typeof plugin !== 'object') return;
  if (_plugins.includes(plugin)) return;
  _plugins.push(plugin);
}

export function runHook(name, value, ctx) {
  let v = value;
  for (const p of _plugins) {
    const fn = p && p[name];
    if (typeof fn === 'function') {
      const res = fn(v, ctx);
      if (typeof res !== 'undefined') v = res;
    }
  }
  return v;
}

export function _resetPlugins() {
  _plugins.length = 0;
}
