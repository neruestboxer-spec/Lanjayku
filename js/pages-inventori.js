/* =====================================================================
   PERSEDIAAN — Pembelian Bahan, Stok & HPP (stok opname),
   Produk & Resep, Diskon/Promo. Semua khusus Admin.
   ===================================================================== */
const Inv = {
  data: null,
  async fetch() { const r = await API.safe('inventoryData'); if (r) this.data = r; return r; },
  bahan(id) { return ((this.data && this.data.bahan) || []).find(b => b.id === id); },

  /** Modal tambah/ubah bahan baku */
  bahanModal(b, after) {
    const isNew = !b;
    b = b || { stok_minimum: (this.data && this.data.stok_min_default) || 0 };
    const kats = [...new Set(((this.data && this.data.bahan) || []).map(x => x.kategori).filter(Boolean))];
    const m = UI.modal({
      title: isNew ? 'Tambah Bahan Baku' : 'Ubah Bahan · ' + UI.h(b.nama),
      body: `<form id="bb-f" class="form-grid">
        <div class="field span-all"><label>Nama bahan</label><input class="input" name="nama" value="${UI.h(b.nama || '')}" required maxlength="80" placeholder="mis. Susu UHT Full Cream"></div>
        <div class="field"><label>Kategori</label><input class="input" name="kategori" list="bb-kat" value="${UI.h(b.kategori || '')}" placeholder="Kopi, Susu, Sirup…"><datalist id="bb-kat">${kats.map(k => `<option value="${UI.h(k)}">`).join('')}</datalist></div>
        <div class="field"><label>Satuan <span class="hint">dipakai di resep</span></label><input class="input" name="satuan" value="${UI.h(b.satuan || '')}" required maxlength="20" placeholder="gr / ml / pcs" ${isNew ? '' : ''}></div>
        <div class="field"><label>Stok minimum</label><input class="input mono" type="number" step="any" min="0" name="stok_minimum" value="${b.stok_minimum}"></div>
        ${isNew ? `<div class="field"><label>Stok awal</label><input class="input mono" type="number" step="any" min="0" name="stok_awal" value="0"></div>
        <div class="field span-all"><label>Harga per satuan (Rp) <span class="hint">harga rata-rata awal</span></label><input class="input mono" type="number" step="any" min="0" name="harga_awal" value="0"></div>
        <div class="note blue span-all">${UI.icon('info')}<div>Setelah dibuat, stok hanya berubah lewat <b>Pembelian</b>, <b>Penjualan</b>, atau <b>Stok Opname</b> agar jejak audit terjaga.</div></div>`
        : `<div class="field"><label>Stok saat ini</label><input class="input mono" value="${UI.num(b.stok)} ${UI.h(b.satuan)}" disabled></div>`}
      </form>`,
      foot: `<button class="btn btn-secondary" data-close>Batal</button><button class="btn btn-primary" id="bb-save">${UI.icon('save')} Simpan Bahan</button>`
    });
    UI.$('#bb-save', m.el).onclick = e => UI.busy(e.currentTarget, async () => {
      const f = UI.$('#bb-f', m.el); if (!f.reportValidity()) return;
      const r = await API.safe('saveBahan', Object.assign({ id: b.id || '' }, UI.formData(f)));
      if (r) { UI.toast(r.message); m.close(); if (after) after(); }
    });
  },

  /** Modal stok opname (penyesuaian stok fisik) */
  opnameModal(b, after) {
    const m = UI.modal({
      title: `${UI.icon('scale')} Stok Opname: ${UI.h(b.id)} ${UI.h(b.nama)}`, cls: 'red-bar',
      body: `<div class="note blue" style="margin-bottom:14px">${UI.icon('info')}<div><b>Perhatian audit:</b> penyesuaian dicatat di log mutasi resmi, memengaruhi nilai persediaan, dan langsung memperbarui stok kasir.</div></div>
        <div class="form-grid" style="border:var(--line);background:var(--alt);padding:12px;margin-bottom:14px">
          <div><div class="lbl">Stok tercatat di sistem</div><div class="mono" style="font-size:20px;font-weight:700">${UI.num(b.stok)} ${UI.h(b.satuan)}</div></div>
          <div><div class="lbl">Harga rata-rata</div><div class="mono" style="font-size:20px;font-weight:700">${UI.rp(b.harga_rata2)}<small>/${UI.h(b.satuan)}</small></div></div></div>
        <form id="op-f" class="stack" style="gap:14px">
          <div class="field"><label>Input stok fisik aktual <span class="hint">timbang tanpa berat wadah</span></label>
            <div class="input-group"><input class="input mono" name="stok_fisik" type="number" step="any" min="0" required style="font-size:20px"><span class="addon">${UI.h(b.satuan).toUpperCase()}</span></div></div>
          <div id="op-diff"></div>
          <div class="field"><label>Alasan penyesuaian (wajib)</label><select class="select" name="alasan" required>
            ${UI.options(['', 'Hasil hitung fisik rutin', 'Tumpah / rusak saat produksi', 'Kedaluwarsa / basi', 'Salah input sebelumnya', 'Pemakaian di luar resep (tester, sampel)', 'Hilang / tidak diketahui', 'Lainnya'], '', null, x => x || '— Pilih alasan —')}</select></div>
          <div class="field"><label>Catatan tambahan &amp; keterangan shift</label><textarea class="textarea" name="catatan" maxlength="300" placeholder="mis. Kalibrasi grinder pagi oleh barista shift 1"></textarea></div>
        </form>`,
      foot: `<button class="btn btn-secondary" data-close>Batal</button><button class="btn btn-primary" id="op-save">${UI.icon('save')} Simpan Penyesuaian Stok</button>`
    });
    const inp = UI.$('[name=stok_fisik]', m.el);
    inp.addEventListener('input', () => {
      if (inp.value === '') { UI.$('#op-diff', m.el).innerHTML = ''; return; }
      const d = Math.round((Number(inp.value) - b.stok) * 1000) / 1000, v = d * b.harga_rata2;
      const kind = d < 0 ? 'red' : d > 0 ? 'green' : 'blue';
      UI.$('#op-diff', m.el).innerHTML = `<div class="note ${kind}" style="justify-content:space-between;align-items:center"><div class="row" style="gap:8px">${UI.icon(d < 0 ? 'alert' : 'checkc')}<div><div class="mono" style="font-size:11px">STATUS REKONSILIASI:</div><b>${d < 0 ? 'Kurang / defisit stok' : d > 0 ? 'Lebih / surplus stok' : 'Sesuai sistem'}</b></div></div>
        <div class="right"><div class="mono" style="font-size:20px;font-weight:700;color:${d < 0 ? 'var(--red)' : 'var(--green)'}">SELISIH: ${d > 0 ? '+' : ''}${UI.num(d)} ${UI.h(b.satuan)}</div><div class="mono" style="font-size:11px">${d < 0 ? 'Kerugian' : 'Nilai'}: ${UI.rp(v)}</div></div></div>`;
    });
    setTimeout(() => inp.focus(), 80);
    UI.$('#op-save', m.el).onclick = e => UI.busy(e.currentTarget, async () => {
      const f = UI.$('#op-f', m.el); if (!f.reportValidity()) return;
      const r = await API.safe('stokOpname', Object.assign({ id_bahan: b.id }, UI.formData(f)));
      if (r) { UI.toast(r.message); m.close(); App.refreshCatalog(); if (after) after(); }
    });
  },

  /** Modal produk + resep (Bill of Material) */
  produkModal(p, after) {
    const isNew = !p;
    p = p || { status_aktif: true, resep: [] };
    const bahan = (this.data && this.data.bahan) || [];
    const kats = [...new Set(((this.data && this.data.produk) || []).map(x => x.kategori).filter(Boolean).concat(['Kopi', 'Non-Kopi', 'Makanan', 'Snack', 'Dessert']))];
    const rowHtml = r => `<div class="rs-row" style="display:grid;grid-template-columns:minmax(0,1fr) 120px 110px 40px;gap:8px;align-items:center;margin-bottom:8px">
        <select class="select" data-b>${UI.options(bahan, r.id_bahan, 'id', b => `${b.nama} (${b.satuan})`, '— Pilih bahan —')}</select>
        <div class="input-group"><input class="input mono right" data-j type="number" step="any" min="0" value="${r.jumlah || ''}" placeholder="0"><span class="addon" data-sat>${UI.h((bahan.find(b => b.id === r.id_bahan) || {}).satuan || '')}</span></div>
        <span class="mono right" data-c style="font-size:12.5px">Rp 0</span>
        <button type="button" class="btn btn-ghost btn-sm" data-rm aria-label="Hapus bahan" style="color:var(--red)">${UI.icon('trash')}</button></div>`;
    const m = UI.modal({
      title: isNew ? 'Tambah Produk / Menu' : 'Ubah Produk · ' + UI.h(p.nama), size: 'lg',
      body: `<form id="pr-f" class="form-grid three">
          <div class="field span-2"><label>Nama produk</label><input class="input" name="nama" value="${UI.h(p.nama || '')}" required maxlength="80"></div>
          <div class="field"><label>Kategori</label><input class="input" name="kategori" list="pr-kat" value="${UI.h(p.kategori || '')}" required><datalist id="pr-kat">${kats.map(k => `<option value="${UI.h(k)}">`).join('')}</datalist></div>
          <div class="field"><label>Harga jual (Rp)</label><input class="input mono" type="number" min="0" step="500" name="harga_jual" value="${p.harga_jual || ''}" required></div>
          <div class="field"><label>Label kartu <span class="hint">opsional</span></label><input class="input" name="label" value="${UI.h(p.label || '')}" maxlength="20" placeholder="FAVORIT, BARU…"></div>
          <div class="field" style="justify-content:flex-end"><label class="check" style="min-height:42px"><input type="checkbox" name="status_aktif" ${p.status_aktif ? 'checked' : ''}> Aktif di kasir</label></div>
        </form>
        <div class="lbl" style="margin:18px 0 8px">Resep per porsi (bahan baku)</div>
        <div style="display:grid;grid-template-columns:minmax(0,1fr) 120px 110px 40px;gap:8px;font:600 10.5px var(--f-mono);color:var(--muted);margin-bottom:6px" class="hide-mobile"><span>BAHAN</span><span>TAKARAN</span><span class="right">BIAYA</span><span></span></div>
        <div id="pr-rs">${(p.resep.length ? p.resep : [{}]).map(rowHtml).join('')}</div>
        <button type="button" class="btn btn-sm" id="pr-add" style="border-style:dashed;width:100%">${UI.icon('plus', 'ic-sm')} Tambah bahan ke resep</button>
        <div id="pr-sum" class="strip" style="margin:16px 0 0"></div>
        ${bahan.length ? '' : `<div class="note amber" style="margin-top:12px">${UI.icon('alert')}<div>Belum ada bahan baku. Tambahkan bahan di menu Stok &amp; HPP agar HPP bisa dihitung.</div></div>`}`,
      foot: `<button class="btn btn-secondary" data-close>Batal</button><button class="btn btn-primary" id="pr-save">${UI.icon('save')} Simpan Produk</button>`
    });
    const rs = UI.$('#pr-rs', m.el);
    const calc = () => {
      let hpp = 0;
      UI.$$('.rs-row', rs).forEach(row => {
        const b = bahan.find(x => x.id === UI.$('[data-b]', row).value);
        const j = Number(UI.$('[data-j]', row).value) || 0;
        const c = b ? b.harga_rata2 * j : 0; hpp += c;
        UI.$('[data-sat]', row).textContent = b ? b.satuan : '';
        UI.$('[data-c]', row).textContent = UI.rp(c);
      });
      const harga = Number(UI.$('[name=harga_jual]', m.el).value) || 0;
      const mg = harga ? (harga - hpp) / harga : 0;
      UI.$('#pr-sum', m.el).innerHTML = `<span>HPP per porsi: <b class="mono red">${UI.rp(hpp)}</b></span><span>Laba per porsi: <b class="mono">${UI.rp(harga - hpp)}</b></span>
        <span>Margin: ${UI.badge(UI.pct(mg), mg >= .55 ? 'green' : mg >= .35 ? 'amber' : 'red')}</span>`;
    };
    rs.addEventListener('input', calc); rs.addEventListener('change', calc);
    UI.$('[name=harga_jual]', m.el).addEventListener('input', calc);
    rs.addEventListener('click', e => { const b = e.target.closest('[data-rm]'); if (b) { b.closest('.rs-row').remove(); calc(); } });
    UI.$('#pr-add', m.el).onclick = () => { rs.insertAdjacentHTML('beforeend', rowHtml({})); calc(); };
    calc();
    UI.$('#pr-save', m.el).onclick = e => UI.busy(e.currentTarget, async () => {
      const f = UI.$('#pr-f', m.el); if (!f.reportValidity()) return;
      const resep = UI.$$('.rs-row', rs).map(row => ({ id_bahan: UI.$('[data-b]', row).value, jumlah: UI.$('[data-j]', row).value })).filter(r => r.id_bahan);
      if (resep.some(r => !(Number(r.jumlah) > 0))) return UI.toast('Isi takaran setiap bahan resep (lebih dari 0).', 'error');
      const r = await API.safe('saveProduct', Object.assign({ id: p.id || '' }, UI.formData(f), { resep }));
      if (r) { UI.toast(r.message); m.close(); App.refreshCatalog(); if (after) after(); }
    });
  },

  diskonModal(d, after) {
    const isNew = !d; d = d || { tipe: 'persen', status_aktif: true };
    const m = UI.modal({
      title: isNew ? 'Tambah Diskon / Promo' : 'Ubah Promo · ' + UI.h(d.nama),
      body: `<form id="ds-f" class="form-grid">
        <div class="field span-all"><label>Nama promo</label><input class="input" name="nama" value="${UI.h(d.nama || '')}" required maxlength="60" placeholder="mis. Coffee Hour 10%"></div>
        <div class="field"><label>Tipe</label><select class="select" name="tipe">${UI.options([{ v: 'persen', l: 'Persen (%)' }, { v: 'nominal', l: 'Nominal (Rp)' }], d.tipe, 'v', o => o.l)}</select></div>
        <div class="field"><label>Nilai</label><input class="input mono" type="number" step="any" min="0" name="nilai" value="${d.nilai || ''}" required></div>
        <div class="field"><label>Mulai <span class="hint">kosong = sejak sekarang</span></label><input class="input mono" type="date" name="tanggal_mulai" value="${d.tanggal_mulai || ''}"></div>
        <div class="field"><label>Selesai <span class="hint">kosong = tanpa batas</span></label><input class="input mono" type="date" name="tanggal_selesai" value="${d.tanggal_selesai || ''}"></div>
        <label class="check span-all"><input type="checkbox" name="status_aktif" ${d.status_aktif ? 'checked' : ''}> Promo aktif (bisa dipilih kasir selama periode berlaku)</label>
      </form>`,
      foot: `<button class="btn btn-secondary" data-close>Batal</button><button class="btn btn-primary" id="ds-save">${UI.icon('save')} Simpan Promo</button>`
    });
    UI.$('#ds-save', m.el).onclick = e => UI.busy(e.currentTarget, async () => {
      const f = UI.$('#ds-f', m.el); if (!f.reportValidity()) return;
      const r = await API.safe('saveDiscount', Object.assign({ id: d.id || '' }, UI.formData(f)));
      if (r) { UI.toast(r.message); m.close(); App.refreshCatalog(); if (after) after(); }
    });
  }
};

