# Panduan Administrator

## 1. Tentang Role Ini

Administrator menjaga konfigurasi, akses, dan governance Dasol. Administrator dapat memiliki seluruh permission, tetapi bukan berarti harus mengerjakan setiap transaksi harian. Pemisahan tugas tetap dianjurkan: Operator membuat, Approver memvalidasi, Akuntan mengontrol, dan Auditor meninjau.

Tanggung jawab utama:

- memastikan user dan membership benar;
- mengelola custom role dan permission;
- menjaga company identity dan accounting settings;
- menyiapkan COA, account mapping, pajak, warehouse, dan bank account;
- menutup/membuka kembali periode sesuai kebijakan;
- menyelidiki audit trail dan exception akses.

> **Status implementasi:** Company baru, branch CRUD, feature flag, dan approval-workflow designer belum memiliki UI. Company aktif dapat diedit; branch yang sudah ada dipilih melalui form terkait.

## 2. Hak Akses

| Modul             | Lihat | Tambah          | Edit             | Hapus/Arsip    | Submit                  | Approve                    | Post | Reverse         | Export |
| ----------------- | ----- | --------------- | ---------------- | -------------- | ----------------------- | -------------------------- | ---- | --------------- | ------ |
| Company/settings  | ✅    | ❌ company baru | ✅               | ❌             | N/A                     | N/A                        | N/A  | N/A             | ❌     |
| Users/memberships | ✅    | ✅ undang       | ✅               | ✅ nonaktifkan | N/A                     | N/A                        | N/A  | N/A             | ❌     |
| Roles/permissions | ✅    | ✅ custom       | ✅ custom        | ✅ nonaktifkan | N/A                     | N/A                        | N/A  | N/A             | ❌     |
| Master data       | ✅    | ✅              | ✅               | ✅ nonaktifkan | N/A                     | N/A                        | N/A  | N/A             | ✅ CSV |
| Sales/Purchase    | ✅    | ✅              | ✅ draft         | ✅ draft       | ✅                      | ✅                         | ✅   | ✅ sesuai guard | ❌     |
| Inventory/Cash    | ✅    | ✅              | ✅ draft         | ✅ draft       | ✅                      | ✅                         | ✅   | ✅              | ❌     |
| Journal/period    | ✅    | ✅ jurnal       | ❌ jurnal posted | ❌             | ⚠️ jurnal langsung post | ⚠️ tidak dipakai UI jurnal | ✅   | ✅              | ❌     |
| Reports/Audit     | ✅    | N/A             | N/A              | N/A            | N/A                     | N/A                        | N/A  | N/A             | ✅ CSV |

## 3. Dashboard Administrator

Dasbor tidak memiliki versi khusus role. Administrator melihat ringkasan company aktif: kas/bank, AR/AP, laba bulanan, transaksi posted terbaru, pending approval, dan low-stock count. Gunakan ini sebagai indikator awal, lalu buka laporan atau audit log untuk investigasi.

## 4. Menu yang Dapat Diakses

Administrator melihat seluruh sidebar:

- **Ringkasan:** Dasbor, Persetujuan, Notifikasi, Sales Quotation.
- **Transaksi:** seluruh sales, purchase, inventory, receipt/payment, return, dan fulfillment.
- **Akuntansi:** COA, contacts, products, warehouses, journal, period, reports, fixed assets.
- **Administrasi:** bank account, cash transaction, reconciliation, taxes, audit, company settings, mapping, users, roles.

## 5. Aktivitas Harian

1. Periksa notifikasi dan exception pada dasbor.
2. Tinjau user/membership yang baru diundang atau perlu dinonaktifkan.
3. Pastikan mapping akun dan master aktif sebelum transaksi dimulai.
4. Tangani permintaan akses melalui custom role, bukan berbagi kredensial.
5. Tinjau Audit Log untuk perubahan konfigurasi kritis.
6. Koordinasikan close/reopen period dengan Akuntan.

## 6. Flowchart Utama Role

### A. Daily Overview

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontSize":"18px","fontFamily":"Inter, ui-sans-serif, Arial, sans-serif","primaryTextColor":"#172033","lineColor":"#64748b"},"flowchart":{"curve":"basis","nodeSpacing":42,"rankSpacing":55}}}%%
flowchart TD
    AD1(["Login dan pilih company"])
    AD2["Buka Dasbor"]
    AD3{"Ada pekerjaan governance?"}
    AD4["Kelola user atau role"]
    AD5["Periksa konfigurasi accounting"]
    AD6["Tinjau periode dan audit"]
    AD7(["Dokumentasikan hasil"])
    AD1 --> AD2 --> AD3
    AD3 --> AD4 --> AD7
    AD3 --> AD5 --> AD7
    AD3 --> AD6 --> AD7
    classDef nav fill:#dbeafe,stroke:#2563eb,stroke-width:2px,color:#1e3a8a;
    classDef decision fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f;
    classDef secure fill:#ede9fe,stroke:#7c3aed,stroke-width:2px,color:#4c1d95;
    classDef done fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#14532d;
    class AD1,AD2 nav;
    class AD3 decision;
    class AD4,AD5,AD6 secure;
    class AD7 done;
