# Alur Kerja Lintas Role

Panduan ini menunjukkan siapa yang membuat, memeriksa, memposting, dan mengaudit transaksi. Preset permission dapat diubah melalui custom role; diagram memakai preset bawaan Dasol.

## Prinsip Handoff

- Operator menyiapkan dokumen operasional dan mengirimkannya.
- Approver memeriksa dokumen yang masuk antrean approval dan dapat approve/reject.
- Akuntan menjaga jurnal, periode, laporan, rekonsiliasi, serta kontrol akuntansi.
- Administrator menjaga identitas company, user, role, master keuangan, dan reopen periode.
- Viewer/Auditor menelusuri bukti secara read-only.

> **Batas implementasi:** approval aktif saat ini satu tingkat. Konfigurasi `current_step`, minimum, dan maksimum tersimpan di skema, tetapi workflow approval bertingkat/berbasis nominal belum berjalan end-to-end di UI dan decision engine.

## 1. Sales Invoice

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontSize":"18px","fontFamily":"Inter, Arial, sans-serif","primaryTextColor":"#172033","lineColor":"#64748b"}}}%%
sequenceDiagram
    participant O as Operator
    participant A as Approver
    participant D as Dasol
    participant V as Viewer
    O->>D: Buat dan submit sales invoice
    D-->>A: Masuk antrean approval
    A->>D: Approve atau reject
    alt Disetujui
        A->>D: Post invoice
        D->>D: Bentuk AR, revenue, dan pajak
        D-->>V: Dokumen dan jurnal dapat ditinjau
    else Ditolak
        D-->>O: Status Rejected untuk diperbaiki
    end
```

### Cara Membaca Flowchart

Baca dari atas ke bawah. Invoice baru memengaruhi ledger setelah Approver memilih **Post**; approval saja belum membentuk jurnal.

## 2. Customer Receipt

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontSize":"18px","fontFamily":"Inter, Arial, sans-serif","primaryTextColor":"#172033","lineColor":"#64748b"}}}%%
sequenceDiagram
    participant O as Operator
    participant A as Approver
    participant D as Dasol
    participant V as Viewer
    O->>D: Buat customer receipt
    Note over O,D: Harus memilih invoice posted yang masih outstanding
    A->>D: Review dan post receipt
    D->>D: Dr Kas/Bank, Cr Piutang
    D-->>V: Saldo dan settlement dapat ditinjau
    opt Koreksi
        A->>D: Reverse receipt
        D->>D: Pulihkan outstanding dan jurnal balik
    end
```

### Cara Membaca Flowchart

Receipt tidak memakai antrean approval. Pemisahan tugas muncul dari `sales.create` milik Operator dan `sales.post`/`journal.reverse` milik Approver atau role lain yang diberi izin tersebut.

## 3. Purchase Order

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontSize":"18px","fontFamily":"Inter, Arial, sans-serif","primaryTextColor":"#172033","lineColor":"#64748b"}}}%%
sequenceDiagram
    participant O as Operator
    participant A as Approver
    participant D as Dasol
    O->>D: Buat dan submit purchase order
    D-->>A: Tampilkan di Persetujuan
    A->>D: Review supplier, item, quantity, harga
    alt Approve
        A->>D: Approve purchase order
        D->>D: Siapkan aksi buat goods receipt
    else Reject
        A->>D: Isi alasan dan reject
        D-->>O: Kembalikan untuk koreksi
    end
```

### Cara Membaca Flowchart

Purchase order adalah komitmen operasional dan belum menjurnal. Goods receipt dibuat sebagai dokumen Draft terpisah setelah PO disetujui.

## 4. Goods Receipt

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontSize":"18px","fontFamily":"Inter, Arial, sans-serif","primaryTextColor":"#172033","lineColor":"#64748b"}}}%%
sequenceDiagram
    participant O as Operator
    participant A as Approver
    participant D as Dasol
    participant K as Akuntan
    O->>D: Buat goods receipt dari approved PO
    O->>D: Submit penerimaan
    A->>D: Approve lalu post
    D->>D: Tambah stock, Dr Inventory, Cr GRNI
    D-->>K: Jurnal posted tersedia
    opt Salah penerimaan
        A->>D: Reverse
        D->>D: Balik stock dan jurnal
    end
```

### Cara Membaca Flowchart

Stock dan GRNI baru berubah ketika goods receipt diposting. Purchase invoice bukan hasil konversi otomatis dari goods receipt pada versi ini.

