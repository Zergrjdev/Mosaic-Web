/* Example Mosaic plugin. Copy this folder to start your own. See PLUGINS.md. */
Mosaic.plugin({
  id: 'example-asset-report',
  activate(api) {
    // 1. A toolbar button (design pages only)
    api.toolbar.add({
      label: 'Asset report', title: 'Count the items that will be exported', where: 'design',
      run() {
        const items = api.project.items().filter(i => !i.hd && !i.nx);
        const byType = {};
        items.forEach(i => byType[i.ty] = (byType[i.ty] || 0) + 1);
        api.toast(items.length + ' exportable items: ' + Object.entries(byType).map(([k, v]) => v + ' ' + k).join(', '));
      }
    });

    // 2. A setting, stored per plugin
    api.settings.add({
      title: 'Asset report',
      render(el) {
        const on = api.storage.get('pivot', false);
        el.innerHTML = '<label class="xck"><input type="checkbox"' + (on ? ' checked' : '') + '><span>Include pivot columns in assets.csv</span></label>';
        el.querySelector('input').onchange = e => api.storage.set('pivot', e.target.checked);
      }
    });

    // 3. An extra export format. It receives the finished layout and files and may add to them.
    api.exports.addTarget({
      id: 'csv',
      label: 'UI assets ZIP + assets.csv (example plugin)',
      async build(ctx) {
        const pivot = api.storage.get('pivot', false);
        const rows = [['name', 'x', 'y', 'width', 'height'].concat(pivot ? ['pivot_x', 'pivot_y'] : []).join(',')];
        ctx.layout.assets.forEach(a => rows.push([a.name, a.x, a.y, a.w, a.h].concat(pivot ? [a.pivot.x, a.pivot.y] : []).join(',')));
        ctx.files.push({ name: 'assets.csv', data: new TextEncoder().encode(rows.join('\n') + '\n') });
      }
    });
  }
});
