/* =====================================================================
   LAPORAN KEUANGAN (Admin) — laba rugi, arus kas, produk terlaris,
   pembelian, stok menipis. Unduh PDF (server) & Excel (klien).
   ===================================================================== */
Pages.laporan = {
  title: 'Laporan Keuangan',
  tab: 'ringkasan',
  period: null,
  data: null,

  presets() {
    const t = UI.today(), dow = UI.weekday(t), mon = UI.addDays(t, -((dow + 6) % 7));
    return {
      hari: { label: 'Hari Ini', from: t, to: t },
      minggu: { label: 'Minggu Ini', from: mon, to: t },
      bulan: { label: 'Bulan Ini (' + UI.BULAN[+t.slice(5, 7) - 1] + ' ' + t.slice(0, 4) + ')', from: t.slice(0, 8) + '01', to: UI.lastDay(t.slice(0, 7)) },
      bulanlalu: { label: 'Bulan Lalu', from: UI.addDays(t.slice(0, 8) + '01', -1).slice(0, 8) + '01', to: UI.addDays(t.slice(0, 8) + '01', -1) },
      tahun: { label: 'Tahun ' + t.slice(0, 4), from: t.slice(0, 4) + '-01-01', to: t }
    };
  },

  async render(el) {
    const P = this.presets();
    if (!this.period) this.period = { key: 'bulan', from: P.bulan.from, to: P.bulan.to };
    el.innerHTML = UI.pageHead('Modul Finansial · Laporan', 'Laporan Keuangan',
      'Ringkasan laba rugi, arus kas, dan analisis performa menu. Semua waktu dalam WITA.',
      `<button class="btn" id="lp-pdf">${UI.icon('download')} Unduh PDF</button><button class="btn" id="lp-xls">${UI.icon('sheet')} Unduh Excel</button>
       <button class="btn btn-primary" id="lp-kas">${UI.icon('plus')} Catat Kas Lain</button>`) +
      `<div class="tabs" role="tablist">
        ${[['ringkasan', 'chart', 'Ringkasan & Laba Rugi'], ['kas', 'book', 'Buku Besar Arus Kas'], ['produk', 'fire', 'Penjualan & Menu Terlaris'], ['beli', 'cart', 'Pembelian & Stok']].map(([k, i, l]) => `<button class="tab" data-tab="${k}">${UI.icon(i, 'ic-sm')} ${l}</button>`).join('')}</div>
      <div class="win section-gap"><div class="win-body"><div class="row" style="gap:12px">
        <span class="lbl">Periode:</span>
        <div class="seg" id="lp-pre">${Object.keys(P).map(k => `<button data-p="${k}" class="${this.period.key === k ? 'on' : ''}">${P[k].label}</button>`).join('')}<button data-p="kustom" class="${this.period.key === 'kustom' ? 'on' : ''}">Kustom</button></div>
        <div class="row" style="gap:6px"><input class="input mono" type="date" id="lp-from" value="${this.period.from}" style="width:auto"><span class="mono">—</span><input class="input mono" type="date" id="lp-to" value="${this.period.to}" style="width:auto">
        <button class="btn btn-dark btn-sm" id="lp-go">Terapkan Filter</button></div></div></div></div>
      <div id="lp-body">${UI.skeleton(6)}</div>`;
    UI.$$('.tab', el).forEach(t => { t.classList.toggle('on', t.dataset.tab === this.tab); t.onclick = () => { this.tab = t.dataset.tab; UI.$$('.tab', el).forEach(x => x.classList.toggle('on', x === t)); this.renderBody(); }; });
    UI.$('#lp-pre').onclick = e => {
      const b = e.target.closest('[data-p]'); if (!b) return;
      if (b.dataset.p === 'kustom') { this.period.key = 'kustom'; UI.$$('#lp-pre button').forEach(x => x.classList.toggle('on', x === b)); UI.$('#lp-from').focus(); return; }
      const p = P[b.dataset.p]; this.period = { key: b.dataset.p, from: p.from, to: p.to };
      UI.$('#lp-from').value = p.from; UI.$('#lp-to').value = p.to;
      UI.$$('#lp-pre button').forEach(x => x.classList.toggle('on', x === b));
      this.load();
    };
    UI.$('#lp-go').onclick = () => {
      const f = UI.$('#lp-from').value, t = UI.$('#lp-to').value;
      if (!f || !t || t < f) return UI.toast('Rentang tanggal tidak valid.', 'error');
      this.period = { key: 'kustom', from: f, to: t };
      UI.$$('#lp-pre button').forEach(x => x.classList.toggle('on', x.dataset.p === 'kustom'));
      this.load();
    };
    UI.$('#lp-kas').onclick = () => this.openOtherTx(() => this.load());
    UI.$('#lp-xls').onclick = () => this.exportExcel();
    UI.$('#lp-pdf').onclick = e => UI.busy(e.currentTarget, async () => {
      const r = await API.safe('reportPdf', { from: this.period.from, to: this.period.to });
      if (r) { UI.downloadBase64(r.base64, r.filename); UI.toast('PDF diunduh' + (r.drive_url ? ' & disimpan di Google Drive.' : '.')); }
    });
    await this.load();
  },

  async load() {
    const body = UI.$('#lp-body'); if (!body) return;
    body.innerHTML = UI.skeleton(6);
    const r = await API.safe('report', { from: this.period.from, to: this.period.to });
    if (!r || !UI.$('#lp-body')) return;
    this.data = r.report;
    this.renderBody();
  },

  renderBody() {
    const R = this.data, body = UI.$('#lp-body');
    if (!R || !body) return;
    const s = R.summary;
    const range = `${UI.fmtDate(R.from)} – ${UI.fmtDate(R.to)}`;
    const stats = `<div class="stats five">
      ${UI.stat('Penjualan Bersih', UI.rp(s.penjualan_bersih), `<span>${s.nota} nota</span><span>Diskon ${UI.rp(s.diskon)}</span>`, { dot: 'navy' })}
      ${UI.stat('HPP Terjual (COGS)', `<span class="red">${UI.rp(s.hpp)}</span>`, `<span>Rasio HPP ${UI.pct(s.penjualan_bersih ? s.hpp / s.penjualan_bersih : 0)}</span>`)}
      ${UI.stat('Laba Kotor', `<span class="green">${UI.rp(s.laba_kotor)}</span>`, `<span>Margin kotor ${UI.pct(s.margin_kotor)}</span>`, { dot: 'green', tag: UI.badge(s.margin_kotor >= .55 ? 'Sehat' : 'Perlu cek', s.margin_kotor >= .55 ? 'green-t' : 'amber-t') })}
      ${UI.stat('Biaya Operasional', UI.rp(s.beban_operasional), `<span>Gaji ${UI.rp(s.biaya_gaji)}</span><span>Lain ${UI.rp(s.beban_lain)}</span>`, { dot: 'navy' })}
      ${UI.stat('Laba Bersih', UI.rp(s.laba_bersih), `<span>Margin bersih ${UI.pct(s.margin_bersih)}</span>`, { dark: true, tag: UI.badge(s.laba_bersih >= 0 ? 'PROFIT' : 'RUGI', s.laba_bersih >= 0 ? 'green' : 'red') })}
    </div>`;

    if (this.tab === 'ringkasan') {
      const maxB = Math.max(1, ...R.beban.map(b => b.nilai));
      const totB = R.beban.reduce((a, b) => a + b.nilai, 0);
      const peak = R.series.reduce((m, x) => x.penjualan > m.penjualan ? x : m, { penjualan: -1 });
      body.innerHTML = stats + `<div class="grid-73 section-gap">
        ${UI.win(`${UI.icon('trend')} Tren Pendapatan vs Beban (WITA)`, `<div class="legend"><span><i></i>Pendapatan penjualan</span><span><i class="dash"></i>HPP + beban operasional</span>
          ${peak.penjualan > 0 ? `<span class="badge b-alt">Puncak: ${R.monthly ? UI.fmtPeriode(peak.label) : UI.fmtDate(peak.label)} (${UI.rp(peak.penjualan)})</span>` : ''}</div><div class="chart-box"><canvas id="lp-chart"></canvas></div>`, { ctrls: false })}
        ${UI.win(`${UI.icon('wallet')} Komposisi Beban Usaha`, R.beban.length ? `<div class="stack" style="gap:14px">${R.beban.map((b, i) => `<div><div class="row between" style="flex-wrap:nowrap"><b style="font-size:13px">${UI.h(b.nama)}</b><span class="mono" style="font-size:12px">${UI.rp(b.nilai)} (${UI.pct(b.nilai / totB)})</span></div>
          <div style="margin-top:5px">${UI.bar(b.nilai / maxB, ['red', 'navy', 'amber', ''][i % 4])}</div></div>`).join('')}
          <div class="strip" style="margin:6px 0 0"><span>TOTAL BEBAN USAHA</span><b class="mono">${UI.rp(totB)}</b></div></div>` : UI.empty('Belum ada beban', 'pada periode ini.', 'wallet'), { ctrls: false })}
      </div>
      <div class="grid-2">
        ${UI.win(`${UI.icon('file')} Laporan Laba Rugi · ${range}`, `<table class="table"><tbody>
          ${[['Penjualan kotor', s.penjualan_kotor], ['Diskon penjualan', -s.diskon], ['Penjualan bersih', s.penjualan_bersih, 1], ['Harga pokok penjualan (HPP)', -s.hpp], ['LABA KOTOR', s.laba_kotor, 1],
            ['Pendapatan lain-lain', s.pendapatan_lain], ['Biaya gaji & upah', -s.biaya_gaji], ['Beban operasional lain', -s.beban_lain], ['Kerugian selisih stok opname', -Math.max(0, -s.selisih_opname)], ['LABA BERSIH', s.laba_bersih, 2]]
            .map(([l, v, b]) => `<tr style="${b ? 'font-weight:700' : ''}${b === 2 ? ';font-size:15px' : ''}"><td style="${b ? 'background:var(--alt)' : ''}">${l}</td><td class="num" style="${b ? 'background:var(--alt)' : ''}${v < 0 ? ';color:var(--red)' : ''}">${UI.rp(v)}</td></tr>`).join('')}
          </tbody></table><p class="help" style="margin:10px 0 0">Gaji masuk laporan bila sudah difinalisasi dan akhir bulan periode gaji berada dalam rentang. Pembelian bahan diakui sebagai beban saat terjual (HPP).</p>`, { flush: false, sq: 'navy', ctrls: false })}
        ${UI.win(`${UI.icon('cash')} Ringkasan Arus Kas`, `<table class="table"><tbody>
          <tr><td>Kas masuk</td><td class="num green">${UI.rp(s.kas_masuk)}</td></tr><tr><td>Kas keluar</td><td class="num red">${UI.rp(s.kas_keluar)}</td></tr>
          <tr style="font-weight:700"><td style="background:var(--alt)">Arus kas bersih</td><td class="num" style="background:var(--alt)">${UI.rp(s.kas_bersih)}</td></tr>
          <tr><td>Total pembelian bahan</td><td class="num">${UI.rp(s.pembelian)}</td></tr><tr><td>Transaksi dibatalkan</td><td class="num">${s.nota_batal} nota</td></tr></tbody></table>
          <div class="stack" style="gap:8px;margin-top:14px">${R.metode.map(m => `<div class="row between"><span>${UI.badge(m.nama, m.nama === 'Tunai' ? 'blue-t' : 'red-t')}</span><b class="mono">${UI.rp(m.total)}</b></div>`).join('')}</div>`, { ctrls: false })}
      </div>`;
      UI.chart(UI.$('#lp-chart'), {
        type: 'line',
        data: {
          labels: R.series.map(x => R.monthly ? UI.fmtPeriode(x.label) : `${+x.label.slice(8)} ${UI.BULAN[+x.label.slice(5, 7) - 1]}`),
          datasets: [
            { label: 'Pendapatan', data: R.series.map(x => x.penjualan), borderColor: '#C62828', backgroundColor: 'rgba(198,40,40,.12)', fill: true, borderWidth: 3, tension: .2, pointRadius: R.series.length > 40 ? 0 : 3, pointBackgroundColor: '#FFFDF7' },
            { label: 'HPP + Beban', data: R.series.map(x => x.beban), borderColor: '#1F2A44', borderDash: [6, 4], borderWidth: 2.5, tension: .2, pointRadius: 0 }
          ]
        },
        options: { maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${UI.rp(c.parsed.y)}` } } },
          scales: { y: { beginAtZero: true, ticks: { callback: v => UI.shortRp(v) }, grid: { color: 'rgba(31,42,68,.08)' } }, x: { grid: { display: false }, ticks: { maxTicksLimit: 12 } } } }
      }).catch(() => { });
    } else if (this.tab === 'kas') {
      const kats = [...new Set(R.ledger.map(x => x.kategori))];
      body.innerHTML = stats + `<div class="win" id="lp-l"></div>`;
      const st = { jenis: '', kat: '' };
      const tbl = UI.table(UI.$('#lp-l'), {
        rows: R.ledger, pageSize: 20, placeholder: 'Cari no. referensi, keterangan…', searchKeys: ['ref', 'ket', 'kategori', 'tanggal'],
        tools: `<select class="select" id="lk-j" style="width:auto"><option value="">Semua mutasi</option><option value="masuk">Kas masuk</option><option value="keluar">Kas keluar</option></select>
          <select class="select" id="lk-k" style="width:auto">${UI.options(kats, '', null, null, 'Semua sumber kas')}</select>`,
        columns: [
          { label: 'Tanggal & Waktu', render: x => `<span class="mono" style="font-size:12px">${UI.fmtDT(x.tanggal)}</span>` },
          { label: 'No. Referensi', render: x => `<b class="mono red">#${UI.h(x.ref)}</b>` },
          { label: 'Jenis', render: x => x.jenis === 'masuk' ? UI.badge('+ Masuk', 'green-t') : UI.badge('− Keluar', 'red-t') },
          { label: 'Kategori / Sumber', render: x => `<b style="font-size:13px">${UI.h(x.kategori)}</b>` },
          { label: 'Keterangan', render: x => `<span style="font-size:12.5px">${UI.h(x.ket || '-')}</span>` },
          { label: 'Pemasukan', num: true, render: x => x.jenis === 'masuk' ? `<span class="green">${UI.rp(x.nominal)}</span>` : '' },
          { label: 'Pengeluaran', num: true, render: x => x.jenis === 'keluar' ? `<span class="red">${UI.rp(x.nominal)}</span>` : '' },
          { label: '', render: x => x.can_void ? `<button class="btn btn-xs btn-ghost" data-vo="${UI.h(x.ref)}" title="Batalkan catatan kas">${UI.icon('trash', 'ic-sm')}</button>` : '' }
        ],
        foot: list => `<td colspan="5">SUBTOTAL (${list.length} entri)</td><td class="num green">${UI.rp(list.filter(x => x.jenis === 'masuk').reduce((a, b) => a + b.nominal, 0))}</td><td class="num red">${UI.rp(list.filter(x => x.jenis === 'keluar').reduce((a, b) => a + b.nominal, 0))}</td><td></td>`
      });
      const apply = () => tbl.setFilter(x => (!st.jenis || x.jenis === st.jenis) && (!st.kat || x.kategori === st.kat));
      UI.$('#lk-j').onchange = e => { st.jenis = e.target.value; apply(); };
      UI.$('#lk-k').onchange = e => { st.kat = e.target.value; apply(); };
      UI.$('#lp-l').onclick = async e => {
        const b = e.target.closest('[data-vo]'); if (!b) return;
        if (!(await UI.confirm(`Batalkan catatan kas <b>#${UI.h(b.dataset.vo)}</b>? Tindakan ini tercatat di log.`, { danger: true, okText: 'Batalkan' }))) return;
        const r = await API.safe('voidOtherTx', { id: b.dataset.vo }); if (r) { UI.toast(r.message); this.load(); }
      };
    } else if (this.tab === 'produk') {
      const kats = R.kategori.map(k => k.nama);
      const maxK = Math.max(1, ...R.kategori.map(k => k.omzet));
      body.innerHTML = stats + `<div class="grid-73 section-gap"><div class="win" id="lp-p"></div>
        ${UI.win(`${UI.icon('grid')} Omzet per Kategori`, R.kategori.length ? `<div class="stack" style="gap:12px">${R.kategori.map((k, i) => `<div><div class="row between"><b style="font-size:13px">${UI.h(k.nama)}</b><span class="mono" style="font-size:12px">${UI.rp(k.omzet)}</span></div><div style="margin-top:5px">${UI.bar(k.omzet / maxK, ['red', 'navy', 'amber', ''][i % 4])}</div></div>`).join('')}</div>` : UI.empty('Belum ada penjualan', '', 'coffee'), { ctrls: false })}</div>
        ${UI.win(`${UI.icon('calendar')} Penjualan ${R.monthly ? 'Bulanan' : 'Harian'}`, '<div id="lp-d"></div>', { flush: true })}`;
      const tbl = UI.table(UI.$('#lp-p'), {
        rows: R.produk, placeholder: 'Cari produk…', searchKeys: ['nama', 'kategori'],
        tools: `<select class="select" id="lpp-k" style="width:auto">${UI.options(kats, '', null, null, 'Semua kategori')}</select>`,
        empty: 'Belum ada produk terjual pada periode ini.',
        columns: [
          { label: '#', render: (p, i) => `<span class="rank ${p === R.produk[0] ? 'first' : ''}">${R.produk.indexOf(p) + 1}</span>` },
          { label: 'Produk', render: p => `<b>${UI.h(p.nama)}</b><div class="mono muted" style="font-size:11px">${UI.h(p.kategori)}</div>` },
          { label: 'Terjual', num: true, render: p => `<b>${UI.num(p.qty)}</b> porsi` },
          { label: 'Omzet (kotor)', num: true, render: p => UI.rp(p.omzet) },
          { label: 'HPP', num: true, render: p => `<span class="red">${UI.rp(p.hpp)}</span>` },
          { label: 'Laba Kotor', num: true, render: p => `<b class="green">${UI.rp(p.omzet - p.hpp)}</b>` },
          { label: 'Margin', num: true, render: p => UI.pct(p.omzet ? (p.omzet - p.hpp) / p.omzet : 0) }
        ]
      });
      UI.$('#lpp-k').onchange = e => tbl.setFilter(e.target.value ? p => p.kategori === e.target.value : null);
      UI.table(UI.$('#lp-d'), {
        rows: R.series.slice().reverse(), search: false, pageSize: 31,
        columns: [
          { label: R.monthly ? 'Bulan' : 'Tanggal', render: x => `<span class="mono">${R.monthly ? UI.fmtPeriode(x.label) : UI.HARI[UI.weekday(x.label)].slice(0, 3) + ', ' + UI.fmtDate(x.label)}</span>` },
          { label: 'Nota', num: true, render: x => x.nota },
          { label: 'Penjualan Bersih', num: true, render: x => `<b>${UI.rp(x.penjualan)}</b>` },
          { label: 'HPP + Beban', num: true, render: x => `<span class="red">${UI.rp(x.beban)}</span>` },
          { label: 'Selisih', num: true, render: x => `<span class="${x.penjualan - x.beban >= 0 ? 'green' : 'red'}">${UI.rp(x.penjualan - x.beban)}</span>` }
        ]
      });
    } else {
      body.innerHTML = stats + `<div class="grid-73"><div class="win" id="lp-b"></div>
        ${UI.win(`${UI.icon('alert')} Stok Menipis Saat Ini`, '<div id="lp-s"></div>', { flush: true, ctrls: false })}</div>`;
      UI.table(UI.$('#lp-b'), {
        rows: R.pembelian, placeholder: 'Cari bahan, supplier…', searchKeys: ['id', 'nama_bahan', 'supplier', 'keterangan'], empty: 'Tidak ada pembelian pada periode ini.',
        columns: [
          { label: 'Tanggal', render: p => `<span class="mono" style="font-size:12px">${UI.fmtDT(p.tanggal)}</span>` },
          { label: 'No.', render: p => `<b class="mono red">#${UI.h(p.id)}</b>` },
          { label: 'Bahan', render: p => `<b>${UI.h(p.nama_bahan)}</b>` },
          { label: 'Qty', num: true, render: p => `${UI.num(p.qty)} ${UI.h(p.satuan)}` },
          { label: 'Harga', num: true, render: p => UI.rp(p.harga_satuan) },
          { label: 'Total', num: true, render: p => `<b>${UI.rp(p.total)}</b>` },
          { label: 'Supplier', render: p => UI.h(p.supplier || '-') }
        ],
        foot: list => `<td colspan="5">TOTAL</td><td class="num">${UI.rp(list.reduce((a, b) => a + b.total, 0))}</td><td></td>`
      });
      UI.table(UI.$('#lp-s'), {
        rows: R.stok_menipis, search: false, paginate: false, empty: 'Semua stok aman ✓',
        columns: [
          { label: 'Bahan', render: b => `<b>${UI.h(b.nama)}</b>` },
          { label: 'Stok', num: true, render: b => `${UI.num(b.stok)} ${UI.h(b.satuan)}` },
          { label: 'Status', render: b => UI.stokBadge(b.status_stok) }
        ]
      });
    }
  },

  exportExcel() {
    const R = this.data; if (!R) return;
    const s = R.summary;
    UI.exportXlsx([
      { name: 'Laba Rugi', rows: [['Laporan Keuangan', (App.settings.nama_cafe || '')], ['Periode', `${R.from} s.d. ${R.to}`], [], ['Pos', 'Nilai (Rp)'],
        ['Penjualan kotor', s.penjualan_kotor], ['Diskon', -s.diskon], ['Penjualan bersih', s.penjualan_bersih], ['HPP', -s.hpp], ['Laba kotor', s.laba_kotor],
        ['Pendapatan lain', s.pendapatan_lain], ['Biaya gaji', -s.biaya_gaji], ['Beban operasional lain', -s.beban_lain], ['Kerugian selisih stok', -Math.max(0, -s.selisih_opname)], ['Laba bersih', s.laba_bersih],
        [], ['Kas masuk', s.kas_masuk], ['Kas keluar', s.kas_keluar], ['Arus kas bersih', s.kas_bersih], ['Jumlah nota', s.nota], ['Nota batal', s.nota_batal]] },
      { name: R.monthly ? 'Bulanan' : 'Harian', rows: [['Periode', 'Nota', 'Penjualan Bersih', 'HPP + Beban'], ...R.series.map(x => [x.label, x.nota, x.penjualan, x.beban])] },
      { name: 'Produk', rows: [['Produk', 'Kategori', 'Qty', 'Omzet', 'HPP', 'Laba Kotor'], ...R.produk.map(p => [p.nama, p.kategori, p.qty, p.omzet, p.hpp, p.omzet - p.hpp])] },
      { name: 'Arus Kas', rows: [['Tanggal', 'Referensi', 'Jenis', 'Kategori', 'Keterangan', 'Masuk', 'Keluar'], ...R.ledger.map(x => [x.tanggal, x.ref, x.jenis, x.kategori, x.ket, x.jenis === 'masuk' ? x.nominal : '', x.jenis === 'keluar' ? x.nominal : ''])] },
      { name: 'Pembelian', rows: [['Tanggal', 'No', 'Bahan', 'Qty', 'Satuan', 'Harga', 'Total', 'Supplier'], ...R.pembelian.map(p => [p.tanggal, p.id, p.nama_bahan, p.qty, p.satuan, p.harga_satuan, p.total, p.supplier])] },
      { name: 'Beban', rows: [['Pos Beban', 'Nilai'], ...R.beban.map(b => [b.nama, b.nilai])] },
      { name: 'Stok Menipis', rows: [['Bahan', 'Stok', 'Satuan', 'Minimum', 'Status'], ...R.stok_menipis.map(b => [b.nama, b.stok, b.satuan, b.stok_minimum, b.status_stok])] }
    ], `Laporan_Keuangan_${R.from}_${R.to}.xlsx`);
  },

  /** Modal catat pemasukan/pengeluaran lain (listrik, sewa, dll). Dipakai juga dari Dashboard. */
  openOtherTx(after) {
    const kat = { keluar: ['Listrik', 'Air', 'Internet / WiFi', 'Sewa Tempat', 'Gas', 'Servis Mesin', 'Kemasan & Perlengkapan', 'Kebersihan', 'Transportasi', 'Pemasaran', 'Pajak & Retribusi', 'Lain-lain'], masuk: ['Modal Tambahan', 'Pendapatan Event', 'Sewa Tempat (Masuk)', 'Lain-lain'] };
    const m = UI.modal({
      title: 'Catat Kas Lain',
      body: `<form id="ot-f" class="form-grid">
        <div class="field span-all"><label>Jenis</label><div class="seg" id="ot-j" style="width:100%;display:grid;grid-template-columns:1fr 1fr"><button type="button" data-j="keluar" class="on">− Pengeluaran</button><button type="button" data-j="masuk">+ Pemasukan</button></div></div>
        <div class="field"><label>Kategori</label><input class="input" name="kategori" list="ot-kl" required placeholder="Pilih / ketik"><datalist id="ot-kl"></datalist></div>
        <div class="field"><label>Tanggal</label><input class="input mono" type="date" name="tanggal" value="${UI.today()}" max="${UI.today()}"></div>
        <div class="field span-all"><label>Nominal (Rp)</label><input class="input mono" type="number" min="1" name="nominal" required></div>
        <div class="field span-all"><label>Keterangan</label><input class="input" name="keterangan" maxlength="200" placeholder="mis. Tagihan PLN Oktober"></div></form>`,
      foot: `<button class="btn btn-secondary" data-close>Batal</button><button class="btn btn-primary" id="ot-save">${UI.icon('save')} Simpan</button>`
    });
    let jenis = 'keluar';
    const setK = () => { UI.$('#ot-kl', m.el).innerHTML = kat[jenis].map(k => `<option value="${k}">`).join(''); };
    setK();
    UI.$('#ot-j', m.el).onclick = e => { const b = e.target.closest('[data-j]'); if (!b) return; jenis = b.dataset.j; UI.$$('#ot-j button', m.el).forEach(x => x.classList.toggle('on', x === b)); setK(); };
    UI.$('#ot-save', m.el).onclick = e => UI.busy(e.currentTarget, async () => {
      const f = UI.$('#ot-f', m.el); if (!f.reportValidity()) return;
      const r = await API.safe('addOtherTx', Object.assign({ jenis }, UI.formData(f)));
      if (r) { UI.toast(r.message); m.close(); if (after) after(); }
    });
  }
};
