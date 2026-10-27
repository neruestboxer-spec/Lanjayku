/* =====================================================================
   KASIR / POS — katalog menu, keranjang, diskon, pembayaran.
   Harga & HPP final dihitung ulang di server (tidak percaya klien).
   ===================================================================== */
Pages.kasir = {
  title: 'Kasir',
  st: null,

  load() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem('ljy_cart') || '{}'); } catch (e) { saved = {}; }
    return { cart: saved.cart || [], tipe: saved.tipe || 'Dine-In', diskon: saved.diskon || '', metode: saved.metode || 'Tunai', diterima: saved.diterima || '', q: '', cat: 'Semua' };
  },
  persist() { const s = this.st; try { localStorage.setItem('ljy_cart', JSON.stringify({ cart: s.cart, tipe: s.tipe, diskon: s.diskon, metode: s.metode, diterima: s.diterima })); } catch (e) { } },

  catStyle(k) {
    const s = String(k || '').toLowerCase();
    if (/non|teh|tea|minum|jus|juice|soda|milk/.test(s)) return { icon: 'glass', cls: 'k2' };
    if (/dessert|sweet|kue|cake|manis/.test(s)) return { icon: 'cake', cls: 'k4' };
    if (/makan|food|pastry|snack|roti|bakery|camilan/.test(s)) return { icon: 'food', cls: 'k3' };
    return { icon: 'coffee', cls: '' };
  },
  allowMinus() { return String(App.settings.izinkan_stok_minus) !== 'false'; },
  prod(id) { return App.produk.find(p => p.id === id); },

  totals() {
    const s = this.st;
    let sub = 0;
    const items = s.cart.map(c => { const p = this.prod(c.id); if (!p) return null; sub += p.harga_jual * c.qty; return { ...c, p }; }).filter(Boolean);
    const d = App.diskon.find(x => x.id === s.diskon);
    let disc = 0;
    if (d) disc = d.tipe === 'persen' ? Math.round(sub * Math.min(100, d.nilai) / 100) : Math.min(Math.round(d.nilai), sub);
    return { items, sub, disc, d, total: sub - disc, count: items.reduce((a, b) => a + b.qty, 0) };
  },

  render(el) {
    this.st = this.load();
    this.st.cart = this.st.cart.filter(c => this.prod(c.id));
    if (this.st.diskon && !App.diskon.find(d => d.id === this.st.diskon)) this.st.diskon = '';
    el.innerHTML = `
      <header class="page-head" style="margin-bottom:16px;padding-bottom:14px">
        <div class="row" style="flex-wrap:nowrap;gap:12px">
          <span class="brand-logo" style="background:var(--alt);color:var(--ink);width:46px;height:46px">${UI.icon('register', 'ic-lg')}</span>
          <div><div class="row" style="gap:8px"><h1 class="page-title" style="font-size:26px">KASIR &amp; PENJUALAN</h1>${UI.badge('ONLINE WITA', 'green-t')}</div>
          <div class="muted" style="font-size:13px">Terminal POS · ${UI.h(App.settings.nama_cafe || 'Lanjayku')}</div></div>
        </div>
        <div class="page-actions">
          <button class="btn btn-sm" id="ks-sync" title="Muat ulang menu, diskon & stok">${UI.icon('sync', 'ic-sm')} Sinkron Menu</button>
          <button class="btn btn-sm btn-secondary" id="ks-hist">${UI.icon('history', 'ic-sm')} Riwayat Hari Ini</button>
        </div>
      </header>
      <div class="pos">
        <div>
          <div class="pos-tools">
            <label class="search"><span class="sr-only">Cari menu</span>${UI.icon('search')}<input class="input" id="ks-q" type="search" placeholder="Cari menu kopi, minuman, atau snack… (tekan /)" autocomplete="off"></label>
          </div>
          <div class="pos-cats" id="ks-cats" role="tablist"></div>
          <div class="menu-grid" id="ks-grid"></div>
          <div class="note" style="margin-top:18px">${UI.icon('info')}<div>Katalog terhubung ke resep & stok bahan baku. Menyimpan transaksi otomatis memotong stok bahan dan mencatat HPP ke laporan keuangan.</div></div>
        </div>
        <aside class="win red-bar cart" id="ks-cart" style="overflow-y:auto" aria-label="Pesanan saat ini"></aside>
      </div>
      <button class="btn btn-primary btn-lg cart-mobile-bar" id="ks-mbar"></button>`;

    UI.$('#ks-q').addEventListener('input', UI.debounce(e => { this.st.q = e.target.value.trim().toLowerCase(); this.renderGrid(); }, 120));
    UI.$('#ks-sync').onclick = e => UI.busy(e.currentTarget, async () => { await App.refreshCatalog(); this.renderAll(); UI.toast('Menu, diskon & stok diperbarui.'); });
    UI.$('#ks-hist').onclick = () => this.history();
    UI.$('#ks-mbar').onclick = () => UI.$('#ks-cart').classList.add('open');

    const onKey = e => {
      if (e.key === 'F9') { e.preventDefault(); this.save(); }
      else if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !UI.$('.modal-wrap')) { e.preventDefault(); UI.$('#ks-q').focus(); }
    };
    document.addEventListener('keydown', onKey);
    App.onLeave(() => document.removeEventListener('keydown', onKey));
    const clk = setInterval(() => { const c = UI.$('#ks-clock'); if (c) c.textContent = UI.clockText().time + ' WITA'; }, 1000);
    App.onLeave(() => clearInterval(clk));
    this.renderAll();
  },

  renderAll() { this.renderCats(); this.renderGrid(); this.renderCart(); },

  renderCats() {
    const cats = {};
    App.produk.forEach(p => { cats[p.kategori] = (cats[p.kategori] || 0) + 1; });
    const names = ['Semua', ...Object.keys(cats).sort()];
    if (!names.includes(this.st.cat)) this.st.cat = 'Semua';
    UI.$('#ks-cats').innerHTML = names.map(n => {
      const cs = this.catStyle(n);
      return `<button class="cat-btn ${n === this.st.cat ? 'on' : ''}" data-cat="${UI.h(n)}" role="tab" aria-selected="${n === this.st.cat}">${UI.icon(n === 'Semua' ? 'grid' : cs.icon, 'ic-sm')} ${UI.h(n)} (${n === 'Semua' ? App.produk.length : cats[n]})</button>`;
    }).join('');
    UI.$$('#ks-cats [data-cat]').forEach(b => b.onclick = () => { this.st.cat = b.dataset.cat; this.renderCats(); this.renderGrid(); });
  },

  renderGrid() {
    const s = this.st, grid = UI.$('#ks-grid');
    const list = App.produk.filter(p => (s.cat === 'Semua' || p.kategori === s.cat) && (!s.q || (p.nama + ' ' + p.kategori).toLowerCase().includes(s.q)));
    if (!list.length) { grid.innerHTML = `<div style="grid-column:1/-1">${UI.empty(App.produk.length ? 'Menu tidak ditemukan' : 'Belum ada menu aktif', App.produk.length ? 'Coba kata kunci lain.' : (App.isAdmin() ? 'Tambahkan di menu Produk & Resep.' : 'Hubungi admin.'), 'search')}</div>`; return; }
    grid.innerHTML = list.map(p => {
      const cs = this.catStyle(p.kategori);
      const inCart = (s.cart.find(c => c.id === p.id) || {}).qty || 0;
      const por = p.porsi_tersedia;
      const habis = por !== null && por <= 0;
      const off = habis && !this.allowMinus();
      let stock;
      if (por === null) stock = `<div class="mc-stock">${UI.icon('info', 'ic-sm')} Tanpa resep</div>`;
      else if (habis) stock = `<div class="mc-stock out">${UI.icon('alert', 'ic-sm')} Stok bahan habis</div>`;
      else if (por <= 5) stock = `<div class="mc-stock warn"><span class="dot amber"></span> Sisa ±${por} porsi</div>`;
      else stock = `<div class="mc-stock"><span class="dot"></span> Resep terhubung · stok aman</div>`;
      return `<button class="menu-card ${off ? 'off' : ''}" data-add="${p.id}" ${off ? 'disabled aria-disabled="true"' : ''} aria-label="Tambah ${UI.h(p.nama)}">
        ${inCart ? `<span class="qty-pin">${inCart}</span>` : ''}
        <div class="mc-top"><span class="mc-ic ${cs.cls}">${UI.icon(cs.icon, 'ic-lg')}</span>
          <div style="min-width:0">${p.label ? `<span class="mc-label">${UI.h(p.label)}</span>` : ''}<div class="mc-name">${UI.h(p.nama)}</div>${stock}</div></div>
        <div class="mc-foot"><div class="mc-price"><small>HARGA</small>${UI.rp(p.harga_jual)}</div><span class="mc-add">${off ? 'Habis' : UI.icon('plus', 'ic-sm') + '<span class="t"> Tambah</span>'}</span></div>
      </button>`;
    }).join('');
    UI.$$('#ks-grid [data-add]').forEach(b => b.onclick = () => this.add(b.dataset.add));
  },

  add(id, delta = 1) {
    const s = this.st, p = this.prod(id);
    if (!p) return;
    let c = s.cart.find(x => x.id === id);
    const next = (c ? c.qty : 0) + delta;
    if (delta > 0 && p.porsi_tersedia !== null && next > p.porsi_tersedia) {
      if (!this.allowMinus()) return UI.toast(`Stok bahan ${p.nama} hanya cukup untuk ${p.porsi_tersedia} porsi.`, 'error');
      if (next === p.porsi_tersedia + 1) UI.toast(`Stok bahan ${p.nama} tidak cukup (±${Math.max(0, p.porsi_tersedia)} porsi). Transaksi tetap bisa disimpan & stok akan minus.`, 'warn');
    }
    if (next <= 0) s.cart = s.cart.filter(x => x.id !== id);
    else if (c) c.qty = Math.min(999, next);
    else s.cart.push({ id, qty: 1 });
    this.persist(); this.renderGrid(); this.renderCart();
  },

  renderCart() {
    const s = this.st, t = this.totals(), box = UI.$('#ks-cart');
    if (!box) return;
    const quick = [...new Set([t.total, Math.ceil(t.total / 5000) * 5000, Math.ceil(t.total / 10000) * 10000, Math.ceil(t.total / 50000) * 50000, Math.ceil(t.total / 100000) * 100000])].filter(v => v > 0).slice(0, 6);
    const dit = UI.parseNum(s.diterima);
    const kembali = dit - t.total;
    box.innerHTML = `
      <div class="win-bar" style="position:sticky;top:0;z-index:2"><div class="win-title">${UI.icon('receipt')} Pesanan Saat Ini</div>
        <div class="win-ctrls"><button class="win-ctrl x only-mobile" id="ks-close" aria-label="Tutup pesanan">×</button></div></div>
      <div class="cart-meta"><span><span class="dot live"></span> Kasir: <b>${UI.h(App.user.nama)}</b></span><span id="ks-clock">${UI.clockText().time} WITA</span>
        <span class="seg dark" role="group" aria-label="Tipe pesanan">${['Dine-In', 'Takeaway'].map(x => `<button data-tipe="${x}" class="${s.tipe === x ? 'on' : ''}">${x}</button>`).join('')}</span></div>
      <div class="win-body">
        ${t.items.length ? t.items.map(it => `<div class="cart-item">
          <div class="ci-top"><div><b>${UI.h(it.p.nama)}</b><div class="ci-unit">@ ${UI.rp(it.p.harga_jual)} / porsi</div></div><div class="ci-price">${UI.rp(it.p.harga_jual * it.qty)}</div></div>
          <div class="ci-row"><div class="stepper"><button data-dec="${it.id}" aria-label="Kurangi">−</button><span>${it.qty}</span><button data-inc="${it.id}" aria-label="Tambah">+</button></div>
            <button class="btn btn-ghost btn-sm" data-del="${it.id}" aria-label="Hapus ${UI.h(it.p.nama)}" style="color:var(--red)">${UI.icon('trash')}</button></div>
          ${it.p.resep && it.p.resep.length ? `<div class="ci-recipe">${UI.icon('box', 'ic-sm')} Potong stok: ${it.p.resep.map(r => `${UI.h(r.nama)} ${UI.num(r.jumlah * it.qty)}${UI.h(r.satuan)}`).join(', ')}</div>` : ''}
        </div>`).join('') : UI.empty('Pesanan masih kosong', 'Pilih menu di katalog untuk menambahkan.', 'cart')}
        <div class="field" style="margin-top:6px"><label for="ks-disc">${UI.icon('tag', 'ic-sm')} Kode Diskon &amp; Promo ${t.d ? `<span class="badge b-green-t">-${t.d.tipe === 'persen' ? t.d.nilai + '%' : UI.rp(t.d.nilai)}</span>` : ''}</label>
          <select class="select" id="ks-disc">${UI.options(App.diskon, s.diskon, 'id', d => `${d.nama} (${d.tipe === 'persen' ? d.nilai + '%' : UI.rp(d.nilai)})`, App.diskon.length ? '— Tanpa diskon —' : '— Tidak ada promo aktif —')}</select></div>
      </div>
      <div class="cart-sum">
        <div class="r"><span>Subtotal (${t.count} item)</span><b>${UI.rp(t.sub)}</b></div>
        ${t.disc ? `<div class="r green"><span>${UI.icon('checkc', 'ic-sm')} Diskon ${UI.h(t.d.nama)}</span><b>-${UI.rp(t.disc)}</b></div>` : ''}
        <div class="cart-total"><span style="font:700 14px var(--f-display)">TOTAL AKHIR</span><span class="v">${UI.rp(t.total)}</span></div>
      </div>
      <div class="cart-pay">
        <div class="lbl">Metode Pembayaran</div>
        <div class="seg dark" style="width:100%;display:grid;grid-template-columns:repeat(3,1fr)" role="group">${['Tunai', 'QRIS', 'Transfer'].map(m => `<button data-met="${m}" class="${s.metode === m ? 'on' : ''}">${m}</button>`).join('')}</div>
        ${s.metode === 'Tunai' ? `<div class="lbl">Pilihan uang cepat</div>
          <div class="quick-cash">${quick.map((v, i) => `<button class="btn btn-sm" data-cash="${v}">${i === 0 ? 'Uang Pas' : UI.rp(v)}</button>`).join('')}</div>
          <div class="form-grid" style="gap:10px"><div class="field"><label for="ks-dit">Diterima (Rp)</label><input class="input mono right" id="ks-dit" inputmode="numeric" value="${s.diterima ? UI.num(dit, 0) : ''}" placeholder="0"></div>
          <div class="field"><label>Kembalian (Rp)</label><div class="input mono right" id="ks-kembali" style="background:${kembali >= 0 && dit ? 'var(--green-t)' : 'var(--bg-2)'};display:flex;align-items:center;justify-content:flex-end;font-weight:700">${dit ? (kembali >= 0 ? UI.num(kembali, 0) : 'Kurang ' + UI.num(-kembali, 0)) : '0'}</div></div></div>`
        : `<div class="note blue">${UI.icon('info')}<div>Pastikan pembayaran ${s.metode} sudah diterima sebelum menyimpan. Aplikasi hanya mencatat (tanpa integrasi pembayaran).</div></div>`}
        <button class="btn btn-primary btn-lg btn-block" id="ks-save" ${t.items.length ? '' : 'disabled'}>${UI.icon('checkc')} Simpan &amp; Selesaikan <span class="kbd" style="color:var(--ink)">F9</span></button>
        <button class="btn btn-block" id="ks-clear" ${t.items.length ? '' : 'disabled'}>${UI.icon('trash')} Kosongkan Pesanan</button>
      </div>`;

    const mbar = UI.$('#ks-mbar');
    if (mbar) { mbar.innerHTML = `<span>${UI.icon('cart')} Pesanan (${t.count})</span><span class="mono">${UI.rp(t.total)} →</span>`; mbar.style.display = t.count ? '' : 'none'; }
    const close = UI.$('#ks-close'); if (close) close.onclick = () => box.classList.remove('open');
    UI.$$('[data-tipe]', box).forEach(b => b.onclick = () => { s.tipe = b.dataset.tipe; this.persist(); this.renderCart(); });
    UI.$$('[data-inc]', box).forEach(b => b.onclick = () => this.add(b.dataset.inc, 1));
    UI.$$('[data-dec]', box).forEach(b => b.onclick = () => this.add(b.dataset.dec, -1));
    UI.$$('[data-del]', box).forEach(b => b.onclick = () => { s.cart = s.cart.filter(x => x.id !== b.dataset.del); this.persist(); this.renderGrid(); this.renderCart(); });
    UI.$('#ks-disc').onchange = e => { s.diskon = e.target.value; this.persist(); this.renderCart(); };
    UI.$$('[data-met]', box).forEach(b => b.onclick = () => { s.metode = b.dataset.met; this.persist(); this.renderCart(); });
    UI.$$('[data-cash]', box).forEach(b => b.onclick = () => { s.diterima = b.dataset.cash; this.persist(); this.renderCart(); });
    const dIn = UI.$('#ks-dit');
    if (dIn) dIn.addEventListener('input', () => {
      const v = UI.parseNum(dIn.value); s.diterima = v ? String(v) : ''; this.persist();
      const k = UI.$('#ks-kembali'), kb = v - this.totals().total;
      k.textContent = v ? (kb >= 0 ? UI.num(kb, 0) : 'Kurang ' + UI.num(-kb, 0)) : '0';
      k.style.background = v && kb >= 0 ? 'var(--green-t)' : 'var(--bg-2)';
    });
    if (dIn) dIn.addEventListener('blur', () => { const v = UI.parseNum(dIn.value); dIn.value = v ? UI.num(v, 0) : ''; });
    UI.$('#ks-save').onclick = () => this.save();
    UI.$('#ks-clear').onclick = async () => { if (await UI.confirm('Kosongkan semua item pesanan?', { okText: 'Kosongkan' })) this.reset(); };
  },

  reset() { Object.assign(this.st, { cart: [], diskon: '', diterima: '', metode: 'Tunai' }); this.persist(); this.renderGrid(); this.renderCart(); },

  async save() {
    const s = this.st, t = this.totals();
    if (!t.items.length || this._saving) return;
    if (s.metode === 'Tunai' && UI.parseNum(s.diterima) < t.total) {
      UI.toast('Masukkan uang diterima (minimal ' + UI.rp(t.total) + ').', 'error');
      const i = UI.$('#ks-dit'); if (i) i.focus(); return;
    }
    const kurang = t.items.filter(i => i.p.porsi_tersedia !== null && i.qty > i.p.porsi_tersedia);
    if (kurang.length) {
      if (!this.allowMinus()) return UI.toast('Stok bahan tidak cukup untuk: ' + kurang.map(i => i.p.nama).join(', '), 'error');
      const ok = await UI.confirm(`Stok bahan untuk <b>${kurang.map(i => UI.h(i.p.nama)).join(', ')}</b> tidak mencukupi. Lanjutkan transaksi? Stok akan tercatat minus untuk ditinjau admin.`, { title: 'Peringatan Stok', okText: 'Tetap Simpan' });
      if (!ok) return;
    }
    this._saving = true;
    const btn = UI.$('#ks-save');
    await UI.busy(btn, async () => {
      try {
        const r = await API.call('saveSale', {
          items: t.items.map(i => ({ id_produk: i.id, qty: i.qty })), id_diskon: s.diskon || '', metode_bayar: s.metode,
          diterima: s.metode === 'Tunai' ? UI.parseNum(s.diterima) : t.total, tipe_pesanan: s.tipe
        });
        App.produk = r.produk || App.produk;
        UI.$('#ks-cart').classList.remove('open');
        this.reset();
        this.receipt(r.sale, r.warnings || []);
      } catch (e) { UI.toast(e.message, 'error'); }
    });
    this._saving = false;
  },

  receipt(sale, warnings) {
    const m = UI.modal({
      title: 'Transaksi Berhasil', size: 'sm',
      body: `<div class="absen-hero" style="padding-top:4px"><div class="absen-ok">${UI.icon('check')}</div>
          <h2 style="font-size:22px">Pembayaran Tersimpan</h2><div class="mono muted">#${UI.h(sale.id)} · ${UI.fmtDT(sale.tanggal)}</div></div>
        <div class="stack" style="gap:6px;border:var(--line);padding:12px;background:var(--bg)">
          ${sale.items.map(i => `<div class="row between"><span>${i.qty}× ${UI.h(i.nama_produk)}</span><b class="mono">${UI.rp(i.qty * i.harga_jual)}</b></div>`).join('')}
          <div class="row between" style="border-top:var(--soft);padding-top:6px"><span>Subtotal</span><b class="mono">${UI.rp(sale.subtotal)}</b></div>
          ${sale.nilai_diskon ? `<div class="row between green"><span>Diskon</span><b class="mono">-${UI.rp(sale.nilai_diskon)}</b></div>` : ''}
          <div class="row between"><b>TOTAL (${UI.h(sale.metode_bayar)})</b><b class="mono red" style="font-size:18px">${UI.rp(sale.total)}</b></div>
          ${sale.metode_bayar === 'Tunai' ? `<div class="row between"><span>Diterima</span><b class="mono">${UI.rp(sale.diterima)}</b></div>
          <div class="row between" style="font-size:16px"><b>KEMBALIAN</b><b class="mono green">${UI.rp(sale.kembalian)}</b></div>` : ''}
        </div>
        ${warnings.length ? `<div class="note amber" style="margin-top:12px">${UI.icon('alert')}<div><b>Stok bahan minus:</b> ${warnings.map(UI.h).join('; ')}. Admin perlu meninjau stok.</div></div>` : ''}`,
      foot: `<button class="btn btn-primary btn-block" data-close>${UI.icon('plus')} Transaksi Baru</button>`
    });
    setTimeout(() => { const b = m.el.querySelector('.modal-foot .btn'); if (b) b.focus(); }, 80);
  },

  async history() {
    const m = UI.modal({ title: 'Riwayat Transaksi Hari Ini', size: 'xl', body: UI.skeleton(5) });
    const r = await API.safe('listSales', {});
    if (!r) return m.close();
    const valid = r.sales.filter(x => x.status !== 'batal');
    m.body.innerHTML = `<div class="stats" style="grid-template-columns:repeat(3,minmax(0,1fr));margin-bottom:14px">
        ${UI.stat('Nota Selesai', String(valid.length))}${UI.stat('Total Penjualan', UI.rp(valid.reduce((a, b) => a + b.total, 0)), '', { dot: 'green' })}${UI.stat('Dibatalkan', String(r.sales.length - valid.length), '', { dot: 'navy' })}</div>
      <div class="win flat" id="kh-t"></div>`;
    const tbl = UI.table(UI.$('#kh-t', m.el), {
      rows: r.sales, pageSize: 10, placeholder: 'Cari nota, kasir, metode…', searchKeys: ['id', 'nama_kasir', 'metode_bayar', 'status'],
      rowCls: x => x.status === 'batal' ? 'void' : '',
      columns: [
        { label: 'Nota & Jam', render: x => `<b class="mono">#${UI.h(x.id)}</b><div class="mono muted" style="font-size:11px">${UI.fmtTime(x.tanggal)} WITA · ${UI.h(x.tipe_pesanan)}</div>` },
        { label: 'Item', render: x => `<span style="font-size:12.5px">${x.items.map(i => `${i.qty}× ${UI.h(i.nama_produk)}`).join(', ')}</span>` },
        { label: 'Kasir', render: x => UI.h(x.nama_kasir) },
        { label: 'Metode', render: x => UI.badge(x.metode_bayar, x.metode_bayar === 'Tunai' ? 'blue-t' : 'red-t') },
        { label: 'Total', num: true, render: x => `<b>${UI.rp(x.total)}</b>${x.nilai_diskon ? `<div class="green" style="font-size:11px">disk. ${UI.rp(x.nilai_diskon)}</div>` : ''}` },
        { label: 'Status', render: x => x.status === 'batal' ? `<span class="badge b-red" title="${UI.h(x.catatan)}">Batal</span>` : UI.badge('Selesai', 'green') },
        ...(App.isAdmin() ? [{ label: 'Aksi', render: x => x.status === 'batal' ? '' : `<button class="btn btn-xs" data-void="${x.id}">${UI.icon('x', 'ic-sm')} Batalkan</button>` }] : [])
      ]
    });
    m.el.addEventListener('click', async e => {
      const b = e.target.closest('[data-void]'); if (!b) return;
      const alasan = await UI.prompt(`Batalkan transaksi <b>#${UI.h(b.dataset.void)}</b>? Stok bahan akan dikembalikan otomatis dan laporan menyesuaikan.`, { title: 'Batalkan Transaksi', label: 'Alasan pembatalan', okText: 'Batalkan Transaksi' });
      if (!alasan) return;
      const res = await API.safe('voidSale', { id: b.dataset.void, alasan });
      if (res) { UI.toast(res.message); m.close(); await App.refreshCatalog(); this.renderAll(); this.history(); }
    });
    return tbl;
  }
};
