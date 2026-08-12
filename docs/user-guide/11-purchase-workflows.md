# Workflow Purchase

Modul Purchase mencakup purchase request, purchase order, goods receipt, purchase invoice, supplier payment, dan purchase return.

> **Batas implementasi:** purchase request dapat dikonversi ke purchase order, lalu approved purchase order dapat membuat goods receipt Draft. Purchase invoice dibuat terpisah; belum ada three-way matching otomatis.

## 1. Purchase Request

**Tujuan:** mencatat kebutuhan pembelian internal. **Pelaku:** Operator dan Approver. **Prasyarat:** item/service dan kebutuhan sudah jelas.

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontSize":"18px","fontFamily":"Inter, Arial, sans-serif","primaryTextColor":"#172033","lineColor":"#64748b"},"flowchart":{"curve":"basis"}}}%%
flowchart LR
    D[Request Draft] --> S[Submitted]
    S --> A{Decision}
    A -- Reject --> R[Rejected]
    R --> D
    A -- Approve --> P[Approved]
    P --> C[Create purchase order Draft]
```

### Cara Membaca Flowchart

Purchase request adalah dokumen kebutuhan, tanpa journal atau stock movement. Konversi hanya menghasilkan PO Draft yang masih harus dilengkapi dan disetujui.

## 2. Purchase Order

**Tujuan:** mencatat komitmen pemesanan ke supplier. **Prasyarat:** supplier dan line pembelian tersedia.

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontSize":"18px","fontFamily":"Inter, Arial, sans-serif","primaryTextColor":"#172033","lineColor":"#64748b"},"flowchart":{"curve":"basis"}}}%%
flowchart TD
    D[PO Draft] --> S[Submit]
    S --> A{Approve?}
    A -- Tidak --> R[Rejected lalu koreksi]
    R --> D
    A -- Ya --> P[Approved]
    P --> G[Create goods receipt Draft]
    P --> N[Purchase invoice dibuat terpisah]
```

### Cara Membaca Flowchart

Approved PO belum menambah stock dan belum membentuk utang. Ia menjadi referensi proses penerimaan barang.

## 3. Goods Receipt

**Tujuan:** mencatat barang masuk. **Prasyarat:** approved PO, warehouse, dan line penerimaan. **Dampak posting:** stock naik, Dr Inventory dan Cr GRNI.

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontSize":"18px","fontFamily":"Inter, Arial, sans-serif","primaryTextColor":"#172033","lineColor":"#64748b"},"flowchart":{"curve":"basis"}}}%%
flowchart TD
    PO[Approved PO] --> D[Receipt Draft]
    D --> S[Submitted]
    S --> A{Decision}
    A -- Reject --> X[Rejected]
    X --> D
    A -- Approve --> AP[Approved]
    AP --> P[Post]
    P --> Q[Stock bertambah]
    P --> J[Dr Inventory, Cr GRNI]
```

### Cara Membaca Flowchart

Posting adalah saat kuantitas dan nilai persediaan berubah. Bila salah, reverse dokumen agar stock movement dan journal dibalik dengan jejak audit.

## 4. Purchase Invoice

**Tujuan:** mengakui tagihan supplier. **Prasyarat:** supplier, account/tax mapping, dan periode Open. **Dampak posting:** Dr Expense/Asset dan Input Tax, Cr AP.

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontSize":"18px","fontFamily":"Inter, Arial, sans-serif","primaryTextColor":"#172033","lineColor":"#64748b"},"flowchart":{"curve":"basis"}}}%%
flowchart TD
    D[Invoice Draft] --> E[Edit atau delete]
    E --> S[Submit]
    S --> A{Decision}
    A -- Reject --> R[Rejected]
    R --> D
    A -- Approve --> P[Approved]
    P --> O[Post]
    O --> J[Expense/Asset, Input Tax, AP]
    O --> U[Outstanding supplier]
```

### Cara Membaca Flowchart

Invoice tidak otomatis mengambil receipt. Cocokkan PO, receipt, dan invoice sebelum approval/post sebagai kontrol manual.

## 5. Supplier Payment

