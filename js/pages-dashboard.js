/* =====================================================================
   DASHBOARD (Admin) — ringkasan hari ini, grafik 7 hari, terlaris,
   stok menipis, transaksi terbaru, kehadiran.
   ===================================================================== */
Pages.dashboard = {
  title: 'Dashboard',
  async render(el) {
    el.innerHTML = UI.pageHead('Modul · Dashboard', 'Dashboard Operasional Cafe',
      'Ringkasan performa penjualan, ketersediaan bahan baku, dan kehadiran staf hari ini (WITA).',
      `<a class="btn" href="#/pembelian">${UI.icon('plus')} Pembelian Bahan</a>
       <button class="btn" id="db-kas">${UI.icon('receipt')} Catat Pengeluaran</button>
       <a class="btn btn-primary" href="#/kasir">${UI.icon('register')} Buka Kasir</a>`) +
      `<div class="strip"><span><span class="dot live"></span> <b>STATUS CLOUD LIVE</b> · Zona waktu Makassar / WITA (UTC+8)</span>
        <span class="row"><span id="db-sync" class="muted">Memuat…</span><button class="btn btn-xs" id="db-refresh">${UI.icon('refresh', 'ic-sm')} Segarkan</button></span></div>
      <div id="db-body">${UI.skeleton(6)}</div>`;
    UI.$('#db-refresh').onclick = () => this.load();
    UI.$('#db-kas').onclick = () => Pages.laporan.openOtherTx(() => this.load());
    await this.load();
    const t = setInterval(() => { if (!document.hidden) this.load(true); }, 120000);
    App.onLeave(() => clearInterval(t));
  },

  async load(quiet) {
    const r = await API.safe('dashboard');
    const body = UI.$('#db-body');
    if (!r || !body) return;
    const s = r.summary, a = r.attendance;
    UI.$('#db-sync').textContent = 'Diperbarui ' + UI.clockText().time + ' WITA';
    const growth = s.pertumbuhan === null ? UI.badge('Belum ada pembanding', 'alt')
      : UI.badge((s.pertumbuhan >= 0 ? '▲ ' : '▼ ') + UI.pct(Math.abs(s.pertumbuhan)), s.pertumbuhan >= 0 ? 'green-t' : 'red-t');
    body.innerHTML = `<div class="stats">
      ${UI.stat('Penjualan Hari Ini', UI.rp(s.omzet), `<span>Kemarin: ${UI.rp(s.omzet_kemarin)}</span>`, { tag: growth })}
      ${UI.stat('Laba Kotor Hari Ini', UI.rp(s.laba_kotor), `<span>HPP terjual</span><span class="red">${UI.rp(s.hpp)}</span>`, { dot: 'green', tag: UI.badge('Margin ' + UI.pct(s.margin), 'green-t') })}
      ${UI.stat('Jumlah Transaksi', `${s.nota} <small>nota</small>`, `<span>Rata-rata ${UI.rp(s.rata2)}</span><span>Non-tunai ${UI.pct(s.non_tunai, 0)}</span>`, { dot: 'navy' })}
      ${UI.stat('Karyawan Hadir', `${a.hadir} / ${a.total} <small>staf</small>`, `<div style="flex:1">${UI.bar(a.total ? a.hadir / a.total : 0)}</div>`, { dot: 'amber', tag: a.terlambat ? UI.badge(a.terlambat + ' terlambat', 'amber-t') : UI.badge('Tepat waktu', 'green-t') })}
    </div>
    <div class="grid-73 section-gap">
      ${UI.win(`${UI.icon('trend')} Penjualan 7 Hari Terakhir (WITA)`, `<div class="legend"><span><i></i>Minggu ini</span><span><i class="dash"></i>7 hari sebelumnya</span></div>
        <div class="chart-box"><canvas id="db-chart" aria-label="Grafik penjualan 7 hari"></canvas></div>`, { ctrls: false })}
      ${UI.win(`${UI.icon('fire')} Produk Terlaris Hari Ini`, r.top.length ? `<div class="stack" style="gap:10px">${r.top.map((p, i) => `
        <div class="list-item" style="flex-direction:column;align-items:stretch;gap:8px"><div class="row" style="flex-wrap:nowrap"><span class="rank ${i === 0 ? 'first' : ''}">${i + 1}</span>
          <div style="flex:1;min-width:0"><b style="font-family:var(--f-display)">${UI.h(p.nama)}</b><div class="mono muted" style="font-size:11px">${UI.h(p.kategori)} · ${UI.rp(p.harga)}</div></div>
          <div class="right"><b class="mono">${p.qty} porsi</b><div class="mono red" style="font-size:11px">${UI.rp(p.omzet)}</div></div></div>
          ${UI.bar(p.qty / r.top[0].qty, 'red')}</div>`).join('')}</div>` : UI.empty('Belum ada penjualan hari ini', 'Data muncul setelah transaksi pertama.', 'coffee'), { ctrls: false })}
    </div>
    <div class="grid-2">
      ${UI.win(`${UI.icon('alert')} Peringatan Stok Bahan`, `<div id="db-low"></div>`, { flush: true, right: `<span class="badge ${r.low_stock.length ? 'b-amber' : 'b-green'}">${r.low_stock.length} bahan</span><a class="btn btn-xs" href="#/pembelian">+ Beli</a>`, ctrls: false })}
      ${UI.win(`${UI.icon('history')} Transaksi Terbaru (Hari Ini)`, `<div id="db-recent"></div>`, { flush: true, right: `<a class="link-btn" href="#/kasir">Ke kasir →</a>`, ctrls: false })}
    </div>`;

    UI.table(UI.$('#db-low'), {
      search: false, paginate: false, rows: r.low_stock, empty: 'Semua stok bahan aman ✓',
      columns: [
        { label: 'Nama Bahan', render: b => `<b>${UI.h(b.nama)}</b>` },
        { label: 'Stok', num: true, render: b => `<span class="${b.status_stok === 'Aman' ? '' : 'red'}">${UI.num(b.stok)}</span>` },
        { label: 'Min.', num: true, render: b => UI.num(b.stok_minimum) },
        { label: 'Satuan', render: b => UI.h(b.satuan) },
        { label: 'Status', render: b => UI.stokBadge(b.status_stok) }
      ]
    });
    UI.table(UI.$('#db-recent'), {
      search: false, paginate: false, rows: r.recent, empty: 'Belum ada transaksi hari ini.',
      columns: [
        { label: 'Nota & Jam', render: t => `<b class="mono">#${UI.h(t.id)}</b><div class="mono muted" style="font-size:11px">${UI.fmtTime(t.tanggal)} WITA</div>` },
        { label: 'Kasir', render: t => UI.h(t.nama_kasir) },
        { label: 'Metode', render: t => UI.badge(t.metode_bayar, t.metode_bayar === 'Tunai' ? 'blue-t' : 'red-t') },
        { label: 'Total', num: true, render: t => `<b>${UI.rp(t.total)}</b>` }
      ]
    });

    const labels = r.series.labels.map(d => `${UI.HARI[UI.weekday(d)].slice(0, 3)} (${+d.slice(8)})`);
    UI.chart(UI.$('#db-chart'), {
      type: 'line',
      data: {
        labels, datasets: [
          { label: 'Minggu ini', data: r.series.minggu_ini, borderColor: '#C62828', backgroundColor: 'rgba(198,40,40,.12)', fill: true, tension: .25, borderWidth: 3, pointBackgroundColor: '#FFFDF7', pointBorderColor: '#C62828', pointBorderWidth: 2, pointRadius: 4 },
          { label: '7 hari sebelumnya', data: r.series.minggu_lalu, borderColor: '#1F2A44', borderDash: [5, 4], borderWidth: 2, pointRadius: 0, tension: .25 }
        ]
      },
      options: {
        maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${UI.rp(c.parsed.y)}` } } },
        scales: { y: { beginAtZero: true, ticks: { callback: v => UI.shortRp(v) }, grid: { color: 'rgba(31,42,68,.08)' } }, x: { grid: { display: false } } }
      }
    }).catch(() => { });
    if (!quiet) { /* data pertama dimuat */ }
  }
};
