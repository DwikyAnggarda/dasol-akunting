# Workflow Pajak

Dasol menyimpan tax code, versi tarif berbasis tanggal efektif, snapshot pajak pada invoice posted, dan Tax Report. Konfigurasi harus dilakukan sebelum transaksi diposting.

## Siklus Pajak

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontSize":"18px","fontFamily":"Inter, Arial, sans-serif","primaryTextColor":"#172033","lineColor":"#64748b"},"flowchart":{"curve":"basis"}}}%%
flowchart LR
    C[Tax Code] --> V[Rate Versions]
    V --> I[Invoice line]
    I --> P[Invoice Posted]
    P --> S[Tax Snapshot]
    S --> R[Tax Report]
    R --> E[CSV Export]
```

### Cara Membaca Flowchart

Tarif yang berlaku dipilih berdasarkan tanggal transaksi. Ketika invoice diposting, detail pajak disalin menjadi snapshot agar laporan historis tidak berubah akibat tarif baru.

## Tax Code dan Rate Version

1. Administrator/Akuntan dengan `settings.manage` membuka pengaturan Tax Codes.
2. Buat tax code dengan identitas dan account mapping yang benar.
3. Tambahkan rate version beserta tanggal efektif.
4. Hindari rentang tanggal yang tumpang tindih.
5. Uji pada invoice Draft sebelum digunakan luas.

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontSize":"18px","fontFamily":"Inter, Arial, sans-serif","primaryTextColor":"#172033","lineColor":"#64748b"},"flowchart":{"curve":"basis"}}}%%
flowchart TD
    N[New rate version] --> D[Isi rate dan effective dates]
    D --> O{Overlap dengan versi lain?}
    O -- Ya --> X[Diblokir]
    O -- Tidak --> S[Simpan]
    S --> U{Sudah dipakai posting?}
    U -- Ya --> P[Perubahan/penghapusan dilindungi]
    U -- Tidak --> E[Dapat dikelola sesuai permission]
```

### Cara Membaca Flowchart

Dasol mencegah overlap dan melindungi rate version yang sudah dipakai. Buat versi baru untuk perubahan tarif; jangan mengubah histori.

## Pajak Penjualan

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontSize":"18px","fontFamily":"Inter, Arial, sans-serif","primaryTextColor":"#172033","lineColor":"#64748b"},"flowchart":{"curve":"basis"}}}%%
flowchart LR
    L[Sales invoice line] --> T[Tax code dan rate berlaku]
    T --> P[Post]
    P --> J[Cr Output Tax]
    P --> S[Sales tax snapshot]
    S --> R[Tax Report]
```

### Cara Membaca Flowchart

Pajak keluaran diakui saat sales invoice diposting. Sales return posted membalik bagian pajak sesuai line dan quantity return.

## Pajak Pembelian

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontSize":"18px","fontFamily":"Inter, Arial, sans-serif","primaryTextColor":"#172033","lineColor":"#64748b"},"flowchart":{"curve":"basis"}}}%%
flowchart LR
    L[Purchase invoice line] --> T[Tax code dan rate berlaku]
    T --> P[Post]
    P --> J[Dr Input Tax]
    P --> S[Purchase tax snapshot]
    S --> R[Tax Report]
```

### Cara Membaca Flowchart

Pajak masukan berasal dari purchase invoice posted. Purchase return posted membalik pajak terkait sesuai nilai return.

## Tax Report

1. Buka **Reports → Tax Report**.
2. Pilih tanggal awal dan akhir.
3. Review pajak keluaran dan pajak masukan.
4. Telusuri ke invoice sumber bila nilai tidak sesuai.
5. Pengguna dengan `report.export` dapat mengunduh CSV.

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontSize":"18px","fontFamily":"Inter, Arial, sans-serif","primaryTextColor":"#172033","lineColor":"#64748b"},"flowchart":{"curve":"basis"}}}%%
flowchart TD
    F[Filter from/to] --> R[Tax Report]
    R --> O[Output tax]
    R --> I[Input tax]
    O --> C[Compare dan review source]
    I --> C
    C --> E[Export CSV bila berizin]
```

### Cara Membaca Flowchart

Samakan cutoff laporan dengan periode pemeriksaan. Viewer dapat membaca report, tetapi preset Viewer tidak memiliki permission export.

## Export dan Coretax

Dasol memiliki adapter CSV/XML generik di kode dengan penanda **DEMO / NOT FOR OFFICIAL SUBMISSION**. Tidak ada tombol integrasi langsung ke Coretax, validasi skema resmi, submission, acknowledgement, atau sinkronisasi status.

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontSize":"18px","fontFamily":"Inter, Arial, sans-serif","primaryTextColor":"#172033","lineColor":"#64748b"},"flowchart":{"curve":"basis"}}}%%
flowchart LR
    R[Tax Report] --> C[CSV Dasol]
    C --> V[Validasi/reformat di luar Dasol]
    V --> S[Sistem pajak resmi]
    X[Generic adapter demo] -. bukan submission resmi .-> V
```

### Cara Membaca Flowchart

Export Dasol adalah bahan rekonsiliasi, bukan file resmi siap kirim. Tim pajak tetap harus memvalidasi format dan memakai prosedur sistem resmi yang berlaku.

## Kontrol

- Batasi pengelolaan tax code kepada role berwenang.
- Jangan mengubah histori rate; buat versi efektif baru.
- Review account mapping input/output tax sebelum posting.
- Rekonsiliasi Tax Report dengan invoice, return, dan GL.
- Simpan bukti submission resmi di sistem/prosedur eksternal; attachment UI Dasol belum tersedia.

## Error Umum

| Masalah                      | Penyebab                                 | Tindakan                                |
| ---------------------------- | ---------------------------------------- | --------------------------------------- |
| Tax code tidak tersedia      | Tidak aktif/tidak sesuai company/tanggal | Periksa konfigurasi dan effective date  |
| Rate version ditolak         | Rentang overlap                          | Sesuaikan tanggal tanpa tumpang tindih  |
| Rate tidak dapat dihapus     | Sudah dipakai transaksi posted           | Buat versi baru; pertahankan histori    |
| Report kosong                | Tidak ada invoice posted pada rentang    | Periksa company, tanggal, dan status    |
| CSV tidak cocok format resmi | Export bukan adapter resmi Coretax       | Transformasi dan validasi di luar Dasol |

## Panduan Terkait

- [Panduan Administrator](./03-administrator-guide.md)
- [Panduan Akuntan](./04-accountant-guide.md)
- [Workflow Accounting](./09-accounting-workflows.md)
- [Panduan Laporan](./15-reporting-guide.md)
