/* RESMING BOT STORE – client-side helper */

// toggle terjemahan (jika ada)
function toggleTranslate(id = 'translate') {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('hidden');
}

// simpan sementara data struk (sebelum selesai) ke localStorage
// supaya halaman selesai.html bisa tampilkan walau reload
function cacheLastTrans(nama, telegram, email) {
  localStorage.setItem('resming_last', JSON.stringify({ nama, telegram, email }));
}

// hit cek pembayaran (dari struk.html) dengan loading indikator
async function cekBayar(sid) {
  const btn  = document.getElementById('cekBtn');
  const info = document.getElementById('cekInfo');
  if (!btn || !info) return;

  btn.disabled = true;
  info.innerHTML = '<div class="spinner inline-block mr-2"></div>Menghubungi server...';

  try {
    const res = await fetch(`/cek?s=${sid}`);
    const text = await res.text();
    if (text.includes('Pembayaran Diterima')) {
      info.innerHTML = '<span class="text-green-400">✅ Pembayaran diterima! Mohon tunggu...</span>';
      setTimeout(() => location.href = `/selesai?s=${sid}`, 1200);
    } else {
      info.innerHTML = '<span class="text-red-400">❌ Belum diterima. Coba lagi nanti.</span>';
      btn.disabled = false;
    }
  } catch (e) {
    info.innerHTML = '<span class="text-red-400">⚠️ Gagal cek. Ulangi.</span>';
    btn.disabled = false;
  }
}

// otomatisisi: jika ada elemen #countdownExpired, hitung mundur
function startCountdown(targetISO) {
  const el = document.getElementById('countdownExpired');
  if (!el) return;
  const target = new Date(targetISO).getTime();
  const intv = setInterval(() => {
    const remain = target - Date.now();
    if (remain <= 0) {
      clearInterval(intv);
      el.textContent = 'Kadaluarsa';
      return;
    }
    const m = Math.floor(remain / 60000);
    const s = Math.floor((remain % 60000) / 1000);
    el.textContent = `${m} menit ${s} detik`;
  }, 1000);
}

// terapkan pada struk.html saat load
document.addEventListener('DOMContentLoaded', () => {
  const raw = localStorage.getItem('resming_last');
  if (raw) {
    const d = JSON.parse(raw);
    const prodEl = document.getElementById('prodNama');
    const tglEl  = document.getElementById('prodTg');
    const emlEl  = document.getElementById('prodEm');
    if (prodEl) prodEl.textContent = d.nama;
    if (tglEl)  tglEl.textContent  = d.telegram;
    if (emlEl)  emlEl.textContent  = d.email;
  }
});