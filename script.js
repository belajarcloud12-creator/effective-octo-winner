const KUNCI_PEMASUKAN = 'daftarPemasukan';
const KUNCI_PENGELUARAN = 'daftarPengeluaran';
const KUNCI_GAJI_LAMA = 'totalGaji'; 
const POS_BUDGET = {
    kebutuhan: { id: 'Kebutuhan', nama: 'Kebutuhan', label: 'Kebutuhan Pokok (50%)', porsi: 0.5 },
    keinginan: { id: 'Keinginan', nama: 'Keinginan', label: 'Keinginan (30%)',       porsi: 0.3 },
    tabungan:  { id: 'Tabungan',  nama: 'Tabungan',  label: 'Tabungan (20%)',        porsi: 0.2 }
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


const GAYA_EXCEL = `
    body, table { font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
    table { border-collapse: collapse; }
    td, th { border: 1px solid #b8c4d6; padding: 5px 8px; vertical-align: middle; }
    .judul { font-size: 18pt; font-weight: bold; color: #14305a; border: none; }
    .sub { color: #64748b; border: none; }
    .sect { font-size: 12pt; font-weight: bold; color: #ffffff; background: #14305a; border: 1px solid #14305a; }
    th { background: #dbe7f6; color: #14305a; font-weight: bold; text-align: center; }
    .c { text-align: center; }
    .n { text-align: right; mso-number-format: "\\0022Rp\\0022\\ #\\,##0"; }
    .total td { background: #fff3d6; font-weight: bold; }
    .minus { color: #b91c1c; font-weight: bold; }
    .kosong { color: #94a3b8; font-style: italic; }
    .nb { border: none; }
`;

function bersihkanTeks(teks) {
    return esc(String(teks ?? '').replace(/[^\w\s/.,()%&-]/g, '').trim());
}

function barisKosong(pesan) {
    return `<tr><td colspan="6" class="c kosong">${pesan}</td></tr>`;
}

function barisExcelPengeluaran() {
    if (daftarPengeluaran.length === 0) return barisKosong('Belum ada pengeluaran');

    const urut = [...daftarPengeluaran].sort((a, b) => tanggalItem(a) - tanggalItem(b));

    return urut.map((item, i) => {
        const waktu = tanggalItem(item).toISOString();
        const labelPos = POS_BUDGET[item.kategori]?.label || bersihkanTeks(item.kategori);

        return `<tr>
            <td class="c">${i + 1}</td>
            <td>${formatTanggal(waktu)}</td>
            <td class="c">${formatJam(waktu)}</td>
            <td>${bersihkanTeks(item.nama)}</td>
            <td>${labelPos}</td>
            <td class="n">${item.jumlah}</td>
        </tr>`;
    }).join('');
}

function barisExcelRekap(ringkasan) {
    return Object.entries(POS_BUDGET).map(([kunci, konfig]) => {
        const { budget, terpakai, sisa } = ringkasan.pos[kunci];
        return `<tr>
            <td colspan="2">${konfig.label}</td>
            <td colspan="2" class="n">${Math.round(budget)}</td>
            <td class="n">${terpakai}</td>
            <td class="n ${sisa < 0 ? 'minus' : ''}">${Math.round(sisa)}</td>
        </tr>`;
    }).join('');
}

function barisExcelPemasukan() {
    if (daftarPemasukan.length === 0) return barisKosong('Belum ada pemasukan');

    return daftarPemasukan.map((item, i) => `<tr>
            <td class="c">${i + 1}</td>
            <td>${formatTanggal(tanggalItem(item).toISOString())}</td>
            <td colspan="2">${bersihkanTeks(item.sumber) || 'Pemasukan / Gaji'}</td>
            <td colspan="2" class="n">${item.jumlah}</td>
        </tr>`).join('');
}

function buatHtmlLaporan(ringkasan) {
    const { totalMasuk, totalKeluar, sisaTotal } = ringkasan;
    const sekarang = new Date().toISOString();
    const spacer = '<tr><td colspan="6" class="nb"></td></tr>';
    const teksBiasa = `style="mso-number-format:'@'"`;

    return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="UTF-8">
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
<x:Name>Laporan Keuangan</x:Name>
<x:WorksheetOptions><x:DisplayGridlines>false</x:DisplayGridlines></x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
<style>${GAYA_EXCEL}</style>
</head>
<body>
<table>
    <col width="45"><col width="150"><col width="80"><col width="230"><col width="190"><col width="130">
    <tr><td colspan="6" class="judul">LAPORAN KEUANGAN DOMPETKU</td></tr>
    <tr><td colspan="6" class="sub">Dicetak: ${formatTanggal(sekarang)}, ${formatJam(sekarang)}</td></tr>
    ${spacer}

    <tr><td colspan="6" class="sect">RINGKASAN</td></tr>
    <tr><td colspan="4"><b>Total pemasukan</b></td><td colspan="2" class="n">${totalMasuk}</td></tr>
    <tr><td colspan="4"><b>Total pengeluaran</b></td><td colspan="2" class="n">${totalKeluar}</td></tr>
    <tr class="total"><td colspan="4">Sisa saldo</td><td colspan="2" class="n">${sisaTotal}</td></tr>
    ${spacer}

    <tr><td colspan="6" class="sect">DAFTAR PENGELUARAN</td></tr>
    <tr><th>No</th><th>Tanggal</th><th>Jam</th><th>Nama Pengeluaran</th><th>Diambil dari Pos</th><th>Jumlah</th></tr>
    ${barisExcelPengeluaran()}
    <tr class="total"><td colspan="5" class="n" ${teksBiasa}>TOTAL PENGELUARAN</td><td class="n">${totalKeluar}</td></tr>
    ${spacer}

    <tr><td colspan="6" class="sect">REKAP PER POS BUDGET</td></tr>
    <tr><th colspan="2">Pos</th><th colspan="2">Alokasi</th><th>Terpakai</th><th>Sisa</th></tr>
    ${barisExcelRekap(ringkasan)}
    ${spacer}

    <tr><td colspan="6" class="sect">DAFTAR PEMASUKAN</td></tr>
    <tr><th>No</th><th>Tanggal</th><th colspan="2">Sumber</th><th colspan="2">Nominal</th></tr>
    ${barisExcelPemasukan()}
    <tr class="total"><td colspan="4" class="n" ${teksBiasa}>TOTAL PEMASUKAN</td><td colspan="2" class="n">${totalMasuk}</td></tr>
</table>
</body>
</html>`;
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

    const html = buatHtmlLaporan(hitungRingkasan());
    unduhFile('\uFEFF' + html, 'Laporan_Keuangan_DompetKu.xls', 'application/vnd.ms-excel;charset=utf-8;');
}


function setModeGrafik(mode) {
    modeGrafik = mode;
    document.querySelectorAll('.chart-tab').forEach(tombol => {
        tombol.classList.toggle('active', tombol.dataset.mode === mode);
    });
    gambarGrafik();
}

function konfigGrafikMinggu(now) {
    const awal = awalMinggu(now);

    return {
        judul: 'Pengeluaran Minggu Ini',
        labelX: 'Hari',
        labels: NAMA_HARI,
        detail: NAMA_HARI.map((hari, i) => {
            const t = new Date(awal);
            t.setDate(awal.getDate() + i);
            return hari + ', ' + t.getDate() + ' ' + NAMA_BULAN[t.getMonth()];
        }),
        indeksSekarang: (now.getDay() + 6) % 7,
        cariIndeks: tgl => {
            if (tgl < awal) return -1;
            const hariKe = Math.floor((new Date(tgl.getFullYear(), tgl.getMonth(), tgl.getDate()) - awal) / 86400000);
            return hariKe < 7 ? hariKe : -1;
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

function gambarGrafik() {
    const wrap = $('grafikWrap');
    if (!wrap) return;

    const g = siapkanDataGrafik(modeGrafik);
    dataGrafikAktif = g;
    $('judulGrafik').innerText = g.judul;

    // Ukuran kanvas dan margin
    const W = 640, H = 340;
    const kiri = 64, kanan = 18, atas = 16;
    const labelMiring = modeGrafik === 'tahun';
    const bawah = labelMiring ? 96 : 62;
    const lebar = W - kiri - kanan;
    const tinggi = H - atas - bawah;

    // Skala
    const maks = Math.max(0, ...g.nilai.filter(v => v !== null));
    const { langkah, jumlah } = hitungSkalaY(maks);
    const yMaks = langkah * jumlah;
    const n = g.labels.length;
    const xAt = i => kiri + (n === 1 ? lebar / 2 : (lebar * (i + 0.5)) / n);
    const yAt = v => atas + tinggi - (v / yMaks) * tinggi;

    const svg = [`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(g.judul)}">`];

    for (let t = 0; t <= jumlah; t++) {
        const v = t * langkah;
        const y = yAt(v);
        svg.push(`<line class="${t === 0 ? 'axis-line' : 'grid-line'}" x1="${kiri}" x2="${W - kanan}" y1="${y}" y2="${y}"/>`);
        svg.push(`<text class="ax-text" x="${kiri - 8}" y="${y + 4}" text-anchor="end">${singkatRupiah(v)}</text>`);
    }

    const lompat = (modeGrafik === 'bulan' && n > 28) ? 2 : 1;
    g.labels.forEach((label, i) => {
        if (i % lompat !== 0) return;

        const x = xAt(i);
        const y = atas + tinggi + 18;
        if (labelMiring) {
            svg.push(`<text class="ax-text" x="${x}" y="${y - 4}" text-anchor="end" transform="rotate(-40 ${x} ${y - 4})">${esc(label)}</text>`);
        } else {
            svg.push(`<text class="ax-text" x="${x}" y="${y}" text-anchor="middle">${esc(label)}</text>`);
        }
    });

    svg.push(`<text class="ax-title" x="${kiri + lebar / 2}" y="${H - 8}" text-anchor="middle">${g.labelX}</text>`);
    svg.push(`<text class="ax-title" transform="translate(16 ${atas + tinggi / 2}) rotate(-90)" text-anchor="middle">Jumlah (Rupiah)</text>`);

    const titik = g.nilai
        .map((v, i) => (v === null ? null : [xAt(i), yAt(v)]))
        .filter(Boolean);
    if (titik.length > 1) {
        svg.push(`<polyline class="line" points="${titik.map(p => p.join(',')).join(' ')}"/>`);
    }

    const radius = modeGrafik === 'bulan' ? 3.5 : 5;
    g.nilai.forEach((v, i) => {
        if (v === null) return;
        svg.push(`<circle class="dot" data-i="${i}" cx="${xAt(i)}" cy="${yAt(v)}" r="${radius}"/>`);
        svg.push(`<circle class="hit" data-i="${i}" cx="${xAt(i)}" cy="${yAt(v)}" r="14"/>`);
    });

    svg.push('</svg>');
    wrap.innerHTML = svg.join('');

    wrap.querySelectorAll('.hit').forEach(el => {
        const tampil = () => tampilkanTitikGrafik(parseInt(el.dataset.i, 10));
        el.addEventListener('mouseenter', tampil);
        el.addEventListener('click', tampil);
    });

    tampilkanTitikGrafik(null);
}

function tampilkanTitikGrafik(i) {
    const info = $('grafikInfo');
    const g = dataGrafikAktif;

    document.querySelectorAll('#grafikWrap .dot').forEach(dot => {
        dot.classList.toggle('aktif', i !== null && parseInt(dot.dataset.i, 10) === i);
    });

    if (i !== null) {
        info.innerHTML = esc(g.detail[i]) + ': <strong>' + formatRupiah(g.nilai[i]) + '</strong>';
        return;
    }

    const total = g.nilai.reduce((jumlah, v) => jumlah + (v || 0), 0);
    info.innerHTML = total === 0
        ? 'Belum ada pengeluaran pada periode ini.'
        : 'Total periode ini: <strong>' + formatRupiah(total) + '</strong>. Arahkan atau ketuk titik untuk melihat detail.';
}


migrasiGajiLama();
aktifkanFormatRupiahPadaInput();
isiInfoTanggal();

$('grafikWrap').addEventListener('mouseleave', () => tampilkanTitikGrafik(null));

updateTampilan();
