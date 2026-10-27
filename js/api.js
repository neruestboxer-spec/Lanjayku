/* =====================================================================
   API — semua komunikasi ke backend Google Apps Script lewat fetch()
   Header text/plain WAJIB agar tidak memicu CORS preflight.
   ===================================================================== */
const API = {
  token: (function () { try { return localStorage.getItem('ljy_token') || ''; } catch (e) { return ''; } })(),

  setToken(t) {
    this.token = t || '';
    try { t ? localStorage.setItem('ljy_token', t) : localStorage.removeItem('ljy_token'); } catch (e) { /* abaikan */ }
  },

  configured() { return typeof GAS_URL === 'string' && /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(GAS_URL) && !GAS_URL.includes('XXXX'); },

  async call(action, data = {}, opts = {}) {
    if (!this.configured()) throw new Error('GAS_URL belum diisi di js/config.js. Isi dengan URL Web App (berakhiran /exec).');
    UI.loading(true);
    let res;
    try {
      const r = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, token: this.token, data }),
        redirect: 'follow'
      });
      const text = await r.text();
      try { res = JSON.parse(text); }
      catch (e) { throw new Error('Respons server tidak valid. Pastikan Web App di-deploy dengan akses "Anyone".'); }
    } catch (e) {
      UI.loading(false);
      if (e.message && e.message.startsWith('Respons')) throw e;
      throw new Error('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
    }
    UI.loading(false);
    if (!res.success) {
      const err = new Error(res.message || 'Terjadi kesalahan pada server.');
      err.code = res.code;
      if (res.code === 'AUTH' && !opts.noRedirect) App.sessionExpired();
      if (res.code === 'MUST_CHANGE') App.forceChangePassword();
      throw err;
    }
    return res;
  },

  /** Panggil API dan tampilkan pesan error sebagai toast. Mengembalikan null bila gagal. */
  async safe(action, data, opts) {
    try { return await this.call(action, data, opts); }
    catch (e) { if (e.code !== 'AUTH') UI.toast(e.message, 'error'); return null; }
  }
};
