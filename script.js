const KUNCI_PEMASUKAN = 'daftarPemasukan';
const KUNCI_PENGELUARAN = 'daftarPengeluaran';
const KUNCI_GAJI_LAMA = 'totalGaji'; 
const POS_BUDGET = {
    kebutuhan: { id: 'Kebutuhan', nama: 'Kebutuhan', label: 'Kebutuhan Pokok (50%)', porsi: 0.5 },
    keinginan: { id: 'Keinginan', nama: 'Keinginan', label: 'Keinginan (30%)',       porsi: 0.3 },
    tabungan:  { id: 'Tabungan',  nama: 'Tabungan',  label: 'Tabungan & Dana Darurat (20%)', porsi: 0.2 }
};

const BATAS_WASPADA = 0.40; 
const BATAS_KRITIS = 0.20;  
const JATAH_HARIAN_MINIMAL = 20000;

const LEVEL = { AMAN: 0, WASPADA: 1, KRITIS: 2, HABIS: 3, OVER: 4 };

const TAMPILAN_BADGE = {
    [LEVEL.AMAN]:    { ikon: '🟢', kelas: 'badge-safe',   umum: 'Aman',        akhiran: '' },
    [LEVEL.WASPADA]: { ikon: '🟡', kelas: 'badge-warn',   umum: 'Waspada',     akhiran: ' Menipis' },
    [LEVEL.KRITIS]:  { ikon: '🔴', kelas: 'badge-danger', umum: 'Kritis',      akhiran: ' Hampir Habis' },
    [LEVEL.HABIS]:   { ikon: '⛔', kelas: 'badge-habis',  umum: 'Dana Habis',  akhiran: ' Habis' },
    [LEVEL.OVER]:    { ikon: '🔴', kelas: 'badge-danger', umum: 'Over Budget', akhiran: ' Over Budget' }
};

const TAMPILAN_KARTU = {
    [LEVEL.AMAN]:    { kelasKartu: null,                warnaSisa: 'inherit', pesan: null },
    [LEVEL.WASPADA]: { kelasKartu: 'low-budget-card',   warnaSisa: '#b45309', pesan: '⚠️ Mulai menipis',  kelasPesan: 'waspada', warnaBar: '#f59e0b' },
    [LEVEL.KRITIS]:  { kelasKartu: 'over-budget-card',  warnaSisa: '#c0392b', pesan: '⚠️ Hampir habis!',  warnaBar: '#e74c3c' },
    [LEVEL.HABIS]:   { kelasKartu: 'habis-budget-card', warnaSisa: '#7f1d1d', pesan: '⛔ Dana habis',     kelasPesan: 'habis' },
    [LEVEL.OVER]:    { kelasKartu: 'over-budget-card',  warnaSisa: '#c0392b', pesan: '⚠️ Over Budget!',   warnaBar: '#e74c3c', lebarBar: 100 }
};
const SEMUA_KELAS_KARTU = ['over-budget-card', 'low-budget-card', 'habis-budget-card'];

const EMOJI_PENGELUARAN = [
    { emoji: '🍱', kata: ['makan', 'nasi', 'sarapan', 'dinner', 'lunch'] },
    { emoji: '🍟', kata: ['jajan', 'snack', 'camilan', 'chiki'] },
    { emoji: '🎮', kata: ['game', 'top up', 'diamond', 'uc'] },
    { emoji: '🧋', kata: ['minum', 'boba', 'kopi', 'es', 'tea'] },
    { emoji: '⛽', kata: ['bensin', 'pertamax', 'pertalite', 'motor', 'mobil'] },
    { emoji: '🛒', kata: ['belanja', 'supermarket', 'mall'] },
    { emoji: '📱', kata: ['pulsa', 'kuota', 'internet'] },
    { emoji: '⚡', kata: ['listrik', 'token', 'wifi', 'air'] },
    { emoji: '💊', kata: ['obat', 'dokter'] }
];
const EMOJI_DEFAULT = '💸';

const NAMA_PENGELUARAN_CEPAT = {
    'Jajan': 'Jajan 🍟',
    'Makan': 'Makan 🍱',
    'Top Up Game': 'Top Up Game 🎮'
};

const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli',
                    'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const NAMA_HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];


let daftarPemasukan = muatDaftar(KUNCI_PEMASUKAN);
let daftarPengeluaran = muatDaftar(KUNCI_PENGELUARAN);

let modeGrafik = 'tahun';
let dataGrafikAktif = null;


const $ = id => document.getElementById(id);

function formatRupiah(angka) {
    return 'Rp ' + Math.round(angka).toLocaleString('id-ID');
}