**Tujuan:** melunasi utang supplier. **Pelaku:** Operator membuat; role dengan `purchase.post`, biasanya Approver atau Administrator, memposting. **Prasyarat:** invoice Posted dan outstanding.

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontSize":"18px","fontFamily":"Inter, Arial, sans-serif","primaryTextColor":"#172033","lineColor":"#64748b"},"flowchart":{"curve":"basis"}}}%%
flowchart LR
    I[Posted invoice] --> D[Payment Draft]
    D --> P[Post payment]
    P --> J[Dr AP, Cr Kas/Bank]
    P --> O{Outstanding tersisa?}
    O -- Ya --> PT[Partially paid]
    O -- Tidak --> F[Fully paid]
    P --> R[Reverse bila perlu]
```

### Cara Membaca Flowchart

Payment tidak memakai approval queue. Reversal memulihkan outstanding invoice dan membentuk jurnal kebalikan.

## 6. Purchase Return

**Tujuan:** mengoreksi pembelian posted. **Prasyarat:** purchase invoice Posted, quantity return tersedia, warehouse untuk inventory, dan stock cukup.

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontSize":"18px","fontFamily":"Inter, Arial, sans-serif","primaryTextColor":"#172033","lineColor":"#64748b"},"flowchart":{"curve":"basis"}}}%%
flowchart TD
    I[Posted purchase invoice] --> L[Pilih line dan quantity]
    L --> C{Quantity dan stock valid?}
    C -- Tidak --> B[Diblokir]
    C -- Ya --> S[Submit return]
    S --> A[Approve]
    A --> P[Post]
    P --> F[Balik AP, expense/purchase, tax]
    P --> Q[Kurangi stock bila inventory]
```

### Cara Membaca Flowchart

Sumber return adalah purchase invoice, bukan goods receipt. Validasi kumulatif mencegah quantity retur melebihi quantity invoice.

## 7. Purchase dari Awal sampai Audit

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontSize":"18px","fontFamily":"Inter, Arial, sans-serif","primaryTextColor":"#172033","lineColor":"#64748b"},"flowchart":{"curve":"basis"}}}%%
flowchart LR
    PR[Purchase Request] --> PO[Purchase Order]
    PO --> GR[Goods Receipt]
    GR --> ST[Stock dan GRNI]
    PI[Purchase Invoice] --> AP[AP dan Expense/Asset]
    SP[Supplier Payment] --> AP
    ST --> RP[Reports]
    AP --> RP
    AU[Viewer/Auditor] --> RP
```

### Cara Membaca Flowchart

Fulfillment dan billing merupakan cabang terpisah. Review manual harus memastikan barang yang diterima, invoice supplier, dan pembayaran konsisten.

## Status dan Koreksi

| Dokumen          | Status utama                                 | Saat jurnal/stock berubah | Koreksi                    |
| ---------------- | -------------------------------------------- | ------------------------- | -------------------------- |
| Purchase request | Draft, Submitted, Approved, Rejected         | Tidak pernah              | Edit sebelum resubmit      |
| Purchase order   | Draft, Submitted, Approved, Rejected         | Tidak pernah              | Edit sebelum resubmit      |
| Goods receipt    | Draft, Submitted, Approved, Posted, Reversed | Posted                    | Reverse                    |
| Purchase invoice | Draft, Submitted, Approved, Posted, Reversed | Posted                    | Reverse jika belum settled |
| Supplier payment | Draft, Posted, Reversed                      | Posted                    | Reverse                    |
| Purchase return  | Draft, Submitted, Approved, Posted, Reversed | Posted                    | Reverse                    |

## Error dan Kontrol

- **Supplier/item tidak tersedia:** periksa master dan company aktif.
- **Periode Locked:** eskalasi kebutuhan koreksi; jangan memundurkan tanggal tanpa dasar.
- **Payment ditolak:** periksa outstanding, rekening, dan status invoice.
- **Return gagal:** periksa sisa quantity, warehouse, serta stock yang tersedia.
- **Tidak ada tombol invoice dari PO/receipt:** fitur belum tersedia.
- **GRNI belum clear otomatis:** purchase invoice tidak otomatis direkonsiliasi ke receipt; lakukan review ledger secara manual.

## Panduan Terkait

- [Panduan Operator](./05-operator-guide.md)
- [Panduan Approver](./06-approver-guide.md)
- [Workflow Inventory](./12-inventory-workflows.md)
- [Workflow Accounting](./09-accounting-workflows.md)
