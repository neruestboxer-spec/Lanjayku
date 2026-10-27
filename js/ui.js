/* =====================================================================
   UI HELPERS — format angka/tanggal WITA, ikon, toast, modal, tabel,
   unduhan PDF/Excel. Dipakai semua halaman.
   ===================================================================== */
const ICONS = {
  grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
  register: '<rect x="3" y="11" width="18" height="10" rx="1"/><path d="M7 11V7h10v4M9 3h6v4H9zM7 15h2M11 15h2M15 15h2M7 18h10"/>',
  cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.5 12h11l2-8H6"/>',
  box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
  book: '<path d="M2 4h7a3 3 0 0 1 3 3v14a2 2 0 0 0-2-2H2zM22 4h-7a3 3 0 0 0-3 3v14a2 2 0 0 1 2-2h8z"/>',
  chart: '<path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="6"/><rect x="12" y="7" width="3" height="10"/><rect x="17" y="13" width="3" height="4"/>',
  qr: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/>',
  wallet: '<rect x="2" y="6" width="20" height="13" rx="1"/><circle cx="12" cy="12.5" r="2.5"/><path d="M6 10v5M18 10v5"/>',
  receipt: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  users: '<circle cx="9" cy="8" r="4"/><path d="M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1M16 4a4 4 0 0 1 0 8M22 21v-1a6 6 0 0 0-4-5.6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a7 7 0 0 1 7-7h2a7 7 0 0 1 7 7v1"/>',
  logout: '<path d="M9 21H4V3h5M16 17l5-5-5-5M21 12H9"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21a2 2 0 0 0 4 0"/>',
  printer: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  checkc: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5"/>',
  sync: '<path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="1"/><path d="m22 6-10 7L2 6"/>',
  send: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  coffee: '<path d="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4zM6 2v2M10 2v2M14 2v2"/>',
  glass: '<path d="M5 8h14l-1.5 13h-11zM4 8h16M10 8l1.5-6h3"/>',
  food: '<path d="M4 18c0-5 3-11 8-11s8 6 8 11zM8 18v-4M12 18v-6M16 18v-4M2 18h20"/>',
  cake: '<path d="M4 21V12h16v9M2 21h20M4 16c2 0 2-1.5 4-1.5S10 16 12 16s2-1.5 4-1.5 2 1.5 4 1.5M12 9V6M12 6a1.5 1.5 0 0 1 0-3"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  chevR: '<path d="m9 6 6 6-6 6"/>',
  chevL: '<path d="m15 6-6 6 6 6"/>',
  chevD: '<path d="m6 9 6 6 6-6"/>',
  calendar: '<rect x="3" y="4" width="18" height="17" rx="1"/><path d="M3 9h18M8 2v4M16 2v4"/>',
  camera: '<path d="M3 7h4l2-3h6l2 3h4v13H3z"/><circle cx="12" cy="13" r="4"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="1"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.3-9.3M17 6l3 3M14 9l2 2"/>',
  file: '<path d="M14 2H6v20h12V6zM14 2v4h4M9 13h6M9 17h6"/>',
  sheet: '<rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 9h18M3 15h18M9 3v18"/>',
  maximize: '<path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/>',
  trend: '<path d="m3 17 6-6 4 4 8-8M15 7h6v6"/>',
  tag: '<path d="M2 12V3h9l10 10-9 9z"/><circle cx="7" cy="8" r="1.5"/>',
  pin: '<path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
  save: '<path d="M5 3h11l5 5v13H3V3zM7 3v6h8V3M7 21v-7h10v7"/>',
  arrowL: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  cash: '<rect x="2" y="6" width="20" height="12" rx="1"/><circle cx="12" cy="12" r="3"/>',
  fire: '<path d="M12 22a7 7 0 0 0 7-7c0-4-3-6-4-9-1 3-3 3-4 1-2 3-6 5-6 8a7 7 0 0 0 7 7z"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2"/>',
  scale: '<path d="M12 3v18M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0zM8 21h8"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13L22 12v7H2v-7z"/>'
};

