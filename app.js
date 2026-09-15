(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const definitions = [ ['onlyA', 'Only in A', 'A − B', 'Items exclusive to your first list.'], ['both', 'In both', 'A ∩ B', 'The items your lists have in common.'], ['onlyB', 'Only in B', 'B − A', 'Items exclusive to your second list.'], ['union', 'All unique', 'A ∪ B', 'Every distinct item, together.'] ];
  let timer, results = {}, revision = { a: 0, b: 0 };
  function toast(message) { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(timer); timer = setTimeout(() => $('toast').hidden = true, 3000); }
  function options() { return { splitA: $('split-a').value, splitB: $('split-b').value, caseSensitive: $('case-sensitive').checked, trim: $('trim').checked, spaces: $('spaces').checked, zeros: $('zeros').checked, sort: $('sort').value, outputCase: $('output-case').value }; }
  function update() {
    const settings = options(), comparison = ListDiff.compare($('list-a').value, $('list-b').value, settings);
    for (const [side, stats] of [['a', comparison.left], ['b', comparison.right]]) $('count-' + side).textContent = `${stats.count} items · ${stats.duplicates} duplicates`;
    for (const [key] of definitions) {
      results[key] = ListDiff.arrange(comparison[key], settings);
      $('output-' + key).value = results[key].length ? ListDiff.format(results[key], $('format').value) : '';
      $('badge-' + key).textContent = results[key].length;
      document.querySelectorAll(`[data-result="${key}"]`).forEach(control => control.disabled = !results[key].length);
    }
    $('summary').textContent = comparison.union.length ? `${comparison.onlyA.length + comparison.onlyB.length} different · ${comparison.both.length} shared · ${comparison.union.length} unique` : 'Add items above to get started.';
  }
  async function copy(value) {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(value);
      else {
        const previous = document.activeElement, area = document.createElement('textarea');
        area.value = value; area.style.cssText = 'position:fixed;opacity:0'; document.body.append(area); area.select();
        let success;
        try { success = document.execCommand('copy'); } finally { area.remove(); previous?.focus(); }
        if (!success) throw new Error();
      }
      toast('Copied to clipboard');
    } catch { toast('Could not copy. Select the result and copy it manually.'); }
  }
  for (const [key, title, symbol, description] of definitions) {
    const card = document.createElement('section'); card.className = 'card result-card'; card.setAttribute('aria-labelledby', 'title-' + key);
    card.innerHTML = `<div class="card-heading"><span class="feature-icon set-symbol">${symbol}</span><div><h2 id="title-${key}">${title}</h2><p>${description}</p></div><span class="count-badge" id="badge-${key}">0</span></div><textarea class="result-output" id="output-${key}" readonly aria-label="${title} results" placeholder="${key === 'union' ? 'Your combined list will appear here.' : 'No matching items to show.'}" spellcheck="false"></textarea><div class="result-toolbar"><button class="text-button" data-result="${key}" data-action="copy">Copy</button><button class="text-button" data-result="${key}" data-action="download">Download</button></div>`;
    card.querySelector('[data-action="copy"]').addEventListener('click', () => copy($('output-' + key).value));
    card.querySelector('[data-action="download"]').addEventListener('click', () => {
      const type = $('format').value, extension = { json: 'json', csv: 'csv', html: 'html', markdown: 'md' }[type] || 'txt';
      const url = URL.createObjectURL(new Blob([$('output-' + key).value], { type: 'text/plain;charset=utf-8' }));
      const link = document.createElement('a'); link.href = url; link.download = `list-diff-${key}.${extension}`; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    $('results').append(card);
  }
  async function importFile(side, file) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast('Choose a text file smaller than 5 MB.'); return; }
    if (/\.(xlsx?|docx?|pdf|zip|png|jpe?g|gif|exe)$/i.test(file.name)) { toast('Please export this file as plain text or CSV first.'); return; }
    const current = ++revision[side];
    try {
      const text = await file.text();
      if (current !== revision[side]) return;
      if (text.includes('\0')) { toast('This file is not plain text. Try a UTF-8 text file.'); return; }
      $('list-' + side).value = text.replace(/^\uFEFF/, ''); update(); toast(`Imported ${file.name}`);
    } catch { toast('Could not read that file. Please try another text file.'); }
  }
  for (const side of ['a', 'b']) {
    const area = $('list-' + side);
    area.addEventListener('input', () => { revision[side]++; update(); });
    $('split-' + side).addEventListener('change', update);
    document.querySelector(`[data-upload="${side}"]`).addEventListener('click', () => $('file-' + side).click());
    $('file-' + side).addEventListener('change', event => { importFile(side, event.target.files[0]); event.target.value = ''; });
    area.addEventListener('dragover', event => { event.preventDefault(); area.classList.add('drag-over'); });
    area.addEventListener('dragleave', () => area.classList.remove('drag-over'));
    area.addEventListener('drop', event => { event.preventDefault(); area.classList.remove('drag-over'); importFile(side, event.dataTransfer.files[0]); });
  }
  for (const id of ['case-sensitive', 'trim', 'spaces', 'zeros', 'sort', 'output-case', 'format']) $(id).addEventListener('change', update);
  $('swap-lists').addEventListener('click', () => {
    revision.a++; revision.b++;
    for (const prefix of ['list-', 'split-']) { const value = $(prefix + 'a').value; $(prefix + 'a').value = $(prefix + 'b').value; $(prefix + 'b').value = value; }
    update();
  });
  $('clear-all').addEventListener('click', () => { revision.a++; revision.b++; $('list-a').value = ''; $('list-b').value = ''; update(); $('list-a').focus(); });
  $('example').addEventListener('click', () => {
    revision.a++; revision.b++;
    $('list-a').value = 'Apple\nBanana\nCherry\nMango\nPeach\nBanana'; $('list-b').value = 'Banana\nCherry\nKiwi\nPeach\nPear';
    $('split-a').value = $('split-b').value = 'lines'; update();
  });
  update();
})();
