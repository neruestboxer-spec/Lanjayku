/* =====================================================================
   ABSENSI — QR dinamis (admin), absen via kamera HP / pemindai di
   aplikasi (karyawan), rekap harian & periode, koreksi manual.
   ===================================================================== */
Pages.absensi = {
  title: 'Absensi',
  tok: null, expires: 0, interval: 60, qrs: [],

  render(el) {
    if (App.pendingQr()) return this.confirmView(el, App.pendingQr());
    return App.isAdmin() ? this.adminView(el) : this.staffView(el);
  },

  // ======================= KARYAWAN =======================
  async staffView(el) {
    el.innerHTML = UI.pageHead('SDM · Presensi', 'Absensi Saya', 'Pindai QR absensi yang tampil di outlet. Bisa dengan kamera bawaan HP atau pemindai di aplikasi ini.',
      `<button class="btn btn-primary" id="ab-scan">${UI.icon('camera')} Buka Pemindai QR</button>`) + `<div id="ab-body">${UI.skeleton(4)}</div>`;
    UI.$('#ab-scan').onclick = () => this.scanner();
    const [st, hist] = await Promise.all([API.safe('absenStatus'), API.safe('myAttendance', {})]);
    const body = UI.$('#ab-body'); if (!st || !body) return;
    if (!st.linked) { body.innerHTML = `<div class="note amber">${UI.icon('alert')}<div>${UI.h(st.message)}</div></div>`; return; }
    body.innerHTML = `<div class="grid-37">${this.todayCard(st)}<div class="win" id="ab-hist"></div></div>`;
    this.historyTable(UI.$('#ab-hist'), (hist && hist.records) || []);
  },

  todayCard(st) {
    const r = st.record;
    return UI.win(`${UI.icon('clock')} Status Hari Ini · ${UI.fmtDate(st.today)}`, `
      <div class="who" style="margin-bottom:14px"><span class="av">${UI.initials((st.karyawan || {}).nama)}</span><div><b>${UI.h((st.karyawan || {}).nama || '')}</b><span>${UI.h((st.karyawan || {}).jabatan || '')} · ${UI.h(st.shift.nama)}</span></div></div>
      <div class="shift-rules" style="margin-bottom:14px"><div><small>JAM MASUK</small>${UI.h(st.shift.masuk)} WITA</div><div><small>TOLERANSI</small>${UI.h(App.settings.toleransi_menit || 0)} menit</div><div><small>JAM PULANG</small>${UI.h(st.shift.pulang)} WITA</div></div>
      <dl class="kv"><dt>Absen masuk</dt><dd class="mono">${r && r.jam_masuk ? UI.fmtTime(r.jam_masuk) + ' WITA' : '—'}</dd>
        <dt>Absen pulang</dt><dd class="mono">${r && r.jam_pulang ? UI.fmtTime(r.jam_pulang) + ' WITA' : '—'}</dd>
        <dt>Status</dt><dd>${r ? (r.status === 'Terlambat' ? UI.badge(`Terlambat (+${r.terlambat_menit} m)`, 'amber') : UI.badge('Tepat Waktu', 'green')) : UI.badge('Belum absen', 'alt')}</dd></dl>
      <div class="note blue" style="margin-top:14px">${UI.icon('info')}<div>Arahkan kamera HP ke QR di outlet. Tautan akan membuka aplikasi ini dan mencatat absen setelah Anda konfirmasi.${st.geofence ? ' <b>Aktifkan lokasi (GPS)</b> — absen hanya bisa di area cafe.' : ''}</div></div>`, { sq: 'green' });
  },

  historyTable(box, rows) {
    box.innerHTML = '';
    const head = document.createElement('div');
    head.className = 'win-bar';
    head.innerHTML = `<div class="win-title"><span class="sq navy"></span>Riwayat Presensi 30 Hari</div>`;
    box.appendChild(head);
    const t = document.createElement('div'); box.appendChild(t);
    UI.table(t, {
      rows, search: false, pageSize: 10, empty: 'Belum ada riwayat absensi.',
      columns: [
        { label: 'Tanggal', render: a => `<span class="mono">${UI.HARI[UI.weekday(a.tanggal)].slice(0, 3)}, ${UI.fmtDate(a.tanggal)}</span>` },
        { label: 'Masuk', num: true, render: a => UI.fmtTime(a.jam_masuk) },
        { label: 'Pulang', num: true, render: a => UI.fmtTime(a.jam_pulang) },
        { label: 'Status', render: a => a.status === 'Terlambat' ? UI.badge(`Terlambat +${a.terlambat_menit}m`, 'amber') : UI.badge('Tepat Waktu', 'green') },
        { label: 'Metode', render: a => UI.badge(a.metode, a.metode === 'QR' ? 'blue-t' : 'alt') }
      ]
    });
  },

  // ======================= KONFIRMASI (setelah scan) =======================
  async confirmView(el, qr) {
    el.innerHTML = UI.pageHead('SDM · Presensi', 'Konfirmasi Absensi', 'QR absensi terdeteksi. Pilih jenis absen untuk dicatat.') + `<div id="ab-c" style="max-width:520px;margin:0 auto">${UI.skeleton(3)}</div>`;
    const st = await API.safe('absenStatus');
    const box = UI.$('#ab-c'); if (!st || !box) return;
    if (!st.linked) { App.clearPendingQr(); box.innerHTML = `<div class="note amber">${UI.icon('alert')}<div>${UI.h(st.message)} Akun admin tanpa data karyawan tidak bisa absen.</div></div><div class="row" style="margin-top:14px"><a class="btn" href="#/absensi">Kembali</a></div>`; return; }
    const r = st.record;
    const canIn = !r || !r.jam_masuk, canOut = r && r.jam_masuk && !r.jam_pulang;
    box.innerHTML = UI.win(`${UI.icon('qr')} Absensi · ${UI.fmtDate(st.today)}`, `
      <div class="who" style="margin-bottom:14px"><span class="av">${UI.initials(st.karyawan.nama)}</span><div><b>${UI.h(st.karyawan.nama)}</b><span>${UI.h(st.karyawan.jabatan)} · ${UI.h(st.shift.nama)} (${UI.h(st.shift.masuk)}–${UI.h(st.shift.pulang)})</span></div></div>
      <div class="mono" style="font-size:12px;margin-bottom:14px">Token: <b class="red">${UI.h(qr)}</b></div>
      ${canIn ? `<button class="btn btn-primary btn-lg btn-block" data-mode="masuk">${UI.icon('logout')} Absen MASUK Sekarang</button>` : ''}
      ${canOut ? `<button class="btn btn-dark btn-lg btn-block" data-mode="pulang">${UI.icon('logout')} Absen PULANG Sekarang</button><p class="help center">Masuk tercatat ${UI.fmtTime(r.jam_masuk)} WITA</p>` : ''}
      ${!canIn && !canOut ? `<div class="note green">${UI.icon('checkc')}<div>Absen hari ini sudah lengkap (masuk ${UI.fmtTime(r.jam_masuk)} · pulang ${UI.fmtTime(r.jam_pulang)} WITA).</div></div>` : ''}
      <button class="btn btn-ghost btn-block" id="ab-cancel" style="margin-top:10px">Batal</button>`, { sq: 'green' });
    UI.$('#ab-cancel').onclick = () => { App.clearPendingQr(); location.hash = '#/absensi'; this.render(UI.$('#page')); };
    UI.$$('[data-mode]', box).forEach(b => b.onclick = () => UI.busy(b, () => this.doAbsen(qr, b.dataset.mode, st.geofence)));
  },

  getLocation() {
    return new Promise(resolve => {
      if (!navigator.geolocation) return resolve({});
      navigator.geolocation.getCurrentPosition(p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }), () => resolve({}), { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
    });
  },

  async doAbsen(qr, mode, geofence) {
    const loc = geofence ? await this.getLocation() : {};
    if (geofence && !loc.lat) UI.toast('Lokasi tidak terbaca. Aktifkan GPS & izinkan akses lokasi.', 'warn');
    const box = UI.$('#ab-c');
    try {
      const r = await API.call('absen', Object.assign({ qr, mode }, loc));
      App.clearPendingQr();
      const rec = r.record;
      box.innerHTML = UI.win(`${UI.icon('checkc')} Absensi Tercatat`, `<div class="absen-hero"><div class="absen-ok">${UI.icon('check')}</div>
        <h2 style="font-size:24px">Absen ${mode === 'masuk' ? 'Masuk' : 'Pulang'} Berhasil!</h2>
        <div style="margin:10px 0 16px">${mode === 'pulang' ? UI.badge(`MASUK ${UI.fmtTime(rec.jam_masuk)} · PULANG ${UI.fmtTime(rec.jam_pulang)}`, 'navy') : rec.status === 'Terlambat' ? UI.badge(`TERLAMBAT +${rec.terlambat_menit} MENIT`, 'amber') : UI.badge('TEPAT WAKTU', 'green')}</div></div>
        <dl class="kv" style="border:var(--line);padding:12px;background:var(--bg)"><dt>Karyawan</dt><dd>${UI.h(r.karyawan.nama)} (${UI.h(r.karyawan.id)})</dd><dt>Shift</dt><dd>${UI.h(rec.shift)}</dd>
          <dt>Waktu scan</dt><dd class="mono red">${UI.h(mode === 'masuk' ? rec.jam_masuk : rec.jam_pulang)} WITA</dd></dl>
        <a class="btn btn-block" href="#/absensi" style="margin-top:14px">${UI.icon('history')} Lihat Riwayat Absensi Saya</a>`, { sq: 'green' });
    } catch (e) {
      if (/kedaluwarsa|tidak valid/i.test(e.message)) App.clearPendingQr();
      box.innerHTML = UI.win(`${UI.icon('alert')} Absensi Gagal`, `<div class="absen-hero"><div class="absen-ok err">${UI.icon('x')}</div><h2 style="font-size:20px">Absen tidak tercatat</h2><p>${UI.h(e.message)}</p></div>
        <button class="btn btn-primary btn-block" id="ab-rescan">${UI.icon('camera')} Pindai Ulang QR</button><a class="btn btn-block" href="#/absensi" style="margin-top:8px" id="ab-back">Kembali</a>`);
      UI.$('#ab-rescan').onclick = () => this.scanner();
      UI.$('#ab-back').onclick = () => App.clearPendingQr();
    }
  },

  // ======================= PEMINDAI QR DI APLIKASI =======================
  async scanner() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return UI.toast('Kamera tidak didukung browser ini. Gunakan aplikasi kamera bawaan HP untuk memindai QR.', 'warn');
    const m = UI.modal({
      title: `${UI.icon('camera')} Pindai QR Absensi`, size: 'sm',
      body: `<video class="scan-video" playsinline muted></video><p class="help center" id="sc-msg" style="margin-top:10px">Arahkan kamera ke QR absensi di outlet…</p>`,
      onClose: () => { stop(); }
    });
    let stream = null, raf = 0, stopped = false;
    const stop = () => { stopped = true; cancelAnimationFrame(raf); if (stream) stream.getTracks().forEach(t => t.stop()); };
    try {
      await UI.loadScript(UI.LIBS.jsqr);
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    } catch (e) { m.close(); return UI.toast(e.name === 'NotAllowedError' ? 'Izin kamera ditolak. Izinkan kamera di pengaturan browser.' : (e.message || 'Kamera tidak bisa dibuka.'), 'error'); }
    const video = UI.$('video', m.el); video.srcObject = stream; await video.play().catch(() => { });
    const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d', { willReadFrequently: true });
    const tick = () => {
      if (stopped) return;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const w = 480, h = Math.round(480 * video.videoHeight / video.videoWidth) || 480;
        canvas.width = w; canvas.height = h; ctx.drawImage(video, 0, 0, w, h);
        const code = window.jsQR && jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' });
        if (code && code.data) {
          let tok = '';
          try { tok = new URL(code.data).searchParams.get('absen') || ''; } catch (e) { tok = /^LJY-/i.test(code.data) ? code.data : ''; }
          if (tok) {
            stop(); m.close();
            try { sessionStorage.setItem('ljy_absen_qr', JSON.stringify({ qr: tok, t: Date.now() })); } catch (e) { }
            if (location.hash !== '#/absensi') location.hash = '#/absensi'; else this.render(UI.$('#page'));
            return;
          }
          UI.$('#sc-msg', m.el).textContent = 'QR terbaca, tetapi bukan QR absensi Lanjayku.';
        }
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
  },

  // ======================= ADMIN =======================
  async adminView(el) {
    el.innerHTML = UI.pageHead('Sistem Presensi &amp; Logistik SDM', 'Absensi Karyawan &amp; QR Presensi',
      'QR token dinamis berganti otomatis, rekap kehadiran harian, koreksi manual, dan rekap per periode (WITA).',
      `<button class="btn" id="ab-xls">${UI.icon('sheet')} Unduh Rekap (.xlsx)</button><button class="btn" id="ab-kiosk">${UI.icon('maximize')} Layar Kiosk QR</button>
       ${App.user.id_karyawan ? `<button class="btn btn-primary" id="ab-self">${UI.icon('camera')} Absen Saya</button>` : ''}`) +
      `<div class="stats" id="ab-stats">${UI.stat('Hadir Hari Ini', '…')}${UI.stat('Tepat Waktu', '…', '', { dot: 'green' })}${UI.stat('Terlambat', '…', '', { dot: 'amber' })}${UI.stat('Status Token QR', '…', '', { dot: 'navy' })}</div>
      <div class="grid-37 section-gap">
        <div class="stack">
          ${UI.win(`Generator QR Code Absensi (Outlet)`, `<div class="note" style="margin-bottom:14px">${UI.icon('shield')}<div style="font-size:12.5px">QR berputar otomatis. Token lama ditolak sehingga foto/screenshot QR tidak bisa dipakai belakangan.</div></div>
            <div class="qr-frame"><div class="row between mono" style="font-size:11px"><span>TERMINAL OUTLET</span><span class="green"><span class="dot live"></span> LIVE</span></div>
              <div class="qr-box" id="qr-main"></div><div class="mono" style="font-size:11px;margin-bottom:4px">TOKEN AKTIF:</div><div class="qr-token" id="qr-tok">—</div>
              <div class="mono" style="font-size:11.5px;margin-top:10px">Rotasi otomatis: <b class="red" id="qr-left">--</b> detik</div><div class="timer-bar"><i id="qr-bar" style="width:100%"></i></div></div>
            <div class="row" style="margin-top:14px;display:grid;grid-template-columns:1fr 1fr;gap:10px"><button class="btn btn-dark" id="qr-full">${UI.icon('maximize', 'ic-sm')} Layar Penuh</button><button class="btn" id="qr-regen">${UI.icon('refresh', 'ic-sm')} Muat Ulang Token</button></div>
            <div style="margin-top:16px;border:var(--line);padding:12px"><div class="row between" style="margin-bottom:10px"><b style="font-size:12px;font-family:var(--f-display)">ATURAN SHIFT</b><a class="link-btn" href="#/pengaturan">Ubah di Pengaturan →</a></div><div id="ab-rules" class="stack" style="gap:8px"></div></div>`, { sq: '' })}
        </div>
        <div class="stack">
          <div class="win" id="ab-day"></div>
          <div class="grid-2">
            ${UI.win(`${UI.icon('edit')} Koreksi Absensi Manual`, `<p style="margin:0 0 12px;font-size:13px">Untuk staf yang terkendala kamera/HP saat tiba di outlet. Setiap koreksi tercatat di log audit.</p><button class="btn btn-block" id="ab-manual">${UI.icon('plus')} Input Presensi Manual</button>`, { ctrls: false })}
            ${UI.win(`${UI.icon('calendar')} Rekap Per Periode`, `<p style="margin:0 0 12px;font-size:13px">Ringkasan hadir, terlambat, dan menit keterlambatan per karyawan.</p><button class="btn btn-block" id="ab-rekap">${UI.icon('chart')} Buka Rekap Periode</button>`, { ctrls: false })}
          </div>
        </div>
      </div>`;
    UI.$('#qr-full').onclick = UI.$('#ab-kiosk').onclick = () => this.kiosk();
    UI.$('#qr-regen').onclick = () => this.refreshToken(true);
    UI.$('#ab-manual').onclick = () => this.manualModal();
    UI.$('#ab-rekap').onclick = () => this.rekapModal();
    UI.$('#ab-xls').onclick = () => this.rekapModal(true);
    const self = UI.$('#ab-self'); if (self) self.onclick = () => this.scanner();
    this.dayState = { tanggal: UI.today() };
    this.qrs = [];
    await UI.loadScript(UI.LIBS.qr).catch(e => UI.toast(e.message, 'error'));
    this.mountQr(UI.$('#qr-main'), 210);
    await this.refreshToken();
    const timer = setInterval(() => this.tickQr(), 1000);
    const dayT = setInterval(() => { if (!document.hidden && this.dayState.tanggal === UI.today()) this.loadDay(true); }, 60000);
    App.onLeave(() => { clearInterval(timer); clearInterval(dayT); this.qrs = []; const k = UI.$('.kiosk'); if (k) k.remove(); });
    this.loadDay();
  },

  qrUrl() { return location.origin + location.pathname + '?absen=' + encodeURIComponent(this.tok || ''); },
  mountQr(node, size) {
    if (!window.QRCode || !node) return;
    node.innerHTML = '';
    const q = new QRCode(node, { text: this.tok ? this.qrUrl() : 'LANJAYKU', width: size, height: size, colorDark: '#1F2A44', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
    this.qrs.push({ q, node });
  },
  drawQr() {
    this.qrs = this.qrs.filter(x => x.node.isConnected);
    this.qrs.forEach(x => { x.q.clear(); x.q.makeCode(this.qrUrl()); });
    UI.$$('[data-qrtok]').concat(UI.$$('#qr-tok')).forEach(n => { n.textContent = this.tok; });
  },
  async refreshToken(manual) {
    if (this._fetching) return;
    this._fetching = true;
    try {
      const r = await API.call('qrToken');
      this.tok = r.qr; this.interval = r.interval; this.expires = Date.now() + r.expires_in * 1000;
      this.drawQr();
      if (manual) UI.toast('Token QR dimuat ulang.');
      this.renderStats();
    } catch (e) { if (e.code !== 'AUTH') UI.toast('Gagal memuat token QR: ' + e.message, 'error'); this.expires = Date.now() + 10000; }
    this._fetching = false;
  },
  tickQr() {
    const left = Math.max(0, Math.ceil((this.expires - Date.now()) / 1000));
    UI.$$('#qr-left, [data-qrleft]').forEach(n => { n.textContent = left; });
    UI.$$('#qr-bar, [data-qrbar]').forEach(n => { n.style.width = (left / (this.interval || 60) * 100) + '%'; });
    if (left <= 0) this.refreshToken();
  },
  kiosk() {
    const k = document.createElement('div');
    k.className = 'kiosk';
    k.innerHTML = `<div class="row" style="gap:12px"><span class="brand-logo">${UI.icon('coffee')}</span><div style="text-align:left"><div class="brand-name" style="font-size:24px">${UI.h(App.settings.nama_cafe || 'LANJAYKU')}</div><div class="mono muted">ABSENSI KARYAWAN · <span data-kclock></span> WITA</div></div></div>
      <div class="qr-box" id="qr-kiosk"></div>
      <div><div class="qr-token" data-qrtok>${UI.h(this.tok || '')}</div><div class="mono" style="margin-top:10px">Segarkan dalam <b class="red" data-qrleft>--</b> detik</div><div class="timer-bar" style="width:300px"><i data-qrbar></i></div></div>
      <p style="max-width:460px;margin:0">Pindai dengan <b>kamera HP</b> → login → konfirmasi absen masuk/pulang.</p>
      <button class="btn" id="k-close">${UI.icon('x')} Tutup Layar Kiosk</button>`;
    document.body.appendChild(k);
    const size = Math.min(480, Math.floor(Math.min(window.innerWidth * .8, window.innerHeight * .55)));
    this.mountQr(UI.$('#qr-kiosk', k), size);
    const clk = setInterval(() => { const c = UI.$('[data-kclock]', k); if (c) c.textContent = UI.clockText().time; }, 1000);
    const close = () => { clearInterval(clk); if (document.fullscreenElement) document.exitFullscreen().catch(() => { }); k.remove(); document.removeEventListener('keydown', esc); };
    const esc = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', esc);
    UI.$('#k-close', k).onclick = close;
    if (k.requestFullscreen) k.requestFullscreen().catch(() => { });
    this.tickQr();
  },

  renderStats() {
    const s = this.dayData, box = UI.$('#ab-stats'); if (!box) return;
    const list = (s && s.list) || [];
    const hadir = list.filter(x => x.record && x.record.jam_masuk), tepat = hadir.filter(x => x.record.status !== 'Terlambat'), telat = hadir.filter(x => x.record.status === 'Terlambat');
    box.innerHTML = UI.stat('Hadir Hari Ini', `${hadir.length} <small>/ ${list.length} staf</small>`, `<div style="flex:1">${UI.bar(list.length ? hadir.length / list.length : 0)}</div>`, { tag: UI.badge(UI.pct(list.length ? hadir.length / list.length : 0, 0) + ' terisi', 'green-t') }) +
      UI.stat('Tepat Waktu', `${tepat.length} <small>staf</small>`, `<span>Toleransi ${UI.h((s && s.settings.toleransi_menit) || 0)} menit</span>`, { dot: 'green' }) +
      UI.stat('Terlambat', `${telat.length} <small>staf</small>`, `<span>${telat.map(x => UI.h(x.nama.split(' ')[0]) + ' +' + x.record.terlambat_menit + 'm').join(', ') || 'Tidak ada'}</span>`, { dot: 'amber', tag: telat.length ? UI.badge('Perlu review', 'amber') : '' }) +
      UI.stat('Status Token QR', `<span class="mono" style="font-size:17px">${UI.h(this.tok || '—')}</span>`, `<span>Rotasi tiap ${this.interval} detik</span><span class="green">● Tersinkron</span>`, { dot: 'navy', tag: UI.badge('AKTIF (WITA)', 'green') });
  },

  async loadDay(quiet) {
    const box = UI.$('#ab-day'); if (!box) return;
    const r = await API.safe('attendanceToday', { tanggal: this.dayState.tanggal });
    if (!r || !UI.$('#ab-day')) return;
    this.dayData = r;
    this.renderStats();
    const st = r.settings;
    const rules = UI.$('#ab-rules');
    if (rules) rules.innerHTML = [st.shift1, st.shift2].map(s => `<div class="shift-rules"><div><small>${UI.h(s.nama)} · MASUK</small>${UI.h(s.masuk)}</div><div><small>TOLERANSI</small><span class="amber">${UI.h(st.toleransi_menit)} mnt</span></div><div><small>PULANG</small>${UI.h(s.pulang)}</div></div>`).join('');
    const isToday = r.tanggal === UI.today();
    const nowMin = (() => { const p = UI.witaParts(); return +p.hour * 60 + +p.minute; })();
    const toMin = t => { const [h, m] = String(t).split(':'); return +h * 60 + +m; };
    const dur = a => {
      if (!a || !a.jam_masuk) return '--';
      const end = a.jam_pulang ? toMin(a.jam_pulang) : (isToday ? nowMin : null);
      if (end === null) return '--';
      const d = Math.max(0, end - toMin(a.jam_masuk)); return `${Math.floor(d / 60)}j ${String(d % 60).padStart(2, '0')}m${a.jam_pulang ? '' : ' <span class="dot live"></span>'}`;
    };
    const rows = r.list.map(x => Object.assign({ status_txt: x.record ? x.record.status : '' }, x));
    if (!quiet || !this.dayTbl || !box.querySelector('table')) {
      box.innerHTML = `<div class="win-bar"><div class="win-title"><span class="sq navy"></span>Rekap Presensi Harian · ${UI.fmtDate(r.tanggal)}</div><div class="win-ctrls" aria-hidden="true"><span class="win-ctrl">_</span><span class="win-ctrl">□</span></div></div><div id="ab-dt"></div>
        <div class="win-foot" id="ab-dfoot"></div>`;
      this.dayTbl = UI.table(UI.$('#ab-dt'), {
        rows, placeholder: 'Cari nama staf / ID…', searchKeys: ['nama', 'id', 'jabatan'], pageSize: 20,
        tools: `<select class="select" id="ad-s" style="width:auto"><option value="">Semua status</option><option value="hadir">Sudah hadir</option><option value="Terlambat">Terlambat</option><option value="belum">Belum hadir</option></select>
          <input class="input mono" type="date" id="ad-d" value="${r.tanggal}" max="${UI.today()}" style="width:auto"><button class="btn btn-sm btn-icon" id="ad-r" aria-label="Segarkan">${UI.icon('refresh')}</button>`,
        columns: [
          { label: 'Karyawan & Peran', render: x => `<div class="who"><span class="av" style="background:var(--alt);color:var(--ink)">${UI.initials(x.nama)}</span><div><b>${UI.h(x.nama)}</b><span>#${UI.h(x.id)} · ${UI.h(x.jabatan)}</span></div></div>` },
          { label: 'Shift', render: x => `<span class="mono nowrap" style="font-size:12px">${UI.h(x.shift.nama)}<br>${UI.h(x.shift.masuk)}–${UI.h(x.shift.pulang)}</span>` },
          { label: 'Masuk', num: true, render: x => x.record ? `<b class="${x.record.status === 'Terlambat' ? 'amber' : 'green'}">${UI.fmtTime(x.record.jam_masuk)}</b>` : '--:--' },
          { label: 'Pulang', num: true, render: x => x.record ? UI.fmtTime(x.record.jam_pulang) : '--:--' },
          { label: 'Durasi', num: true, render: x => dur(x.record) },
          { label: 'Status', render: x => x.record ? (x.record.status === 'Terlambat' ? UI.badge(`Terlambat (+${x.record.terlambat_menit}m)`, 'amber') : UI.badge('Tepat Waktu', 'green'))
            : (isToday && nowMin < toMin(x.shift.masuk) ? UI.badge(`Shift ${x.shift.masuk}`, 'b-dashed'.slice(2)) : UI.badge('Belum hadir', 'red-t')) },
          { label: 'Metode', render: x => x.record ? `<span class="mono" style="font-size:11.5px">${UI.h(x.record.metode)}</span>${x.record.catatan ? `<div class="muted" style="font-size:11px" title="${UI.h(x.record.catatan)}">${UI.h(x.record.catatan.slice(0, 40))}</div>` : ''}` : '<i class="muted">menunggu</i>' }
        ]
      });
      UI.$('#ad-s').onchange = e => { const v = e.target.value; this.dayTbl.setFilter(!v ? null : x => v === 'hadir' ? !!x.record : v === 'belum' ? !x.record : x.status_txt === v); };
      UI.$('#ad-d').onchange = e => { this.dayState.tanggal = e.target.value || UI.today(); this.loadDay(); };
      UI.$('#ad-r').onclick = () => this.loadDay();
    } else this.dayTbl.setRows(rows);
    const hadir = rows.filter(x => x.record).length;
    UI.$('#ab-dfoot').innerHTML = `<span><span class="dot"></span> ${hadir} hadir</span><span><span class="dot amber"></span> ${rows.filter(x => x.status_txt === 'Terlambat').length} terlambat</span><span><span class="dot red"></span> ${rows.length - hadir} belum hadir</span><span class="muted" style="margin-left:auto">Sinkron otomatis tiap 60 detik</span>`;
  },

  async manualModal() {
    const list = (this.dayData && this.dayData.list) || [];
    const m = UI.modal({
      title: 'Input / Koreksi Presensi Manual',
      body: `<div class="note amber" style="margin-bottom:14px">${UI.icon('shield')}<div>Koreksi menimpa data presensi pada tanggal tersebut dan tercatat di log audit beserta nama Anda.</div></div>
        <form id="mn-f" class="form-grid">
        <div class="field span-all"><label>Karyawan</label><select class="select" name="id_karyawan" required>${UI.options(list, '', 'id', k => `${k.nama} (${k.id}) · ${k.shift.nama}`, '— Pilih karyawan —')}</select></div>
        <div class="field span-all"><label>Tanggal</label><input class="input mono" type="date" name="tanggal" value="${UI.today()}" max="${UI.today()}" required></div>
        <div class="field"><label>Jam masuk</label><input class="input mono" type="time" name="jam_masuk" required></div>
        <div class="field"><label>Jam pulang <span class="hint">opsional</span></label><input class="input mono" type="time" name="jam_pulang"></div>
        <div class="field span-all"><label>Alasan koreksi (wajib)</label><input class="input" name="alasan" required maxlength="150" placeholder="mis. HP baterai habis, dikonfirmasi supervisor"></div></form>`,
      foot: `<button class="btn btn-secondary" data-close>Batal</button><button class="btn btn-primary" id="mn-save">${UI.icon('save')} Simpan Presensi</button>`
    });
    UI.$('#mn-save', m.el).onclick = e => UI.busy(e.currentTarget, async () => {
      const f = UI.$('#mn-f', m.el); if (!f.reportValidity()) return;
      const r = await API.safe('manualAbsen', UI.formData(f));
      if (r) { UI.toast(r.message); m.close(); this.loadDay(); }
    });
  },

  async rekapModal(directExport) {
    const t = UI.today();
    const st = { from: t.slice(0, 8) + '01', to: t, id: '' };
    const list = (this.dayData && this.dayData.list) || [];
    const m = UI.modal({
      title: 'Rekap Absensi Per Periode', size: 'xl',
      body: `<div class="row" style="margin-bottom:14px"><input class="input mono" type="date" id="rk-f" value="${st.from}" style="width:auto"><span class="mono">s.d.</span><input class="input mono" type="date" id="rk-t" value="${st.to}" style="width:auto">
        <select class="select" id="rk-k" style="width:auto">${UI.options(list, '', 'id', k => k.nama, 'Semua karyawan')}</select>
        <button class="btn btn-dark btn-sm" id="rk-go">Terapkan</button><button class="btn btn-sm" id="rk-x">${UI.icon('sheet', 'ic-sm')} Unduh Excel</button></div>
        <div class="win flat section-gap" id="rk-s"></div><div class="win flat" id="rk-r"></div>`
    });
    let data = null;
    const sumT = UI.table(UI.$('#rk-s', m.el), {
      rows: [], search: false, paginate: false, empty: 'Memuat…',
      columns: [
        { label: 'Karyawan', render: s => `<b>${UI.h(s.nama)}</b><div class="mono muted" style="font-size:11px">${UI.h(s.id)} · ${UI.h(s.jabatan)}</div>` },
        { label: 'Hari Hadir', num: true, render: s => `<b>${s.hadir}</b>` },
        { label: 'Tepat Waktu', num: true, render: s => `<span class="green">${s.tepat}</span>` },
        { label: 'Terlambat', num: true, render: s => `<span class="amber">${s.terlambat}</span>` },
        { label: 'Total Menit Telat', num: true, render: s => s.menit_telat },
        { label: 'Tanpa Absen Pulang', num: true, render: s => s.tanpa_pulang },
        { label: 'Kedisiplinan', render: s => `<div style="min-width:100px">${UI.bar(s.hadir ? s.tepat / s.hadir : 0, s.hadir && s.tepat / s.hadir < .8 ? 'amber' : '')}</div>` }
      ]
    });
    const recT = UI.table(UI.$('#rk-r', m.el), {
      rows: [], placeholder: 'Cari nama…', searchKeys: ['nama', 'tanggal', 'status', 'metode'], pageSize: 12,
      columns: [
        { label: 'Tanggal', render: a => `<span class="mono">${UI.fmtDate(a.tanggal)}</span>` },
        { label: 'Karyawan', render: a => UI.h(a.nama) },
        { label: 'Shift', render: a => UI.h(a.shift) },
        { label: 'Masuk', num: true, render: a => UI.fmtTime(a.jam_masuk) },
        { label: 'Pulang', num: true, render: a => UI.fmtTime(a.jam_pulang) },
        { label: 'Status', render: a => a.status === 'Terlambat' ? UI.badge(`Terlambat +${a.terlambat_menit}m`, 'amber') : UI.badge('Tepat', 'green') },
        { label: 'Metode', render: a => UI.h(a.metode) }
      ]
    });
    const exp = () => {
      if (!data) return;
      UI.exportXlsx([
        { name: 'Ringkasan', rows: [['ID', 'Nama', 'Jabatan', 'Hari Hadir', 'Tepat Waktu', 'Terlambat', 'Total Menit Telat', 'Tanpa Absen Pulang'], ...data.summary.map(s => [s.id, s.nama, s.jabatan, s.hadir, s.tepat, s.terlambat, s.menit_telat, s.tanpa_pulang])] },
        { name: 'Detail', rows: [['Tanggal', 'ID', 'Nama', 'Shift', 'Masuk', 'Pulang', 'Status', 'Menit Telat', 'Metode', 'Catatan'], ...data.records.map(a => [a.tanggal, a.id_karyawan, a.nama, a.shift, a.jam_masuk, a.jam_pulang, a.status, a.terlambat_menit, a.metode, a.catatan])] }
      ], `Rekap_Absensi_${data.from}_${data.to}.xlsx`);
    };
    const load = async () => {
      st.from = UI.$('#rk-f', m.el).value; st.to = UI.$('#rk-t', m.el).value; st.id = UI.$('#rk-k', m.el).value;
      const r = await API.safe('rekapAbsensi', { from: st.from, to: st.to, id_karyawan: st.id });
      if (!r) return;
      data = r; sumT.setRows(r.summary); recT.setRows(r.records);
    };
    UI.$('#rk-go', m.el).onclick = load;
    UI.$('#rk-x', m.el).onclick = exp;
    await load();
    if (directExport) exp();
  }
};