/* ============================ PEMBELIAN ============================ */
Pages.pembelian = {
  title: 'Pembelian Bahan',
  async render(el) {
    el.innerHTML = UI.pageHead('Modul Logistik · Pembelian', 'Pembelian Bahan Baku',
      'Catat belanja bahan. Stok bertambah, harga rata-rata tertimbang (WAC) diperbarui, HPP produk dihitung ulang, dan pengeluaran masuk ke arus kas.',
      `<button class="btn" id="pb-new">${UI.icon('plus')} Bahan Baru</button>`) + `<div id="pb-body">${UI.skeleton(5)}</div>`;
    UI.$('#pb-new').onclick = () => Inv.bahanModal(null, () => this.render(el));
    if (!(await Inv.fetch())) return;
    const bahan = Inv.data.bahan;
    UI.$('#pb-body').innerHTML = `<div class="grid-73">
      ${UI.win(`${UI.icon('cart')} Form Pembelian`, bahan.length ? `<form id="pb-f">
        <div class="form-grid three" style="margin-bottom:16px">
          <div class="field"><label>Tanggal</label><input class="input mono" type="date" name="tanggal" value="${UI.today()}" max="${UI.today()}"></div>
          <div class="field"><label>Supplier <span class="hint">opsional</span></label><input class="input" name="supplier" maxlength="80" placeholder="Toko / pemasok"></div>
          <div class="field"><label>Keterangan <span class="hint">opsional</span></label><input class="input" name="keterangan" maxlength="200" placeholder="No. faktur, catatan"></div>
        </div>
        <div class="lbl" style="margin-bottom:8px">Daftar item</div>
        <div id="pb-items"></div>
        <button type="button" class="btn btn-sm" id="pb-add" style="border-style:dashed;width:100%;margin-bottom:16px">${UI.icon('plus', 'ic-sm')} Tambah item</button>
        <div class="strip" style="margin-bottom:16px"><span>TOTAL PEMBELIAN</span><b class="mono red" style="font-size:22px" id="pb-total">Rp 0</b></div>
        <button class="btn btn-primary btn-lg btn-block" type="submit">${UI.icon('save')} Simpan Pembelian</button></form>`
        : UI.empty('Belum ada bahan baku', 'Tambahkan bahan baku terlebih dahulu.', 'box'))}
      ${UI.win(`${UI.icon('info')} Cara Kerja`, `<ol style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:10px">
        <li>Stok bahan bertambah sesuai jumlah beli.</li>
        <li>Harga rata-rata dihitung ulang:<div class="mono" style="font-size:11.5px;background:var(--alt);border:1.5px solid var(--ink);padding:6px;margin-top:4px">(stok lama × harga lama + qty × harga beli) ÷ (stok lama + qty)</div></li>
        <li>HPP setiap menu yang memakai bahan tersebut ikut diperbarui.</li>
        <li>Total pembelian tercatat sebagai <b>kas keluar</b> di Buku Besar Arus Kas.</li></ol>
        <div class="note amber" style="margin-top:14px">${UI.icon('alert')}<div>Di laporan Laba Rugi, biaya bahan diakui saat terjual (HPP), bukan saat dibeli — agar laba tidak terdistorsi stok gudang.</div></div>`, { sq: 'navy' })}
    </div>
    <div class="section-gap" style="margin-top:20px">${UI.win(`${UI.icon('history')} Riwayat Pembelian`, '<div id="pb-hist"></div>', { flush: true })}</div>`;

    const items = UI.$('#pb-items');
    if (items) {
      const row = () => `<div class="pb-row" style="display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr) minmax(0,1fr) 40px;gap:8px;margin-bottom:10px;align-items:start">
        <div><select class="select" data-b required>${UI.options(bahan, '', 'id', b => `${b.nama} (${b.satuan})`, '— Pilih bahan —')}</select><div class="mono muted" data-info style="font-size:10.5px;margin-top:4px"></div></div>
        <div class="input-group"><input class="input mono right" data-q type="number" step="any" min="0" placeholder="Qty" required><span class="addon" data-s>—</span></div>
        <div class="input-group"><span class="addon">Rp</span><input class="input mono right" data-h type="number" step="any" min="0" placeholder="Harga/satuan" required></div>
        <button type="button" class="btn btn-ghost btn-sm" data-rm style="color:var(--red)" aria-label="Hapus item">${UI.icon('trash')}</button></div>`;
      items.innerHTML = row();
      const calc = () => {
        let tot = 0;
        UI.$$('.pb-row', items).forEach(r => {
          const b = Inv.bahan(UI.$('[data-b]', r).value), q = Number(UI.$('[data-q]', r).value) || 0, h = Number(UI.$('[data-h]', r).value) || 0;
          tot += q * h;
          UI.$('[data-s]', r).textContent = b ? b.satuan : '—';
          let info = '';
          if (b) {
            const sl = Math.max(0, b.stok), nw = q ? (sl * b.harga_rata2 + q * h) / (sl + q) : b.harga_rata2;
            info = `Stok ${UI.num(b.stok)} → ${UI.num(b.stok + q)} · Harga rata2 ${UI.rp(b.harga_rata2)} → <b>${UI.rp(nw)}</b> · Subtotal ${UI.rp(q * h)}`;
          }
          UI.$('[data-info]', r).innerHTML = info;
        });
        UI.$('#pb-total').textContent = UI.rp(tot);
      };
      items.addEventListener('input', calc); items.addEventListener('change', calc);
      items.addEventListener('click', e => { const b = e.target.closest('[data-rm]'); if (b && UI.$$('.pb-row', items).length > 1) { b.closest('.pb-row').remove(); calc(); } });
      UI.$('#pb-add').onclick = () => { items.insertAdjacentHTML('beforeend', row()); };
      UI.$('#pb-f').addEventListener('submit', async e => {
        e.preventDefault();
        const list = UI.$$('.pb-row', items).map(r => ({ id_bahan: UI.$('[data-b]', r).value, qty: UI.$('[data-q]', r).value, harga_satuan: UI.$('[data-h]', r).value }));
        const d = UI.formData(e.target);
        await UI.busy(e.submitter, async () => {
          const r = await API.safe('savePurchase', { items: list, tanggal: d.tanggal, supplier: d.supplier, keterangan: d.keterangan });
          if (r) { UI.toast(r.message); App.refreshCatalog(); this.render(el); }
        });
      });
    }
    this.history();
  },

  async history() {
    const box = UI.$('#pb-hist');
    const st = { from: UI.addDays(UI.today(), -30), to: UI.today() };
    const load = async () => {
      const r = await API.safe('listPurchases', st);
      if (!r || !box.isConnected) return;
      tbl.setRows(r.purchases);
    };
    const tbl = UI.table(box, {
      rows: [], placeholder: 'Cari bahan, supplier, ID…', searchKeys: ['id', 'nama_bahan', 'supplier', 'keterangan'],
      tools: `<input class="input mono" type="date" id="ph-from" value="${st.from}" style="width:auto"><span class="mono">s.d.</span><input class="input mono" type="date" id="ph-to" value="${st.to}" style="width:auto">
        <button class="btn btn-sm btn-dark" id="ph-go">Terapkan</button><button class="btn btn-sm" id="ph-xls">${UI.icon('sheet', 'ic-sm')} Excel</button>`,
      columns: [
        { label: 'Tanggal', render: p => `<span class="mono" style="font-size:12px">${UI.fmtDT(p.tanggal)}</span>` },
        { label: 'No.', render: p => `<b class="mono red">#${UI.h(p.id)}</b>` },
        { label: 'Bahan', render: p => `<b>${UI.h(p.nama_bahan)}</b>` },
        { label: 'Qty', num: true, render: p => `${UI.num(p.qty)} ${UI.h(p.satuan)}` },
        { label: 'Harga/Satuan', num: true, render: p => UI.rp(p.harga_satuan) },
        { label: 'Total', num: true, render: p => `<b>${UI.rp(p.total)}</b>` },
        { label: 'Supplier / Ket.', render: p => `<span style="font-size:12.5px">${UI.h([p.supplier, p.keterangan].filter(Boolean).join(' · ') || '-')}</span>` },
        { label: 'Oleh', render: p => `<span class="mono" style="font-size:12px">${UI.h(p.id_user)}</span>` }
      ],
      foot: list => `<td colspan="5">TOTAL (${list.length} item)</td><td class="num">${UI.rp(list.reduce((a, b) => a + b.total, 0))}</td><td colspan="2"></td>`
    });
    UI.$('#ph-go').onclick = () => { st.from = UI.$('#ph-from').value; st.to = UI.$('#ph-to').value; load(); };
    UI.$('#ph-xls').onclick = () => UI.exportXlsx([{ name: 'Pembelian', rows: [['Tanggal', 'No', 'Bahan', 'Qty', 'Satuan', 'Harga Satuan', 'Total', 'Supplier', 'Keterangan', 'User'], ...tbl.visible.map(p => [p.tanggal, p.id, p.nama_bahan, p.qty, p.satuan, p.harga_satuan, p.total, p.supplier, p.keterangan, p.id_user])] }], `Pembelian_${st.from}_${st.to}.xlsx`);
    load();
  }
};

