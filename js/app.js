/* =====================================================================
   APP — login, sesi, router SPA (hash), menu sesuai peran, jam WITA
   ===================================================================== */
const App = {
  user: null,
  settings: {},
  produk: [],
  diskon: [],
  cleanups: [],
  current: '',

  NAV: [
    { group: 'Modul' },
    { id: 'dashboard', label: 'Dashboard', icon: 'grid', admin: true },
    { id: 'kasir', label: 'Kasir', icon: 'register' },
    { id: 'pembelian', label: 'Pembelian Bahan', icon: 'cart', admin: true },
    { id: 'stok', label: 'Stok & HPP', icon: 'box', admin: true },
    { id: 'produk', label: 'Produk & Resep', icon: 'book', admin: true },
    { id: 'laporan', label: 'Laporan Keuangan', icon: 'chart', admin: true },
    { group: 'SDM & Karyawan' },
    { id: 'absensi', label: 'Absensi & QR', staffLabel: 'Absensi Saya', icon: 'qr' },
    { id: 'gaji', label: 'Penggajian & Slip', icon: 'wallet', admin: true },
    { id: 'slip-saya', label: 'Slip Gaji Saya', icon: 'file', staffOnly: true },
    { id: 'kasbon', label: 'Kasbon', icon: 'receipt', admin: true },
    { id: 'pengaturan', label: 'Pengaturan', icon: 'settings', admin: true },
    { id: 'akun', label: 'Akun Karyawan', icon: 'users', admin: true },
    { id: 'profil', label: 'Akun Saya', icon: 'user', staffOnly: true }
  ],

  isAdmin() { return this.user && this.user.role === 'admin'; },
  allowed(item) {
    if (!item || !this.user) return false;
    if (item.admin) return this.isAdmin();
    if (item.staffOnly) return !this.isAdmin() || (item.id === 'slip-saya' && !!this.user.id_karyawan);
    return true;
  },
  homeRoute() { return this.isAdmin() ? 'dashboard' : 'kasir'; },

  // ---------------- Inisialisasi ----------------
  async init() {
    // Tangkap token QR absensi dari URL (?absen=TOKEN) lalu bersihkan URL
    const qs = new URLSearchParams(location.search);
    if (qs.get('absen')) {
      try { sessionStorage.setItem('ljy_absen_qr', JSON.stringify({ qr: qs.get('absen'), t: Date.now() })); } catch (e) { }
      history.replaceState(null, '', location.pathname + '#/absensi');
    }
    this.tickClock();
    setInterval(() => this.tickClock(), 1000);
    window.addEventListener('online', () => this.netStatus(true));
    window.addEventListener('offline', () => this.netStatus(false));
    window.addEventListener('hashchange', () => this.go());
    this.bindShell();
    this.bindLogin();

    if (!API.configured()) {
      const w = UI.$('#config-warning');
      w.innerHTML = UI.icon('alert') + '<div><b>Backend belum terhubung.</b> Isi <code>GAS_URL</code> di <code>js/config.js</code> dengan URL Web App Apps Script (berakhiran /exec), lalu upload ulang.</div>';
      w.classList.remove('hidden');
      return this.showLogin();
    }
    if (API.token) {
      try { await this.loadBootstrap(); return this.enter(); }
      catch (e) {
        if (e.code === 'MUST_CHANGE') return;
        if (e.code !== 'AUTH') UI.toast(e.message, 'error');
        API.setToken('');
      }
    }
    this.showLogin();
  },

  async loadBootstrap() {
    const r = await API.call('bootstrap', {}, { noRedirect: true });
    this.user = r.user; this.settings = r.settings || {}; this.produk = r.produk || []; this.diskon = r.diskon || [];
    return r;
  },
  /** Muat ulang data kasir (produk & diskon) setelah ada perubahan master. */
  async refreshCatalog() { try { await this.loadBootstrap(); } catch (e) { /* abaikan */ } },

  showLogin() {
    UI.$('#boot').classList.add('hidden');
    UI.$('#app-view').classList.add('hidden');
    UI.$('#login-view').classList.remove('hidden');
    UI.$('#login-absen-note').classList.toggle('hidden', !this.pendingQr());
    setTimeout(() => { const u = UI.$('#lg-user'); if (u && window.innerWidth > 767) u.focus(); }, 50);
  },

  enter() {
    UI.$('#boot').classList.add('hidden');
    UI.$('#login-view').classList.add('hidden');
    UI.$('#app-view').classList.remove('hidden');
    UI.$('#user-name').textContent = this.user.nama;
    UI.$('#user-role').textContent = this.isAdmin() ? 'Admin' : 'Karyawan';
    UI.$('#user-role').className = 'role-badge' + (this.isAdmin() ? '' : ' staf');
    UI.$('#user-av').textContent = UI.initials(this.user.nama);
    this.renderNav();
    if (this.pendingQr()) location.hash = '#/absensi';
    else if (!location.hash || location.hash === '#/' || location.hash === '#') location.hash = '#/' + this.homeRoute();
    this.go();
  },

  pendingQr() {
    try {
      const p = JSON.parse(sessionStorage.getItem('ljy_absen_qr') || 'null');
      if (p && Date.now() - p.t < 10 * 60 * 1000) return p.qr;
      sessionStorage.removeItem('ljy_absen_qr');
    } catch (e) { }
    return null;
  },
  clearPendingQr() { try { sessionStorage.removeItem('ljy_absen_qr'); } catch (e) { } },

  // ---------------- Login & sesi ----------------
  bindLogin() {
    const form = UI.$('#login-form');
    UI.$('#lg-show').onclick = () => { const p = UI.$('#lg-pass'); const show = p.type === 'password'; p.type = show ? 'text' : 'password'; UI.$('#lg-show').textContent = show ? 'Sembunyi' : 'Lihat'; };
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = UI.$('#lg-btn');
      await UI.busy(btn, async () => {
        try {
          const r = await API.call('login', { username: UI.$('#lg-user').value.trim(), password: UI.$('#lg-pass').value });
          API.setToken(r.token);
          this.user = r.user;
          UI.$('#lg-pass').value = '';
          if (r.user.mustChange) return this.forceChangePassword();
          await this.loadBootstrap();
          UI.toast('Selamat datang, ' + this.user.nama + '!');
          this.enter();
        } catch (err) { UI.toast(err.message, 'error'); }
      });
    });
  },

  sessionExpired() {
    if (!this.user && !API.token) return;
    API.setToken(''); this.user = null; this.runCleanups();
    UI.$$('.modal-wrap').forEach(m => m.remove()); document.body.style.overflow = '';
    UI.toast('Sesi Anda berakhir. Silakan login kembali.', 'warn');
    this.showLogin();
  },

  async logout() {
    if (!(await UI.confirm('Keluar dari Lanjayku?', { title: 'Keluar', okText: 'Keluar' }))) return;
    try { await API.call('logout', {}, { noRedirect: true }); } catch (e) { }
    API.setToken(''); this.user = null; this.runCleanups();
    UI.$('#page').innerHTML = '';
    history.replaceState(null, '', location.pathname);
    this.showLogin();
  },

  forceChangePassword() {
    if (UI.$('.modal-wrap[data-force]')) return;
    UI.$('#boot').classList.add('hidden');
    const m = UI.modal({
      title: 'Ganti Password Wajib', size: 'sm', closable: false,
      body: `<div class="note amber" style="margin-bottom:14px">${UI.icon('lock')}<div>Untuk keamanan, ganti password sementara Anda sebelum memakai aplikasi.</div></div>
        <form class="stack" style="gap:12px" id="fcp">
          <div class="field"><label>Password saat ini</label><input class="input" type="password" name="old" autocomplete="current-password" required></div>
          <div class="field"><label>Password baru <span class="hint">min. 6 karakter</span></label><input class="input" type="password" name="new" autocomplete="new-password" minlength="6" required></div>
          <div class="field"><label>Ulangi password baru</label><input class="input" type="password" name="new2" autocomplete="new-password" required></div>
          <button class="btn btn-primary btn-block" type="submit">Simpan Password Baru</button>
          <button class="btn btn-ghost btn-block" type="button" data-out>Batal &amp; keluar</button>
        </form>`
    });
    m.el.dataset.force = '1';
    m.el.querySelector('[data-out]').onclick = () => { m.close(); API.setToken(''); this.user = null; this.showLogin(); };
    m.el.querySelector('#fcp').addEventListener('submit', async e => {
      e.preventDefault();
      const d = UI.formData(e.target);
      if (d.new !== d.new2) return UI.toast('Konfirmasi password tidak sama.', 'error');
      await UI.busy(e.submitter, async () => {
        try {
          await API.call('changePassword', { old: d.old, new: d.new });
          m.close();
          UI.toast('Password berhasil diganti.');
          await this.loadBootstrap();
          this.enter();
        } catch (err) { UI.toast(err.message, 'error'); }
      });
    });
  },

  // ---------------- Shell ----------------
  bindShell() {
    UI.$('#menu-btn').onclick = () => this.toggleSide(true);
    UI.$('#backdrop').onclick = () => this.toggleSide(false);
    UI.$('#user-chip').onclick = () => { location.hash = this.isAdmin() ? '#/profil' : '#/profil'; };
    UI.$('#btn-print').onclick = () => window.print();
  },
  toggleSide(open) {
    UI.$('#sidebar').classList.toggle('open', open);
    UI.$('#backdrop').classList.toggle('open', open);
  },
  renderNav() {
    const items = this.NAV.filter(n => n.group || this.allowed(n));
    let html = '';
    items.forEach((n, i) => {
      if (n.group) { const next = items[i + 1]; if (next && !next.group) html += `<div class="nav-group">${n.group}</div>`; return; }
      const label = !this.isAdmin() && n.staffLabel ? n.staffLabel : n.label;
      html += `<a class="nav-item" href="#/${n.id}" data-nav="${n.id}">${UI.icon(n.icon)}<span>${label}</span></a>`;
    });
    html += `<div class="side-foot">${this.isAdmin() ? `<a class="nav-item" href="#/profil" data-nav="profil">${UI.icon('user')}<span>Akun Saya</span></a>` : ''}
      <button class="btn btn-block" id="btn-logout" style="margin-top:8px">${UI.icon('logout')} Keluar</button></div>`;
    UI.$('#sidebar').innerHTML = html;
    UI.$('#btn-logout').onclick = () => this.logout();
    UI.$$('#sidebar [data-nav]').forEach(a => a.addEventListener('click', () => this.toggleSide(false)));
    // Navigasi bawah (HP)
    const quick = this.isAdmin() ? ['dashboard', 'kasir', 'stok', 'laporan'] : ['kasir', 'absensi', 'slip-saya', 'profil'];
    const navMap = {}; this.NAV.forEach(n => { if (n.id) navMap[n.id] = n; });
    UI.$('#bottom-nav').innerHTML = quick.filter(id => this.allowed(navMap[id])).map(id => {
      const n = navMap[id]; const label = (!this.isAdmin() && n.staffLabel ? n.staffLabel : n.label).replace(' Keuangan', '').replace(' & HPP', '').replace(' Gaji Saya', ' Gaji');
      return `<a href="#/${id}" data-nav="${id}">${UI.icon(n.icon)}<span>${label.replace('Absensi Saya', 'Absensi')}</span></a>`;
    }).join('') + (this.isAdmin() ? `<button type="button" id="bn-more">${UI.icon('menu')}<span>Menu</span></button>` : '');
    const more = UI.$('#bn-more'); if (more) more.onclick = () => this.toggleSide(true);
  },

  // ---------------- Router ----------------
  runCleanups() { this.cleanups.forEach(f => { try { f(); } catch (e) { } }); this.cleanups = []; },
  onLeave(fn) { this.cleanups.push(fn); },
  go() {
    if (!this.user) return;
    const parts = location.hash.replace(/^#\/?/, '').split('/');
    let name = parts[0] || this.homeRoute();
    const param = decodeURIComponent(parts.slice(1).join('/') || '');
    let nav = this.NAV.find(n => n.id === name);
    if (name === 'slip') nav = { id: 'slip' };
    if (name === 'profil') nav = { id: 'profil' };
    if (!Pages[name] || (nav && nav.id !== 'slip' && nav.id !== 'profil' && !this.allowed(nav))) {
      if (Pages[name]) UI.toast('Halaman ini khusus admin.', 'warn');
      location.replace('#/' + this.homeRoute());
      return;
    }
    this.runCleanups();
    this.current = name;
    UI.$$('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === name || (name === 'slip' && a.dataset.nav === (this.isAdmin() ? 'gaji' : 'slip-saya'))));
    const el = UI.$('#page');
    el.innerHTML = '';
    window.scrollTo(0, 0);
    document.title = (Pages[name].title || 'Lanjayku') + ' — Lanjayku';
    try { Pages[name].render(el, param); }
    catch (e) { console.error(e); el.innerHTML = UI.empty('Terjadi kesalahan', UI.h(e.message), 'alert'); }
  },

  // ---------------- Jam & status ----------------
  tickClock() {
    const c = UI.clockText();
    const d = UI.$('#clock-date'), t = UI.$('#clock-time');
    if (d) d.textContent = c.full;
    if (t) t.textContent = c.time;
  },
  netStatus(on) {
    const el = UI.$('#net-status');
    el.innerHTML = on ? '<span class="dot live"></span>TERHUBUNG KE SERVER' : '<span class="dot red"></span>OFFLINE — CEK INTERNET';
    el.style.color = on ? '' : 'var(--red)';
    if (!on) UI.toast('Koneksi internet terputus. Transaksi belum bisa disimpan.', 'warn');
  }
};

/* ---------- Halaman Akun Saya (semua peran) ---------- */
Pages.profil = {
  title: 'Akun Saya',
  render(el) {
    const u = App.user;
    el.innerHTML = UI.pageHead('Akun · Keamanan', 'Akun Saya', 'Informasi akun dan penggantian password Anda.') +
      `<div class="grid-2">
        ${UI.win('Profil Pengguna', `<div class="who" style="margin-bottom:16px"><span class="av" style="width:52px;height:52px;font-size:16px">${UI.initials(u.nama)}</span><div><b style="font-size:18px">${UI.h(u.nama)}</b><span>@${UI.h(u.username)}</span></div></div>
          <dl class="kv"><dt>Peran</dt><dd>${App.isAdmin() ? UI.badge('ADMIN', 'red') : UI.badge('KARYAWAN', 'navy')}</dd>
          <dt>ID Karyawan</dt><dd class="mono">${UI.h(u.id_karyawan || '— (tidak ditautkan)')}</dd>
          <dt>Cafe</dt><dd>${UI.h(App.settings.nama_cafe || '-')}</dd></dl>
          <div class="note blue" style="margin-top:16px">${UI.icon('shield')}<div>Password disimpan dalam bentuk hash. Admin pun tidak dapat melihat password Anda.</div></div>`, { sq: 'navy' })}
        ${UI.win('Ganti Password', `<form id="cp-form" class="stack" style="gap:12px">
          <div class="field"><label>Password saat ini</label><input class="input" type="password" name="old" autocomplete="current-password" required></div>
          <div class="field"><label>Password baru <span class="hint">min. 6 karakter</span></label><input class="input" type="password" name="new" autocomplete="new-password" minlength="6" required></div>
          <div class="field"><label>Ulangi password baru</label><input class="input" type="password" name="new2" autocomplete="new-password" required></div>
          <div class="row"><button class="btn btn-primary" type="submit">${UI.icon('save')} Simpan Password</button></div></form>`)}
      </div>
      <div class="row section-gap" style="margin-top:20px"><button class="btn" id="pf-logout">${UI.icon('logout')} Keluar dari aplikasi</button></div>`;
    UI.$('#pf-logout').onclick = () => App.logout();
    UI.$('#cp-form').addEventListener('submit', async e => {
      e.preventDefault();
      const d = UI.formData(e.target);
      if (d.new !== d.new2) return UI.toast('Konfirmasi password tidak sama.', 'error');
      await UI.busy(e.submitter, async () => {
        const r = await API.safe('changePassword', { old: d.old, new: d.new });
        if (r) { UI.toast(r.message); e.target.reset(); }
      });
    });
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
