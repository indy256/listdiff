(function (root) {
  'use strict';
  function compare(a, b, options = {}) {
    const separators = { lines: /\r\n|\n|\r/, comma: ',', semicolon: ';', tab: '\t' };
    function parse(text, split) {
      const values = new Map();
      let count = 0;
      for (const raw of text.split(separators[split] || separators.lines)) {
        if (!raw.trim()) continue;
        count++;
        let key = options.trim ? raw.trim() : raw;
        if (options.spaces) key = key.replace(/\s+/g, ' ');
        if (options.zeros) key = key.replace(/^([+-]?)0+(?=\d)/, '$1');
        if (!options.caseSensitive) key = key.toLowerCase();
        if (!values.has(key)) values.set(key, raw);
      }
      return { values, count, duplicates: count - values.size };
    }
    const left = parse(a, options.splitA), right = parse(b, options.splitB);
    const onlyA = [], both = [], onlyB = [];
    for (const [key, value] of left.values) (right.values.has(key) ? both : onlyA).push(value);
    for (const [key, value] of right.values) if (!left.values.has(key)) onlyB.push(value);
    return { onlyA, both, onlyB, union: [...left.values.values(), ...onlyB], left, right };
  }
  function arrange(values, options) {
    const result = values.map(value => options.outputCase === 'lower' ? value.toLowerCase() : options.outputCase === 'upper' ? value.toUpperCase() : value);
    if (options.sort === 'az' || options.sort === 'za') result.sort((a, b) => a.localeCompare(b) * (options.sort === 'za' ? -1 : 1));
    if (options.sort === 'numeric' || options.sort === 'numeric-desc') result.sort((a, b) => {
      const x = Number(a), y = Number(b), validX = Number.isFinite(x), validY = Number.isFinite(y);
      if (validX !== validY) return validX ? -1 : 1;
      return validX ? (x - y) * (options.sort === 'numeric-desc' ? -1 : 1) : a.localeCompare(b);
    });
    return result;
  }
  function format(values, type) {
    if (type === 'json') return JSON.stringify(values, null, 2);
    if (type === 'csv') return values.map(v => '"' + v.replace(/"/g, '""') + '"').join(',');
    if (type === 'numbered') return values.map((v, i) => `${i + 1}. ${v}`).join('\n');
    if (type === 'markdown') return values.map(v => `- ${v}`).join('\n');
    if (type === 'html') return '<ul>\n' + values.map(v => '  <li>' + v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') + '</li>').join('\n') + '\n</ul>';
    return values.join('\n');
  }
  root.ListDiff = { compare, arrange, format };
})(globalThis);