/* ============================ STOK & HPP ============================ */
Pages.stok = {
  title: 'Stok & HPP',
  tab: 'stok',
  async render(el) {
    el.innerHTML = UI.pageHead('Modul Logistik · Persediaan', 'Stok Bahan Baku &amp; HPP Produk',
      'Pantau stok, nilai persediaan, dan margin tiap menu. Metode harga: rata-rata tertimbang (WAC).',
      `<button class="btn" id="sk-hpp">${UI.icon('sync')} Hitung Ulang HPP</button><button class="btn" id="sk-new">${UI.icon('plus')} Tambah Bahan Baku</button>
       <a class="btn btn-primary" href="#/pembelian">${UI.icon('cart')} Pembelian</a>`) + `<div id="sk-body">${UI.skeleton(6)}</div>`;
    UI.$('#sk-new').onclick = () => Inv.bahanModal(null, () => this.render(el));
    UI.$('#sk-hpp').onclick = e => UI.busy(e.currentTarget, async () => { const r = await API.safe('recalcHpp'); if (r) { UI.toast(r.message); this.render(el); } });
    if (!(await Inv.fetch())) return;
    const D = Inv.data;
    const nilai = D.bahan.reduce((a, b) => a + b.nilai, 0);
    const aktif = D.produk.filter(p => p.status_aktif);
    const avgM = aktif.length ? aktif.reduce((a, p) => a + p.margin, 0) / aktif.length : 0;
    const low = D.bahan.filter(b => b.status_stok !== 'Aman');
    UI.$('#sk-body').innerHTML = `<div class="stats">
        ${UI.stat('Total Nilai Persediaan', UI.rp(nilai), `<span>${D.bahan.length} bahan aktif</span>`)}
        ${UI.stat('Stok Perlu Perhatian', `${low.length} <small>bahan</small>`, `<span>Kritis/habis: ${low.filter(b => b.status_stok !== 'Menipis').length}</span><span>Menipis: ${low.filter(b => b.status_stok === 'Menipis').length}</span>`, { dot: 'amber', tag: low.length ? UI.badge('Cek', 'amber') : UI.badge('Aman', 'green') })}
        ${UI.stat('Rata-rata Margin Menu', UI.pct(avgM), '<span>Target ideal cafe</span><span>min. 55%</span>', { dot: 'green', tag: UI.badge(avgM >= .55 ? 'Optimal' : 'Di bawah target', avgM >= .55 ? 'green' : 'amber') })}
        ${UI.stat('Produk Aktif', `${aktif.length} <small>menu</small>`, `<span>Nonaktif: ${D.produk.length - aktif.length}</span>`, { dot: 'navy' })}
      </div>
      <div class="tabs" role="tablist">
        <button class="tab" data-tab="stok">${UI.icon('box', 'ic-sm')} Stok Bahan Baku <span class="count">${D.bahan.length}</span></button>
        <button class="tab" data-tab="hpp">${UI.icon('tag', 'ic-sm')} HPP &amp; Margin Produk <span class="count">${D.produk.length}</span></button>
        <button class="tab" data-tab="opname">${UI.icon('scale', 'ic-sm')} Riwayat Opname</button>
      </div><div id="sk-tab"></div>`;
    UI.$$('.tab', el).forEach(t => t.onclick = () => { this.tab = t.dataset.tab; this.renderTab(el); });
    this.renderTab(el);
  },

  renderTab(el) {
    const D = Inv.data, box = UI.$('#sk-tab');
    UI.$$('.tab', el).forEach(t => t.classList.toggle('on', t.dataset.tab === this.tab));
    if (this.tab === 'stok') {
      box.innerHTML = `<div class="win" id="sk-t"></div>`;
      const filt = { s: 'Semua' };
      const tbl = UI.table(UI.$('#sk-t'), {
        rows: D.bahan, placeholder: 'Cari kode atau nama bahan…', searchKeys: ['id', 'nama', 'kategori'],
        tools: `<div class="seg" id="sk-f">${['Semua', 'Aman', 'Menipis', 'Kritis'].map(x => `<button data-f="${x}" class="${x === 'Semua' ? 'on' : ''}">${x}</button>`).join('')}</div>
          <button class="btn btn-sm" id="sk-xls">${UI.icon('sheet', 'ic-sm')} Excel</button>`,
        columns: [
          { label: 'Kode & Nama Bahan', render: b => `<div class="row" style="flex-wrap:nowrap"><span class="badge b-alt">${UI.h(b.id)}</span><div><b>${UI.h(b.nama)}</b><div class="mono muted" style="font-size:11px">${UI.h(b.kategori || '-')}</div></div></div>` },
          { label: 'Stok Saat Ini', num: true, render: b => `<b class="${b.status_stok === 'Aman' ? '' : 'red'}">${UI.num(b.stok)} ${UI.h(b.satuan)}</b>` },
          { label: 'Min. Stok', num: true, render: b => `${UI.num(b.stok_minimum)} ${UI.h(b.satuan)}` },
          { label: 'Harga Rata² (WAC)', num: true, render: b => `${UI.rp(b.harga_rata2)}<div class="muted" style="font-size:10.5px">/ ${UI.h(b.satuan)}</div>` },
          { label: 'Nilai Stok', num: true, render: b => `<b class="red">${UI.rp(b.nilai)}</b>` },
          { label: 'Status', render: b => `<div style="min-width:110px">${UI.stokBadge(b.status_stok)}<div style="margin-top:5px">${UI.bar(Math.min(1, b.rasio / 2), b.status_stok === 'Aman' ? '' : b.status_stok === 'Menipis' ? 'amber' : 'red')}</div></div>` },
          { label: 'Aksi', render: b => `<div class="row" style="flex-wrap:nowrap;gap:6px"><button class="btn btn-xs" data-op="${b.id}">${UI.icon('scale', 'ic-sm')} Opname</button><button class="btn btn-xs btn-ghost" data-ed="${b.id}" aria-label="Ubah">${UI.icon('edit', 'ic-sm')}</button></div>` }
        ],
        foot: list => `<td colspan="4">SUBTOTAL NILAI DITAMPILKAN (${list.length} bahan)</td><td class="num">${UI.rp(list.reduce((a, b) => a + b.nilai, 0))}</td><td colspan="2"></td>`
      });
      UI.$('#sk-f').onclick = e => { const b = e.target.closest('[data-f]'); if (!b) return; filt.s = b.dataset.f; UI.$$('#sk-f button').forEach(x => x.classList.toggle('on', x === b)); tbl.setFilter(filt.s === 'Semua' ? null : x => filt.s === 'Kritis' ? (x.status_stok === 'Kritis' || x.status_stok === 'Habis') : x.status_stok === filt.s); };
      UI.$('#sk-xls').onclick = () => UI.exportXlsx([{ name: 'Stok Bahan', rows: [['Kode', 'Nama', 'Kategori', 'Stok', 'Satuan', 'Stok Minimum', 'Harga Rata2', 'Nilai Stok', 'Status'], ...tbl.visible.map(b => [b.id, b.nama, b.kategori, b.stok, b.satuan, b.stok_minimum, b.harga_rata2, b.nilai, b.status_stok])] }], `Stok_Bahan_${UI.today()}.xlsx`);
      box.onclick = e => {
        const op = e.target.closest('[data-op]'), ed = e.target.closest('[data-ed]');
        if (op) Inv.opnameModal(Inv.bahan(op.dataset.op), () => this.render(UI.$('#page')));
        if (ed) Inv.bahanModal(Inv.bahan(ed.dataset.ed), () => this.render(UI.$('#page')));
      };
    } else if (this.tab === 'hpp') {
      box.innerHTML = `<div class="win" id="sk-h"></div>`;
      const tbl = UI.table(UI.$('#sk-h'), {
        rows: D.produk, placeholder: 'Cari produk atau kategori…', searchKeys: ['id', 'nama', 'kategori'],
        tools: `<button class="btn btn-sm" id="hp-xls">${UI.icon('sheet', 'ic-sm')} Excel</button>`,
        columns: [
          { label: 'Produk', render: p => `<b>${UI.h(p.nama)}</b><div class="mono muted" style="font-size:11px">${UI.h(p.id)} · ${UI.h(p.kategori)}</div>` },
          { label: 'Status', render: p => p.status_aktif ? UI.badge('Aktif', 'green-t') : UI.badge('Nonaktif', 'alt') },
          { label: 'Harga Jual', num: true, render: p => UI.rp(p.harga_jual) },
          { label: 'HPP / Porsi', num: true, render: p => `<b class="red">${UI.rp(p.hpp)}</b>` },
          { label: 'Laba / Porsi', num: true, render: p => UI.rp(p.harga_jual - p.hpp) },
          { label: 'Margin', render: p => `<div style="min-width:110px"><b class="mono ${p.margin >= .55 ? 'green' : p.margin >= .35 ? 'amber' : 'red'}">${UI.pct(p.margin)}</b>${UI.bar(p.margin, p.margin >= .55 ? '' : p.margin >= .35 ? 'amber' : 'red')}</div>` },
          { label: 'Porsi Tersedia', num: true, render: p => p.porsi_tersedia === null ? '<span class="muted">tanpa resep</span>' : `<span class="${p.porsi_tersedia <= 0 ? 'red' : ''}">${p.porsi_tersedia}</span>` },
          { label: 'Resep', render: p => `<button class="btn btn-xs" data-rs="${p.id}">${UI.icon('eye', 'ic-sm')} Rincian (${p.resep.length})</button>` }
        ]
      });
      UI.$('#hp-xls').onclick = () => UI.exportXlsx([{ name: 'HPP Produk', rows: [['Kode', 'Produk', 'Kategori', 'Harga Jual', 'HPP', 'Laba/Porsi', 'Margin %', 'Status'], ...tbl.visible.map(p => [p.id, p.nama, p.kategori, p.harga_jual, p.hpp, p.harga_jual - p.hpp, Math.round(p.margin * 1000) / 10, p.status_aktif ? 'Aktif' : 'Nonaktif'])] }], `HPP_Produk_${UI.today()}.xlsx`);
      box.onclick = e => {
        const b = e.target.closest('[data-rs]'); if (!b) return;
        const p = D.produk.find(x => x.id === b.dataset.rs);
        UI.modal({
          title: 'Rincian HPP · ' + UI.h(p.nama), body: p.resep.length ? `<div class="table-wrap" style="border:var(--line)"><table class="table"><thead><tr><th>Bahan</th><th class="right">Takaran</th><th class="right">Biaya</th></tr></thead><tbody>
            ${p.resep.map(r => `<tr><td>${UI.h(r.nama)}</td><td class="num">${UI.num(r.jumlah)} ${UI.h(r.satuan)}</td><td class="num">${UI.rp(r.biaya)}</td></tr>`).join('')}</tbody>
            <tfoot><tr><td colspan="2">HPP per porsi</td><td class="num">${UI.rp(p.hpp)}</td></tr></tfoot></table></div>
            <div class="strip" style="margin:14px 0 0"><span>Harga jual ${UI.rp(p.harga_jual)}</span><span>Margin <b>${UI.pct(p.margin)}</b></span></div>` : UI.empty('Belum ada resep', 'Atur resep di menu Produk & Resep.', 'book'),
          foot: `<a class="btn" href="#/produk" data-close>${UI.icon('edit')} Ubah di Produk &amp; Resep</a><button class="btn btn-secondary" data-close>Tutup</button>`
        });
      };
    } else {
      box.innerHTML = `<div class="win" id="sk-o"></div>`;
      UI.table(UI.$('#sk-o'), {
        rows: D.opname, placeholder: 'Cari bahan atau alasan…', searchKeys: ['nama_bahan', 'alasan', 'catatan', 'id_user'],
        empty: 'Belum ada penyesuaian stok. (Menampilkan 30 opname terakhir.)',
        columns: [
          { label: 'Tanggal', render: o => `<span class="mono" style="font-size:12px">${UI.fmtDT(o.tanggal)}</span>` },
          { label: 'Bahan', render: o => `<b>${UI.h(o.nama_bahan)}</b>` },
          { label: 'Sistem → Fisik', num: true, render: o => `${UI.num(o.stok_sistem)} → ${UI.num(o.stok_fisik)} ${UI.h(o.satuan)}` },
          { label: 'Selisih', num: true, render: o => `<b class="${o.selisih < 0 ? 'red' : 'green'}">${o.selisih > 0 ? '+' : ''}${UI.num(o.selisih)}</b>` },
          { label: 'Nilai', num: true, render: o => `<span class="${o.nilai_selisih < 0 ? 'red' : 'green'}">${UI.rp(o.nilai_selisih)}</span>` },
          { label: 'Alasan', render: o => `${UI.h(o.alasan)}${o.catatan ? `<div class="muted" style="font-size:12px">${UI.h(o.catatan)}</div>` : ''}` },
          { label: 'Oleh', render: o => `<span class="mono" style="font-size:12px">${UI.h(o.id_user)}</span>` }
        ]
      });
    }
  }
};