```

### Cara Membaca Flowchart

1. Mulai dari company yang benar.
2. Dasbor membantu memilih area investigasi.
3. Perubahan akses, konfigurasi, dan periode harus dapat dijelaskan.
4. Simpan alasan atau tiket internal untuk perubahan kritis.

### B. User Management

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontSize":"18px","fontFamily":"Inter, ui-sans-serif, Arial, sans-serif","primaryTextColor":"#172033","lineColor":"#64748b"},"flowchart":{"curve":"basis"}}}%%
flowchart TD
    UM1["Settings > Pengguna"] --> UM2{"User sudah dikenal?"}
    UM2 -- Tidak --> UM3["Isi nama, email, role"]
    UM3 --> UM4["Kirim undangan Auth"]
    UM2 -- Ya --> UM5["Tambahkan membership"]
    UM4 --> UM6["Membership aktif"]
    UM5 --> UM6
    UM6 --> UM7{"Perlu perubahan?"}
    UM7 -- Ya --> UM8["Ubah role atau status"]
    UM7 -- Tidak --> UM9["Selesai"]
    UM8 --> UM9
    classDef input fill:#dbeafe,stroke:#2563eb,stroke-width:2px,color:#1e3a8a;
    classDef decision fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f;
    classDef secure fill:#ede9fe,stroke:#7c3aed,stroke-width:2px,color:#4c1d95;
    classDef done fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#14532d;
    class UM1,UM3 input;
    class UM2,UM7 decision;
    class UM4,UM5,UM6,UM8 secure;
    class UM9 done;
```

### Cara Membaca Flowchart

1. Undangan memakai konfigurasi Supabase Auth dan service-role di server.
2. User yang sudah ada tidak perlu dibuat ulang; membership baru dapat ditambahkan.
3. Role harus aktif.
4. Administrator tidak dapat mengubah role/status membership miliknya sendiri melalui UI, untuk mencegah self-lockout.

### C. Role dan Permission

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontSize":"18px","fontFamily":"Inter, ui-sans-serif, Arial, sans-serif","primaryTextColor":"#172033","lineColor":"#64748b"},"flowchart":{"curve":"basis"}}}%%
flowchart LR
    RP1["Settings > Roles"] --> RP2{"Role sistem?"}
    RP2 -- Ya --> RP3["Lihat permission saja"]
    RP2 -- Tidak --> RP4["Buat atau edit custom role"]
    RP4 --> RP5["Pilih permission minimum"]
    RP5 --> RP6{"Masih dipakai user aktif?"}
    RP6 -- Ya --> RP7["Tidak dapat dinonaktifkan"]
    RP6 -- Tidak --> RP8["Dapat dinonaktifkan"]
    classDef nav fill:#dbeafe,stroke:#2563eb,stroke-width:2px,color:#1e3a8a;
    classDef decision fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f;
    classDef secure fill:#ede9fe,stroke:#7c3aed,stroke-width:2px,color:#4c1d95;
    classDef blocked fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#7f1d1d;
    classDef done fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#14532d;
    class RP1 nav;
    class RP2,RP6 decision;
    class RP3,RP4,RP5 secure;
    class RP7 blocked;
    class RP8 done;
```

### Cara Membaca Flowchart

1. Lima role demo adalah role sistem dan tidak dapat diedit.
2. Custom role wajib memiliki minimal satu permission.
3. Gunakan prinsip least privilege.
4. Role aktif yang masih dipakai membership tidak dapat dinonaktifkan.

### D. Initial Company Setup

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontSize":"18px","fontFamily":"Inter, ui-sans-serif, Arial, sans-serif","primaryTextColor":"#172033","lineColor":"#64748b"},"flowchart":{"curve":"basis"}}}%%
flowchart TD
    CS1["Pilih company yang telah diprovisikan"] --> CS2["Lengkapi identitas dan timezone"]
    CS2 --> CS3["Atur awal tahun buku dan self approval"]
    CS3 --> CS4["Siapkan COA"]
    CS4 --> CS5["Lengkapi account mapping"]
    CS5 --> CS6["Buat pajak, warehouse, dan bank"]
    CS6 --> CS7["Buat role dan membership"]
    CS7 --> CS8["Uji akses dan posting demo"]
    classDef input fill:#dbeafe,stroke:#2563eb,stroke-width:2px,color:#1e3a8a;
    classDef secure fill:#ede9fe,stroke:#7c3aed,stroke-width:2px,color:#4c1d95;
    classDef accounting fill:#ecfeff,stroke:#0891b2,stroke-width:2px,color:#164e63;
    classDef done fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#14532d;
    class CS1,CS2 input;
    class CS3,CS7 secure;
    class CS4,CS5,CS6 accounting;
    class CS8 done;
```

