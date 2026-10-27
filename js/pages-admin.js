/* =====================================================================
   PENGATURAN APLIKASI & AKUN KARYAWAN (Admin)
   ===================================================================== */
Pages.pengaturan = {
  title: 'Pengaturan',
  tab: 'profil',
  async render(el) {
    el.innerHTML = UI.pageHead('Modul Pengaturan · Konfigurasi', 'Pengaturan Aplikasi &amp; Profil Cafe',
      'Identitas cafe, jadwal shift & presensi QR, kebijakan stok, dan format slip gaji. Disimpan di sheet "Pengaturan".') + `<div id="st-body">${UI.skeleton(6)}</div>`;
    const r = await API.safe('getSettings');
    if (!r || !UI.$('#st-body')) return;
    this.data = r;
    const s = r.settings;
    const f = (name, label, opt = {}) => `<div class="field ${opt.cls || ''}"><label for="st-${name}">${label}${opt.hint ? ` <span class="hint">${opt.hint}</span>` : ''}</label>
      ${opt.textarea ? `<textarea class="textarea" id="st-${name}" name="${name}" maxlength="300">${UI.h(s[name])}</textarea>`
        : `<input class="input ${opt.mono ? 'mono' : ''}" id="st-${name}" name="${name}" type="${opt.type || 'text'}" value="${UI.h(s[name])}" ${opt.attr || ''}>`}</div>`;
    const tabs = [['profil', 'Profil Cafe'], ['presensi', 'Jam Kerja & Presensi'], ['stok', 'Manajemen Stok'], ['slip', 'Slip Gaji & Notifikasi'], ['sistem', 'Sistem & Log']];
    UI.$('#st-body').innerHTML = `<div class="tabs">${tabs.map(([k, l]) => `<button class="tab" type="button" data-tab="${k}">${l}</button>`).join('')}</div>
      <form id="st-f">
        <section data-sec="profil">${UI.win(`${UI.icon('coffee')} Profil Cafe &amp; Identitas Outlet`, `<div class="note blue" style="margin-bottom:16px">${UI.icon('info')}<div>Identitas ini dipakai di kop laporan keuangan, rekap absensi, dan slip gaji karyawan.</div></div>
          <div class="form-grid">${f('nama_cafe', 'Nama cafe / usaha', { cls: 'span-all', attr: 'required maxlength="80"' })}${f('alamat', 'Alamat lengkap outlet', { cls: 'span-all' })}
          ${f('telepon', 'Nomor telepon / WhatsApp', { mono: true })}${f('email_cafe', 'Email resmi cafe', { type: 'email' })}
          <div class="field span-all"><label>Zona waktu operasional</label><div class="input-group"><input class="input mono" value="Asia/Makassar (WITA · UTC+8)" disabled><span class="addon">${UI.icon('lock', 'ic-sm')} TERKUNCI</span></div></div></div>`)}</section>
        <section data-sec="presensi">${UI.win(`${UI.icon('clock')} Jam Kerja, Shift &amp; Presensi QR`, `<div class="grid-2 section-gap">
            <div style="border:var(--line);padding:14px;background:var(--bg)"><div class="form-grid">${f('shift1_nama', 'Nama shift 1', { cls: 'span-all' })}${f('shift1_masuk', 'Jam masuk (WITA)', { type: 'time', mono: true })}${f('shift1_pulang', 'Jam pulang (WITA)', { type: 'time', mono: true })}</div></div>
            <div style="border:var(--line);padding:14px;background:var(--bg)"><div class="form-grid">${f('shift2_nama', 'Nama shift 2', { cls: 'span-all' })}${f('shift2_masuk', 'Jam masuk (WITA)', { type: 'time', mono: true })}${f('shift2_pulang', 'Jam pulang (WITA)', { type: 'time', mono: true })}</div></div></div>
          <div class="form-grid">${f('toleransi_menit', 'Toleransi keterlambatan', { type: 'number', mono: true, hint: 'menit', attr: 'min="0" max="240"' })}
            ${f('qr_interval', 'Interval rotasi token QR', { type: 'number', mono: true, hint: 'detik (min. 15)', attr: 'min="15" max="3600"' })}</div>
          <div class="lbl" style="margin:18px 0 8px">Batasi absen di area outlet (opsional)</div>
          <div class="form-grid three">${f('lokasi_lat', 'Latitude', { mono: true, hint: 'kosong = tanpa cek lokasi' })}${f('lokasi_lng', 'Longitude', { mono: true })}${f('lokasi_radius', 'Radius', { type: 'number', mono: true, hint: 'meter', attr: 'min="20"' })}</div>
          <button type="button" class="btn btn-sm" id="st-loc" style="margin-top:10px">${UI.icon('pin', 'ic-sm')} Isi dengan lokasi saya sekarang</button>
          <p class="help">Bila diisi, karyawan wajib mengizinkan GPS dan berada dalam radius outlet saat absen.</p>`)}</section>
        <section data-sec="stok">${UI.win(`${UI.icon('box')} Inventaris &amp; Stok Bahan Baku`, `<div class="form-grid">${f('stok_min_default', 'Stok minimum default', { type: 'number', mono: true, hint: 'untuk bahan baru', attr: 'min="0" step="any"' })}
            <div class="field"><label>Metode harga pokok (HPP)</label><div class="input-group"><input class="input" value="Rata-rata tertimbang (WAC)" disabled><span class="addon">${UI.icon('lock', 'ic-sm')}</span></div></div></div>
          <div class="lbl" style="margin:18px 0 8px">Kebijakan saat stok bahan tidak cukup di kasir</div>
          <input type="hidden" name="izinkan_stok_minus" id="st-minus" value="${UI.h(s.izinkan_stok_minus)}">
          <div class="grid-2">${[['true', 'Izinkan dengan peringatan', 'Kasir tetap bisa menyimpan transaksi; stok menjadi minus untuk ditinjau saat stok opname.', 'Rekomendasi'], ['false', 'Blokir transaksi', 'Menu dengan stok bahan kurang tidak bisa dijual sampai stok ditambah.', '']].map(([v, t, d, b]) =>
            `<label class="list-item" style="cursor:pointer;align-items:flex-start"><input type="radio" name="_minus" value="${v}" ${String(s.izinkan_stok_minus) === v ? 'checked' : ''} style="width:20px;height:20px;accent-color:var(--red)"><div><b>${t}</b> ${b ? UI.badge(b, 'alt') : ''}<div class="help">${d}</div></div></label>`).join('')}</div>`)}</section>
        <section data-sec="slip">${UI.win(`${UI.icon('mail')} Format Slip Gaji &amp; Email Gmail`, `<div class="strip">${UI.icon('mail')} <span>Kuota pengiriman Gmail (MailApp) tersisa hari ini: <b>${r.mail_quota}</b> email</span>${UI.badge(r.mail_quota > 20 ? 'Normal' : 'Menipis', r.mail_quota > 20 ? 'green' : 'amber')}</div>
          <div class="form-grid">${f('email_pengirim', 'Nama pengirim email')}${f('subjek_slip', 'Format subjek email slip', { hint: '{nama_cafe} {periode} {nama}' })}
          ${f('catatan_slip', 'Catatan kaki slip gaji (A4 / PDF)', { cls: 'span-all', textarea: true })}
          ${f('penandatangan_nama', 'Nama penandatangan')}${f('penandatangan_jabatan', 'Jabatan penandatangan')}</div>`)}</section>
        <section data-sec="sistem">${UI.win(`${UI.icon('shield')} Sistem &amp; Google Workspace`, `<dl class="kv"><dt>Versi backend</dt><dd class="mono">${UI.h(r.version)}</dd><dt>Database</dt><dd>${r.spreadsheet_url ? `<a href="${UI.h(r.spreadsheet_url)}" target="_blank" rel="noopener">Buka Google Spreadsheet ↗</a>` : '-'}</dd>
            <dt>Folder Drive</dt><dd>${r.folder_url ? `<a href="${UI.h(r.folder_url)}" target="_blank" rel="noopener">Buka folder PDF (slip &amp; laporan) ↗</a>` : '-'}</dd><dt>Zona waktu</dt><dd class="mono">Asia/Makassar (WITA)</dd></dl>
          <div class="note amber" style="margin-top:14px">${UI.icon('alert')}<div><b>Cadangan berkala:</b> buka spreadsheet → File → Buat salinan, setiap minggu/bulan. Rahasia aplikasi tersimpan di Script Properties (tidak tampil di sini).</div></div>
          <div class="lbl" style="margin:18px 0 8px">Log aktivitas terbaru</div><div class="win flat" id="st-log"></div>`)}</section>
      </form>
      <div class="win navy-bar" style="position:sticky;bottom:12px;margin-top:20px;z-index:5" id="st-bar"><div class="win-body row between">
        <span class="mono" style="font-size:12px" id="st-state"><span class="dot"></span> Semua pengaturan tersimpan</span>
        <span class="row"><span class="mono muted hide-mobile" style="font-size:11px">Ctrl + S</span><button class="btn btn-sm" type="button" id="st-reset">Batal / Reset</button><button class="btn btn-primary btn-sm" type="button" id="st-save">${UI.icon('save', 'ic-sm')} Simpan Semua Pengaturan</button></span></div></div>`;
    const form = UI.$('#st-f');
    const show = () => { UI.$$('.tab', el).forEach(t => t.classList.toggle('on', t.dataset.tab === this.tab)); UI.$$('[data-sec]', form).forEach(x => x.classList.toggle('hidden', x.dataset.sec !== this.tab)); };
    UI.$$('.tab', el).forEach(t => t.onclick = () => { this.tab = t.dataset.tab; show(); if (this.tab === 'sistem') this.loadLog(); });
    show(); if (this.tab === 'sistem') this.loadLog();
    let dirty = false;
    const mark = () => { dirty = true; UI.$('#st-state').innerHTML = '<span class="dot amber"></span> Ada perubahan belum disimpan'; };
    form.addEventListener('input', mark);
    form.addEventListener('change', e => { if (e.target.name === '_minus') UI.$('#st-minus').value = e.target.value; mark(); });
    UI.$('#st-reset').onclick = () => this.render(el);
    UI.$('#st-loc').onclick = () => {
      if (!navigator.geolocation) return UI.toast('Browser tidak mendukung lokasi.', 'error');
      navigator.geolocation.getCurrentPosition(p => { UI.$('#st-lokasi_lat').value = p.coords.latitude.toFixed(6); UI.$('#st-lokasi_lng').value = p.coords.longitude.toFixed(6); mark(); UI.toast('Lokasi terisi. Jangan lupa simpan.'); },
        () => UI.toast('Gagal membaca lokasi. Izinkan akses lokasi di browser.', 'error'), { enableHighAccuracy: true, timeout: 12000 });
    };
    const save = btn => UI.busy(btn, async () => {
      const d = UI.formData(form); delete d._minus;
      const res = await API.safe('saveSettings', { settings: d });
      if (res) { dirty = false; UI.toast(res.message); UI.$('#st-state').innerHTML = `<span class="dot"></span> Tersimpan ${UI.clockText().time} WITA`; await App.refreshCatalog(); }
    });
    UI.$('#st-save').onclick = e => save(e.currentTarget);
    const key = e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(UI.$('#st-save')); } };
    const unload = e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    document.addEventListener('keydown', key); window.addEventListener('beforeunload', unload);
    App.onLeave(() => { document.removeEventListener('keydown', key); window.removeEventListener('beforeunload', unload); });
  },
  async loadLog() {
    const box = UI.$('#st-log'); if (!box || box.dataset.loaded) return;
    box.dataset.loaded = '1'; box.innerHTML = UI.skeleton(3);
    const r = await API.safe('logList', { limit: 150 });
    if (r && box.isConnected) Pages.akun.logTable(box, r.logs);
  }
};

