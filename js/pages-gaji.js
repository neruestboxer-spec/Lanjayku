/* =====================================================================
   PENGGAJIAN, SLIP GAJI & KASBON
   Alur gaji: Hitung (draft) → Edit komponen → Finalisasi (memotong
   kasbon otomatis) → Kirim email / Unduh PDF.
   ===================================================================== */
const Gaji = {
  terbilang(n) {
    n = Math.floor(Math.abs(n));
    const s = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
    const f = x => x < 12 ? s[x] : x < 20 ? f(x - 10) + ' belas' : x < 100 ? f(Math.floor(x / 10)) + ' puluh ' + f(x % 10)
      : x < 200 ? 'seratus ' + f(x - 100) : x < 1000 ? f(Math.floor(x / 100)) + ' ratus ' + f(x % 100) : x < 2000 ? 'seribu ' + f(x - 1000)
        : x < 1e6 ? f(Math.floor(x / 1000)) + ' ribu ' + f(x % 1000) : x < 1e9 ? f(Math.floor(x / 1e6)) + ' juta ' + f(x % 1e6) : f(Math.floor(x / 1e9)) + ' miliar ' + f(x % 1e9);
    const t = f(n).replace(/\s+/g, ' ').trim();
    return (t ? t[0].toUpperCase() + t.slice(1) : 'Nol') + ' Rupiah';
  },
  bruto(g) { return g.gaji_pokok + g.tunjangan + g.bonus; },
  statusBadge(g) {
    if (g.status !== 'final') return UI.badge('Draft', 'amber-t');
    return g.status_kirim === 'terkirim' ? `${UI.badge('Terkirim', 'green')}<div class="mono muted" style="font-size:10.5px;margin-top:3px">${UI.fmtDT(g.waktu_kirim)}</div>` : `${UI.badge('Final', 'navy')}<div class="mono muted" style="font-size:10.5px;margin-top:3px">belum dikirim</div>`;
  },
  async downloadPdf(id) {
    const r = await API.safe('slipPdf', { id });
    if (r) UI.downloadBase64(r.base64, r.filename);
    return !!r;
  },

  editModal(g, after) {
    const m = UI.modal({
      title: `${UI.icon('settings')} Edit Komponen Gaji · ${UI.h(g.nama)} (${UI.h(g.id_karyawan)})`, size: 'lg', cls: 'red-bar',
      body: `<div class="row between" style="border:var(--line);background:var(--alt);padding:10px 12px;margin-bottom:16px">
          <div class="who"><span class="av">${UI.initials(g.nama)}</span><div><b>${UI.h(g.nama)} ${UI.badge(g.id_karyawan, 'red')}</b><span>${UI.h(g.jabatan)} · <span class="green">● ${g.hari_hadir} hari hadir, ${g.terlambat} terlambat</span></span></div></div>
          <span class="badge b-alt">${UI.icon('calendar', 'ic-sm')} Periode: ${UI.fmtPeriode(g.periode)}</span></div>
        <form id="eg-f"><div class="grid-2">
          <div class="win flat"><div class="win-bar"><div class="win-title" style="color:var(--green)">${UI.icon('plus')} Komponen Penerimaan (+)</div></div><div class="win-body stack" style="gap:12px">
            <div class="field"><label>1. Gaji pokok <span class="hint">${UI.icon('lock', 'ic-sm')} master</span></label><div class="input-group"><span class="addon">Rp</span><input class="input mono" type="number" min="0" name="gaji_pokok" value="${g.gaji_pokok}"></div></div>
            <div class="field"><label>2. Tunjangan</label><div class="input-group"><span class="addon">Rp</span><input class="input mono" type="number" min="0" name="tunjangan" value="${g.tunjangan}"></div></div>
            <div class="field"><label>3. Bonus / insentif <span class="hint red">performa</span></label><div class="input-group"><span class="addon">Rp</span><input class="input mono" type="number" min="0" name="bonus" value="${g.bonus}"></div></div>
          </div><div class="win-foot" style="justify-content:space-between;font-size:14px"><b style="font-family:var(--f-display)">Subtotal Penerimaan</b><b class="green" id="eg-in" style="font-size:18px"></b></div></div>
          <div class="win flat"><div class="win-bar"><div class="win-title" style="color:var(--red)">${UI.icon('minus')} Komponen Potongan (−)</div></div><div class="win-body stack" style="gap:12px">
            <div class="field"><label>Angsuran kasbon <span class="hint">sisa kasbon aktif: ${UI.rp(g.kasbon_sisa)}</span></label><div class="input-group"><span class="addon">Rp</span><input class="input mono" type="number" min="0" max="${g.kasbon_sisa}" name="potongan_kasbon" value="${g.potongan_kasbon}"></div></div>
            <div class="field"><label>Potongan lain <span class="hint">kerusakan, BPJS, dll.</span></label><div class="input-group"><span class="addon">Rp</span><input class="input mono" type="number" min="0" name="potongan_lain" value="${g.potongan_lain}"></div></div>
            <div class="field"><label>Catatan di slip</label><input class="input" name="catatan" maxlength="200" value="${UI.h(g.catatan || '')}" placeholder="mis. Bonus target omzet shift siang"></div>
          </div><div class="win-foot" style="justify-content:space-between;font-size:14px"><b style="font-family:var(--f-display)">Subtotal Potongan</b><b class="red" id="eg-out" style="font-size:18px"></b></div></div>
        </div>
        <div style="background:var(--ink);color:#fff;border:var(--line);padding:16px;margin-top:16px;display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;align-items:center">
          <div><div class="mono" style="font-size:11px;letter-spacing:.08em"><span class="dot amber"></span> TOTAL GAJI BERSIH (TAKE HOME PAY) · LIVE PREVIEW</div><div class="mono" style="font-size:30px;font-weight:700" id="eg-net"></div><i style="font-size:12px" id="eg-tb"></i></div>
          <div class="mono" style="font-size:12px;text-align:right" id="eg-rumus"></div></div>
        <label class="check" style="margin-top:14px"><input type="checkbox" name="update_master"> Perbarui juga gaji pokok &amp; tunjangan tetap di data karyawan (berlaku bulan berikutnya)</label>
        </form>`,
      foot: `<span class="mono muted" style="font-size:11px;margin-right:auto">Tersimpan ke sheet "Penggajian" (WITA)</span><button class="btn btn-secondary" data-close>Batal / Tutup</button><button class="btn btn-primary" id="eg-save">${UI.icon('save')} Simpan Perubahan Komponen</button>`
    });
    const f = UI.$('#eg-f', m.el);
    const calc = () => {
      const d = UI.formData(f), v = k => Number(d[k]) || 0;
      const inn = v('gaji_pokok') + v('tunjangan') + v('bonus'), out = v('potongan_kasbon') + v('potongan_lain'), net = inn - out;
      UI.$('#eg-in', m.el).textContent = UI.rp(inn); UI.$('#eg-out', m.el).textContent = '− ' + UI.rp(out);
      UI.$('#eg-net', m.el).textContent = UI.rp(net); UI.$('#eg-tb', m.el).textContent = 'Terbilang: "' + this.terbilang(net) + '"';
      UI.$('#eg-rumus', m.el).innerHTML = `<b>Rincian rumus:</b><br>${UI.rp(inn)} (penerimaan) − ${UI.rp(out)} (potongan)<br><span style="color:#FFB95F">= ${UI.rp(net)}</span>`;
    };
    f.addEventListener('input', calc); calc();
    UI.$('#eg-save', m.el).onclick = e => UI.busy(e.currentTarget, async () => {
      const d = UI.formData(f);
      if (Number(d.potongan_kasbon) > g.kasbon_sisa) return UI.toast('Potongan kasbon melebihi sisa kasbon aktif.', 'error');
      const r = await API.safe('payrollEdit', Object.assign({ id: g.id }, d));
      if (r) { UI.toast(r.message); m.close(); if (after) after(); }
    });
  }
};