const UI = {
  // ---------- Dasar ----------
  $(sel, root) { return (root || document).querySelector(sel); },
  $$(sel, root) { return Array.from((root || document).querySelectorAll(sel)); },
  h(s) { return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); },
  icon(name, cls) { return `<svg class="ic ${cls || ''}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`; },
  debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms || 200); }; },
  initials(n) { return String(n || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase(); },

  // ---------- Angka ----------
  num(n, dec) { return Number(n || 0).toLocaleString('id-ID', { maximumFractionDigits: dec === undefined ? 2 : dec }); },
  rp(n) { const v = Math.round(Number(n) || 0); return (v < 0 ? '-' : '') + 'Rp ' + Math.abs(v).toLocaleString('id-ID'); },
  pct(n, d) { return (Number(n || 0) * 100).toLocaleString('id-ID', { maximumFractionDigits: d === undefined ? 1 : d }) + '%'; },
  parseNum(v) { if (typeof v === 'number') return v; const s = String(v || '').replace(/\s|Rp/gi, '').replace(/\./g, '').replace(',', '.'); const n = Number(s); return isNaN(n) ? 0 : n; },

  // ---------- Waktu WITA ----------
  BULAN: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
  BULAN_PANJANG: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
  HARI: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
  witaParts(d) {
    const p = {};
    new Intl.DateTimeFormat('en-GB', { timeZone: APP_CONFIG.timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short', hour12: false })
      .formatToParts(d || new Date()).forEach(x => { p[x.type] = x.value; });
    if (p.hour === '24') p.hour = '00';
    return p;
  },
  today() { const p = this.witaParts(); return `${p.year}-${p.month}-${p.day}`; },
  thisMonth() { return this.today().slice(0, 7); },
  addDays(dateStr, n) { const d = new Date(dateStr + 'T12:00:00+08:00'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); },
  weekday(dateStr) { return new Date(dateStr + 'T12:00:00+08:00').getUTCDay(); },
  lastDay(periode) { const y = +periode.slice(0, 4), m = +periode.slice(5, 7); return periode + '-' + String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, '0'); },
  fmtDate(s, long) { if (!s) return '-'; const [y, m, d] = String(s).slice(0, 10).split('-'); return `${+d} ${(long ? this.BULAN_PANJANG : this.BULAN)[+m - 1]} ${y}`; },
  fmtDT(s) { if (!s) return '-'; return `${this.fmtDate(s)}, ${String(s).slice(11, 16)} WITA`; },
  fmtTime(s) { if (!s) return '--:--'; const t = String(s).length > 8 ? String(s).slice(11, 16) : String(s).slice(0, 5); return t; },
  fmtPeriode(p) { return p ? `${this.BULAN_PANJANG[+p.slice(5, 7) - 1]} ${p.slice(0, 4)}` : '-'; },
  clockText() {
    const p = this.witaParts();
    const dow = this.HARI[this.weekday(`${p.year}-${p.month}-${p.day}`)];
    return { full: `${dow}, ${+p.day} ${this.BULAN[+p.month - 1]} ${p.year}`, time: `${p.hour}:${p.minute}:${p.second}` };
  },

  // ---------- Badge ----------
  badge(text, kind) { return `<span class="badge ${kind ? 'b-' + kind : ''}">${this.h(text)}</span>`; },
  stokBadge(s) { return this.badge(s, { Aman: 'green-t', Menipis: 'amber-t', Kritis: 'red', Habis: 'red' }[s] || 'alt'); },

  // ---------- Komponen HTML ----------
  win(title, body, opt = {}) {
    return `<section class="win ${opt.cls || ''}" ${opt.id ? `id="${opt.id}"` : ''}>
      <div class="win-bar"><div class="win-title"><span class="sq ${opt.sq || ''}"></span>${title}</div>${opt.right || ''}
        ${opt.ctrls === false ? '' : '<div class="win-ctrls" aria-hidden="true"><span class="win-ctrl">_</span><span class="win-ctrl">□</span></div>'}</div>
      <div class="win-body ${opt.flush ? 'flush' : ''}">${body}</div>${opt.foot ? `<div class="win-foot">${opt.foot}</div>` : ''}</section>`;
  },
  stat(label, value, sub, opt = {}) {
    return `<div class="stat ${opt.dark ? 'dark' : ''}"><div class="stat-h"><span class="stat-l ${opt.dot || ''}">${label}</span>${opt.tag || ''}</div>
      <div class="stat-b"><div class="stat-v">${value}</div>${sub ? `<div class="stat-s">${sub}</div>` : ''}</div></div>`;
  },
  pageHead(eyebrow, title, desc, actions) {
    return `<header class="page-head"><div><div class="eyebrow">${eyebrow}</div><h1 class="page-title">${title}</h1>${desc ? `<p class="page-desc">${desc}</p>` : ''}</div>
      ${actions ? `<div class="page-actions">${actions}</div>` : ''}</header>`;
  },
  empty(title, text, icon) { return `<div class="empty-state">${this.icon(icon || 'inbox')}<b>${title}</b>${text || ''}</div>`; },
  skeleton(n) { return `<div class="stack" style="gap:12px">${Array.from({ length: n || 4 }, () => '<div class="skel" style="height:44px"></div>').join('')}</div>`; },
  bar(ratio, kind) { const w = Math.max(0, Math.min(100, ratio * 100)); return `<div class="bar ${kind || ''}"><i style="width:${w}%"></i></div>`; },
  options(list, sel, valKey, labelFn, placeholder) {
    return (placeholder !== undefined ? `<option value="">${this.h(placeholder)}</option>` : '') +
      list.map(o => { const v = typeof o === 'object' ? o[valKey] : o; return `<option value="${this.h(v)}" ${String(v) === String(sel) ? 'selected' : ''}>${this.h(labelFn ? labelFn(o) : v)}</option>`; }).join('');
  },
  formData(form) {
    const o = {};
    this.$$('[name]', form).forEach(el => {
      if (el.type === 'checkbox') o[el.name] = el.checked;
      else if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; }
      else o[el.name] = el.value;
    });
    return o;
  },

  // ---------- Loading & toast ----------
  _loadN: 0,
  loading(on) {
    this._loadN = Math.max(0, this._loadN + (on ? 1 : -1));
    const el = document.getElementById('topload');
    if (el) el.classList.toggle('on', this._loadN > 0);
  },
  toast(msg, type = 'success', ms) {
    const box = document.getElementById('toasts');
    if (!box) return alert(msg);
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.innerHTML = `${this.icon({ success: 'checkc', error: 'alert', warn: 'alert', info: 'info' }[type] || 'info')}<div>${this.h(msg)}</div>`;
    box.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 320); }, ms || (type === 'error' ? 6000 : 3500));
  },
  async busy(btn, fn) {
    if (btn) { btn.disabled = true; btn.classList.add('loading'); }
    try { return await fn(); } finally { if (btn) { btn.disabled = false; btn.classList.remove('loading'); } }
  },

  // ---------- Modal ----------
  modal({ title, body, foot, size, cls, onClose, closable = true }) {
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = `<div class="modal win ${size || ''} ${cls || ''}" role="dialog" aria-modal="true">
      <div class="win-bar"><div class="win-title"><span class="sq"></span>${title}</div>
      <div class="win-ctrls">${closable ? `<button class="win-ctrl x" data-close aria-label="Tutup">×</button>` : ''}</div></div>
      <div class="win-body">${body || ''}</div>${foot ? `<div class="modal-foot">${foot}</div>` : ''}</div>`;
    document.body.appendChild(wrap);
    document.body.style.overflow = 'hidden';
    const close = () => {
      if (!wrap.isConnected) return;
      wrap.remove();
      if (!document.querySelector('.modal-wrap')) document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      if (onClose) onClose();
    };
    const onKey = e => { if (e.key === 'Escape' && closable && wrap === UI.$$('.modal-wrap').pop()) close(); };
    document.addEventListener('keydown', onKey);
    wrap.addEventListener('click', e => { if ((e.target === wrap && closable) || e.target.closest('[data-close]')) close(); });
    const first = wrap.querySelector('input:not([type=hidden]):not([disabled]), select, textarea');
    if (first && window.innerWidth > 767) setTimeout(() => first.focus(), 60);
    return { el: wrap, body: wrap.querySelector('.win-body'), close };
  },
  confirm(message, { title = 'Konfirmasi', okText = 'Ya, lanjutkan', danger = false } = {}) {
    return new Promise(resolve => {
      let done = false;
      const m = this.modal({
        title, size: 'sm', body: `<p style="margin:0">${message}</p>`,
        foot: `<button class="btn btn-secondary" data-close>Batal</button><button class="btn ${danger ? 'btn-dark' : 'btn-primary'}" data-ok>${okText}</button>`,
        onClose: () => { if (!done) resolve(false); }
      });
      m.el.querySelector('[data-ok]').onclick = () => { done = true; m.close(); resolve(true); };
    });
  },
  prompt(message, { title = 'Isi keterangan', label = 'Alasan', okText = 'Simpan', required = true, value = '', type = 'text' } = {}) {
    return new Promise(resolve => {
      let done = false;
      const m = this.modal({
        title, size: 'sm',
        body: `<p style="margin:0 0 12px">${message}</p><div class="field"><label>${label}</label><input class="input" data-v type="${type}" value="${this.h(value)}"></div>`,
        foot: `<button class="btn btn-secondary" data-close>Batal</button><button class="btn btn-primary" data-ok>${okText}</button>`,
        onClose: () => { if (!done) resolve(null); }
      });
      const inp = m.el.querySelector('[data-v]');
      const ok = () => { const v = inp.value.trim(); if (required && !v) { inp.focus(); return; } done = true; m.close(); resolve(v); };
      m.el.querySelector('[data-ok]').onclick = ok;
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') ok(); });
      setTimeout(() => inp.focus(), 60);
    });
  },

  // ---------- Tabel dengan pencarian & paginasi ----------
  /**
   * table(el, { columns:[{key,label,num,render,cls}], rows, pageSize, search:true, searchKeys, tools, empty, foot, rowCls })
   * Mengembalikan objek { setRows, refresh }.
   */
  table(el, cfg) {
    const st = { rows: cfg.rows || [], q: '', page: 1, size: cfg.pageSize || 15, filter: null };
    const keys = cfg.searchKeys || cfg.columns.map(c => c.key);
    const render = () => {
      const q = st.q.toLowerCase();
      let list = st.rows.filter(r => (!st.filter || st.filter(r)) && (!q || keys.some(k => String(r[k] === undefined ? '' : r[k]).toLowerCase().includes(q))));
      const pages = Math.max(1, Math.ceil(list.length / st.size));
      st.page = Math.min(st.page, pages);
      const slice = list.slice((st.page - 1) * st.size, st.page * st.size);
      const body = slice.length ? slice.map((r, i) => `<tr class="${cfg.rowCls ? cfg.rowCls(r) : ''}">${cfg.columns.map(c =>
        `<td class="${c.num ? 'num' : ''} ${c.cls || ''}">${c.render ? c.render(r, i) : this.h(r[c.key])}</td>`).join('')}</tr>`).join('')
        : `<tr><td class="empty" colspan="${cfg.columns.length}">${cfg.empty || 'Belum ada data.'}</td></tr>`;
      tb.innerHTML = body;
      if (tf) tf.innerHTML = cfg.foot ? cfg.foot(list) : '';
      if (pg) pg.innerHTML = `<span>Menampilkan ${list.length ? (st.page - 1) * st.size + 1 : 0}–${Math.min(st.page * st.size, list.length)} dari ${list.length} baris</span>
        <span class="btns"><button class="btn btn-xs" data-pg="-1" ${st.page <= 1 ? 'disabled' : ''}>${this.icon('chevL', 'ic-sm')} Sebelumnya</button>
        <span class="badge b-navy">${st.page}/${pages}</span><button class="btn btn-xs" data-pg="1" ${st.page >= pages ? 'disabled' : ''}>Berikutnya ${this.icon('chevR', 'ic-sm')}</button></span>`;
      if (cfg.onRender) cfg.onRender(list);
    };
    el.innerHTML = `${cfg.search !== false || cfg.tools ? `<div class="table-tools">${cfg.search !== false ? `<label class="search"><span class="sr-only">Cari</span>${this.icon('search')}<input class="input" type="search" placeholder="${cfg.placeholder || 'Cari…'}" data-q></label>` : ''}${cfg.tools || ''}</div>` : ''}
      <div class="table-wrap"><table class="table"><thead><tr>${cfg.columns.map(c => `<th class="${c.num ? 'right' : ''}">${c.label}</th>`).join('')}</tr></thead><tbody></tbody>${cfg.foot ? '<tfoot></tfoot>' : ''}</table></div>
      ${cfg.paginate === false ? '' : '<div class="pager"></div>'}`;
    const tb = el.querySelector('tbody'), tf = el.querySelector('tfoot'), pg = el.querySelector('.pager');
    const qi = el.querySelector('[data-q]');
    if (qi) qi.addEventListener('input', this.debounce(() => { st.q = qi.value.trim(); st.page = 1; render(); }, 150));
    if (pg) pg.addEventListener('click', e => { const b = e.target.closest('[data-pg]'); if (b) { st.page += +b.dataset.pg; render(); } });
    if (cfg.paginate === false) st.size = 1e9;
    render();
    return {
      setRows(r) { st.rows = r; render(); },
      setFilter(f) { st.filter = f; st.page = 1; render(); },
      refresh: render,
      get visible() { const q = st.q.toLowerCase(); return st.rows.filter(r => (!st.filter || st.filter(r)) && (!q || keys.some(k => String(r[k] === undefined ? '' : r[k]).toLowerCase().includes(q)))); }
    };
  },

  // ---------- Unduhan ----------
  downloadBase64(b64, filename, mime) {
    const bin = atob(b64), bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([bytes], { type: mime || 'application/pdf' }));
    const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
  },
  _scripts: {},
  loadScript(src) {
    if (!this._scripts[src]) this._scripts[src] = new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = src; s.onload = res;
      s.onerror = () => { delete this._scripts[src]; rej(new Error('Gagal memuat pustaka. Periksa koneksi internet.')); };
      document.head.appendChild(s);
    });
    return this._scripts[src];
  },
  LIBS: {
    chart: 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',
    xlsx: 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
    qr: 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
    jsqr: 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js'
  },
  /** sheets: [{ name, rows: [[...header], [...]] , widths? }] */
  async exportXlsx(sheets, filename) {
    try {
      await this.loadScript(this.LIBS.xlsx);
      const wb = XLSX.utils.book_new();
      sheets.forEach(s => {
        const ws = XLSX.utils.aoa_to_sheet(s.rows);
        ws['!cols'] = (s.rows[0] || []).map((_, i) => ({ wch: Math.min(48, Math.max(10, ...s.rows.slice(0, 200).map(r => String(r[i] === undefined ? '' : r[i]).length + 2))) }));
        XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31));
      });
      XLSX.writeFile(wb, filename);
      this.toast('File Excel diunduh: ' + filename);
    } catch (e) { this.toast(e.message, 'error'); }
  },

  // ---------- Grafik (Chart.js) ----------
  async chart(canvas, config) {
    await this.loadScript(this.LIBS.chart);
    Chart.defaults.font.family = "'JetBrains Mono', monospace";
    Chart.defaults.font.size = 11;
    Chart.defaults.color = '#1F2A44';
    if (canvas._chart) canvas._chart.destroy();
    canvas._chart = new Chart(canvas, config);
    return canvas._chart;
  },
  shortRp(v) { const a = Math.abs(v); return a >= 1e9 ? (v / 1e9).toFixed(1) + 'M' : a >= 1e6 ? (v / 1e6).toFixed(1) + 'jt' : a >= 1e3 ? Math.round(v / 1e3) + 'rb' : String(v); }
};
const Pages = {};