### Cara Membaca Flowchart

1. Company harus sudah diprovisikan; create-company UI belum ada.
2. Pastikan COA aktif sebelum dipakai mapping.
3. Tax rate dibuat sebagai versi efektif, bukan mengubah histori.
4. Uji dengan transaksi kecil sebelum onboarding massal.

### E. Accounting Configuration

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontSize":"18px","fontFamily":"Inter, ui-sans-serif, Arial, sans-serif","primaryTextColor":"#172033","lineColor":"#64748b"},"flowchart":{"curve":"basis"}}}%%
flowchart LR
    AC1["COA aktif"] --> AC2["Account Mapping"]
    AC2 --> AC3["Product accounts"]
    AC2 --> AC4["Tax input/output accounts"]
    AC2 --> AC5["Bank linked GL"]
    AC3 --> AC6{"Posting test seimbang?"}
    AC4 --> AC6
    AC5 --> AC6
    AC6 -- Tidak --> AC7["Perbaiki konfigurasi"]
    AC6 -- Ya --> AC8["Siap operasional"]
    AC7 --> AC2
    classDef accounting fill:#ecfeff,stroke:#0891b2,stroke-width:2px,color:#164e63;
    classDef decision fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f;
    classDef blocked fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#7f1d1d;
    classDef done fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#14532d;
    class AC1,AC2,AC3,AC4,AC5 accounting;
    class AC6 decision;
    class AC7 blocked;
    class AC8 done;
```

### Cara Membaca Flowchart

1. Mapping company menangani akun kontrol umum.
2. Produk membawa akun revenue/expense/inventory/COGS.
3. Pajak dan bank memiliki akun terkait masing-masing.
4. Posting gagal dengan aman bila mapping wajib kosong.

### F. Period Close/Reopen Governance

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontSize":"18px","fontFamily":"Inter, ui-sans-serif, Arial, sans-serif","primaryTextColor":"#172033","lineColor":"#64748b"},"flowchart":{"curve":"basis"}}}%%
flowchart TD
    PC1["Akuntan review ledger"] --> PC2{"Siap ditutup?"}
    PC2 -- Tidak --> PC3["Selesaikan koreksi"]
    PC3 --> PC1
    PC2 -- Ya --> PC4["Tutup periode"]
    PC4 --> PC5["Posting tanggal periode diblokir"]
    PC5 --> PC6{"Perlu reopen?"}
    PC6 -- Tidak --> PC7["Periode tetap Locked"]
    PC6 -- Ya --> PC8["Administrator isi alasan"]
    PC8 --> PC9["Reopen dan audit event"]
    classDef accounting fill:#ecfeff,stroke:#0891b2,stroke-width:2px,color:#164e63;
    classDef decision fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f;
    classDef blocked fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#7f1d1d;
    classDef secure fill:#ede9fe,stroke:#7c3aed,stroke-width:2px,color:#4c1d95;
    classDef done fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#14532d;
    class PC1,PC3 accounting;
    class PC2,PC6 decision;
    class PC4,PC8,PC9 secure;
    class PC5 blocked;
    class PC7 done;
```

### Cara Membaca Flowchart

1. Close dilakukan setelah review, bukan sekadar karena kalender berakhir.
2. Akuntan preset dapat close tetapi tidak reopen.
3. Administrator preset dapat reopen dengan alasan wajib.
4. Semua posting dan reversal pada periode Locked ditolak.

### G. Audit Investigation

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontSize":"18px","fontFamily":"Inter, ui-sans-serif, Arial, sans-serif","primaryTextColor":"#172033","lineColor":"#64748b"},"flowchart":{"curve":"basis"}}}%%
flowchart LR
    AI1["Audit Log"] --> AI2["Filter tanggal, action, entity"]
    AI2 --> AI3["Buka detail event"]
    AI3 --> AI4["Bandingkan before dan after"]
    AI4 --> AI5["Hubungkan document number"]
    AI5 --> AI6{"Perlu eskalasi?"}
    AI6 -- Ya --> AI7["Catat bukti dan owner"]
    AI6 -- Tidak --> AI8["Tutup investigasi"]
    classDef neutral fill:#f1f5f9,stroke:#64748b,stroke-width:2px,color:#334155;
    classDef decision fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f;
    classDef secure fill:#ede9fe,stroke:#7c3aed,stroke-width:2px,color:#4c1d95;
    classDef done fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#14532d;
    class AI1,AI2,AI3,AI4,AI5 neutral;
    class AI6 decision;
    class AI7 secure;
    class AI8 done;