## 5. Purchase Invoice

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontSize":"18px","fontFamily":"Inter, Arial, sans-serif","primaryTextColor":"#172033","lineColor":"#64748b"}}}%%
sequenceDiagram
    participant O as Operator
    participant A as Approver
    participant D as Dasol
    participant K as Akuntan
    O->>D: Buat dan submit purchase invoice
    A->>D: Review dan approve atau reject
    alt Approved
        A->>D: Post invoice
        D->>D: Dr Beban/Aset dan Pajak Masukan, Cr Utang
        D-->>K: AP dan jurnal tersedia
    else Rejected
        D-->>O: Perbaiki invoice
    end
```

### Cara Membaca Flowchart

Purchase invoice berdiri sendiri dari goods receipt. Pastikan rekonsiliasi dokumen sumber dilakukan secara prosedural karena three-way matching otomatis belum tersedia.

## 6. Supplier Payment

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontSize":"18px","fontFamily":"Inter, Arial, sans-serif","primaryTextColor":"#172033","lineColor":"#64748b"}}}%%
sequenceDiagram
    participant O as Operator
    participant A as Approver
    participant D as Dasol
    participant V as Viewer
    O->>D: Buat supplier payment
    Note over O,D: Pilih invoice posted yang masih outstanding
    A->>D: Review dan post payment
    D->>D: Dr Utang, Cr Kas/Bank
    D-->>V: Settlement dapat ditelusuri
    opt Koreksi
        A->>D: Reverse payment
        D->>D: Pulihkan outstanding
    end
```

### Cara Membaca Flowchart

Payment memiliki lifecycle Draft → Posted → Reversed dan tidak masuk approval queue. Posting memakai `purchase.post`; overpayment, withholding, bank fee, dan write-off belum ditangani oleh form settlement.

## 7. Stock Adjustment

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontSize":"18px","fontFamily":"Inter, Arial, sans-serif","primaryTextColor":"#172033","lineColor":"#64748b"}}}%%
sequenceDiagram
    participant O as Operator
    participant A as Approver
    participant D as Dasol
    participant K as Akuntan
    O->>D: Buat adjustment dan submit
    A->>D: Review item, warehouse, quantity, alasan
    alt Approve dan post
        A->>D: Post adjustment
        D->>D: Ubah stock dan bentuk jurnal selisih
        D-->>K: Jurnal tersedia untuk review
    else Reject
        D-->>O: Koreksi dokumen
    end
```

### Cara Membaca Flowchart

Pengecekan quantity dan nilai terjadi saat posting. Reversal membalik stock movement dan jurnal terkait.

## 8. Manual Journal

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontSize":"18px","fontFamily":"Inter, Arial, sans-serif","primaryTextColor":"#172033","lineColor":"#64748b"}}}%%
sequenceDiagram
    participant K as Akuntan
    participant D as Dasol
    participant V as Viewer
    K->>D: Isi tanggal, memo, debit, kredit
    D->>D: Validasi seimbang dan periode terbuka
    K->>D: Post jurnal
    D-->>V: Jurnal posted dapat ditelusuri
    opt Koreksi
        K->>D: Reverse dengan alasan
        D->>D: Buat jurnal pembalik
    end
```

### Cara Membaca Flowchart

Form jurnal manual saat ini langsung memposting. Belum ada UI Draft → Submit → Approval untuk jurnal manual, sehingga review internal harus diatur sebagai prosedur organisasi.

## 9. Period Closing

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontSize":"18px","fontFamily":"Inter, Arial, sans-serif","primaryTextColor":"#172033","lineColor":"#64748b"}}}%%
sequenceDiagram
    participant K as Akuntan
    participant D as Dasol
    participant M as Administrator
    participant V as Viewer
    K->>D: Review transaksi dan laporan periode
    K->>D: Close period
    D->>D: Status menjadi Locked
    D-->>V: Laporan final dapat ditinjau
    opt Perlu koreksi sah
        M->>D: Reopen dengan alasan
        D->>D: Status kembali Open dan dicatat
    end
```

### Cara Membaca Flowchart

Preset Akuntan dapat menutup periode, tetapi hanya Administrator yang dapat membuka kembali. Jangan reopen tanpa alasan dan otorisasi yang dapat diaudit.

## 10. Sales Return

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontSize":"18px","fontFamily":"Inter, Arial, sans-serif","primaryTextColor":"#172033","lineColor":"#64748b"}}}%%
sequenceDiagram
    participant O as Operator
    participant A as Approver
    participant D as Dasol
    participant K as Akuntan
    O->>D: Pilih posted sales invoice dan line
    D->>D: Batasi quantity kumulatif return
    O->>D: Submit sales return
    A->>D: Approve dan post
    D->>D: Kurangi AR/revenue/pajak dan pulihkan stock bila relevan
    D-->>K: Jurnal return tersedia
```

### Cara Membaca Flowchart

Sumber sales return wajib sales invoice berstatus Posted. Untuk item inventory, warehouse wajib dan posting juga membalik COGS sesuai nilai yang dihitung sistem.

