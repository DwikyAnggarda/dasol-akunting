# Dasol Mermaid Diagram System

Diagram dalam buku panduan memakai Mermaid yang ditanam langsung pada setiap file Markdown agar mudah dipindahkan ke knowledge base, PDF, atau DOCX.

## Bahasa Warna

| Warna   | Makna                                      |
| ------- | ------------------------------------------ |
| Biru    | Start, input, navigasi, pekerjaan Operator |
| Hijau   | Approved, posted, selesai                  |
| Amber   | Decision, pending, warning                 |
| Merah   | Rejected, error, blocked                   |
| Ungu    | Security, permission, approval             |
| Cyan    | Accounting dan financial processing        |
| Abu-abu | Read-only, archive, neutral                |

Semua diagram menggunakan `Inter, ui-sans-serif, Arial, sans-serif`, font 18–20px, ID node tanpa spasi, dan label pendek. Diagram panjang dipecah berdasarkan proses.

## Validasi

Source Mermaid diekstrak dari seluruh file `docs/user-guide/*.md` ke file sementara dan dirender dengan Mermaid CLI. Pemeriksaan link Markdown dan aturan caption dilakukan terpisah. Hasil validasi terakhir dicatat saat handoff dokumentasi.