/* ============================ PRODUK, RESEP & DISKON ============================ */
Pages.produk = {
  title: 'Produk & Resep',
  tab: 'produk',
  async render(el) {
    el.innerHTML = UI.pageHead('Modul Menu · Master Data', 'Produk, Resep &amp; Promo',
      'Kelola menu cafe, komposisi resep per porsi (otomatis memotong stok saat terjual), dan diskon kasir.',
      `<button class="btn" id="pr-dnew">${UI.icon('tag')} Tambah Promo</button><button class="btn btn-primary" id="pr-new">${UI.icon('plus')} Tambah Produk</button>`) + `<div id="pr-body">${UI.skeleton(6)}</div>`;
    const reload = () => this.render(el);
    UI.$('#pr-new').onclick = () => Inv.produkModal(null, reload);
    UI.$('#pr-dnew').onclick = () => Inv.diskonModal(null, reload);
    if (!(await Inv.fetch())) return;
    const D = Inv.data;
    UI.$('#pr-body').innerHTML = `<div class="tabs" role="tablist">
        <button class="tab" data-tab="produk">${UI.icon('book', 'ic-sm')} Menu &amp; Resep <span class="count">${D.produk.length}</span></button>
        <button class="tab" data-tab="diskon">${UI.icon('tag', 'ic-sm')} Diskon &amp; Promo <span class="count">${D.diskon.length}</span></button></div><div id="pr-tab"></div>`;
    UI.$$('.tab', el).forEach(t => t.onclick = () => { this.tab = t.dataset.tab; this.renderTab(el, reload); });
    this.renderTab(el, reload);
  },
  renderTab(el, reload) {
    const D = Inv.data, box = UI.$('#pr-tab');
    UI.$$('.tab', el).forEach(t => t.classList.toggle('on', t.dataset.tab === this.tab));
    if (this.tab === 'produk') {
      box.innerHTML = '<div class="win" id="pr-t"></div>';
      const kats = [...new Set(D.produk.map(p => p.kategori))];
      const tbl = UI.table(UI.$('#pr-t'), {
        rows: D.produk, placeholder: 'Cari produk…', searchKeys: ['id', 'nama', 'kategori', 'label'],
        tools: `<select class="select" id="pr-kf" style="width:auto">${UI.options(kats, '', null, null, 'Semua kategori')}</select>`,
        rowCls: p => p.status_aktif ? '' : 'muted',
        columns: [
          { label: 'Produk', render: p => `<b>${UI.h(p.nama)}</b> ${p.label ? UI.badge(p.label, 'alt') : ''}<div class="mono muted" style="font-size:11px">${UI.h(p.id)}</div>` },
          { label: 'Kategori', render: p => UI.badge(p.kategori, 'blue-t') },
          { label: 'Harga', num: true, render: p => UI.rp(p.harga_jual) },
          { label: 'HPP', num: true, render: p => `<span class="red">${UI.rp(p.hpp)}</span>` },
          { label: 'Margin', num: true, render: p => `<b class="${p.margin >= .55 ? 'green' : p.margin >= .35 ? 'amber' : 'red'}">${UI.pct(p.margin)}</b>` },
          { label: 'Resep', render: p => p.resep.length ? `<span style="font-size:12px">${p.resep.map(r => UI.h(r.nama)).join(', ')}</span>` : '<span class="badge b-amber-t">Belum ada resep</span>' },
          { label: 'Status', render: p => p.status_aktif ? UI.badge('Aktif', 'green') : UI.badge('Nonaktif', 'alt') },
          { label: 'Aksi', render: p => `<div class="row" style="flex-wrap:nowrap;gap:6px"><button class="btn btn-xs" data-ed="${p.id}">${UI.icon('edit', 'ic-sm')} Ubah</button><button class="btn btn-xs btn-ghost" data-tg="${p.id}">${p.status_aktif ? 'Nonaktifkan' : 'Aktifkan'}</button></div>` }
        ]
      });
      UI.$('#pr-kf').onchange = e => tbl.setFilter(e.target.value ? p => p.kategori === e.target.value : null);
      box.onclick = async e => {
        const ed = e.target.closest('[data-ed]'), tg = e.target.closest('[data-tg]');
        if (ed) Inv.produkModal(D.produk.find(p => p.id === ed.dataset.ed), reload);
        if (tg) {
          const p = D.produk.find(x => x.id === tg.dataset.tg);
          if (!(await UI.confirm(`${p.status_aktif ? 'Nonaktifkan' : 'Aktifkan'} <b>${UI.h(p.nama)}</b>? ${p.status_aktif ? 'Menu tidak tampil di kasir, riwayat penjualan tetap aman.' : ''}`))) return;
          const r = await API.safe('saveProduct', { id: p.id, nama: p.nama, kategori: p.kategori, harga_jual: p.harga_jual, label: p.label, status_aktif: !p.status_aktif, resep: p.resep.map(x => ({ id_bahan: x.id_bahan, jumlah: x.jumlah })) });
          if (r) { UI.toast(r.message); App.refreshCatalog(); reload(); }
        }
      };
    } else {
      box.innerHTML = '<div class="win" id="pr-d"></div>';
      const t = UI.today();
      UI.table(UI.$('#pr-d'), {
        rows: D.diskon, search: false, empty: 'Belum ada promo. Klik "Tambah Promo".',
        columns: [
          { label: 'Promo', render: d => `<b>${UI.h(d.nama)}</b><div class="mono muted" style="font-size:11px">${UI.h(d.id)}</div>` },
          { label: 'Nilai', num: true, render: d => `<b class="red">${d.tipe === 'persen' ? d.nilai + '%' : UI.rp(d.nilai)}</b>` },
          { label: 'Periode', render: d => `<span class="mono" style="font-size:12px">${d.tanggal_mulai ? UI.fmtDate(d.tanggal_mulai) : 'Sejak awal'} → ${d.tanggal_selesai ? UI.fmtDate(d.tanggal_selesai) : 'Tanpa batas'}</span>` },
          { label: 'Status', render: d => { const live = d.status_aktif && (!d.tanggal_mulai || d.tanggal_mulai <= t) && (!d.tanggal_selesai || d.tanggal_selesai >= t); return live ? UI.badge('Berlaku', 'green') : d.status_aktif ? UI.badge('Di luar periode', 'amber-t') : UI.badge('Nonaktif', 'alt'); } },
          { label: 'Aksi', render: d => `<button class="btn btn-xs" data-dd="${d.id}">${UI.icon('edit', 'ic-sm')} Ubah</button>` }
        ]
      });
      box.onclick = e => { const b = e.target.closest('[data-dd]'); if (b) Inv.diskonModal(D.diskon.find(d => d.id === b.dataset.dd), reload); };
    }
  }
};