function esc(teks) {
    const peta = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(teks ?? '').replace(/[&<>"']/g, c => peta[c]);
}

function jumlahkan(daftar) {
    return daftar.reduce((total, item) => total + item.jumlah, 0);
}

function formatTanggal(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return '-';
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatJam(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return '-';
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
}

function tanggalItem(item) {
    return new Date(item.tanggal || item.id);
}

function ambilAngkaMurni(idElement) {
    const nilai = $(idElement).value.replace(/\./g, '');
    return parseFloat(nilai) || 0;
}

function hitungSisaHariBulanIni() {
    const sekarang = new Date();
    const hariDiBulan = new Date(sekarang.getFullYear(), sekarang.getMonth() + 1, 0).getDate();
    return Math.max(1, hariDiBulan - sekarang.getDate() + 1);
}

// Awal minggu = hari Senin pukul 00:00
function awalMinggu(tanggal) {
    const d = new Date(tanggal.getFullYear(), tanggal.getMonth(), tanggal.getDate());
    const selisih = (d.getDay() + 6) % 7; // Senin = 0 ... Minggu = 6
    d.setDate(d.getDate() - selisih);
    return d;
}


function muatDaftar(kunci) {
    try {
        return JSON.parse(localStorage.getItem(kunci)) || [];
    } catch (err) {
        console.warn('Data ' + kunci + ' rusak, dimulai dari kosong.', err);
        return [];
    }
}

function simpanPemasukan() {
    localStorage.setItem(KUNCI_PEMASUKAN, JSON.stringify(daftarPemasukan));
}

function simpanPengeluaran() {
    localStorage.setItem(KUNCI_PENGELUARAN, JSON.stringify(daftarPengeluaran));
}

function migrasiGajiLama() {
    const gajiLama = parseFloat(localStorage.getItem(KUNCI_GAJI_LAMA));
    if (gajiLama > 0 && daftarPemasukan.length === 0) {
        daftarPemasukan.push({ id: Date.now(), sumber: '💰 Pemasukan / Gaji', jumlah: gajiLama });
        simpanPemasukan();
        localStorage.removeItem(KUNCI_GAJI_LAMA);
    }
}

function bukaTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('[data-tab]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    $(tabId).classList.add('active');
    // Grafik tidak bisa diukur saat tabnya tersembunyi, jadi digambar ulang begitu tab Statistik dibuka
    if (tabId === 'tab-budget') gambarGrafik();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function aktifkanFormatRupiahPadaInput() {
    document.querySelectorAll('.input-rupiah').forEach(input => {
        input.addEventListener('input', () => {
            const angka = input.value.replace(/[^0-9]/g, '');
            input.value = angka ? parseInt(angka, 10).toLocaleString('id-ID') : '';
        });
    });
}

function tambahCepat(idElement, nominalTambah) {
    const totalBaru = ambilAngkaMurni(idElement) + nominalTambah;
    $(idElement).value = totalBaru.toLocaleString('id-ID');
}

function cekPilihanPengeluaran() {
    const pilihLainnya = $('pilihanPengeluaran').value === 'lainnya';
    $('groupInputLainnya').style.display = pilihLainnya ? 'block' : 'none';

    if (pilihLainnya) {
        $('namaPengeluaran').focus();
    } else {
        $('namaPengeluaran').value = '';
    }
}

function tambahkanEmojiOtomatis(teks) {
    const huruf = teks.toLowerCase();
    const cocok = EMOJI_PENGELUARAN.find(grup => grup.kata.some(kata => huruf.includes(kata)));
    return teks + ' ' + (cocok ? cocok.emoji : EMOJI_DEFAULT);
}


function tambahPemasukan() {
    const jumlah = ambilAngkaMurni('gaji');

    if (jumlah <= 0) {
        alert('Masukkan nominal pemasukan yang valid!');
        return;
    }

    daftarPemasukan.push({
        id: Date.now(),
        sumber: '💰 Pemasukan / Gaji',
        jumlah,
        tanggal: new Date().toISOString()
    });
    simpanPemasukan();

    $('gaji').value = '';
    updateTampilan();
    bukaTab('tab-budget');
}

function tambahPengeluaran() {
    const pilihan = $('pilihanPengeluaran').value;
    let nama;

    if (pilihan === 'lainnya') {
        nama = $('namaPengeluaran').value.trim();
        if (!nama) {
            alert('Silakan ketik nama pengeluaran terlebih dahulu!');
            $('namaPengeluaran').focus();
            return;
        }
        nama = tambahkanEmojiOtomatis(nama);
    } else {
        nama = NAMA_PENGELUARAN_CEPAT[pilihan] || pilihan;
    }

    const jumlah = ambilAngkaMurni('jumlahPengeluaran');
    if (jumlah <= 0) {
        alert('Masukkan nominal pengeluaran dengan benar!');
        return;
    }

    daftarPengeluaran.push({
        id: Date.now(),
        nama,
        jumlah,
        kategori: $('kategoriPengeluaran').value,
        tanggal: new Date().toISOString()
    });
    simpanPengeluaran();

    // Kosongkan form
    $('pilihanPengeluaran').value = 'Jajan';
    $('namaPengeluaran').value = '';
    $('groupInputLainnya').style.display = 'none';
    $('jumlahPengeluaran').value = '';

    updateTampilan();
    bukaTab('tab-budget');
}

function hapusPemasukan(id) {
    daftarPemasukan = daftarPemasukan.filter(item => item.id !== id);
    simpanPemasukan();
    updateTampilan();
}

function hapusPengeluaran(id) {
    daftarPengeluaran = daftarPengeluaran.filter(item => item.id !== id);
    simpanPengeluaran();
    updateTampilan();
}

function resetSemuaData() {
    if (!confirm('Yakin ingin menghapus semua data pemasukan dan pengeluaran untuk memulai dari awal?')) return;

    daftarPemasukan = [];
    daftarPengeluaran = [];
    localStorage.removeItem(KUNCI_PEMASUKAN);
    localStorage.removeItem(KUNCI_PENGELUARAN);
    updateTampilan();
}


function levelKategori(budget, terpakai) {
    if (budget <= 0) return LEVEL.AMAN;

    const sisa = Math.round(budget - terpakai);
    if (sisa < 0) return LEVEL.OVER;
    if (sisa === 0) return LEVEL.HABIS;

    const rasioSisa = sisa / budget;
    if (rasioSisa <= BATAS_KRITIS) return LEVEL.KRITIS;
    if (rasioSisa <= BATAS_WASPADA) return LEVEL.WASPADA;
    return LEVEL.AMAN;
}

function levelTotal(persen) {
    if (persen > 100) return LEVEL.OVER;
    if (persen === 100) return LEVEL.HABIS;
    if (persen >= 80) return LEVEL.KRITIS;
    if (persen >= 60) return LEVEL.WASPADA;
    return LEVEL.AMAN;
}

function hitungRingkasan() {
    const totalMasuk = jumlahkan(daftarPemasukan);
    const pos = {};
    let totalKeluar = 0;

    Object.entries(POS_BUDGET).forEach(([kunci, konfig]) => {
        const budget = totalMasuk * konfig.porsi;
        const terpakai = jumlahkan(daftarPengeluaran.filter(item => item.kategori === kunci));

        pos[kunci] = {
            budget,
            terpakai,
            sisa: budget - terpakai,
            level: levelKategori(budget, terpakai)
        };
        totalKeluar += terpakai;
    });

    return {
        totalMasuk,
        totalKeluar,
        sisaTotal: totalMasuk - totalKeluar,
        persenTerpakai: totalMasuk > 0 ? Math.round((totalKeluar / totalMasuk) * 100) : 0,
        pos
    };
}

function cariPosTerburuk(pos) {
    return Object.keys(pos).reduce((terburuk, kunci) =>
        pos[kunci].level > pos[terburuk].level ? kunci : terburuk
    );
}

function hitungJatahHarian(ringkasan, sisaHari) {
    const { kebutuhan, keinginan } = ringkasan.pos;
    const sisaBelanja = kebutuhan.sisa + keinginan.sisa;
    const uangTersedia = Math.min(sisaBelanja, ringkasan.sisaTotal);
    return uangTersedia > 0 ? uangTersedia / sisaHari : 0;
}


function updateTampilan() {
    const ringkasan = hitungRingkasan();

    renderHero(ringkasan);
    renderStatusKeuangan(ringkasan);
    renderKartuPos(ringkasan);
    renderTabelPemasukan();
    renderTabelPengeluaran();
    gambarGrafik();
}

function renderHero({ totalMasuk, totalKeluar, sisaTotal }) {
    $('displayTotalGaji').innerText = formatRupiah(totalMasuk);
    $('displayTotalKeluar').innerText = formatRupiah(totalKeluar);
    $('displaySisaTotal').innerText = formatRupiah(sisaTotal);
}

function renderStatusKeuangan(ringkasan) {
    const elPersen = $('persenTerpakai');
    const elStatus = $('statusKeuangan');
    const elHarian = $('estimasiHarian');
    const elCatatan = $('catatanHarian');

    const sisaHari = hitungSisaHariBulanIni();
    $('sisaHariBulan').innerText = sisaHari;

    if (ringkasan.totalMasuk <= 0) {
        elPersen.innerText = '0%';
        elPersen.className = '';
        elStatus.innerText = 'Belum Ada Saldo';
        elStatus.className = 'status-badge badge-neutral';
        elHarian.innerText = 'Rp 0/hari';
        elHarian.className = '';
        elCatatan.innerText = '';
        return;
    }

    const { persenTerpakai, pos } = ringkasan;

    const kunciTerburuk = cariPosTerburuk(pos);
    const levelPos = pos[kunciTerburuk].level;
    const levelAkhir = Math.max(levelPos, levelTotal(persenTerpakai));

    const tampilan = TAMPILAN_BADGE[levelAkhir];
    const sebutNamaPos = levelAkhir !== LEVEL.AMAN && levelPos === levelAkhir;
    const teks = sebutNamaPos ? POS_BUDGET[kunciTerburuk].nama + tampilan.akhiran : tampilan.umum;

    elStatus.innerText = tampilan.ikon + ' ' + teks;
    elStatus.className = 'status-badge ' + tampilan.kelas;

    renderPersenTerpakai(elPersen, persenTerpakai);
    renderJatahHarian(elHarian, elCatatan, hitungJatahHarian(ringkasan, sisaHari));
}

function renderPersenTerpakai(el, persen) {
    const level = levelTotal(persen);
    let keterangan = '';
    if (persen > 100) keterangan = ' (melebihi!)';
    else if (persen === 100) keterangan = ' (habis)';

    el.innerText = persen + '%' + keterangan;
    if (level >= LEVEL.KRITIS) el.className = 'nilai-bahaya';
    else if (level === LEVEL.WASPADA) el.className = 'nilai-waspada';
    else el.className = '';
}

function renderJatahHarian(elNilai, elCatatan, danaHarian) {
    elNilai.innerText = formatRupiah(danaHarian) + '/hari';
    elCatatan.className = 'catatan-harian';

    if (danaHarian <= 0) {
        elNilai.className = 'nilai-bahaya';
        elCatatan.innerText = '⛔ Tidak ada dana tersisa untuk belanja';
    } else if (danaHarian < JATAH_HARIAN_MINIMAL) {
        elNilai.className = 'nilai-bahaya';
        elCatatan.innerText = '⚠️ Tidak cukup untuk sehari-hari, hemat!';
    } else {
        elNilai.className = '';
        elCatatan.innerText = '';
    }
}

function renderKartuPos(ringkasan) {
    Object.entries(POS_BUDGET).forEach(([kunci, konfig]) => {
        const { budget, sisa, level } = ringkasan.pos[kunci];
        const tampilan = TAMPILAN_KARTU[level];

        const elKartu = $('card' + konfig.id);
        const elBar = $('bar' + konfig.id);
        const elSisa = $('sisa' + konfig.id);
        const elPesan = $('alert' + konfig.id);

        $('res' + konfig.id).innerText = formatRupiah(budget);
        elSisa.innerText = formatRupiah(sisa);
        elSisa.style.color = tampilan.warnaSisa;

        elKartu.classList.remove(...SEMUA_KELAS_KARTU);
        elPesan.classList.remove('waspada', 'habis');
        elBar.style.backgroundColor = tampilan.warnaBar || '';

        if (tampilan.kelasKartu) elKartu.classList.add(tampilan.kelasKartu);

        if (tampilan.pesan) {
            elPesan.innerText = tampilan.pesan;
            elPesan.style.display = 'inline-block';
            if (tampilan.kelasPesan) elPesan.classList.add(tampilan.kelasPesan);
        } else {
            elPesan.style.display = 'none';
        }

        const persenSisa = budget > 0 ? Math.max(0, Math.min(100, (sisa / budget) * 100)) : 0;
        elBar.style.width = (tampilan.lebarBar ?? persenSisa) + '%';
    });
}

function renderTabelPemasukan() {
    const tbody = $('listPemasukan');

    if (daftarPemasukan.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="empty-text">Belum ada pemasukan. Tambahkan di menu Catat.</td></tr>';
        return;
    }

    tbody.innerHTML = daftarPemasukan.map(item => `
        <tr>
            <td>${esc(item.sumber)}</td>
            <td style="color:#16a34a; font-weight:700;">+${formatRupiah(item.jumlah)}</td>
            <td><button class="btn-hapus" onclick="hapusPemasukan(${item.id})">Hapus</button></td>
        </tr>
    `).join('');
}

function renderTabelPengeluaran() {
    const tbody = $('listPengeluaran');

    if (daftarPengeluaran.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-text">Belum ada pengeluaran. Tambahkan di menu Catat.</td></tr>';
        return;
    }

    tbody.innerHTML = daftarPengeluaran.map(item => `
        <tr>
            <td>${esc(item.nama)}</td>
            <td style="text-transform: capitalize;">${esc(item.kategori)}</td>
            <td style="color:#dc2626; font-weight:700;">-${formatRupiah(item.jumlah)}</td>
            <td><button class="btn-hapus" onclick="hapusPengeluaran(${item.id})">Hapus</button></td>
        </tr>
    `).join('');
}

function isiInfoTanggal() {
    const sekarang = new Date();
    $('heroPeriode').innerText = '· ' + NAMA_BULAN[sekarang.getMonth()] + ' ' + sekarang.getFullYear();
    $('tahunFooter').innerText = sekarang.getFullYear();
}


// ===== Ekspor Excel =====
// Membuat file .xlsx asli langsung di browser (tanpa library & tanpa internet).
// .xlsx adalah file ZIP berisi beberapa file XML, jadi cukup ditulis manual.

const MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const FORMAT_RUPIAH_XLSX = '"Rp "#,##0;[Red]-"Rp "#,##0';
const LEBAR_KOLOM_XLSX = [6, 20, 9, 30, 34, 18]; // kolom A sampai F

// Nomor gaya = urutan <xf> di STYLES_XLSX di bawah
const GAYA = {
    judul: 1, sub: 2, seksi: 3, kepala: 4, teks: 5, tengah: 6,
    uang: 7, totalLabel: 8, totalUang: 9, kosong: 10, labelTebal: 11, totalLabelKiri: 12
};

const STYLES_XLSX = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="1"><numFmt numFmtId="164" formatCode="${FORMAT_RUPIAH_XLSX.replace(/"/g, '&quot;')}"/></numFmts>
<fonts count="7">
<font><sz val="11"/><color rgb="FF1B2A41"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="18"/><color rgb="FF14305A"/><name val="Calibri"/><family val="2"/></font>
<font><sz val="11"/><color rgb="FF64748B"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="12"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="11"/><color rgb="FF14305A"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="11"/><color rgb="FF1B2A41"/><name val="Calibri"/><family val="2"/></font>
<font><i/><sz val="11"/><color rgb="FF94A3B8"/><name val="Calibri"/><family val="2"/></font>
</fonts>
<fills count="5">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF14305A"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFDBE7F6"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFFFF3D6"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="2">
<border><left/><right/><top/><bottom/><diagonal/></border>
<border><left style="thin"><color rgb="FFB8C4D6"/></left><right style="thin"><color rgb="FFB8C4D6"/></right><top style="thin"><color rgb="FFB8C4D6"/></top><bottom style="thin"><color rgb="FFB8C4D6"/></bottom><diagonal/></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="13">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="3" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="4" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
<xf numFmtId="0" fontId="5" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
<xf numFmtId="164" fontId="5" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
<xf numFmtId="0" fontId="6" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="5" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="5" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

// Teks polos untuk laporan: buang emoji/simbol aneh, sisakan huruf, angka, dan tanda baca umum
function bersihkanTeks(teks) {
    return String(teks ?? '')
        .replace(/[^\p{L}\p{N}\s/.,()%&+:-]/gu, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function xmlEsc(teks) {
    return String(teks)
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function hurufKolom(indeks) {
    return String.fromCharCode(65 + indeks);
}

function xmlSel(ref, nilai, gaya) {
    if (nilai === null || nilai === undefined || nilai === '') {
        return `<c r="${ref}" s="${gaya}"/>`;
    }
    if (typeof nilai === 'number') {
        return `<c r="${ref}" s="${gaya}"><v>${Number.isFinite(nilai) ? nilai : 0}</v></c>`;
    }
    return `<c r="${ref}" s="${gaya}" t="inlineStr"><is><t xml:space="preserve">${xmlEsc(nilai)}</t></is></c>`;
}

// Susun isi lembar kerja. Tiap sel ditulis [nilai, gaya, jumlahKolomYangDigabung]
function susunBarisLaporan(ringkasan) {
    const { totalMasuk, totalKeluar, sisaTotal } = ringkasan;
    const baris = [];
    const gabung = [];

    const tambah = (sel, tinggi) => {
        const nomor = baris.length + 1;
        const hasil = [];
        let kol = 0;

        sel.forEach(([nilai, gaya, lebar = 1]) => {
            hasil.push({ kol, nilai, gaya });
            for (let i = 1; i < lebar; i++) hasil.push({ kol: kol + i, nilai: null, gaya });
            if (lebar > 1) gabung.push(`${hurufKolom(kol)}${nomor}:${hurufKolom(kol + lebar - 1)}${nomor}`);
            kol += lebar;
        });
        baris.push({ sel: hasil, tinggi });
    };
    const kepala = (...judul) => tambah(judul.map(j => [j, GAYA.kepala]));
    const kosong = () => tambah([]);

    const sekarang = new Date().toISOString();
    tambah([['LAPORAN KEUANGAN DOMPETKU', GAYA.judul, 6]], 30);
    tambah([['Dicetak: ' + formatTanggal(sekarang) + ', ' + formatJam(sekarang), GAYA.sub, 6]]);
    kosong();

    tambah([['RINGKASAN', GAYA.seksi, 6]], 20);
    tambah([['Total pemasukan', GAYA.labelTebal, 4], [totalMasuk, GAYA.uang, 2]]);
    tambah([['Total pengeluaran', GAYA.labelTebal, 4], [totalKeluar, GAYA.uang, 2]]);
    tambah([['Sisa saldo', GAYA.totalLabelKiri, 4], [sisaTotal, GAYA.totalUang, 2]]);
    kosong();

    tambah([['DAFTAR PENGELUARAN', GAYA.seksi, 6]], 20);
    kepala('No', 'Tanggal', 'Jam', 'Nama Pengeluaran', 'Diambil dari Pos', 'Jumlah');
    if (daftarPengeluaran.length === 0) {
        tambah([['Belum ada pengeluaran', GAYA.kosong, 6]]);
    } else {
        [...daftarPengeluaran]
            .sort((a, b) => tanggalItem(a) - tanggalItem(b))
            .forEach((item, i) => {
                const waktu = tanggalItem(item).toISOString();
                tambah([
                    [i + 1, GAYA.tengah],
                    [formatTanggal(waktu), GAYA.teks],
                    [formatJam(waktu), GAYA.tengah],
                    [bersihkanTeks(item.nama) || 'Pengeluaran', GAYA.teks],
                    [POS_BUDGET[item.kategori]?.label || bersihkanTeks(item.kategori), GAYA.teks],
                    [item.jumlah, GAYA.uang]
                ]);
            });
    }
    tambah([['TOTAL PENGELUARAN', GAYA.totalLabel, 5], [totalKeluar, GAYA.totalUang]]);
    kosong();

    tambah([['REKAP PER POS BUDGET', GAYA.seksi, 6]], 20);
    tambah([['Pos', GAYA.kepala, 3], ['Alokasi', GAYA.kepala], ['Terpakai', GAYA.kepala], ['Sisa', GAYA.kepala]]);
    Object.entries(POS_BUDGET).forEach(([kunci, konfig]) => {
        const { budget, terpakai, sisa } = ringkasan.pos[kunci];
        tambah([
            [konfig.label, GAYA.teks, 3],
            [Math.round(budget), GAYA.uang],
            [terpakai, GAYA.uang],
            [Math.round(sisa), GAYA.uang]
        ]);
    });
    kosong();

    tambah([['DAFTAR PEMASUKAN', GAYA.seksi, 6]], 20);
    tambah([['No', GAYA.kepala], ['Tanggal', GAYA.kepala], ['Sumber', GAYA.kepala, 2], ['Nominal', GAYA.kepala, 2]]);
    if (daftarPemasukan.length === 0) {
        tambah([['Belum ada pemasukan', GAYA.kosong, 6]]);
    } else {
        daftarPemasukan.forEach((item, i) => {
            tambah([
                [i + 1, GAYA.tengah],
                [formatTanggal(tanggalItem(item).toISOString()), GAYA.teks],
                [bersihkanTeks(item.sumber) || 'Pemasukan / Gaji', GAYA.teks, 2],
                [item.jumlah, GAYA.uang, 2]
            ]);
        });
    }
    tambah([['TOTAL PEMASUKAN', GAYA.totalLabel, 4], [totalMasuk, GAYA.totalUang, 2]]);

    return { baris, gabung };
}

function buatXmlLembar({ baris, gabung }) {
    const kolom = LEBAR_KOLOM_XLSX
        .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
        .join('');

    const isi = baris.map((b, i) => {
        const nomor = i + 1;
        const tinggi = b.tinggi ? ` ht="${b.tinggi}" customHeight="1"` : '';
        const sel = b.sel.map(s => xmlSel(hurufKolom(s.kol) + nomor, s.nilai, s.gaya)).join('');
        return `<row r="${nomor}"${tinggi}>${sel}</row>`;
    }).join('');

    const blokGabung = gabung.length
        ? `<mergeCells count="${gabung.length}">${gabung.map(g => `<mergeCell ref="${g}"/>`).join('')}</mergeCells>`
        : '';

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
<sheetViews><sheetView showGridLines="0" workbookViewId="0"/></sheetViews>
<sheetFormatPr defaultRowHeight="18"/>
<cols>${kolom}</cols>
<sheetData>${isi}</sheetData>
${blokGabung}
<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>
<pageSetup paperSize="9" orientation="portrait" fitToWidth="1" fitToHeight="0"/>
</worksheet>`;
}

// ZIP sederhana tanpa kompresi (metode "store"), cukup untuk file sekecil ini
const TABEL_CRC32 = (() => {
    const tabel = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        tabel[n] = c >>> 0;
    }
    return tabel;
})();

function hitungCrc32(bytes) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) c = TABEL_CRC32[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
}

function buatZip(daftarBerkas) {
    const enc = new TextEncoder();
    const now = new Date();
    const jamDos = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
    const tglDos = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

    const isiZip = [];
    const direktori = [];
    let posisi = 0;

    daftarBerkas.forEach(({ nama, isi }) => {
        const namaByte = enc.encode(nama);
        const data = enc.encode(isi);
        const crc = hitungCrc32(data);

        const lokal = new DataView(new ArrayBuffer(30));
        lokal.setUint32(0, 0x04034b50, true);
        lokal.setUint16(4, 20, true);
        lokal.setUint16(6, 0x0800, true);
        lokal.setUint16(10, jamDos, true);
        lokal.setUint16(12, tglDos, true);
        lokal.setUint32(14, crc, true);
        lokal.setUint32(18, data.length, true);
        lokal.setUint32(22, data.length, true);
        lokal.setUint16(26, namaByte.length, true);

        const pusat = new DataView(new ArrayBuffer(46));
        pusat.setUint32(0, 0x02014b50, true);
        pusat.setUint16(4, 20, true);
        pusat.setUint16(6, 20, true);
        pusat.setUint16(8, 0x0800, true);
        pusat.setUint16(12, jamDos, true);
        pusat.setUint16(14, tglDos, true);
        pusat.setUint32(16, crc, true);
        pusat.setUint32(20, data.length, true);
        pusat.setUint32(24, data.length, true);
        pusat.setUint16(28, namaByte.length, true);
        pusat.setUint32(42, posisi, true);

        isiZip.push(new Uint8Array(lokal.buffer), namaByte, data);
        direktori.push(new Uint8Array(pusat.buffer), namaByte);
        posisi += 30 + namaByte.length + data.length;
    });

    const ukuranDirektori = direktori.reduce((total, b) => total + b.length, 0);
    const akhir = new DataView(new ArrayBuffer(22));
    akhir.setUint32(0, 0x06054b50, true);
    akhir.setUint16(8, daftarBerkas.length, true);
    akhir.setUint16(10, daftarBerkas.length, true);
    akhir.setUint32(12, ukuranDirektori, true);
    akhir.setUint32(16, posisi, true);

    return new Blob([...isiZip, ...direktori, new Uint8Array(akhir.buffer)], { type: MIME_XLSX });
}

function buatFileXlsx(ringkasan) {
    const xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
    const nsMain = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
    const nsRel = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
    const nsPaket = 'http://schemas.openxmlformats.org/package/2006/relationships';

    return buatZip([
        { nama: '[Content_Types].xml', isi: xml +
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
            '<Default Extension="xml" ContentType="application/xml"/>' +
            '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
            '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
            '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
            '</Types>' },
        { nama: '_rels/.rels', isi: xml +
            `<Relationships xmlns="${nsPaket}">` +
            `<Relationship Id="rId1" Type="${nsRel}/officeDocument" Target="xl/workbook.xml"/>` +
            '</Relationships>' },
        { nama: 'xl/workbook.xml', isi: xml +
            `<workbook xmlns="${nsMain}" xmlns:r="${nsRel}">` +
            '<bookViews><workbookView/></bookViews>' +
            '<sheets><sheet name="Laporan Keuangan" sheetId="1" r:id="rId1"/></sheets>' +
            '</workbook>' },
        { nama: 'xl/_rels/workbook.xml.rels', isi: xml +
            `<Relationships xmlns="${nsPaket}">` +
            `<Relationship Id="rId1" Type="${nsRel}/worksheet" Target="worksheets/sheet1.xml"/>` +
            `<Relationship Id="rId2" Type="${nsRel}/styles" Target="styles.xml"/>` +
            '</Relationships>' },
        { nama: 'xl/styles.xml', isi: STYLES_XLSX },
        { nama: 'xl/worksheets/sheet1.xml', isi: buatXmlLembar(susunBarisLaporan(ringkasan)) }
    ]);
}

function unduhFile(isi, namaFile, tipe) {
    const blob = new Blob([isi], { type: tipe });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = namaFile;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function eksporKeExcel() {
    if (daftarPengeluaran.length === 0 && daftarPemasukan.length === 0) {
        alert('Belum ada data untuk diekspor!');
        return;
    }

    try {
        const berkas = buatFileXlsx(hitungRingkasan());
        unduhFile(berkas, 'Laporan_Keuangan_DompetKu.xlsx', MIME_XLSX);
    } catch (err) {
        console.error('Gagal membuat file Excel:', err);
        alert('Maaf, file Excel gagal dibuat. Coba muat ulang halaman lalu ekspor lagi.');
    }
}


// ===== Grafik statistik (minggu / bulan / tahun) =====

const NAMA_HARI_PENDEK = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const NAMA_BULAN_PENDEK = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

let lebarGrafikTergambar = 0;

function setModeGrafik(mode) {
    modeGrafik = mode;
    document.querySelectorAll('.chart-tab').forEach(tombol => {
        tombol.classList.toggle('active', tombol.dataset.mode === mode);
    });
    gambarGrafik();
}

// Selisih hari kalender (a - b). Dihitung dari tanggalnya, bukan dari selisih milidetik,
// supaya tidak meleset sehari saat ada pergantian jam musim panas (DST).
function selisihHari(a, b) {
    const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((utcA - utcB) / 86400000);
}

function konfigGrafikMinggu(now) {
    const awal = awalMinggu(now);

    return {
        judul: 'Pengeluaran Minggu Ini',
        labelX: 'Hari',
        labels: NAMA_HARI,
        labelsPendek: NAMA_HARI_PENDEK,
        detail: NAMA_HARI.map((hari, i) => {
            const t = new Date(awal);
            t.setDate(awal.getDate() + i);
            return hari + ', ' + t.getDate() + ' ' + NAMA_BULAN[t.getMonth()];
        }),
        indeksSekarang: selisihHari(now, awal),
        cariIndeks: tgl => {
            const hariKe = selisihHari(tgl, awal);
            return hariKe >= 0 && hariKe < 7 ? hariKe : -1;
        }
    };
}

function konfigGrafikBulan(now) {
    const tahun = now.getFullYear();
    const bulan = now.getMonth();
    const jumlahHari = new Date(tahun, bulan + 1, 0).getDate();
    const labels = Array.from({ length: jumlahHari }, (_, i) => String(i + 1));

    return {
        judul: 'Pengeluaran ' + NAMA_BULAN[bulan] + ' ' + tahun,
        labelX: 'Tanggal',
        labels,
        labelsPendek: labels,
        detail: labels.map(tgl => tgl + ' ' + NAMA_BULAN[bulan] + ' ' + tahun),
        indeksSekarang: now.getDate() - 1,
        cariIndeks: tgl => (tgl.getFullYear() === tahun && tgl.getMonth() === bulan) ? tgl.getDate() - 1 : -1
    };
}

function konfigGrafikTahun(now) {
    const tahun = now.getFullYear();

    return {
        judul: 'Pengeluaran Tahun ' + tahun,
        labelX: 'Bulan',
        labels: NAMA_BULAN,
        labelsPendek: NAMA_BULAN_PENDEK,
        labelsInisial: NAMA_BULAN.map(bulan => bulan[0]),
        detail: NAMA_BULAN.map(bulan => bulan + ' ' + tahun),
        indeksSekarang: now.getMonth(),
        cariIndeks: tgl => tgl.getFullYear() === tahun ? tgl.getMonth() : -1
    };
}

function siapkanDataGrafik(mode) {
    const pembuat = { minggu: konfigGrafikMinggu, bulan: konfigGrafikBulan, tahun: konfigGrafikTahun };
    const konfig = pembuat[mode](new Date());

    const nilai = new Array(konfig.labels.length).fill(0);
    daftarPengeluaran.forEach(item => {
        const i = konfig.cariIndeks(tanggalItem(item));
        if (i >= 0 && i < nilai.length) nilai[i] += item.jumlah;
    });

    // Waktu yang belum terjadi (setelah hari ini / bulan ini) tidak digambar
    const nilaiTampil = nilai.map((v, i) => (i <= konfig.indeksSekarang ? v : null));

    return { ...konfig, nilai: nilaiTampil };
}

function singkatRupiah(v) {
    if (v >= 1000000) return (v / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' jt';
    if (v >= 1000) return (v / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' rb';
    return String(v);
}

function hitungSkalaY(maks) {
    if (maks <= 0) return { langkah: 10000, jumlah: 5 };

    const kasar = maks / 5;
    const pangkat = Math.pow(10, Math.floor(Math.log10(kasar)));
    let langkah = pangkat;

    for (const pengali of [1, 2, 5, 10]) {
        langkah = pengali * pangkat;
        if (kasar <= langkah) break;
    }
    return { langkah, jumlah: Math.ceil(maks / langkah) };
}

// Mengukur lebar teks sumbu dengan font yang sama seperti di layar
function buatPengukurTeks(elemen) {
    let ctx = null;
    try {
        ctx = document.createElement('canvas').getContext('2d');
        ctx.font = '500 11.5px ' + getComputedStyle(elemen).fontFamily;
    } catch (err) {
        ctx = null;
    }
    return teks => (ctx ? ctx.measureText(String(teks)).width : String(teks).length * 6.6);
}

// Menentukan label sumbu X mana yang ditampilkan agar tidak saling bertumpuk.
// - Hari & bulan: nama lengkap bila muat, kalau tidak pakai singkatan (Sen, Sel / Jan, Feb).
// - Tanggal: kelipatan 1, 2, 5 atau 10 sesuai lebar layar.
// - Label "hari ini" selalu tampil.
function pilihLabelSumbuX(g, posX, mode, ukur) {
    const n = g.labels.length;
    const jarak = n > 1 ? posX[1] - posX[0] : Infinity;
    // Pakai tingkat label terpanjang yang masih muat semua: nama lengkap, singkatan, lalu inisial.
    // Kalau tidak ada yang muat, pakai singkatan dan sebagian label dilewati (lihat langkah di bawah).
    const tingkat = [g.labels, g.labelsPendek, g.labelsInisial].filter(Boolean);
    const muatSemua = daftar => Math.max(...daftar.map(ukur)) + 6 <= jarak;
    const teks = tingkat.find(muatSemua) ?? g.labelsPendek;
    const lebarMaks = Math.max(...teks.map(ukur)) + 6;

    const opsiLangkah = mode === 'bulan' ? [1, 2, 5, 10] : [1, 2, 3, 4, 6];
    const langkah = opsiLangkah.find(s => jarak * s >= lebarMaks) ?? opsiLangkah[opsiLangkah.length - 1];

    const tampil = new Set();
    for (let i = 0; i < n; i++) {
        const tgl = i + 1;
        let reguler;
        if (mode !== 'bulan') reguler = i % langkah === 0;
        else if (langkah === 1) reguler = true;
        else if (langkah === 2) reguler = tgl % 2 === 1;
        else reguler = tgl === 1 || tgl % langkah === 0;
        if (reguler) tampil.add(i);
    }

    const bentrok = (i, j) => Math.abs(posX[i] - posX[j]) < (ukur(teks[i]) + ukur(teks[j])) / 2 + 6;

    // Tanggal terakhir ikut tampil bila masih ada tempat
    const terakhir = n - 1;
    if (mode === 'bulan' && !tampil.has(terakhir) && ![...tampil].some(j => bentrok(terakhir, j))) {
        tampil.add(terakhir);
    }

    // Hari ini selalu tampil; label tetangga yang menabraknya dikalahkan
    const sekarang = g.indeksSekarang;
    if (!tampil.has(sekarang)) {
        [...tampil].filter(j => bentrok(sekarang, j)).forEach(j => tampil.delete(j));
        tampil.add(sekarang);
    }

    return { teks, tampil };
}

function gambarGrafik() {
    const wrap = $('grafikWrap');
    if (!wrap) return;

    const g = siapkanDataGrafik(modeGrafik);
    dataGrafikAktif = g;
    $('judulGrafik').innerText = g.judul;

    // Tab Statistik sedang tersembunyi: lebarnya 0, digambar ulang saat tab dibuka (lihat bukaTab)
    const W = Math.floor(wrap.clientWidth);
    if (W < 120) return;
    lebarGrafikTergambar = W;

    const ukur = buatPengukurTeks(wrap);
    const sempit = W < 480;
    const H = Math.round(Math.min(340, Math.max(230, W * 0.62)));

    // Skala
    const maks = Math.max(0, ...g.nilai.filter(v => v !== null));
    const { langkah, jumlah } = hitungSkalaY(maks);
    const yMaks = langkah * jumlah;
    const n = g.labels.length;
    const labelY = Array.from({ length: jumlah + 1 }, (_, t) => singkatRupiah(t * langkah));

    // Margin menyesuaikan lebar label sumbu Y; judul sumbu Y hanya di layar lebar
    const kiri = Math.ceil(Math.max(...labelY.map(ukur))) + 12 + (sempit ? 0 : 18);
    const kanan = 14, atas = 14, bawah = 52;
    const lebar = W - kiri - kanan;
    const tinggi = H - atas - bawah;

    const xAt = i => kiri + (lebar * (i + 0.5)) / n;
    const yAt = v => atas + tinggi - (v / yMaks) * tinggi;
    const posX = g.labels.map((_, i) => xAt(i));
    g.posX = posX;

    const svg = [`<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(g.judul)}">`];

    // Garis bantu + label sumbu Y
    for (let t = 0; t <= jumlah; t++) {
        const y = yAt(t * langkah);
        svg.push(`<line class="${t === 0 ? 'axis-line' : 'grid-line'}" x1="${kiri}" x2="${W - kanan}" y1="${y}" y2="${y}"/>`);
        svg.push(`<text class="ax-text" x="${kiri - 8}" y="${y + 4}" text-anchor="end">${labelY[t]}</text>`);
    }

    // Label sumbu X
    const { teks, tampil } = pilihLabelSumbuX(g, posX, modeGrafik, ukur);
    tampil.forEach(i => {
        const kelas = 'ax-text' + (i === g.indeksSekarang ? ' hari-ini' : '');
        svg.push(`<text class="${kelas}" x="${posX[i]}" y="${atas + tinggi + 18}" text-anchor="middle">${esc(teks[i])}</text>`);
    });

    svg.push(`<text class="ax-title" x="${kiri + lebar / 2}" y="${H - 8}" text-anchor="middle">${esc(g.labelX)}</text>`);
    if (!sempit) {
        svg.push(`<text class="ax-title" transform="translate(14 ${atas + tinggi / 2}) rotate(-90)" text-anchor="middle">Jumlah (Rupiah)</text>`);
    }

    // Garis penunjuk titik yang dipilih (digeser lewat tampilkanTitikGrafik)
    svg.push(`<line class="guide" x1="0" x2="0" y1="${atas}" y2="${atas + tinggi}" visibility="hidden"/>`);

    // Garis data
    const titik = g.nilai
        .map((v, i) => (v === null ? null : [posX[i], yAt(v)]))
        .filter(Boolean);
    if (titik.length > 1) {
        svg.push(`<polyline class="line" points="${titik.map(p => p.join(',')).join(' ')}"/>`);
    }

    // Titik data (titik "hari ini" dibuat sedikit lebih besar)
    const radius = (modeGrafik === 'bulan' && sempit) ? 3 : (modeGrafik === 'bulan' ? 3.5 : 5);
    g.nilai.forEach((v, i) => {
        if (v === null) return;
        const hariIni = i === g.indeksSekarang;
        svg.push(`<circle class="dot${hariIni ? ' hari-ini' : ''}" data-i="${i}" cx="${posX[i]}" cy="${yAt(v)}" r="${hariIni ? radius + 1.5 : radius}"/>`);
    });

    svg.push('</svg>');
    wrap.innerHTML = svg.join('');

    // Interaksi: seluruh kolom hari/tanggal/bulan bisa disentuh, bukan hanya titiknya.
    const svgEl = wrap.querySelector('svg');
    const indeksDariEvent = e => {
        const kotak = svgEl.getBoundingClientRect();
        const x = (e.clientX - kotak.left) * (W / kotak.width);
        const i = Math.floor(((x - kiri) / lebar) * n);
        return (i >= 0 && i < n && g.nilai[i] !== null) ? i : null;
    };
    const pilih = e => {
        const i = indeksDariEvent(e);
        if (i !== null) tampilkanTitikGrafik(i);
    };
    svgEl.addEventListener('pointermove', pilih);
    svgEl.addEventListener('pointerdown', pilih);
    svgEl.addEventListener('pointerleave', e => {
        if (e.pointerType === 'mouse') tampilkanTitikGrafik(null);
    });

    tampilkanTitikGrafik(null);
}

function tampilkanTitikGrafik(i) {
    const info = $('grafikInfo');
    const g = dataGrafikAktif;
    if (!g) return;

    const wrap = $('grafikWrap');
    wrap.querySelectorAll('.dot').forEach(dot => {
        dot.classList.toggle('aktif', i !== null && parseInt(dot.dataset.i, 10) === i);
    });

    const garis = wrap.querySelector('.guide');
    if (garis) {
        if (i !== null && g.posX) {
            garis.setAttribute('x1', g.posX[i]);
            garis.setAttribute('x2', g.posX[i]);
            garis.setAttribute('visibility', 'visible');
        } else {
            garis.setAttribute('visibility', 'hidden');
        }
    }

    if (i !== null) {
        const penanda = i === g.indeksSekarang ? ' (hari ini)' : '';
        info.innerHTML = esc(g.detail[i]) + penanda + ': <strong>' + formatRupiah(g.nilai[i]) + '</strong>';
        return;
    }

    const total = g.nilai.reduce((jumlah, v) => jumlah + (v || 0), 0);
    info.innerHTML = total === 0
        ? 'Belum ada pengeluaran pada periode ini.'
        : 'Total periode ini: <strong>' + formatRupiah(total) + '</strong>. Arahkan atau ketuk grafik untuk melihat detail.';
}


migrasiGajiLama();
aktifkanFormatRupiahPadaInput();
isiInfoTanggal();

// Gambar ulang saat lebar layar berubah (HP diputar, jendela diubah) supaya teks tetap terbaca.
// Perubahan tinggi saja (bilah alamat HP naik/turun) diabaikan.
let timerUkuranGrafik = null;
window.addEventListener('resize', () => {
    clearTimeout(timerUkuranGrafik);
    timerUkuranGrafik = setTimeout(() => {
        const wrap = $('grafikWrap');
        if (wrap && Math.floor(wrap.clientWidth) !== lebarGrafikTergambar) gambarGrafik();
    }, 120);
});

// Ketuk di luar grafik = tutup detail titik (penting di layar sentuh, yang tidak punya "mouse keluar")
document.addEventListener('pointerdown', e => {
    if (!$('grafikWrap').contains(e.target)) tampilkanTitikGrafik(null);
});

updateTampilan();

// Font web baru siap beberapa saat setelah halaman terbuka; ukur ulang label dengan font yang benar
if (document.fonts && document.fonts.ready) document.fonts.ready.then(gambarGrafik);