/* ============================ PENGGAJIAN (ADMIN) ============================ */
Pages.gaji = {
  title: 'Penggajian & Slip',
  periode: null,
  sel: new Set(),
  async render(el) {
    this.periode = this.periode || UI.thisMonth();
    this.sel = new Set();
    el.innerHTML = UI.pageHead(`Modul SDM · Payroll · Tahun Buku ${this.periode.slice(0, 4)}`, 'Penggajian &amp; Slip Gaji',
      `Periode <b>${UI.fmtPeriode(this.periode)}</b> · Hitung → Edit → Finalisasi (potong kasbon otomatis) → Kirim email / Unduh PDF.`,
      `<label class="sr-only" for="pg-per">Periode</label><input class="input mono" type="month" id="pg-per" value="${this.periode}" style="width:auto">
       <button class="btn" id="pg-xls">${UI.icon('sheet')} Rekap Excel</button><button class="btn" id="pg-sendall">${UI.icon('mail')} Kirim Semua Slip</button>
       <button class="btn btn-primary" id="pg-calc">${UI.icon('sync')} Hitung Gaji Periode Ini</button>`) + `<div id="pg-body">${UI.skeleton(6)}</div>`;
    UI.$('#pg-per').onchange = e => { if (e.target.value) { this.periode = e.target.value; this.render(el); } };
    UI.$('#pg-calc').onclick = e => UI.busy(e.currentTarget, async () => {
      if (this.rows && this.rows.some(g => g.status === 'draft') && !(await UI.confirm('Hitung ulang akan memperbarui gaji pokok, tunjangan, kehadiran, dan potongan kasbon dari data terbaru untuk slip berstatus <b>draft</b>. Bonus & potongan lain tetap dipertahankan. Lanjutkan?'))) return;
      const r = await API.safe('payrollCompute', { periode: this.periode }); if (r) { UI.toast(r.message); this.load(); }
    });
    UI.$('#pg-xls').onclick = () => this.exportXls();
    UI.$('#pg-sendall').onclick = () => this.sendAll();
    await this.load();
  },

  async load() {
    const r = await API.safe('payrollList', { periode: this.periode });
    const body = UI.$('#pg-body'); if (!r || !body) return;
    this.rows = r.rows; this.quota = r.mail_quota;
    const rows = r.rows, sum = k => rows.reduce((a, b) => a + (typeof k === 'function' ? k(b) : b[k]), 0);
    const sent = rows.filter(g => g.status_kirim === 'terkirim').length;
    body.innerHTML = `<div class="stats">
        ${UI.stat('Total Gaji Bersih', UI.rp(sum('gaji_bersih')), `<span>${UI.icon('checkc', 'ic-sm')} Dari gaji, absensi & kasbon</span>`, { tag: UI.badge(rows.length + ' karyawan', 'green') })}
        ${UI.stat('Tunjangan &amp; Bonus', UI.rp(sum('tunjangan') + sum('bonus')), `<span>Tunj. ${UI.rp(sum('tunjangan'))}</span><span>Bonus ${UI.rp(sum('bonus'))}</span>`, { dot: 'navy' })}
        ${UI.stat('Potongan Kasbon &amp; Lain', `<span class="red">${UI.rp(sum('potongan_kasbon') + sum('potongan_lain'))}</span>`, `<span>Kasbon ${UI.rp(sum('potongan_kasbon'))}</span><span>Lain ${UI.rp(sum('potongan_lain'))}</span>`)}
        ${UI.stat('Status Pengiriman', `${sent} / ${rows.length} <small>terkirim</small>`, `<div style="flex:1">${UI.bar(rows.length ? sent / rows.length : 0)}</div><span>Kuota email: ${r.mail_quota}/hari</span>`, { dot: 'green' })}
      </div>
      ${r.belum_dihitung.length ? `<div class="note amber section-gap">${UI.icon('alert')}<div><b>${r.belum_dihitung.length} karyawan aktif belum dihitung</b> untuk periode ini: ${r.belum_dihitung.map(k => UI.h(k.nama)).join(', ')}. Klik <b>Hitung Gaji Periode Ini</b>.</div></div>` : ''}
      <div class="win" id="pg-t"></div>
      <div id="pg-bulk"></div>`;
    const tbl = UI.table(UI.$('#pg-t'), {
      rows, placeholder: 'Cari nama karyawan…', searchKeys: ['nama', 'id_karyawan', 'jabatan'], pageSize: 25,
      empty: 'Belum ada data gaji periode ini. Klik "Hitung Gaji Periode Ini".',
      tools: `<span class="mono muted" style="font-size:12px;margin-left:auto">TAMPILAN: ${rows.length} DATA</span><button class="btn btn-sm" id="pg-ref">${UI.icon('refresh', 'ic-sm')} Segarkan</button>`,
      columns: [
        { label: '<input type="checkbox" id="pg-all" aria-label="Pilih semua" style="width:18px;height:18px;accent-color:var(--red)">', render: g => `<input type="checkbox" data-sel="${g.id}" ${this.sel.has(g.id) ? 'checked' : ''} aria-label="Pilih ${UI.h(g.nama)}" style="width:18px;height:18px;accent-color:var(--red)">` },
        { label: 'Karyawan', render: g => `<div class="who"><span class="av">${UI.initials(g.nama)}</span><div><b>${UI.h(g.nama)}</b><span class="red">#${UI.h(g.id_karyawan)}</span><span>${UI.h(g.jabatan)}</span></div></div>` },
        { label: 'Gaji Pokok', num: true, render: g => UI.rp(g.gaji_pokok) },
        { label: 'Tunjangan', num: true, render: g => UI.rp(g.tunjangan) },
        { label: 'Bonus', num: true, render: g => UI.rp(g.bonus) },
        { label: 'Potongan', num: true, render: g => `<span class="red">${g.potongan_kasbon + g.potongan_lain ? '−' + UI.rp(g.potongan_kasbon + g.potongan_lain) : UI.rp(0)}</span><div class="muted" style="font-size:10.5px">kasbon ${UI.rp(g.potongan_kasbon)}${g.potongan_lain ? ' · lain ' + UI.rp(g.potongan_lain) : ''}</div>` },
        { label: 'Gaji Bersih', num: true, render: g => `<b style="font-size:14.5px">${UI.rp(g.gaji_bersih)}</b><div class="muted" style="font-size:10.5px">${g.hari_hadir} hari hadir</div>` },
        { label: 'Status Slip', render: g => Gaji.statusBadge(g) },
        { label: 'Aksi', render: g => `<div class="acts">
            ${g.status === 'draft' ? `<button class="btn btn-xs" data-ed="${g.id}" title="Edit komponen">${UI.icon('edit', 'ic-sm')}</button><button class="btn btn-xs btn-dark" data-fin="${g.id}">Final</button>`
            : (g.status_kirim !== 'terkirim' ? `<button class="btn btn-xs btn-ghost" data-reo="${g.id}" title="Buka kembali ke draft">${UI.icon('edit', 'ic-sm')}</button>` : '')}
            <a class="btn btn-xs btn-primary" href="#/slip/${encodeURIComponent(g.id)}">Slip</a></div>` }
      ],
      foot: list => `<td></td><td>Σ TOTAL (${list.length} staf)</td><td class="num">${UI.rp(list.reduce((a, b) => a + b.gaji_pokok, 0))}</td><td class="num">${UI.rp(list.reduce((a, b) => a + b.tunjangan, 0))}</td><td class="num">${UI.rp(list.reduce((a, b) => a + b.bonus, 0))}</td>
        <td class="num red">−${UI.rp(list.reduce((a, b) => a + b.potongan_kasbon + b.potongan_lain, 0))}</td><td class="num" style="font-size:16px">${UI.rp(list.reduce((a, b) => a + b.gaji_bersih, 0))}</td><td colspan="2">${list.filter(g => g.status_kirim === 'terkirim').length} terkirim</td>`
    });
    const box = UI.$('#pg-t');
    UI.$('#pg-ref').onclick = () => this.load();
    box.addEventListener('change', e => {
      if (e.target.id === 'pg-all') { tbl.visible.forEach(g => e.target.checked ? this.sel.add(g.id) : this.sel.delete(g.id)); tbl.refresh(); }
      else if (e.target.dataset.sel) { e.target.checked ? this.sel.add(e.target.dataset.sel) : this.sel.delete(e.target.dataset.sel); }
      this.renderBulk();
    });
    box.addEventListener('click', async e => {
      const ed = e.target.closest('[data-ed]'), fin = e.target.closest('[data-fin]'), reo = e.target.closest('[data-reo]');
      if (ed) Gaji.editModal(rows.find(g => g.id === ed.dataset.ed), () => this.load());
      if (fin) this.finalize([fin.dataset.fin]);
      if (reo) {
        if (!(await UI.confirm('Buka kembali slip ini ke status draft? Potongan kasbon yang sudah dipotong akan dikembalikan.'))) return;
        const r = await API.safe('payrollReopen', { id: reo.dataset.reo }); if (r) { UI.toast(r.message); this.load(); }
      }
    });
    this.renderBulk();
  },

  renderBulk() {
    const box = UI.$('#pg-bulk'); if (!box) return;
    const ids = [...this.sel], rows = (this.rows || []).filter(g => this.sel.has(g.id));
    if (!ids.length) { box.innerHTML = ''; return; }
    box.innerHTML = `<div class="win navy-bar" style="position:sticky;bottom:12px;margin-top:16px;z-index:5"><div class="win-bar"><div class="win-title"><span class="dot amber"></span> ${ids.length} karyawan terpilih (${rows.slice(0, 3).map(g => UI.h(g.nama.split(' ')[0])).join(', ')}${rows.length > 3 ? '…' : ''}) · Total ${UI.rp(rows.reduce((a, b) => a + b.gaji_bersih, 0))}</div></div>
      <div class="win-body row"><button class="btn btn-dark btn-sm" id="bk-fin">${UI.icon('lock', 'ic-sm')} Finalisasi</button><button class="btn btn-success btn-sm" id="bk-mail">${UI.icon('mail', 'ic-sm')} Kirim Slip ke Email</button>
      <button class="btn btn-sm" id="bk-pdf">${UI.icon('download', 'ic-sm')} Unduh PDF</button><button class="btn btn-ghost btn-sm" id="bk-x">${UI.icon('x', 'ic-sm')} Batal Pilih</button></div></div>`;
    UI.$('#bk-x').onclick = () => { this.sel.clear(); this.load(); };
    UI.$('#bk-fin').onclick = () => this.finalize(rows.filter(g => g.status === 'draft').map(g => g.id));
    UI.$('#bk-mail').onclick = () => this.send(rows);
    UI.$('#bk-pdf').onclick = e => UI.busy(e.currentTarget, async () => { for (const g of rows) await Gaji.downloadPdf(g.id); });
  },

  async finalize(ids) {
    if (!ids.length) return UI.toast('Tidak ada slip draft yang dipilih.', 'warn');
    if (!(await UI.confirm(`Finalisasi <b>${ids.length}</b> slip gaji? Potongan kasbon akan dikurangkan dari sisa kasbon karyawan dan slip siap dikirim. Slip final tidak bisa diedit kecuali dibuka kembali (sebelum dikirim).`, { okText: 'Finalisasi' }))) return;
    const r = await API.safe('payrollFinalize', { ids }); if (r) { UI.toast(r.message); this.sel.clear(); this.load(); }
  },

  async send(rows) {
    const drafts = rows.filter(g => g.status === 'draft');
    const targets = rows.filter(g => g.status_kirim !== 'terkirim');
    if (!targets.length) return UI.toast('Semua slip terpilih sudah terkirim.', 'info');
    if (!(await UI.confirm(`Kirim <b>${targets.length}</b> slip ke email karyawan${drafts.length ? ` (${drafts.length} slip draft akan <b>difinalisasi</b> lebih dulu)` : ''}? Kuota email tersisa hari ini: ${this.quota}.`, { okText: 'Kirim Sekarang' }))) return;
    if (drafts.length) { const f = await API.safe('payrollFinalize', { ids: drafts.map(g => g.id) }); if (!f) return; }
    const r = await API.safe('payrollSend', { ids: targets.map(g => g.id) });
    if (!r) return this.load();
    const bad = r.results.filter(x => !x.ok);
    if (bad.length) UI.modal({ title: 'Hasil Pengiriman Slip', body: `<p>${UI.h(r.message)}</p><div class="note red">${UI.icon('alert')}<div>${bad.map(x => `<b>${UI.h(x.nama)}</b>: ${UI.h(x.error)}`).join('<br>')}</div></div>`, foot: '<button class="btn btn-primary" data-close>OK</button>' });
    else UI.toast(r.message);
    this.sel.clear(); this.load();
  },
  sendAll() {
    if (!this.rows || !this.rows.length) return UI.toast('Belum ada data gaji. Hitung gaji dulu.', 'warn');
    this.send(this.rows);
  },
  exportXls() {
    const rows = this.rows || [];
    UI.exportXlsx([{ name: 'Penggajian ' + this.periode, rows: [['ID Slip', 'ID Karyawan', 'Nama', 'Jabatan', 'Hari Hadir', 'Terlambat', 'Gaji Pokok', 'Tunjangan', 'Bonus', 'Potongan Kasbon', 'Potongan Lain', 'Gaji Bersih', 'Status', 'Status Kirim', 'Catatan'],
      ...rows.map(g => [g.id, g.id_karyawan, g.nama, g.jabatan, g.hari_hadir, g.terlambat, g.gaji_pokok, g.tunjangan, g.bonus, g.potongan_kasbon, g.potongan_lain, g.gaji_bersih, g.status, g.status_kirim, g.catatan]),
      ['', '', 'TOTAL', '', '', '', ...['gaji_pokok', 'tunjangan', 'bonus', 'potongan_kasbon', 'potongan_lain', 'gaji_bersih'].map(k => rows.reduce((a, b) => a + b[k], 0))]] }], `Rekap_Gaji_${this.periode}.xlsx`);
  }
};

