/**
 * Sistem Penguncian Dinamis Berbeda untuk Setiap Pertemuan (1 s.d. 16)
 * Otomatis mendeteksi nama file (misal: pertemuan-1.html -> pertemuan_1)
 */

// 1. DAFTAR KATA SANDI MAHASISWA TIAP PERTEMUAN (Bisa Anda sesuaikan bebas)
const PASSWORDS_MAHASISWA = {
  "pertemuan_1":  "orto0109",
  "pertemuan_2":  "orto0208",
  "pertemuan_3":  "orto0307",
  "pertemuan_4":  "orto0406",
  "pertemuan_5":  "orto0505",
  "pertemuan_6":  "orto0604",
  "pertemuan_7":  "orto0703",
  "pertemuan_8":  "uts2026",   // Ujian Tengah Semester (UTS)
  "pertemuan_9":  "orto0902",
  "pertemuan_10": "orto1001",
  "pertemuan_11": "orto1100",
  "pertemuan_12": "orto1219",
  "pertemuan_13": "orto1318",
  "pertemuan_14": "orto1417",
  "pertemuan_15": "orto1516",
  "pertemuan_16": "uas2026"    // Ujian Akhir Semester (UAS)
};

// 2. KATA SANDI DOSEN (Master Password - bisa membuka semua pertemuan dan kunci jawaban)
const MASTER_PASS_DOSEN = "dosenorto";

// Fungsi pembantu menghitung SHA-256
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Fungsi mendeteksi ID pertemuan dari URL (misal: "pertemuan-6.html" -> "pertemuan_6")
function getMeetingKey() {
  const path = window.location.pathname;
  const fileName = path.split("/").pop(); // Mengambil nama file (misal: pertemuan-6.html)
  const match = fileName.match(/pertemuan-(\d+)/i);
  
  if (match) {
    return `pertemuan_${match[1]}`;
  }
  return "pertemuan_1"; // Default cadangan
}

document.addEventListener("DOMContentLoaded", async () => {
  const meetingKey = getMeetingKey();
  const sessionKey = `auth_${meetingKey}`;

  // Ambil kata sandi khusus pertemuan ini
  const passMhsPertemuan = PASSWORDS_MAHASISWA[meetingKey] || "orto2026";
  
  const hashDosen = await sha256(MASTER_PASS_DOSEN);
  const hashMhs = await sha256(passMhsPertemuan);

  // Periksa apakah sesi pertemuan ini sudah terbuka
  const savedRole = sessionStorage.getItem(sessionKey);
  if (savedRole === "dosen" || savedRole === "mahasiswa") {
    bukaKunciHalaman(savedRole);
    return;
  }

  // Tampilkan form penguncian jika belum login
  pasangOverlayKunci(meetingKey, sessionKey, hashDosen, hashMhs);
});

function pasangOverlayKunci(meetingKey, sessionKey, hashDosen, hashMhs) {
  // Label angka pertemuan untuk antarmuka
  const meetingNumber = meetingKey.replace("pertemuan_", "");

  const overlay = document.createElement('div');
  overlay.id = 'page-lock-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    background: linear-gradient(135deg, #fdf2f8 0%, #ecfdf5 50%, #ede9fe 100%);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  `;

  overlay.innerHTML = `
    <div style="
      background: #ffffff;
      padding: 2.5rem 2rem;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.08);
      max-width: 420px;
      width: 90%;
      text-align: center;
      border: 2px solid #cbd5e1;
    ">
      <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔒</div>
      <span style="
        display: inline-block;
        padding: 0.25rem 0.8rem;
        background: #ede9fe;
        color: #7c3aed;
        border-radius: 20px;
        font-weight: 800;
        font-size: 0.8rem;
        margin-bottom: 0.75rem;
      ">PERTEMUAN ${meetingNumber}</span>
      <h2 style="font-size: 1.35rem; color: #0f172a; margin-bottom: 0.5rem; font-weight: 800;">Akses Terkunci</h2>
      <p style="font-size: 0.9rem; color: #64748b; margin-bottom: 1.5rem; line-height: 1.5;">
        Masukkan kata sandi perkuliahan untuk membuka materi Pertemuan ${meetingNumber}.
      </p>
      
      <input type="password" id="input-password-pertemuan" placeholder="Ketik sandi pertemuan ini..." style="
        width: 100%;
        padding: 0.75rem 1rem;
        border: 2px solid #cbd5e1;
        border-radius: 8px;
        font-size: 1rem;
        margin-bottom: 1rem;
        box-sizing: border-box;
        outline: none;
        transition: border-color 0.2s;
      " />
      
      <div id="lock-error-msg" style="color: #e11d48; font-size: 0.85rem; margin-bottom: 1rem; display: none;">
        Kata sandi salah untuk pertemuan ini.
      </div>

      <button id="btn-submit-lock" style="
        width: 100%;
        padding: 0.8rem;
        background: #7c3aed;
        color: #ffffff;
        border: none;
        border-radius: 8px;
        font-weight: 700;
        font-size: 0.95rem;
        cursor: pointer;
        transition: background 0.2s;
      ">Buka Akses</button>
    </div>
  `;

  document.body.appendChild(overlay);

  const inputEl = document.getElementById('input-password-pertemuan');
  const btnEl = document.getElementById('btn-submit-lock');
  const errorEl = document.getElementById('lock-error-msg');

  async function verifikasiSandi() {
    const enteredPass = inputEl.value.trim();
    const enteredHash = await sha256(enteredPass);

    if (enteredHash === hashDosen) {
      sessionStorage.setItem(sessionKey, "dosen");
      overlay.remove();
      bukaKunciHalaman("dosen");
    } else if (enteredHash === hashMhs) {
      sessionStorage.setItem(sessionKey, "mahasiswa");
      overlay.remove();
      bukaKunciHalaman("mahasiswa");
    } else {
      errorEl.style.display = 'block';
      inputEl.style.borderColor = '#e11d48';
      inputEl.value = '';
      inputEl.focus();
    }
  }

  btnEl.addEventListener('click', verifikasiSandi);
  inputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') verifikasiSandi();
  });

  inputEl.focus();
}

function bukaKunciHalaman(role) {
  // Jika dosen yang masuk, otomatis tampilkan kunci jawaban PG / studi kasus
  if (role === "dosen") {
    document.querySelectorAll('.lecturer-key-box').forEach(el => {
      el.style.display = 'block';
    });
  }
}