## 11. Purchase Return

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontSize":"18px","fontFamily":"Inter, Arial, sans-serif","primaryTextColor":"#172033","lineColor":"#64748b"}}}%%
sequenceDiagram
    participant O as Operator
    participant A as Approver
    participant D as Dasol
    participant K as Akuntan
    O->>D: Pilih posted purchase invoice dan line
    D->>D: Validasi sisa quantity yang dapat diretur
    O->>D: Submit purchase return
    A->>D: Approve dan post
    D->>D: Kurangi AP/beban/pajak dan stock bila relevan
    D-->>K: Jurnal return tersedia
```

### Cara Membaca Flowchart

Sumber implementasi saat ini adalah purchase invoice, bukan goods receipt. Return inventory gagal diposting jika stock tidak cukup atau warehouse belum dipilih.

## 12. Tax Report dan Export

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontSize":"18px","fontFamily":"Inter, Arial, sans-serif","primaryTextColor":"#172033","lineColor":"#64748b"}}}%%
sequenceDiagram
    participant K as Akuntan
    participant D as Dasol
    participant V as Viewer
    participant E as File CSV
    K->>D: Pilih periode Tax Report
    D->>D: Baca tax snapshot invoice posted
    D-->>K: Tampilkan pajak masukan dan keluaran
    K->>D: Export CSV
    D-->>E: Unduh data laporan
    V->>D: Review report tanpa export
```

### Cara Membaca Flowchart

Tax report mengambil snapshot pajak yang dibekukan saat invoice diposting. Export adalah CSV Dasol; ini bukan pengiriman langsung atau format resmi Coretax.

## 13. Ringkasan Alur Sales

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontSize":"18px","fontFamily":"Inter, Arial, sans-serif","primaryTextColor":"#172033","lineColor":"#64748b"},"flowchart":{"curve":"basis"}}}%%
flowchart LR
    O[Operator] --> Q[Quotation]
    Q --> A[Approver]
    A --> SO[Sales Order Draft]
    O --> SI[Sales Invoice]
    SI --> A
    A --> P[Posting]
    P --> J[Journal dan AR]
    O --> R[Customer Receipt]
    K[Akuntan] --> R
    R --> J
    V[Viewer] --> J
```

### Cara Membaca Flowchart

Quotation dapat dikonversi ke sales order, tetapi sales invoice dibuat terpisah. Garis ke jurnal hanya muncul dari invoice dan receipt yang sudah diposting.

## 14. Ringkasan Alur Purchase

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontSize":"18px","fontFamily":"Inter, Arial, sans-serif","primaryTextColor":"#172033","lineColor":"#64748b"},"flowchart":{"curve":"basis"}}}%%
flowchart LR
    O[Operator] --> PR[Purchase Request]
    PR --> A[Approver]
    A --> PO[Purchase Order Draft]
    PO --> GR[Goods Receipt]
    GR --> ST[Stock dan GRNI]
    O --> PI[Purchase Invoice]
    PI --> A
    A --> AP[Journal dan AP]
    O --> SP[Supplier Payment]
    K[Akuntan] --> SP
    SP --> AP
```

### Cara Membaca Flowchart

Goods receipt menambah stock/GRNI, sedangkan purchase invoice membentuk AP. Keduanya belum dihubungkan oleh three-way matching otomatis.

## 15. Ringkasan Alur Accounting

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontSize":"18px","fontFamily":"Inter, Arial, sans-serif","primaryTextColor":"#172033","lineColor":"#64748b"},"flowchart":{"curve":"basis"}}}%%
flowchart LR
    S[Source Posted] --> J[Journal Entries]
    M[Manual Journal] --> J
    J --> GL[General Ledger]
    GL --> TB[Trial Balance]
    TB --> FS[Financial Reports]
    K[Akuntan] --> C[Close Period]
    C --> L[Locked]
    AD[Administrator] --> R[Reopen dengan alasan]
    R --> O[Open]
```

### Cara Membaca Flowchart

Laporan berasal dari jurnal posted. Closing mengunci mutation bertanggal dalam periode tersebut; reopen adalah tindakan administratif yang harus beralasan.

## Checklist Handoff

- Sertakan nomor dokumen, company, tanggal, nominal, dan masalah.
- Pastikan status terakhir terlihat sebelum menyerahkan pekerjaan.
- Jangan meminta penerima melewati permission; eskalasi ke Administrator bila role keliru.
- Untuk rejection/reversal/reopen, tulis alasan yang spesifik dan dapat diaudit.
- Setelah posting, cocokkan source, jurnal, saldo, serta laporan yang terpengaruh.

## Panduan Terkait

- [Peta role dan permission](./02-peta-role-dan-permission.md)
- [Workflow accounting](./09-accounting-workflows.md)
- [Troubleshooting](./16-troubleshooting.md)