/* ============================ PRATINJAU SLIP (A4) ============================ */
Pages.slip = {
  title: 'Slip Gaji',
  opt: { ttd: true, kasbon: true },
  async render(el, id) {
    if (!id) { location.replace(App.isAdmin() ? '#/gaji' : '#/slip-saya'); return; }
    el.innerHTML = UI.skeleton(8);
    const r = await API.safe('slipData', { id });
    if (!r) { el.innerHTML = UI.empty('Slip tidak dapat dibuka', '', 'file'); return; }
    const S = r.slip, g = S.gaji, admin = App.isAdmin();
    let list = [];
    if (admin) { const l = await API.safe('payrollList', { periode: g.periode }); list = (l && l.rows) || []; this.quota = l ? l.mail_quota : '-'; }
    const idx = list.findIndex(x => x.id === g.id);
    el.innerHTML = `<div class="strip no-print"><a class="btn btn-sm btn-ghost" href="${admin ? '#/gaji' : '#/slip-saya'}">${UI.icon('arrowL', 'ic-sm')} Kembali</a>
        ${admin && list.length ? `<span class="row" style="gap:6px"><a class="btn btn-xs ${idx <= 0 ? 'hidden' : ''}" href="#/slip/${encodeURIComponent((list[idx - 1] || {}).id)}">${UI.icon('chevL', 'ic-sm')}</a><span class="badge b-alt">KARYAWAN ${idx + 1} DARI ${list.length} · <span class="red">${UI.h(g.nama.toUpperCase())}</span></span><a class="btn btn-xs ${idx >= list.length - 1 ? 'hidden' : ''}" href="#/slip/${encodeURIComponent((list[idx + 1] || {}).id)}">${UI.icon('chevR', 'ic-sm')}</a></span>` : ''}
        <span class="row">${admin ? `<button class="btn btn-sm" id="sl-mail" ${g.status !== 'final' ? 'disabled title="Finalisasi dulu"' : ''}>${UI.icon('mail', 'ic-sm')} Kirim ke Email</button>` : ''}
        <button class="btn btn-sm" id="sl-print">${UI.icon('printer', 'ic-sm')} Cetak</button><button class="btn btn-sm btn-primary" id="sl-pdf">${UI.icon('download', 'ic-sm')} Unduh PDF (A4)</button></span></div>
      <div class="${admin ? 'slip-layout' : ''}">
        ${admin ? `<div class="stack no-print">
          ${UI.win('Pengiriman Email &amp; Status', `<div class="lbl">Email karyawan</div><div class="mono" style="margin:4px 0 10px;overflow-wrap:anywhere">${UI.h(S.karyawan.email || '— belum diisi —')}</div>
            <div class="lbl">Status notifikasi</div><div style="margin:6px 0 10px">${Gaji.statusBadge(g)}</div>
            <div class="mono" style="font-size:11.5px;border:var(--line);padding:8px">Kuota MailApp Google: <b>${this.quota}</b> email tersisa hari ini</div>
            ${g.status === 'draft' ? `<div class="note amber" style="margin-top:10px">${UI.icon('alert')}<div>Slip masih <b>draft</b>. Finalisasi di halaman Penggajian sebelum dikirim.</div></div>` : ''}`, { right: UI.badge('AUTO', 'navy'), ctrls: false })}
          ${UI.win(`${UI.icon('users')} Karyawan (${UI.fmtPeriode(g.periode)})`, list.map(x => `<a href="#/slip/${encodeURIComponent(x.id)}" style="display:flex;justify-content:space-between;gap:8px;padding:10px 12px;border-bottom:1.5px solid var(--ink);text-decoration:none;color:${x.id === g.id ? '#fff' : 'var(--ink)'};background:${x.id === g.id ? 'var(--ink)' : 'transparent'}">
              <span><b style="font-family:var(--f-display)">${UI.h(x.nama)}</b><br><small>${UI.h(x.jabatan)}</small></span><span class="right">${x.status_kirim === 'terkirim' ? UI.badge('TERKIRIM', 'green') : x.status === 'final' ? UI.badge('FINAL', 'navy') : UI.badge('DRAFT', 'amber')}<br><b class="mono" style="font-size:12px">${UI.rp(x.gaji_bersih)}</b></span></a>`).join(''), { flush: true, ctrls: false })}
          ${UI.win(`${UI.icon('settings')} Pengaturan Cetak Slip`, `<div class="stack" style="gap:10px"><div class="row between"><span>Format kertas</span>${UI.badge('A4 (Potret)', 'alt')}</div>
            <label class="check"><input type="checkbox" data-o="ttd" ${this.opt.ttd ? 'checked' : ''}> Kolom tanda tangan</label><label class="check"><input type="checkbox" data-o="kasbon" ${this.opt.kasbon ? 'checked' : ''}> Info sisa kasbon</label></div>`, { ctrls: false })}
        </div>` : ''}
        <div><p class="mono muted no-print" style="font-size:11px;text-align:center;margin:0 0 10px">Standar kertas A4 (210 × 297 mm) · Pratinjau</p><div id="sl-paper"></div></div>
      </div>`;
    const draw = () => { UI.$('#sl-paper').innerHTML = this.paper(S); };
    draw();
    UI.$$('[data-o]').forEach(c => c.onchange = () => { this.opt[c.dataset.o] = c.checked; draw(); });
    UI.$('#sl-print').onclick = () => window.print();
    UI.$('#sl-pdf').onclick = e => UI.busy(e.currentTarget, () => Gaji.downloadPdf(g.id));
    const mail = UI.$('#sl-mail');
    if (mail) mail.onclick = e => UI.busy(e.currentTarget, async () => {
      if (!(await UI.confirm(`Kirim slip ${UI.h(g.nama)} ke <b>${UI.h(S.karyawan.email || '(email kosong)')}</b>?`, { okText: 'Kirim' }))) return;
      const r2 = await API.safe('payrollSend', { ids: [g.id] });
      if (r2) { const x = r2.results[0]; x.ok ? UI.toast('Slip terkirim ke ' + S.karyawan.email) : UI.toast('Gagal: ' + x.error, 'error'); this.render(el, id); }
    });
  },

  paper(S) {
    const g = S.gaji, k = S.karyawan, st = S.settings;
    const ln = (a, b, sub) => `<div class="ln"><span>${a}${sub ? `<div class="mono muted" style="font-size:10.5px">${sub}</div>` : ''}</span><b>${UI.rp(b)}</b></div>`;
    return `<article class="paper">
      <div class="kop"><div class="kop-name"><span class="brand-logo" style="width:48px;height:48px">${UI.icon('coffee', 'ic-lg')}</span><div><h2>${UI.h(st.nama_cafe)}</h2>
        <div style="font-size:11.5px;margin-top:4px">${UI.h(st.alamat)}<br>${UI.h([st.telepon && 'Telp/WA: ' + st.telepon, st.email_cafe && 'Email: ' + st.email_cafe].filter(Boolean).join(' · '))}</div></div></div>
        <div><div class="kop-title"><b>SLIP GAJI KARYAWAN</b><span class="mono red" style="font-size:11px;font-weight:700">PERIODE: ${UI.fmtPeriode(g.periode).toUpperCase()}</span></div>
        <div class="mono right" style="font-size:11px;margin-top:8px">No. Dokumen: <b>#${UI.h(g.id)}</b><br>Status: ${g.status === 'final' ? 'FINAL' : 'DRAFT'}</div></div></div>
      <div class="ident">
        <div><span>ID Karyawan</span><b class="mono">: ${UI.h(k.id)}</b></div><div><span>Status kerja</span>: ${k.status_aktif ? 'Aktif' : 'Nonaktif'}</div>
        <div><span>Nama lengkap</span><b>: ${UI.h(g.nama)}</b></div><div><span>Tanggal masuk</span>: ${UI.fmtDate(k.tanggal_masuk)}</div>
        <div><span>Jabatan</span>: ${UI.h(g.jabatan)}</div><div><span>Rekap presensi</span>: <span class="mono">${g.hari_hadir} hari · ${g.terlambat} telat</span></div>
        <div><span>Rekening</span>: ${UI.h(k.rekening || '-')}</div><div><span>Email</span>: ${UI.h(k.email || '-')}</div>
      </div>
      <div class="comp"><div><h4>A. PENERIMAAN / PENGHASILAN ${UI.badge('KREDIT', 'navy')}</h4>
          ${ln('1. Gaji pokok bulanan', g.gaji_pokok)}${ln('2. Tunjangan', g.tunjangan)}${ln('3. Bonus / insentif', g.bonus)}
          <div class="sub"><span>SUBTOTAL BRUTO (A)</span><b>${UI.rp(Gaji.bruto(g))}</b></div></div>
        <div><h4>B. POTONGAN GAJI ${UI.badge('DEBIT', 'red')}</h4>
          ${ln('1. Angsuran kasbon karyawan', g.potongan_kasbon, S.kasbon_ref.length ? 'Ref: ' + S.kasbon_ref.map(UI.h).join(', ') : '')}${ln('2. Potongan lain-lain', g.potongan_lain)}
          <div class="sub"><span>TOTAL POTONGAN (B)</span><b class="red">${UI.rp(g.potongan_kasbon + g.potongan_lain)}</b></div></div></div>
      ${this.opt.kasbon && S.kasbon_sisa > 0 ? `<div style="border:var(--line);padding:10px 12px;margin-top:14px;font-size:12.5px"><b>Catatan kasbon aktif:</b> sisa pokok pinjaman setelah periode ini <b class="red mono">${UI.rp(S.kasbon_sisa)}</b>.</div>` : ''}
      <div class="thp"><div><div class="mono" style="font-size:12px;letter-spacing:.06em;font-weight:700">TOTAL GAJI BERSIH DITERIMA (TAKE HOME PAY)</div><i style="font-size:12px">Terbilang: <b>${Gaji.terbilang(g.gaji_bersih)}</b></i></div>
        <div class="right"><div class="v">${UI.rp(g.gaji_bersih)}</div>${g.status === 'final' ? UI.badge('STATUS: FINAL', 'green') : UI.badge('DRAFT', 'amber')}</div></div>
      ${g.catatan ? `<p style="margin:12px 0 0;font-size:12.5px"><b>Keterangan:</b> ${UI.h(g.catatan)}</p>` : ''}
      <div class="notice"><b>Pemberitahuan manajemen:</b> ${UI.h(st.catatan_slip)}</div>
      ${this.opt.ttd ? `<div class="sign"><div><b>DITERIMA OLEH KARYAWAN,</b><div class="space"></div><b>${UI.h(g.nama)}</b><div class="mono muted" style="font-size:11px">${UI.h(g.jabatan)} · ${UI.h(k.id)}</div></div>
        <div><b>DISAHKAN OLEH MANAJEMEN,</b><div class="space"></div><b>${UI.h(st.penandatangan_nama)}</b><div class="mono muted" style="font-size:11px">${UI.h(st.penandatangan_jabatan)}</div></div></div>` : ''}
      <div class="mono muted" style="font-size:10px;margin-top:22px;border-top:1px solid rgba(31,42,68,.25);padding-top:8px;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><span>Sistem Komputasi Gaji Lanjayku OS (Google Apps Script)</span><span>Dicetak: ${UI.fmtDT(UI.today() + ' ' + UI.clockText().time)}</span></div>
    </article>`;
  }
};