```

### Cara Membaca Flowchart

1. Mulai dari filter yang sempit agar event relevan mudah ditemukan.
2. Detail menampilkan metadata dan perubahan data bila tersedia.
3. Audit Log tidak diedit atau dihapus dari UI.
4. Export CSV tersedia bagi Administrator dengan `report.export` dan `audit.read`.

## 7. Panduan Setiap Aktivitas

### Mengundang pengguna

1. Buka **Pengaturan → Pengguna**.
2. Klik tambah/undang.
3. Masukkan nama, email, dan role aktif.
4. Simpan. Jika user belum ada, Dasol meminta Supabase Auth mengirim undangan.
5. Konfirmasi membership muncul pada daftar.

### Mengelola custom role

1. Buka **Roles & Permission**.
2. Buat role dengan kode, nama, dan minimal satu permission.
3. Review permission berisiko tinggi: manage, approve, post, reverse, dan period.
4. Simpan dan uji dengan user non-admin.

### Menyiapkan account mapping

1. Pastikan akun aktif dan tipe/normal balance benar.
2. Buka **Pemetaan Akun**.
3. Isi AR, AP, inventory, COGS, revenue, GRNI, tax, bank fee, rounding, retained earnings, dan exchange accounts yang dipakai.
4. Simpan, lalu uji posting relevan.

## 8. Status yang Relevan

- Membership: `active` atau `inactive`.
- Role: active/inactive; role sistem tidak dapat diubah.
- Master: active/inactive.
- Period: `open` atau `locked`.
- Audit: append-only, tanpa lifecycle edit.

## 9. Kesalahan yang Sering Terjadi

- Mengubah company yang salah sebelum konfigurasi.
- Memberikan permission `*.post`, `*.reverse`, atau `period.reopen` terlalu luas.
- Menonaktifkan master yang masih diperlukan tanpa koordinasi.
- Mengubah setting self-approval tanpa kebijakan tertulis.
- Menganggap approval threshold/two-level sudah aktif karena tabel database tersedia.

## 10. Tips

- Buat custom role per fungsi, bukan per nama orang.
- Uji negative access setelah perubahan permission.
- Catat alasan reopen period dan perubahan mapping.
- Gunakan inactive untuk master historis; jangan mengejar hard delete.

## 11. Checklist Administrator

- [ ] Company aktif sudah benar.
- [ ] User memiliki membership dan role yang tepat.
- [ ] Mapping akun wajib terisi.
- [ ] Tax rate efektif tidak tumpang tindih.
- [ ] Warehouse dan bank account aktif.
- [ ] Self-approval sesuai kebijakan.
- [ ] Close/reopen memiliki persetujuan internal.
- [ ] Audit Log ditinjau setelah perubahan kritis.

## 12. FAQ

**Apakah Administrator boleh posting?**

Secara permission default, ya. Secara governance sebaiknya hanya untuk kondisi yang disetujui dan tidak menghilangkan separation of duties.

**Bisakah membuat company baru dari UI?**

Belum. Company harus diprovisikan di luar alur self-service, lalu identitasnya dapat diedit.

**Bisakah mengatur two-level approval?**

Belum end-to-end. Schema step ada, tetapi engine/UI aktif masih satu keputusan.

**Mengapa role tidak dapat dinonaktifkan?**

Role sistem dilindungi, dan custom role yang masih dipakai anggota aktif juga diblokir.

## Belajar Dasol dalam 30 Menit

1. Login dan pilih company.
2. Kenali KPI Dasbor.
3. Buka Pengguna dan detail membership.
4. Buka role sistem dan custom role.
5. Tinjau COA dan Account Mapping.
6. Buka Kode Pajak dan versi rate.
7. Tinjau Periode Akuntansi.
8. Cari satu dokumen pada Audit Log.
9. Uji satu akun user dengan permission terbatas.

### Demo 5 Menit

1. Tunjukkan company aktif.
2. Buka daftar user dan role.
3. Buka satu custom role dan permission-nya.
4. Buka Account Mapping.
5. Tunjukkan Audit Log sebelum/after perubahan yang aman.

## Handoff ke Role Lain

- Setup selesai → Operator mulai membuat master/transaksi.
- Dokumen submitted → Approver memvalidasi.
- Transaksi posted → Akuntan merekonsiliasi.
- Bukti ledger/audit → Viewer/Auditor meninjau.
- Exception permission/configuration → kembali ke Administrator.

## Panduan Terkait

- [Peta Role dan Permission](./02-peta-role-dan-permission.md)
- [Panduan Akuntan](./04-accountant-guide.md)
- [Alur lintas role](./08-cross-role-workflows.md)
- [Troubleshooting](./16-troubleshooting.md)