/* ============================ AKUN & KARYAWAN ============================ */
Pages.akun = {
  title: 'Akun Karyawan',
  tab: 'akun',
  async render(el) {
    el.innerHTML = UI.pageHead('Modul SDM · Pengguna &amp; RBAC', 'Akun &amp; Hak Akses Karyawan',
      'Kelola data karyawan, akun login, peran, dan reset password. Hak akses divalidasi di server untuk setiap aksi.',
      `<button class="btn" id="ak-knew">${UI.icon('user')} Tambah Karyawan</button><button class="btn btn-primary" id="ak-unew">${UI.icon('plus')} Tambah Akun Pengguna</button>`) + `<div id="ak-body">${UI.skeleton(6)}</div>`;
    UI.$('#ak-knew').onclick = () => this.karyawanModal(null);
    UI.$('#ak-unew').onclick = () => this.userModal(null);
    await this.load();
  },
  async load() {
    const r = await API.safe('usersList');
    const body = UI.$('#ak-body'); if (!r || !body) return;
    this.data = r;
    const U = r.users, aktif = U.filter(u => u.status_aktif);
    body.innerHTML = `<div class="stats">
        ${UI.stat('Total Akun', `${U.length} <small>akun</small>`, `<span>${r.karyawan.filter(k => k.status_aktif).length} karyawan aktif</span>`)}
        ${UI.stat('Akun Aktif', `<span class="green">${aktif.length}</span> <small>aktif</small>`, `<span>Nonaktif: ${U.length - aktif.length}</span>`, { dot: 'green' })}
        ${UI.stat('Peran (RBAC)', `${U.filter(u => u.role === 'admin').length} <small>admin</small> · ${U.filter(u => u.role !== 'admin').length} <small>staf</small>`, '<span>Validasi di backend GAS</span>', { dot: 'navy' })}
        ${UI.stat('Keamanan Kredensial', '<span class="green" style="font-size:19px">SHA-256 + Salt</span>', '<span>Tanpa password teks biasa</span>', { dot: 'green' })}
      </div>
      <div class="tabs">${[['akun', 'users', 'Akun Pengguna', U.length], ['karyawan', 'user', 'Data Karyawan', r.karyawan.length], ['rbac', 'shield', 'Matriks Hak Akses', ''], ['log', 'history', 'Log Aktivitas', '']]
        .map(([k, i, l, n]) => `<button class="tab" data-tab="${k}">${UI.icon(i, 'ic-sm')} ${l}${n !== '' ? ` <span class="count">${n}</span>` : ''}</button>`).join('')}</div><div id="ak-tab"></div>`;
    UI.$$('.tab', body).forEach(t => t.onclick = () => { this.tab = t.dataset.tab; this.renderTab(); });
    this.renderTab();
  },
  renderTab() {
    const r = this.data, box = UI.$('#ak-tab');
    UI.$$('#ak-body .tab').forEach(t => t.classList.toggle('on', t.dataset.tab === this.tab));
    box.onclick = null;
    if (this.tab === 'akun') {
      box.innerHTML = '<div class="win" id="ak-u"></div>';
      UI.table(UI.$('#ak-u'), {
        rows: r.users, placeholder: 'Cari username, nama atau ID staf…', searchKeys: ['username', 'nama', 'id', 'id_karyawan', 'role'],
        columns: [
          { label: 'Pengguna', render: u => `<div class="who"><span class="av" style="background:${u.role === 'admin' ? 'var(--red)' : 'var(--ink)'}">${UI.initials(u.nama || u.username)}</span><div><b class="mono" style="font-size:13px">${UI.h(u.username)}</b><span>ID: ${UI.h(u.id)}</span></div></div>` },
          { label: 'Nama & ID Staf', render: u => u.id_karyawan ? `<b>${UI.h(u.nama)}</b><div class="mono muted" style="font-size:11px">#${UI.h(u.id_karyawan)} · ${UI.h(u.jabatan)}</div>` : '<span class="muted">— tidak ditautkan —</span>' },
          { label: 'Peran', render: u => u.role === 'admin' ? UI.badge('ADMIN', 'red') : UI.badge('KARYAWAN', 'alt') },
          { label: 'Status', render: u => (u.status_aktif ? UI.badge('● Aktif', 'green-t') : UI.badge('● Nonaktif', 'red-t')) + (u.harus_ganti_pw ? `<div style="margin-top:3px">${UI.badge('Wajib ganti PW', 'amber-t')}</div>` : '') },
          { label: 'Terakhir Login (WITA)', render: u => `<span class="mono" style="font-size:12px">${u.terakhir_login ? UI.fmtDT(u.terakhir_login) : 'Belum pernah'}</span>` },
          { label: 'Aksi Cepat', render: u => `<div class="row" style="flex-wrap:nowrap;gap:6px"><button class="btn btn-xs" data-ue="${u.id}">${UI.icon('edit', 'ic-sm')} Ubah</button><button class="btn btn-xs" data-pw="${u.id}">${UI.icon('key', 'ic-sm')} Sandi</button>
            ${u.id === App.user.uid ? `<span class="badge b-alt">${UI.icon('lock', 'ic-sm')} Anda</span>` : `<button class="btn btn-xs ${u.status_aktif ? 'btn-ghost' : 'btn-success'}" data-tg="${u.id}">${u.status_aktif ? 'Nonaktifkan' : 'Aktifkan'}</button>`}</div>` }
        ]
      });
      box.onclick = async e => {
        const ue = e.target.closest('[data-ue]'), pw = e.target.closest('[data-pw]'), tg = e.target.closest('[data-tg]');
        if (ue) this.userModal(r.users.find(u => u.id === ue.dataset.ue));
        if (pw) {
          const u = r.users.find(x => x.id === pw.dataset.pw);
          const v = await UI.prompt(`Reset password <b>${UI.h(u.username)}</b>. Berikan password sementara ini ke pengguna; mereka wajib menggantinya saat login.`, { title: 'Reset Password', label: 'Password sementara (min. 6 karakter)', okText: 'Reset Password' });
          if (!v) return;
          const res = await API.safe('userResetPassword', { id: u.id, password: v }); if (res) { UI.toast(res.message); this.load(); }
        }
        if (tg) {
          const u = r.users.find(x => x.id === tg.dataset.tg);
          if (!(await UI.confirm(`${u.status_aktif ? 'Nonaktifkan' : 'Aktifkan'} akun <b>${UI.h(u.username)}</b>?${u.status_aktif ? ' Sesi login yang sedang aktif akan langsung diputus.' : ''}`, { danger: u.status_aktif }))) return;
          const res = await API.safe('userSave', { id: u.id, role: u.role, id_karyawan: u.id_karyawan, status_aktif: !u.status_aktif }); if (res) { UI.toast(res.message); this.load(); }
        }
      };
    } else if (this.tab === 'karyawan') {
      box.innerHTML = '<div class="win" id="ak-k"></div>';
      UI.table(UI.$('#ak-k'), {
        rows: r.karyawan, placeholder: 'Cari nama, jabatan, email…', searchKeys: ['id', 'nama', 'jabatan', 'email', 'no_hp'],
        columns: [
          { label: 'Karyawan', render: k => `<div class="who"><span class="av">${UI.initials(k.nama)}</span><div><b>${UI.h(k.nama)}</b><span>#${UI.h(k.id)} · ${UI.h(k.jabatan)}</span></div></div>` },
          { label: 'Kontak', render: k => `<span style="font-size:12.5px">${UI.h(k.email || '— email belum diisi —')}<br><span class="mono">${UI.h(k.no_hp || '')}</span></span>` },
          { label: 'Shift', render: k => UI.badge(k.shift === '2' ? (App.settings.shift2_nama || 'Shift 2') : (App.settings.shift1_nama || 'Shift 1'), 'blue-t') },
          { label: 'Masuk', render: k => `<span class="mono" style="font-size:12px">${UI.fmtDate(k.tanggal_masuk)}</span>` },
          { label: 'Gaji Pokok', num: true, render: k => UI.rp(k.gaji_pokok) },
          { label: 'Tunjangan', num: true, render: k => UI.rp(k.tunjangan) },
          { label: 'Akun', render: k => { const u = r.users.find(x => x.id_karyawan === k.id); return u ? `<span class="mono" style="font-size:12px">${UI.h(u.username)}</span>` : `<button class="btn btn-xs" data-mk="${k.id}">${UI.icon('plus', 'ic-sm')} Buat akun</button>`; } },
          { label: 'Status', render: k => k.status_aktif ? UI.badge('Aktif', 'green-t') : UI.badge('Nonaktif', 'red-t') },
          { label: '', render: k => `<button class="btn btn-xs" data-ke="${k.id}">${UI.icon('edit', 'ic-sm')} Ubah</button>` }
        ]
      });
      box.onclick = e => {
        const ke = e.target.closest('[data-ke]'), mk = e.target.closest('[data-mk]');
        if (ke) this.karyawanModal(r.karyawan.find(k => k.id === ke.dataset.ke));
        if (mk) this.userModal(null, mk.dataset.mk);
      };
    } else if (this.tab === 'rbac') {
      const M = [['Login & sesi mandiri', 1, 1, 'Token sesi di CacheService, kedaluwarsa otomatis 6 jam tanpa aktivitas.'], ['Kasir & POS (input penjualan, pilih diskon)', 1, 1, 'Harga & HPP dihitung ulang di server; stok terpotong otomatis.'],
        ['Pembatalan transaksi kasir (void)', 1, 0, 'Mencegah kecurangan kasir. Stok dikembalikan otomatis.'], ['Pembelian bahan baku', 1, 0, 'Mencatat kas keluar & menghitung harga rata-rata.'],
        ['Stok bahan & HPP (opname)', 1, 0, 'Metode WAC; setiap opname tercatat di log.'], ['Kelola produk, resep & diskon', 1, 0, 'Hanya admin yang menentukan harga dan takaran.'],
        ['Laporan keuangan, laba rugi & arus kas', 1, 0, 'Data margin & laba bersifat rahasia.'], ['Presensi scan QR (masuk/pulang)', 1, 1, 'Token QR dinamis + opsi cek lokasi GPS.'],
        ['Rekap presensi seluruh staf', 1, 0, 'Karyawan hanya melihat riwayat sendiri.'], ['Kelola penggajian & kirim slip massal', 1, 0, 'Finalisasi memotong kasbon; email via MailApp.'],
        ['Slip gaji milik sendiri (lihat & unduh)', 1, 1, 'Server menolak bila ID karyawan tidak cocok.'], ['Kasbon karyawan (catat & potongan)', 1, 0, 'Dicatat oleh admin/pemilik.'],
        ['Pengaturan aplikasi', 1, 0, 'Konfigurasi shift, QR, stok, slip.'], ['Manajemen akun & hak akses', 1, 0, 'Buat akun, tautkan karyawan, reset sandi.'], ['Ganti password sendiri', 1, 1, 'Wajib memasukkan password lama.']];
      const ok = v => v ? UI.badge('✓ DIIZINKAN', 'green-t') : UI.badge('✕ DITOLAK', 'red-t');
      box.innerHTML = UI.win(`${UI.icon('shield')} Matriks Hak Akses Sistem per Peran (Server-Side Validated)`, `<div class="note green" style="margin:14px">${UI.icon('checkc')}<div><b>Prinsip keamanan:</b> setiap panggilan API memvalidasi token sesi dan peran di backend Apps Script. Menyembunyikan menu hanyalah kenyamanan tampilan — server tetap menolak aksi tanpa hak akses.</div></div>
        <div class="table-wrap"><table class="table"><thead><tr><th>Modul &amp; fitur</th><th>Admin (Pemilik)</th><th>Karyawan (Staf)</th><th>Catatan keamanan</th></tr></thead><tbody>
        ${M.map((m, i) => `<tr><td><b>${i + 1}. ${m[0]}</b></td><td>${ok(m[1])}</td><td>${ok(m[2])}</td><td style="font-size:12.5px">${m[3]}</td></tr>`).join('')}</tbody></table></div>`, { flush: true });
    } else {
      box.innerHTML = `<div class="win" id="ak-l">${UI.skeleton(4)}</div>`;
      API.safe('logList', { limit: 300 }).then(res => { if (res && UI.$('#ak-l')) this.logTable(UI.$('#ak-l'), res.logs); });
    }
  },
  logTable(box, logs) {
    const sens = /BATAL|OPNAME|GAJI|RESET|AKSES|NONAKTIF|HAPUS|KOREKSI|GAGAL|UBAH_AKUN/;
    UI.table(box, {
      rows: logs, placeholder: 'Cari pengguna, aksi, detail…', searchKeys: ['user', 'aksi', 'detail', 'waktu'], pageSize: 15,
      columns: [
        { label: 'Waktu (WITA)', render: l => `<span class="mono" style="font-size:12px">${UI.fmtDT(l.waktu)}</span>` },
        { label: 'Pengguna', render: l => `<b class="mono" style="font-size:12.5px">${UI.h(l.user)}</b>` },
        { label: 'Aksi', render: l => UI.badge(l.aksi, sens.test(l.aksi) ? 'amber-t' : 'alt') },
        { label: 'Detail', render: l => `<span class="mono" style="font-size:11px;word-break:break-word">${UI.h(String(l.detail).slice(0, 220))}${String(l.detail).length > 220 ? '…' : ''}</span>` }
      ]
    });
  },

  userModal(u, linkKaryawan) {
    const isNew = !u; u = u || { role: 'karyawan', status_aktif: true, id_karyawan: linkKaryawan || '' };
    const kar = this.data.karyawan.filter(k => k.status_aktif || k.id === u.id_karyawan);
    const taken = new Set(this.data.users.filter(x => x.id !== u.id && x.id_karyawan).map(x => x.id_karyawan));
    const m = UI.modal({
      title: isNew ? 'Tambah Akun Pengguna' : 'Ubah Akun · ' + UI.h(u.username),
      body: `<form id="us-f" class="form-grid">
        <div class="field span-all"><label>Username</label><input class="input mono" name="username" value="${UI.h(u.username || '')}" ${isNew ? 'required pattern="[a-z0-9._]{3,30}" autocapitalize="none" placeholder="mis. siti.kasir"' : 'disabled'}><span class="help">${isNew ? 'Huruf kecil, angka, titik, garis bawah (3–30).' : 'Username tidak dapat diubah.'}</span></div>
        <div class="field"><label>Peran</label><select class="select" name="role">${UI.options([{ v: 'karyawan', l: 'Karyawan (staf)' }, { v: 'admin', l: 'Admin (pemilik/manajer)' }], u.role, 'v', o => o.l)}</select></div>
        <div class="field"><label>Tautkan ke data karyawan</label><select class="select" name="id_karyawan">${UI.options(kar.filter(k => !taken.has(k.id)), u.id_karyawan, 'id', k => `${k.nama} (${k.id})`, '— Tidak ditautkan (khusus admin) —')}</select></div>
        ${isNew ? `<div class="field span-all"><label>Password sementara <span class="hint">min. 6 karakter</span></label><input class="input mono" name="password" type="text" minlength="6" required autocomplete="off"><span class="help">Pengguna wajib mengganti password saat login pertama.</span></div>` : ''}
        <label class="check span-all"><input type="checkbox" name="status_aktif" ${u.status_aktif ? 'checked' : ''}> Akun aktif (bisa login)</label></form>`,
      foot: `<button class="btn btn-secondary" data-close>Batal</button><button class="btn btn-primary" id="us-save">${UI.icon('save')} Simpan Akun</button>`
    });
    UI.$('#us-save', m.el).onclick = e => UI.busy(e.currentTarget, async () => {
      const f = UI.$('#us-f', m.el); if (!f.reportValidity()) return;
      const d = UI.formData(f);
      if (d.role === 'karyawan' && !d.id_karyawan) return UI.toast('Akun karyawan wajib ditautkan ke data karyawan.', 'error');
      const r = await API.safe('userSave', Object.assign({ id: u.id || '' }, d));
      if (r) { UI.toast(r.message); m.close(); this.load(); }
    });
  },

  karyawanModal(k) {
    const isNew = !k; k = k || { status_aktif: true, shift: '1', tanggal_masuk: UI.today(), gaji_pokok: 0, tunjangan: 0 };
    const S = App.settings;
    const m = UI.modal({
      title: isNew ? 'Tambah Data Karyawan' : 'Ubah Karyawan · ' + UI.h(k.nama), size: 'lg',
      body: `<form id="ky-f" class="form-grid">
        <div class="field"><label>Nama lengkap</label><input class="input" name="nama" value="${UI.h(k.nama || '')}" required maxlength="80"></div>
        <div class="field"><label>Jabatan</label><input class="input" name="jabatan" value="${UI.h(k.jabatan || '')}" maxlength="60" list="ky-jb" placeholder="Kasir, Barista…"><datalist id="ky-jb">${['Kasir', 'Barista', 'Head Barista', 'Kitchen', 'Service', 'Supervisor'].map(x => `<option value="${x}">`).join('')}</datalist></div>
        <div class="field"><label>Email <span class="hint">untuk kirim slip</span></label><input class="input" type="email" name="email" value="${UI.h(k.email || '')}"></div>
        <div class="field"><label>No. HP / WhatsApp</label><input class="input mono" name="no_hp" value="${UI.h(k.no_hp || '')}" inputmode="tel"></div>
        <div class="field"><label>Tanggal masuk</label><input class="input mono" type="date" name="tanggal_masuk" value="${UI.h(k.tanggal_masuk || '')}"></div>
        <div class="field"><label>Shift kerja</label><select class="select" name="shift">${UI.options([{ v: '1', l: `${S.shift1_nama || 'Shift 1'} (${S.shift1_masuk}–${S.shift1_pulang})` }, { v: '2', l: `${S.shift2_nama || 'Shift 2'} (${S.shift2_masuk}–${S.shift2_pulang})` }], k.shift, 'v', o => o.l)}</select></div>
        <div class="field"><label>Gaji pokok / bulan (Rp)</label><input class="input mono" type="number" min="0" step="1000" name="gaji_pokok" value="${k.gaji_pokok}"></div>
        <div class="field"><label>Tunjangan tetap / bulan (Rp)</label><input class="input mono" type="number" min="0" step="1000" name="tunjangan" value="${k.tunjangan}"></div>
        <div class="field span-all"><label>Rekening transfer gaji <span class="hint">opsional, tampil di slip</span></label><input class="input mono" name="rekening" value="${UI.h(k.rekening || '')}" placeholder="mis. BCA ****8921"></div>
        <label class="check span-all"><input type="checkbox" name="status_aktif" ${k.status_aktif ? 'checked' : ''}> Karyawan aktif ${isNew ? '' : '<span class="help">(menonaktifkan juga menonaktifkan akunnya)</span>'}</label></form>`,
      foot: `<button class="btn btn-secondary" data-close>Batal</button><button class="btn btn-primary" id="ky-save">${UI.icon('save')} Simpan Karyawan</button>`
    });
    UI.$('#ky-save', m.el).onclick = e => UI.busy(e.currentTarget, async () => {
      const f = UI.$('#ky-f', m.el); if (!f.reportValidity()) return;
      const r = await API.safe('karyawanSave', Object.assign({ id: k.id || '' }, UI.formData(f)));
      if (r) { UI.toast(r.message); m.close(); this.tab = 'karyawan'; this.load(); }
    });
  }
};
