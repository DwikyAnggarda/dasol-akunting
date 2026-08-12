# Dasol User Guide

Buku panduan ini menjelaskan cara memakai Dasol berdasarkan implementasi aplikasi per 12 Agustus 2026. Bahasa dan contoh ditujukan kepada pengguna bisnis; istilah teknis hanya dipakai ketika membantu memahami kontrol, jurnal, atau keamanan.

> **Sumber kebenaran:** Bila buku panduan lama berbeda dengan aplikasi, perilaku aplikasi dan permission aktif perusahaan adalah acuan. Administrator dapat membuat custom role, sehingga menu setiap pengguna bisa berbeda dari preset demo.

## Mulai di Sini

1. [Pengenalan Dasol](./00-pengenalan-dasol.md) — tujuan aplikasi, cara masuk, dan perjalanan pertama.
2. [Konsep Dasar](./01-konsep-dasar-dasol.md) — company aktif, status dokumen, posting, reversal, periode, dan audit.
3. [Peta Role dan Permission](./02-peta-role-dan-permission.md) — pembagian tugas dan hak akses default.
4. [Quick Reference](./18-quick-reference.md) — cari menu berdasarkan pekerjaan yang ingin dilakukan.

## Berdasarkan Role

- [Administrator](./03-administrator-guide.md)
- [Akuntan / Standard User](./04-accountant-guide.md)
- [Operator Penjualan / Pembelian](./05-operator-guide.md)
- [Approver / Validator](./06-approver-guide.md)
- [Viewer / Auditor](./07-viewer-auditor-guide.md)

## Berdasarkan Proses

- [Alur lintas role](./08-cross-role-workflows.md)
- [Akuntansi dan posting](./09-accounting-workflows.md)
- [Penjualan](./10-sales-workflows.md)
- [Pembelian](./11-purchase-workflows.md)
- [Persediaan](./12-inventory-workflows.md)
- [Kas dan bank](./13-cash-bank-workflows.md)
- [Pajak](./14-tax-workflows.md)
- [Laporan](./15-reporting-guide.md)

## Referensi

- [Troubleshooting](./16-troubleshooting.md)
- [Glosarium](./17-glossary.md)
- [Quick Reference](./18-quick-reference.md)
- [Sistem visual diagram](./diagrams/README.md)

## Cara Menggunakan Buku Ini

- Pengguna baru: baca pengenalan, konsep dasar, lalu panduan role Anda.
- Trainer: gunakan bagian **Belajar Dasol dalam 30 Menit** dan **Demo 5 Menit** pada setiap panduan role.
- Supervisor: mulai dari peta role dan alur lintas role.
- Tim finance: mulai dari alur akuntansi, kas/bank, pajak, dan laporan.
- Tim support: gunakan troubleshooting dan quick reference.

## Legenda

| Simbol           | Arti                                                           |
| ---------------- | -------------------------------------------------------------- |
| ✅               | Tersedia pada preset role dan berfungsi                        |
| ⚠️               | Terbatas, tergantung permission, atau hanya sebagian lifecycle |
| ❌               | Tidak tersedia pada preset role                                |
| Draft            | Masih dapat diedit oleh pembuat berwenang                      |
| Pending Approval | Menunggu keputusan Approver                                    |
| Approved         | Sudah disetujui dan siap diposting oleh role berwenang         |
| Posted           | Sudah menghasilkan dampak permanen pada ledger/stok/subledger  |
| Reversed         | Dampak posted dibalik dengan transaksi/jurnal baru             |

## Batas Cakupan yang Perlu Diketahui

Fitur yang belum tersedia penuh tidak disamarkan sebagai fitur selesai. Yang paling penting:

- tidak ada print/PDF dokumen transaksi;
- tidak ada integrasi langsung Coretax;
- approval UI saat ini satu tingkat, tanpa threshold dan request revision;
- manual journal langsung diposting saat dibuat, tanpa draft/approval UI;
- order belum dapat langsung membuat invoice;
- stock transfer adalah proses satu tahap, tanpa status in-transit/receive;
- Viewer preset tidak memiliki permission ekspor;
- notifikasi sudah durable, tetapi belum realtime di header atau email.

Rincian status teknis tersedia dalam [Functional Completion Report](../FUNCTIONAL_COMPLETION_REPORT.md).

### Matriks Batas Implementasi

| Area               | Yang tersedia                                                        | Yang belum tersedia penuh                                                                    |
| ------------------ | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Company/branch     | Pilih company aktif dan edit identitas/settings                      | Create/archive company dan CRUD branch di UI                                                 |
| User/role          | Membership, preset/custom role, permission enforcement               | Feature-flag dan approval-workflow designer di UI                                            |
| Approval           | Submit, satu keputusan approve/reject, history, self-approval policy | Multi-level/threshold, request revision, cancel submission                                   |
| Dokumen            | Draft/edit/delete sesuai state, submit, post, reverse sesuai domain  | Print/PDF, send, duplicate, attachment UI                                                    |
| Sales/Purchase     | Quotation/request → order → fulfillment serta invoice terpisah       | Konversi order/receipt langsung ke invoice, three-way matching, cancel remaining quantity    |
| Settlement         | Receipt/payment dan partial/full outstanding                         | Overpayment, withholding, bank fee, write-off                                                |
| Inventory          | Stock card, adjustment, transfer, opname, fulfillment/return         | In-transit/receive dua langkah, lot/serial, report valuation/reconciliation tersendiri       |
| Accounting         | Manual posting/reversal dan close/reopen period                      | Draft/approval jurnal manual, fiscal-year/period generator, budget/consolidation/revaluation |
| Fixed assets       | Category, asset Draft, activate, depreciation, dispose/write-off     | Reversal disposal dan fixed-asset report tersendiri                                          |
| Tax                | Effective rate, posted snapshot, Tax Report, CSV                     | Integrasi/submission Coretax langsung dan validasi skema resmi                               |
| Reports            | Delapan report dan CSV bagi role berizin                             | Customer/supplier statement, sales/purchase/inventory reports, PDF/print pack                |
| Notification/audit | Durable notification page, read state, audit list/detail/export      | Realtime header badge, email, dan attachment evidence UI                                     |