/* ============================ SLIP SAYA (KARYAWAN) ============================ */
Pages['slip-saya'] = {
  title: 'Slip Gaji Saya',
  async render(el) {
    el.innerHTML = UI.pageHead('SDM · Slip Gaji', 'Slip Gaji Saya', 'Slip gaji yang sudah diterbitkan admin. Anda hanya dapat melihat slip milik sendiri.') + '<div class="win" id="ss-t"></div>';
    const r = await API.safe('mySlips');
    if (!r || !UI.$('#ss-t')) return;
    UI.table(UI.$('#ss-t'), {
      rows: r.slips, search: false, empty: App.user.id_karyawan ? 'Belum ada slip gaji yang diterbitkan.' : 'Akun ini belum ditautkan ke data karyawan.',
      columns: [
        { label: 'Periode', render: g => `<b>${UI.fmtPeriode(g.periode)}</b><div class="mono muted" style="font-size:11px">#${UI.h(g.id)}</div>` },
        { label: 'Penerimaan', num: true, render: g => UI.rp(Gaji.bruto(g)) },
        { label: 'Potongan', num: true, render: g => `<span class="red">−${UI.rp(g.potongan_kasbon + g.potongan_lain)}</span>` },
        { label: 'Gaji Bersih', num: true, render: g => `<b>${UI.rp(g.gaji_bersih)}</b>` },
        { label: 'Aksi', render: g => `<div class="row" style="flex-wrap:nowrap;gap:6px"><a class="btn btn-xs" href="#/slip/${encodeURIComponent(g.id)}">${UI.icon('eye', 'ic-sm')} Lihat</a><button class="btn btn-xs btn-primary" data-pdf="${g.id}">${UI.icon('download', 'ic-sm')} PDF</button></div>` }
      ]
    });
    UI.$('#ss-t').onclick = e => { const b = e.target.closest('[data-pdf]'); if (b) UI.busy(b, () => Gaji.downloadPdf(b.dataset.pdf)); };
  }
};

/* ============================ KASBON (ADMIN) ============================ */
Pages.kasbon = {
  title: 'Kasbon',
  tab: 'aktif',
  async render(el) {
    el.innerHTML = UI.pageHead('Modul SDM · Pinjaman Karyawan', 'Kasbon Karyawan', 'Catat kasbon dan cicilannya. Sisa kasbon berkurang otomatis saat gaji difinalisasi, atau lewat pembayaran tunai.',
      `<button class="btn btn-primary" id="kb-new">${UI.icon('plus')} Catat Kasbon Baru</button>`) + `<div id="kb-body">${UI.skeleton(5)}</div>`;
    UI.$('#kb-new').onclick = () => this.addModal(() => this.render(el));
    const r = await API.safe('kasbonList');
    if (!r || !UI.$('#kb-body')) return;
    this.data = r;
    const aktif = r.kasbon.filter(k => k.status === 'aktif'), m = UI.thisMonth();
    const bayarBln = r.pembayaran.filter(p => p.tanggal.slice(0, 7) === m).reduce((a, b) => a + b.nominal, 0);
    UI.$('#kb-body').innerHTML = `<div class="stats">
        ${UI.stat('Total Sisa Kasbon Aktif', `<span class="amber">${UI.rp(aktif.reduce((a, b) => a + b.sisa, 0))}</span>`, `<span>Dari pokok ${UI.rp(aktif.reduce((a, b) => a + b.nominal, 0))}</span>`, { dot: 'amber' })}
        ${UI.stat('Kasbon Aktif', `${aktif.length} <small>kasbon</small>`, `<span>${new Set(aktif.map(k => k.id_karyawan)).size} karyawan</span>`, { dot: 'navy' })}
        ${UI.stat('Dibayar Bulan Ini', `<span class="green">${UI.rp(bayarBln)}</span>`, '<span>Potong gaji + tunai</span>', { dot: 'green' })}
        ${UI.stat('Kasbon Lunas', `${r.kasbon.filter(k => k.status === 'lunas').length} <small>kasbon</small>`, '<span>Sepanjang waktu</span>')}
      </div>
      <div class="tabs">${[['aktif', 'Kasbon Aktif', aktif.length], ['semua', 'Riwayat Semua', r.kasbon.length], ['bayar', 'Pembayaran', r.pembayaran.length]].map(([k, l, n]) => `<button class="tab" data-tab="${k}">${l} <span class="count">${n}</span></button>`).join('')}</div>
      <div class="win" id="kb-t"></div>`;
    UI.$$('.tab', el).forEach(t => t.onclick = () => { this.tab = t.dataset.tab; this.renderTab(el); });
    this.renderTab(el);
  },
  renderTab(el) {
    const r = this.data, box = UI.$('#kb-t');
    UI.$$('.tab', el).forEach(t => t.classList.toggle('on', t.dataset.tab === this.tab));
    const kSel = `<select class="select" id="kb-k" style="width:auto">${UI.options(r.karyawan, '', 'id', k => k.nama, 'Semua karyawan')}</select>`;
    let tbl;
    if (this.tab === 'bayar') {
      tbl = UI.table(box, {
        rows: r.pembayaran, placeholder: 'Cari ID kasbon…', searchKeys: ['id', 'id_kasbon', 'id_penggajian', 'keterangan'], tools: kSel, empty: 'Belum ada pembayaran kasbon.',
        columns: [
          { label: 'Tanggal', render: p => `<span class="mono" style="font-size:12px">${UI.fmtDT(p.tanggal)}</span>` },
          { label: 'No.', render: p => `<b class="mono">#${UI.h(p.id)}</b>` },
          { label: 'Kasbon', render: p => `<span class="mono red">#${UI.h(p.id_kasbon)}</span>` },
          { label: 'Karyawan', render: p => UI.h((r.karyawan.find(k => k.id === p.id_karyawan) || {}).nama || p.id_karyawan) },
          { label: 'Sumber', render: p => p.sumber === 'gaji' ? UI.badge('Potong gaji ' + (p.id_penggajian || ''), 'navy') : UI.badge('Tunai', 'green-t') },
          { label: 'Nominal', num: true, render: p => `<b class="green">${UI.rp(p.nominal)}</b>` },
          { label: 'Keterangan', render: p => `<span style="font-size:12.5px">${UI.h(p.keterangan || '-')}</span>` }
        ]
      });
    } else {
      const rows = this.tab === 'aktif' ? r.kasbon.filter(k => k.status === 'aktif') : r.kasbon;
      tbl = UI.table(box, {
        rows, placeholder: 'Cari nama atau ID…', searchKeys: ['id', 'nama', 'keterangan', 'status'], tools: kSel,
        empty: this.tab === 'aktif' ? 'Tidak ada kasbon aktif.' : 'Belum ada kasbon.',
        columns: [
          { label: 'No. & Tanggal', render: k => `<b class="mono red">#${UI.h(k.id)}</b><div class="mono muted" style="font-size:11px">${UI.fmtDate(k.tanggal)}</div>` },
          { label: 'Karyawan', render: k => `<div class="who"><span class="av">${UI.initials(k.nama)}</span><div><b>${UI.h(k.nama)}</b><span>${UI.h(k.id_karyawan)}</span></div></div>` },
          { label: 'Pokok', num: true, render: k => UI.rp(k.nominal) },
          { label: 'Cicilan/Bln', num: true, render: k => UI.rp(k.cicilan) },
          { label: 'Sisa', num: true, render: k => `<b class="${k.sisa ? 'amber' : 'green'}">${UI.rp(k.sisa)}</b><div style="margin-top:4px">${UI.bar(k.nominal ? 1 - k.sisa / k.nominal : 1, 'navy')}</div>` },
          { label: 'Status', render: k => ({ aktif: UI.badge('Aktif', 'amber'), lunas: UI.badge('Lunas', 'green'), batal: UI.badge('Batal', 'red') })[k.status] || UI.h(k.status) },
          { label: 'Keterangan', render: k => `<span style="font-size:12.5px">${UI.h(k.keterangan || '-')}</span>` },
          { label: 'Aksi', render: k => k.status === 'aktif' ? `<div class="row" style="flex-wrap:nowrap;gap:6px"><button class="btn btn-xs" data-pay="${k.id}">${UI.icon('cash', 'ic-sm')} Bayar Tunai</button><button class="btn btn-xs btn-ghost" data-cn="${k.id}" title="Batalkan">${UI.icon('x', 'ic-sm')}</button></div>` : '' }
        ],
        foot: list => `<td colspan="2">TOTAL (${list.length})</td><td class="num">${UI.rp(list.reduce((a, b) => a + b.nominal, 0))}</td><td></td><td class="num">${UI.rp(list.reduce((a, b) => a + b.sisa, 0))}</td><td colspan="3"></td>`
      });
    }
    UI.$('#kb-k').onchange = e => tbl.setFilter(e.target.value ? x => x.id_karyawan === e.target.value : null);
    box.onclick = async e => {
      const pay = e.target.closest('[data-pay]'), cn = e.target.closest('[data-cn]');
      if (pay) {
        const k = r.kasbon.find(x => x.id === pay.dataset.pay);
        const v = await UI.prompt(`Pembayaran tunai kasbon <b>#${UI.h(k.id)}</b> (${UI.h(k.nama)}). Sisa: <b>${UI.rp(k.sisa)}</b>.`, { title: 'Bayar Kasbon Tunai', label: 'Nominal dibayar (Rp)', type: 'number', value: k.sisa, okText: 'Catat Pembayaran' });
        if (!v) return;
        const res = await API.safe('kasbonPay', { id: k.id, nominal: v }); if (res) { UI.toast(res.message); this.render(UI.$('#page')); }
      }
      if (cn) {
        if (!(await UI.confirm(`Batalkan kasbon <b>#${UI.h(cn.dataset.cn)}</b>? Hanya bisa bila belum ada pembayaran.`, { danger: true, okText: 'Batalkan Kasbon' }))) return;
        const res = await API.safe('kasbonCancel', { id: cn.dataset.cn }); if (res) { UI.toast(res.message); this.render(UI.$('#page')); }
      }
    };
  },
  async addModal(after) {
    const kar = ((this.data && this.data.karyawan) || []).filter(k => k.aktif);
    const m = UI.modal({
      title: 'Catat Kasbon Baru',
      body: `<form id="ka-f" class="form-grid">
        <div class="field span-all"><label>Karyawan</label><select class="select" name="id_karyawan" required>${UI.options(kar, '', 'id', k => `${k.nama} · ${k.jabatan}`, '— Pilih karyawan —')}</select></div>
        <div class="field"><label>Nominal kasbon (Rp)</label><input class="input mono" type="number" min="1000" step="1000" name="nominal" required></div>
        <div class="field"><label>Cicilan per bulan (Rp) <span class="hint">dipotong dari gaji</span></label><input class="input mono" type="number" min="0" step="1000" name="cicilan" placeholder="kosong = lunas sekali potong"></div>
        <div class="field"><label>Tanggal</label><input class="input mono" type="date" name="tanggal" value="${UI.today()}" max="${UI.today()}"></div>
        <div class="field"><label>Keterangan</label><input class="input" name="keterangan" maxlength="200" placeholder="mis. Keperluan darurat keluarga"></div>
        <div class="note blue span-all">${UI.icon('info')}<div>Kasbon tercatat sebagai <b>kas keluar</b> di Buku Besar. Cicilan dipotong otomatis saat gaji periode berikutnya difinalisasi.</div></div></form>`,
      foot: `<button class="btn btn-secondary" data-close>Batal</button><button class="btn btn-primary" id="ka-save">${UI.icon('save')} Simpan Kasbon</button>`
    });
    UI.$('#ka-save', m.el).onclick = e => UI.busy(e.currentTarget, async () => {
      const f = UI.$('#ka-f', m.el); if (!f.reportValidity()) return;
      const r = await API.safe('kasbonAdd', UI.formData(f)); if (r) { UI.toast(r.message); m.close(); if (after) after(); }
    });
  }
};
