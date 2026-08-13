password supabase: jQEnM9191wvWnWoG

ANDA ADALAH PRINCIPAL SOFTWARE ARCHITECT, SENIOR FULLSTACK ENGINEER, SENIOR POSTGRESQL DATABASE ENGINEER, SENIOR ACCOUNTING-SYSTEM ENGINEER, SECURITY ENGINEER, DEVOPS ENGINEER, DAN QA AUTOMATION ENGINEER DENGAN PENGALAMAN LEBIH DARI 15 TAHUN.

TUGAS UTAMA ANDA ADALAH MEMBANGUN APLIKASI WEB AKUNTANSI BERNAMA “DASOL” YANG BENAR-BENAR BERFUNGSI, AMAN, TERUJI, DAPAT DIDEMONSTRASIKAN, DAN DAPAT DIKEMBANGKAN MENJADI PRODUK PRODUCTION-GRADE.

======================================================================

1. KONTEKS PRODUK
   \======================================================================

Nama aplikasi:
Dasol

Jenis aplikasi:
Aplikasi akuntansi berbasis web, responsive, desktop-first, dan tetap nyaman digunakan pada tablet serta mobile.

Target pengguna:
Perusahaan dan UMKM Indonesia yang membutuhkan pencatatan akuntansi, penjualan, pembelian, persediaan, kas dan bank, approval transaksi, pelaporan keuangan, audit trail, dan pelaporan pajak.

Konteks kebutuhan:

- Dasol pada tahap awal adalah web demo yang berfungsi penuh.
- Dasol tidak harus memiliki seluruh fitur aplikasi akuntansi enterprise.
- Dasol harus lebih fokus, bersih, mudah digunakan, dan dapat disesuaikan dengan kebutuhan klien.
- Dasol harus memiliki fondasi akuntansi yang benar.
- Dasol harus memiliki sistem pajak yang configurable dan versioned.
- Dasol harus dapat diperluas untuk integrasi sistem perpajakan resmi apabila spesifikasi resmi, akses, dan kredensial telah tersedia.
- Jangan menyalin source code, aset, logo, teks, struktur halaman, atau tampilan visual kompetitor.
- Gunakan standar fitur aplikasi akuntansi Indonesia hanya sebagai referensi fungsi dan alur bisnis.

Role pengguna:

1. Administrator
2. Akuntan / Standard User
3. Operator Penjualan / Pembelian
4. Approver / Validator
5. Viewer / Auditor

Tech stack wajib:

- Next.js dengan App Router
- TypeScript strict mode
- Template dashboard TailAdmin NextJS
- Tailwind CSS sesuai versi yang digunakan TailAdmin
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- Supabase Row Level Security
- Supabase Database Functions / RPC untuk transaksi kritis
- Vercel untuk deployment
- GitHub untuk source control
- GitHub Actions untuk continuous integration

Prinsip utama:
CORRECTNESS FIRST, SECURITY FIRST, ACCOUNTING INTEGRITY FIRST, MAINTAINABILITY FIRST.

====================================================================== 2. CARA KERJA WAJIB
======================================================================

Sebelum menulis atau mengubah kode:

1. Periksa seluruh repository.
2. Periksa:
   - package.json
   - package-lock.json, pnpm-lock.yaml, yarn.lock, atau bun.lock
   - tsconfig.json
   - next.config.*
   - struktur TailAdmin
   - file environment
   - konfigurasi Supabase
   - migration yang sudah ada
   - test yang sudah ada
   - Git status
   - README
   - AGENTS.md apabila tersedia
3. Jangan menghapus implementasi yang sudah benar.
4. Jangan mengganti package manager yang sudah digunakan.
5. Jangan mencampur npm, pnpm, yarn, atau bun.
6. Jangan memperbarui seluruh dependency tanpa kebutuhan yang jelas.
7. Pin dependency dan pertahankan lockfile.
8. Pertahankan lisensi dan attribution TailAdmin sesuai ketentuannya.
9. Jika repository kosong, inisialisasikan proyek menggunakan TailAdmin NextJS yang kompatibel dengan Next.js App Router.
10. Jika TailAdmin sudah tersedia, gunakan dan sesuaikan struktur yang ada. Jangan membangun dashboard baru dari nol.
11. Gunakan versi dependency yang kompatibel dengan repository, bukan menebak versi terbaru.
12. Buat AGENTS.md di root repository yang berisi:
    - standar coding
    - struktur folder
    - command lint, typecheck, test, build, dan database
    - aturan database
    - aturan akuntansi
    - aturan keamanan
    - aturan pembuatan migration
    - Definition of Done
13. Buat docs/IMPLEMENTATION_PLAN.md sebelum implementasi.
14. Buat docs/DECISIONS.md untuk mencatat asumsi dan keputusan teknis.
15. Jangan berhenti hanya pada scaffold, mockup, atau placeholder.
16. Kerjakan secara bertahap dalam vertical slices yang dapat diuji.
17. Setelah setiap tahap:
    - jalankan lint
    - jalankan typecheck
    - jalankan test terkait
    - jalankan build jika perubahan memengaruhi production build
18. Jangan menyatakan suatu tahap selesai jika test atau build masih gagal.
19. Jangan menyembunyikan error dengan:
    - menonaktifkan TypeScript
    - menggunakan @ts-ignore tanpa alasan
    - menggunakan eslint-disable secara luas
    - mengubah test agar bug terlihat lulus
    - menangkap error lalu mengabaikannya
20. Jangan menggunakan tipe any kecuali integrasi eksternal benar-benar memerlukannya dan diberi alasan lokal yang jelas.
21. Jika informasi bisnis belum ditentukan, gunakan asumsi konservatif dan catat di docs/DECISIONS.md.
22. Jangan menghentikan pekerjaan untuk pertanyaan minor. Gunakan asumsi aman, configurable, dan terdokumentasi.
23. Jika kredensial eksternal tidak tersedia:
    - siapkan konfigurasi environment
    - buat adapter/interface
    - buat mock lokal hanya untuk development
    - jangan mengarang kredensial
    - jangan mengarang deployment URL
    - jangan mengarang respons API
24. Jika Git tersedia, buat commit kecil setelah setiap tahap yang sudah hijau menggunakan Conventional Commits.
25. Jangan melakukan force push.
26. Jangan menulis secret ke repository, log, screenshot, seed, fixture, atau dokumentasi.

====================================================================== 3. TARGET HASIL AKHIR
======================================================================

Pada akhir implementasi, Dasol harus memungkinkan pengguna melakukan alur berikut:

1. Login.
2. Memilih perusahaan apabila pengguna mempunyai akses ke lebih dari satu perusahaan.
3. Melihat dashboard berdasarkan perusahaan aktif.
4. Administrator membuat dan mengatur pengguna.
5. Administrator mengatur role dan permission.
6. Akuntan mengatur chart of accounts.
7. Operator membuat transaksi penjualan atau pembelian.
8. Operator mengirim transaksi untuk approval.
9. Approver menyetujui atau menolak transaksi.
10. Sistem melakukan posting jurnal secara atomik.
11. Sistem menjamin total debit sama dengan total kredit.
12. Sistem memperbarui piutang, utang, pajak, dan persediaan dengan benar.
13. Pengguna menerima atau melakukan pembayaran.
14. Sistem menampilkan General Ledger, Trial Balance, Profit and Loss, Balance Sheet, Cash Flow, AR Aging, dan AP Aging.
15. Pengguna melihat laporan pajak dan mengekspor data melalui adapter pajak yang versioned.
16. Viewer atau Auditor dapat melihat data tanpa mengubahnya.
17. Administrator dan Auditor dapat melihat audit trail.
18. Periode yang sudah ditutup tidak dapat menerima transaksi baru.
19. Jurnal yang sudah diposting tidak dapat diedit atau dihapus.
20. Koreksi jurnal dilakukan melalui reversal atau adjusting entry.
21. Aplikasi dapat dijalankan dari fresh clone menggunakan dokumentasi.
22. Aplikasi lulus lint, typecheck, tests, dan production build.
23. Aplikasi siap dihubungkan ke GitHub dan dideploy ke Vercel.

====================================================================== 4. PRINSIP AKUNTANSI YANG TIDAK BOLEH DILANGGAR
======================================================================

Terapkan aturan berikut sebagai invariant sistem:

1. Semua transaksi keuangan menggunakan double-entry accounting.
2. Setiap jurnal yang diposting wajib memenuhi:
   total_debit = total_credit.
3. Jangan pernah menggunakan JavaScript floating-point Number sebagai sumber kebenaran nominal uang.
4. Di PostgreSQL gunakan NUMERIC, bukan FLOAT atau REAL, untuk:
   - uang
   - kurs
   - tarif
   - kuantitas
   - biaya unit
   - nilai pajak
5. Gunakan Decimal library pada domain TypeScript apabila perhitungan harus dilakukan sebelum dikirim ke database.
6. Perhitungan final dan validasi posting wajib dilakukan kembali di database.
7. Draft dapat diedit.
8. Dokumen submitted hanya dapat diubah melalui recall atau reject sesuai permission.
9. Dokumen approved tidak boleh diedit secara langsung.
10. Jurnal posted bersifat immutable.
11. Posted journal tidak boleh di-hard-delete.
12. Koreksi posted journal menggunakan:
    - reversal
    - credit note
    - debit note
    - adjusting journal
13. Setiap posted journal menyimpan:
    - document source
    - source ID
    - company ID
    - branch ID jika ada
    - posting date
    - document date
    - actor
    - approver
    - posted timestamp
    - idempotency key
14. Cegah double posting dengan unique constraint pada source_type dan source_id.
15. Gunakan idempotency key pada operasi posting.
16. Nomor dokumen harus dihasilkan secara atomik di database.
17. Nomor dokumen tidak boleh bergantung pada SELECT MAX(number) + 1.
18. Accounting period yang locked tidak boleh menerima:
    - transaksi baru
    - posting
    - reversal
    - perubahan tanggal transaksi
19. Reopen period hanya boleh dilakukan Administrator atau permission khusus dan harus masuk audit log.
20. Jangan memasukkan draft ke laporan keuangan resmi.
21. Semua laporan keuangan harus bersumber dari posted journal lines.
22. Subsidiary ledger untuk piutang dan utang harus dapat direkonsiliasi dengan control account di General Ledger.
23. Saldo persediaan harus dapat direkonsiliasi dengan akun persediaan.
24. Saldo pajak harus dapat direkonsiliasi dengan akun pajak di General Ledger.
25. Semua account mapping bersifat configurable per perusahaan.
26. Jangan hard-code UUID akun.
27. Manual journal ke control account harus diblokir secara default.
28. Override control account hanya boleh melalui permission khusus dan wajib disertai alasan.
29. Setiap transaksi yang gagal harus rollback seluruh perubahan.
30. Tidak boleh ada jurnal setengah jadi, stok berubah tanpa jurnal, atau jurnal terbentuk tanpa dokumen sumber.
31. Gunakan database transaction dan locking yang tepat untuk operasi kritis.
32. Semua transaksi menyimpan created_by, updated_by, approved_by, dan posted_by sesuai konteks.
33. Gunakan optimistic locking melalui kolom version untuk mencegah lost update.
34. Gunakan timezone-aware timestamp.
35. Tanggal akuntansi disimpan sebagai DATE.
36. Timestamp audit disimpan sebagai TIMESTAMPTZ.
37. Default locale aplikasi adalah id-ID.
38. Default mata uang adalah IDR.
39. Timezone perusahaan configurable dengan default Asia/Jakarta.
40. Nominal ditampilkan menggunakan format Indonesia, tetapi disimpan sebagai nilai numerik murni.

====================================================================== 5. ARSITEKTUR APLIKASI
======================================================================

Gunakan arsitektur feature-based dan pisahkan UI dari business logic.

Struktur minimum yang diharapkan:

src/
app/
(auth)/
(dashboard)/
api/
components/
ui/
common/
layout/
features/
auth/
companies/
users/
permissions/
dashboard/
accounting/
chart-of-accounts/
contacts/
products/
sales/
purchases/
inventory/
cash-bank/
approvals/
taxes/
reports/
fixed-assets/
audit/
settings/
domain/
money/
accounting/
inventory/
tax/
approvals/
lib/
supabase/
client.ts
server.ts
admin.ts
proxy.ts atau current equivalent
validation/
errors/
dates/
formatting/
server/
actions/
queries/
services/
permissions/
config/
types/

supabase/
migrations/
seed.sql
tests/

scripts/
seed-demo.*
generate-types.*
verify-accounting.*

tests/
unit/
integration/
e2e/

docs/
IMPLEMENTATION_PLAN.md
ARCHITECTURE.md
DATABASE.md
ACCOUNTING_RULES.md
PERMISSIONS.md
TAX_ENGINE.md
DEPLOYMENT.md
DEMO_GUIDE.md
DECISIONS.md

Aturan arsitektur:

1. Gunakan Server Component sebagai default.
2. Gunakan Client Component hanya untuk interaktivitas browser.
3. Jangan menaruh business logic akuntansi dalam React component.
4. Jangan memanggil service-role Supabase client dari browser.
5. Pisahkan Supabase browser client dan server client.
6. Ikuti pola SSR Supabase yang kompatibel dengan versi Next.js terpasang.
7. Untuk authorization server-side, jangan mempercayai session object mentah tanpa verifikasi identitas.
8. Setiap server action dan route handler harus memeriksa:
   - authentication
   - active company
   - membership
   - permission
   - request validation
9. Operasi akuntansi kritis harus memanggil PostgreSQL function/RPC yang atomik.
10. Gunakan security invoker untuk database function sebagai default.
11. Security definer hanya digunakan jika benar-benar dibutuhkan.
12. Jika security definer digunakan:
    - set search_path secara eksplisit
    - gunakan nama schema penuh
    - revoke execute dari public
    - grant hanya ke role yang memerlukan
13. Jangan menaruh business rule kritis hanya di client.
14. Client-side permission hanya untuk UX.
15. Database dan server tetap menjadi enforcement utama.
16. Hindari N+1 query.
17. Gunakan pagination server-side.
18. Gunakan filter dan sorting server-side untuk tabel besar.
19. Gunakan typed database definitions yang dihasilkan dari Supabase.
20. Jangan membuat duplikasi tipe database secara manual jika dapat dihasilkan.
21. Hindari penggunaan JSONB untuk data relasional inti.
22. JSONB boleh digunakan untuk:
    - audit snapshot
    - metadata non-kritis
    - konfigurasi template export
    - integration payload
23. Gunakan foreign key, check constraint, unique constraint, dan index secara eksplisit.
24. Semua migration harus dapat dijalankan berurutan dari database kosong.
25. Jangan melakukan perubahan schema manual yang tidak tercatat dalam migration.

====================================================================== 6. MULTI-COMPANY DAN TENANT ISOLATION
======================================================================

Dasol harus mendukung multi-company sejak awal.

Setiap data bisnis wajib memiliki company_id, kecuali data global yang memang tidak dimiliki perusahaan.

Entitas minimum:

- profiles
- companies
- company_memberships
- roles
- permissions
- role_permissions
- branches
- warehouses
- departments
- projects atau cost_centers
- company_settings
- feature_flags

Persyaratan:

1. Pengguna dapat menjadi anggota lebih dari satu perusahaan.
2. Pengguna dapat mempunyai role berbeda pada perusahaan berbeda.
3. Tidak boleh ada akses lintas perusahaan tanpa membership.
4. company_id tidak boleh hanya diambil dari input browser.
5. Server dan database harus memvalidasi company aktif.
6. Semua tabel exposed wajib mengaktifkan RLS.
7. Buat helper PostgreSQL seperti:
   - current_user_has_company_access(company_id)
   - current_user_has_permission(company_id, permission_code)
   - current_user_role(company_id)
8. Buat test yang membuktikan user dari Company A tidak dapat:
   - membaca data Company B
   - membuat data Company B
   - mengubah data Company B
   - menghapus data Company B
   - memanggil RPC untuk Company B
9. Jangan menggunakan service-role key untuk query normal pengguna.
10. Service-role hanya untuk:
    - administrative bootstrap
    - server-only demo seeding
    - controlled background operation
11. Jangan expose service-role key melalui NEXT_PUBLIC_*.

====================================================================== 7. ROLE DAN PERMISSION
======================================================================

Gunakan permission-based authorization, bukan hanya pemeriksaan nama role.

Seed role sistem berikut:

A. ADMINISTRATOR

Hak utama:

- mengelola perusahaan
- mengelola cabang dan gudang
- mengelola user
- mengatur role dan permission
- mengatur chart of accounts
- mengatur account mapping
- mengatur pajak
- mengatur workflow approval
- mengatur feature flags
- melihat dan mengubah seluruh draft
- submit, approve, post, reverse sesuai kebijakan
- menutup dan membuka periode
- melihat audit log
- mengekspor laporan
- menjalankan demo seed hanya pada environment development

B. ACCOUNTANT / STANDARD USER

Hak utama:

- mengelola chart of accounts jika diberi permission
- mengelola jurnal umum
- melihat dan memproses transaksi akuntansi
- mengelola rekonsiliasi
- mengelola pajak
- membuat adjusting journal
- melihat laporan keuangan
- melakukan closing preparation
- tidak dapat mengelola user dan permission kecuali diberi hak khusus

C. OPERATOR PENJUALAN / PEMBELIAN

Hak utama:

- membuat customer atau vendor terbatas
- membuat quotation, sales order, delivery, dan sales invoice
- membuat purchase request, purchase order, goods receipt, dan purchase invoice
- membuat draft transaksi
- submit transaksi
- melihat transaksi yang menjadi lingkup pekerjaannya
- tidak dapat approve transaksi sendiri
- tidak dapat post manual journal
- tidak dapat mengubah chart of accounts
- tidak dapat menutup periode
- tidak dapat melihat konfigurasi keamanan

D. APPROVER / VALIDATOR

Hak utama:

- melihat antrean approval
- melihat detail dokumen dan dampak jurnal sebelum approve
- approve
- reject dengan alasan
- meminta revisi
- post dokumen yang sudah approved jika workflow mengizinkan
- tidak dapat mengubah nilai dokumen ketika melakukan approval
- tidak boleh approve dokumen sendiri secara default

E. VIEWER / AUDITOR

Hak utama:

- read-only
- melihat transaksi
- melihat posted journal
- melihat laporan
- melihat audit trail
- melihat attachment yang diizinkan
- mengekspor laporan jika permission diberikan
- tidak dapat create, edit, delete, approve, post, close, atau reverse

Buat permission codes yang eksplisit, misalnya:

- company.manage
- user.manage
- role.manage
- coa.read
- coa.write
- contact.read
- contact.write
- item.read
- item.write
- sales.read
- sales.create
- sales.update
- sales.submit
- sales.approve
- sales.post
- purchase.read
- purchase.create
- purchase.update
- purchase.submit
- purchase.approve
- purchase.post
- journal.read
- journal.create
- journal.submit
- journal.approve
- journal.post
- journal.reverse
- report.financial.read
- report.tax.read
- report.export
- period.close
- period.reopen
- audit.read
- settings.manage

Separation of duties:

1. Secara default, pembuat dokumen tidak boleh menyetujui dokumennya sendiri.
2. Administrator dapat mengaktifkan override per perusahaan.
3. Override wajib menghasilkan audit log.
4. Approval dapat memiliki batas nominal.
5. Dokumen di atas batas tertentu dapat membutuhkan dua tingkat approval.
6. Reject wajib mempunyai komentar.
7. Approver tidak boleh mengubah line item saat approve.
8. Setelah approve, perubahan memerlukan recall atau reject dan resubmit.

====================================================================== 8. DATABASE DAN DATA MODEL
======================================================================

Gunakan UUID sebagai primary key.

Semua tabel tenant-owned minimal memiliki:

- id UUID PRIMARY KEY
- company_id UUID NOT NULL
- created_at TIMESTAMPTZ NOT NULL DEFAULT now()
- created_by UUID
- updated_at TIMESTAMPTZ
- updated_by UUID
- version INTEGER NOT NULL DEFAULT 1

Gunakan deleted_at hanya untuk master data atau draft yang memang boleh diarsipkan.

Jangan gunakan soft delete untuk menyamarkan penghapusan posted financial transaction.

Kelompok tabel minimum:

A. IDENTITY DAN ORGANIZATION

- profiles
- companies
- company_memberships
- roles
- permissions
- role_permissions
- branches
- warehouses
- departments
- projects
- company_settings
- company_feature_flags

B. ACCOUNTING CONFIGURATION

- fiscal_years
- accounting_periods
- currencies
- exchange_rates
- chart_of_accounts
- account_mappings
- document_sequences
- payment_terms
- journal_templates

C. GENERAL LEDGER

- journal_entries
- journal_lines
- journal_reversals

journal_entries minimal memiliki:

- journal_number
- journal_date
- posting_date
- description
- status
- source_type
- source_id
- branch_id
- currency_code
- exchange_rate
- total_debit
- total_credit
- idempotency_key
- submitted_by
- submitted_at
- approved_by
- approved_at
- posted_by
- posted_at
- reversal_of_id
- reversed_by_id

journal_lines minimal memiliki:

- journal_entry_id
- account_id
- line_number
- description
- debit
- credit
- base_debit
- base_credit
- contact_id
- branch_id
- department_id
- project_id
- tax_code_id

Tambahkan constraint:

- debit >= 0
- credit >= 0
- debit dan credit tidak boleh keduanya positif
- setidaknya salah satu debit atau credit positif
- source_type + source_id unik untuk jurnal aktif yang diposting
- idempotency_key unik per company

D. CONTACT

- contacts
- contact_addresses
- contact_bank_accounts
- contact_tax_profiles

Contact mendukung:

- customer
- supplier
- both

Data minimum:

- code
- display_name
- legal_name
- email
- phone
- billing address
- shipping address
- NPWP
- NIK jika relevan
- NITKU jika relevan
- PKP status
- payment terms
- credit limit
- default receivable/payable account
- default tax configuration

E. PRODUCT DAN INVENTORY

- units
- products
- product_units
- product_prices
- product_warehouses
- inventory_movements
- inventory_balances
- stock_opnames
- stock_opname_lines
- inventory_adjustments
- inventory_adjustment_lines

Product type:

- inventory
- non_inventory
- service

Product minimum:

- sku
- barcode opsional
- name
- type
- base unit
- sales account
- purchase/expense account
- inventory account
- COGS account
- default sales tax
- default purchase tax
- minimum stock
- active status

F. SALES

- sales_quotations
- sales_quotation_lines
- sales_orders
- sales_order_lines
- sales_deliveries
- sales_delivery_lines
- sales_invoices
- sales_invoice_lines
- sales_returns
- sales_return_lines
- customer_receipts
- customer_receipt_allocations
- customer_credits

G. PURCHASE

- purchase_requests
- purchase_request_lines
- purchase_orders
- purchase_order_lines
- goods_receipts
- goods_receipt_lines
- purchase_invoices
- purchase_invoice_lines
- purchase_returns
- purchase_return_lines
- supplier_payments
- supplier_payment_allocations
- supplier_credits

H. CASH DAN BANK

- bank_accounts
- cash_accounts
- cash_transactions
- bank_statement_imports
- bank_statement_lines
- bank_reconciliations
- bank_reconciliation_matches

I. TAX

- tax_codes
- tax_rate_versions
- tax_account_mappings
- document_line_taxes
- tax_reporting_periods
- tax_export_profiles
- tax_export_schema_versions
- tax_export_batches
- tax_export_batch_items

J. APPROVAL

- approval_workflows
- approval_workflow_steps
- approval_requests
- approval_actions

K. FIXED ASSET

- fixed_asset_categories
- fixed_assets
- fixed_asset_depreciation_schedules
- fixed_asset_depreciation_runs
- fixed_asset_disposals

L. AUDIT DAN FILE

- attachments
- audit_logs
- notifications

Tambahkan index untuk:

- company_id
- status
- document_date
- posting_date
- due_date
- document_number
- contact_id
- account_id
- product_id
- warehouse_id
- source_type + source_id
- created_at
- approval queue

Gunakan partial index jika tepat untuk dokumen aktif, unpaid invoice, dan pending approval.

====================================================================== 9. DOCUMENT LIFECYCLE
======================================================================

Gunakan status konsisten:

- draft
- submitted
- pending_approval
- approved
- rejected
- posted
- partially_paid
- paid
- voided
- reversed

Tidak semua status harus digunakan semua dokumen, tetapi transition harus eksplisit.

Buat state transition validation di server/database.

Contoh:

draft -> submitted
submitted -> pending_approval
pending_approval -> approved
pending_approval -> rejected
rejected -> draft
approved -> posted
posted -> partially_paid
partially_paid -> paid
posted -> reversed

Aturan:

1. Transition ilegal harus ditolak.
2. Status tidak boleh diperbarui langsung dari browser.
3. Gunakan function/service khusus untuk transition.
4. Simpan actor, timestamp, dan comment.
5. Setiap approval action masuk audit log.
6. Setiap status change kritis harus atomik.

====================================================================== 10. DATABASE FUNCTIONS / RPC WAJIB
======================================================================

Implementasikan operasi kritis menggunakan PostgreSQL function.

Minimum function:

- next_document_number(...)
- submit_document(...)
- approve_document(...)
- reject_document(...)
- post_manual_journal(...)
- reverse_journal_entry(...)
- post_sales_delivery(...)
- post_sales_invoice(...)
- post_sales_return(...)
- post_goods_receipt(...)
- post_purchase_invoice(...)
- post_purchase_return(...)
- post_customer_receipt(...)
- post_supplier_payment(...)
- post_cash_transaction(...)
- close_accounting_period(...)
- reopen_accounting_period(...)
- run_fixed_asset_depreciation(...)
- rebuild_inventory_balance(...) hanya untuk admin/maintenance
- verify_general_ledger_balance(...)
- verify_subledger_reconciliation(...)

Setiap posting function wajib:

1. Memverifikasi auth user.
2. Memverifikasi membership.
3. Memverifikasi permission.
4. Memverifikasi status dokumen.
5. Memverifikasi periode terbuka.
6. Memverifikasi dokumen belum pernah diposting.
7. Mengunci row dokumen yang relevan.
8. Memvalidasi total dokumen.
9. Menghitung ulang total dari line, bukan mempercayai total dari client.
10. Menghitung ulang pajak.
11. Menghasilkan nomor jurnal secara atomik.
12. Menghasilkan journal entry.
13. Menghasilkan journal lines.
14. Memverifikasi debit sama dengan credit.
15. Memperbarui status dokumen.
16. Memperbarui subledger.
17. Memperbarui inventory jika diperlukan.
18. Menulis audit log.
19. Mengembalikan hasil terstruktur.
20. Melakukan rollback penuh jika satu langkah gagal.
21. Aman ketika tombol post diklik dua kali.
22. Aman terhadap concurrent request.

Gunakan explicit exception message yang aman dan mudah dipahami.

Jangan membocorkan:

- query internal
- secret
- stack trace database
- data perusahaan lain

====================================================================== 11. POSTING RULES
======================================================================

Semua account mapping berasal dari konfigurasi perusahaan.

A. SALES ORDER

- Tidak membuat jurnal.
- Mengurangi available-to-promise hanya jika fitur reservation aktif.
- Tidak mengurangi on-hand stock sebelum delivery.

B. SALES DELIVERY

Untuk perpetual inventory:

Debit:

- Cost of Goods Sold

Credit:

- Inventory

Nilai menggunakan moving weighted average cost pada saat posting.

C. SALES INVOICE

Debit:

- Accounts Receivable atau Cash untuk transaksi tunai

Credit:

- Sales Revenue
- Output Tax Payable sesuai tax mapping

Jika sales invoice dibuat tanpa delivery dan berisi inventory item:

- lakukan direct-delivery secara atomik
- post COGS dan Inventory
- jangan menghasilkan pengurangan stok dua kali

D. CUSTOMER RECEIPT

Debit:

- Bank/Cash sebesar kas bersih diterima
- Tax Receivable atau Withholding Tax Credit jika customer melakukan pemotongan
- Discount/Write-off account jika ada dan diizinkan

Credit:

- Accounts Receivable sebesar nilai yang dialokasikan

Mendukung:

- partial payment
- multi-invoice allocation
- unapplied receipt
- overpayment/customer credit
- withholding tax
- exchange difference jika multi-currency diaktifkan

E. PURCHASE ORDER

- Tidak membuat jurnal.

F. GOODS RECEIPT

Untuk inventory item:

Debit:

- Inventory

Credit:

- Goods Received Not Invoiced / GRNI

Gunakan estimated purchase cost yang dapat direkonsiliasi saat invoice diterima.

G. PURCHASE INVOICE DENGAN GOODS RECEIPT

Debit:

- GRNI
- Input Tax Receivable
- Purchase Price Variance atau Inventory Adjustment jika diperlukan

Credit:

- Accounts Payable

H. PURCHASE INVOICE TANPA GOODS RECEIPT

Untuk inventory item:
Debit:

- Inventory
- Input Tax Receivable

Untuk service/expense:
Debit:

- Expense atau asset account
- Input Tax Receivable

Credit:

- Accounts Payable

I. SUPPLIER PAYMENT

Debit:

- Accounts Payable

Credit:

- Bank/Cash
- Withholding Tax Payable apabila perusahaan memotong pajak vendor
- Discount/Gain account bila relevan

J. SALES RETURN

- Reverse revenue dan output tax sesuai nilai retur.
- Kembalikan inventory jika barang benar-benar kembali.
- Reverse COGS menggunakan cost yang dapat dilacak dari transaksi asal.
- Buat customer credit atau kurangi receivable.

K. PURCHASE RETURN

- Kurangi payable atau buat supplier credit.
- Reverse input tax sesuai konfigurasi.
- Kurangi inventory menggunakan nilai yang konsisten.
- Tangani price variance secara eksplisit.

L. MANUAL JOURNAL

- Total debit wajib sama dengan total credit.
- Minimal dua line.
- Control account diblokir secara default.
- Tidak boleh post ke locked period.
- Harus melalui approval jika kebijakan perusahaan mensyaratkan.

M. REVERSAL

- Buat jurnal baru.
- Tukar debit dan credit.
- Hubungkan reversal dengan jurnal asal.
- Jangan mengubah line jurnal asal.
- Catat alasan reversal.
- Tidak boleh reversal dua kali.

N. FIXED ASSET DEPRECIATION

Versi pertama mendukung:

- straight-line method
- monthly depreciation
- useful life
- residual value
- acquisition date
- in-service date
- disposal

Posting:
Debit:

- Depreciation Expense

Credit:

- Accumulated Depreciation

Jangan mengklaim perhitungan penyusutan fiskal resmi tanpa konfigurasi dan validasi terpisah.

====================================================================== 12. INVENTORY COSTING
======================================================================

Gunakan moving weighted average sebagai metode default MVP.

Formula harus terdokumentasi dan diuji.

Aturan:

1. Jangan gunakan floating point.
2. Simpan quantity dan unit cost dengan precision memadai.
3. Pisahkan:
   - quantity on hand
   - quantity reserved
   - quantity available
4. Negative inventory diblokir secara default.
5. Jika negative inventory diaktifkan pada masa depan, implementasikan revaluation yang benar. Jangan sekadar mengizinkan saldo minus.
6. Backdated inventory posting tidak boleh menghasilkan costing salah.
7. Untuk MVP, pilih salah satu secara eksplisit:
   - implementasikan deterministic replay/revaluation; atau
   - blokir posting sebelum movement terakhir untuk product dan warehouse terkait.
8. Jangan diam-diam menerima backdated posting yang mengubah historical cost.
9. Gunakan database lock untuk mencegah overselling akibat concurrent request.
10. Setiap inventory movement harus memiliki source document.
11. Inventory balance adalah summary yang dapat direbuild dari movement.
12. Inventory movement adalah sumber audit yang tidak boleh diubah setelah posting.
13. Stock opname menghasilkan adjustment yang harus diapprove dan diposting.
14. Sediakan kartu stok.
15. Sediakan laporan valuasi persediaan.
16. Sediakan laporan low stock.

====================================================================== 13. PAJAK DAN CORETAX-READY ARCHITECTURE
======================================================================

Pajak adalah konfigurasi, bukan hard-coded logic yang tersebar.

Dukung kategori generik:

- VAT/PPN input
- VAT/PPN output
- withholding tax receivable
- withholding tax payable
- final withholding tax
- non-taxable
- exempt
- other configurable tax

Seed label Indonesia yang umum seperti PPN dan kategori PPh hanya sebagai contoh konfigurasi.

JANGAN mengunci tarif pajak berdasarkan asumsi.

Gunakan tax_rate_versions dengan:

- tax_code_id
- rate
- effective_from
- effective_to
- calculation_basis
- inclusive atau exclusive
- rounding_method
- status
- source_reference
- notes

Aturan tax engine:

1. Tarif dipilih berdasarkan tanggal transaksi.
2. Tarif lama tetap tersimpan untuk historical transaction.
3. Perubahan tarif membuat versi baru, bukan menimpa versi lama.
4. Perhitungan pajak dapat dilakukan per line.
5. Dukung harga inclusive dan exclusive.
6. Dukung satu atau lebih tax component jika dibutuhkan.
7. Dukung withholding pada invoice atau settlement sesuai konfigurasi.
8. Account mapping pajak wajib configurable.
9. Rounding rule wajib configurable dan diuji.
10. Simpan:
    - tax base
    - rate version
    - tax amount
    - tax code
    - tax identity data
11. Laporan pajak harus dapat direkonsiliasi dengan General Ledger.
12. Tampilkan warning jika contact membutuhkan NPWP/NITKU tetapi datanya tidak lengkap.
13. Validasi format identitas pajak harus configurable dan versioned.
14. Jangan hard-code format yang mungkin berubah.

Buat modul Tax Reporting:

- Tax dashboard
- Output tax report
- Input tax report
- Withholding tax report
- Tax payable/receivable reconciliation
- Tax transaction validation
- Missing tax identity report
- Tax export history
- Export batch status
- Export error report

Buat architecture adapter:

interface TaxExportAdapter {
code: string;
version: string;
validate(input): ValidationResult;
generate(input): ExportArtifact;
}

Implementasi awal:

- Generic CSV export
- Generic XML export framework
- Coretax XML adapter interface
- Versioned export profile
- Validation report

ATURAN PENTING CORETAX:

1. Jangan mengarang endpoint Coretax.
2. Jangan mengarang API resmi.
3. Jangan mengarang XML element.
4. Jangan membuat klaim “siap upload resmi” tanpa fixture atau template resmi yang terverifikasi.
5. Jangan melakukan scraping atau reverse engineering sistem pajak.
6. Format XML harus berasal dari template resmi yang disediakan dan dimasukkan sebagai versioned schema/fixture.
7. Simpan template version, effective date, checksum, source reference, dan validation rules.
8. Jika template resmi belum tersedia di repository:
   - buat adapter framework
   - buat sample DEMO profile
   - tandai hasil sebagai DEMO / NOT FOR OFFICIAL SUBMISSION
   - dokumentasikan cara menambahkan template resmi
9. Ketika template resmi diberikan:
   - tambahkan fixture
   - tambahkan mapping
   - tambahkan validation
   - tambahkan regression test
10. Export batch yang sudah final tidak boleh diedit.
11. Perubahan data setelah export harus menandai batch sebagai stale.
12. Simpan audit siapa yang membuat, memvalidasi, dan mengunduh export.

====================================================================== 14. APPROVAL WORKFLOW
======================================================================

Buat configurable approval workflow per perusahaan dan per document type.

Mendukung:

- no approval
- one-level approval
- two-level approval
- approval berdasarkan nominal
- approval berdasarkan cabang
- approval berdasarkan tipe transaksi
- approval berdasarkan permission

Tabel minimum:

approval_workflows:

- company_id
- document_type
- name
- active
- allow_self_approval
- threshold configuration

approval_workflow_steps:

- workflow_id
- step_order
- role atau permission
- minimum_amount
- maximum_amount

approval_requests:

- document_type
- document_id
- workflow_id
- current_step
- status
- submitted_by
- submitted_at

approval_actions:

- request_id
- step
- action
- actor
- comment
- created_at

Fitur UI:

- My Approval Queue
- Pending Approval
- Approved
- Rejected
- Detail dokumen
- Preview accounting impact
- Approval history
- Approve modal
- Reject modal dengan alasan wajib

====================================================================== 15. MODUL FUNGSIONAL
======================================================================

A. AUTHENTICATION

Implementasikan:

- login email/password
- logout
- forgot password
- reset password
- session refresh
- protected routes
- company selection
- unauthorized page
- disabled member handling

Opsional setelah core stabil:

- magic link
- MFA

B. DASHBOARD

Tampilkan data nyata:

- cash and bank balance
- total accounts receivable
- overdue receivable
- total accounts payable
- overdue payable
- revenue this month
- expenses this month
- gross profit
- net profit
- sales trend
- purchase trend
- cash flow summary
- low-stock items
- pending approvals
- recent transactions

Semua widget:

- mempunyai loading state
- empty state
- error state
- date filter
- company scope
- permission check

C. CHART OF ACCOUNTS

Fitur:

- hierarchical accounts
- account code
- account name
- account type
- normal balance
- parent account
- control account
- allow manual entry
- cash flow category
- active/inactive
- import
- export
- opening balance process
- account history

Account type minimum:

- asset
- liability
- equity
- revenue
- cost_of_goods_sold
- expense
- other_income
- other_expense

D. CONTACTS

Fitur:

- customer
- supplier
- both
- address
- contact person
- tax profile
- payment terms
- credit limit
- opening balance
- AR/AP history
- document history
- attachment

E. PRODUCTS

Fitur:

- inventory item
- service
- non-inventory
- SKU
- unit
- price
- account mapping
- tax defaults
- minimum stock
- warehouse balance
- active/inactive

F. SALES

Fitur minimum:

- quotation
- sales order
- delivery
- invoice
- sales return
- customer receipt
- partial payment
- due date
- discount per line
- document discount
- tax
- attachment
- approval
- posting preview
- printable invoice
- status tracking
- customer statement

G. PURCHASES

Fitur minimum:

- purchase request
- purchase order
- goods receipt
- purchase invoice
- purchase return
- supplier payment
- partial payment
- due date
- discount
- tax
- attachment
- approval
- posting preview
- status tracking
- supplier statement

H. CASH AND BANK

Fitur:

- cash receipt
- cash payment
- bank transfer
- bank account
- bank statement CSV import
- matching
- reconciliation
- reconciliation difference
- adjustment transaction with permission
- reconciliation report

I. INVENTORY

Fitur:

- stock by warehouse
- stock card
- stock movement
- stock adjustment
- stock opname
- stock transfer
- low-stock alert
- inventory valuation
- approval for adjustment
- negative stock protection

J. GENERAL LEDGER

Fitur:

- manual journal
- recurring journal template
- journal approval
- posting preview
- journal list
- journal detail
- reversal
- account history
- period closing
- period reopening with audit

K. FIXED ASSET

Fitur:

- category
- acquisition
- asset register
- depreciation schedule
- depreciation run
- disposal
- journal posting
- asset report

L. REPORTS

Minimum:

- General Ledger
- Journal Report
- Trial Balance
- Balance Sheet
- Profit and Loss
- Cash Flow
- Account Transactions
- Accounts Receivable Aging
- Accounts Payable Aging
- Customer Statement
- Supplier Statement
- Sales by Customer
- Sales by Product
- Purchase by Supplier
- Inventory Stock Card
- Inventory Valuation
- Tax Summary
- Tax Reconciliation
- Fixed Asset Register
- Depreciation Report
- Audit Activity Report

Report requirements:

- company filter
- branch filter
- date range
- comparison period where relevant
- search
- server-side pagination for detail reports
- print-friendly view
- CSV export
- no draft transactions
- totals must be recalculated server-side
- display “generated at” timestamp
- display active company and filters
- permission enforcement

Cash Flow:

- gunakan cash flow category pada account
- dokumentasikan metode yang digunakan
- pastikan perubahan kas sesuai dengan perubahan saldo cash/bank

Balance Sheet:

- verifikasi Assets = Liabilities + Equity
- tampilkan warning internal pada test jika tidak balance

Trial Balance:

- total debit harus sama dengan total credit

====================================================================== 16. UI DAN UX
======================================================================

Gunakan TailAdmin NextJS sebagai visual foundation.

Branding:

- Nama: Dasol
- Gunakan logo text “Dasol” terlebih dahulu
- Jangan menggunakan logo kompetitor
- Jangan menggunakan aset berhak cipta dari kompetitor
- Desain profesional, bersih, dan modern
- Pertahankan konsistensi TailAdmin
- Sediakan light mode dan dark mode jika sudah didukung template

Bahasa UI:
Bahasa Indonesia.

Terminologi utama:

- Dasbor
- Penjualan
- Pembelian
- Kas & Bank
- Persediaan
- Akuntansi
- Pajak
- Laporan
- Persetujuan
- Audit Log
- Pengaturan

Route minimum:

/login
/forgot-password
/reset-password
/select-company
/dashboard

/master/accounts
/master/contacts
/master/products
/master/warehouses
/master/taxes

/sales/quotations
/sales/orders
/sales/deliveries
/sales/invoices
/sales/returns
/sales/receipts

/purchases/requests
/purchases/orders
/purchases/receipts
/purchases/invoices
/purchases/returns
/purchases/payments

/cash-bank/accounts
/cash-bank/transactions
/cash-bank/reconciliation

/inventory/stock
/inventory/movements
/inventory/adjustments
/inventory/stock-opname

/accounting/journals
/accounting/periods
/accounting/closing

/fixed-assets/assets
/fixed-assets/depreciation

/tax/dashboard
/tax/transactions
/tax/reconciliation
/tax/exports

/approvals
/reports
/audit-log
/settings/company
/settings/users
/settings/roles
/settings/account-mapping
/settings/approval-workflows
/settings/features

UX requirement:

1. Breadcrumb.
2. Consistent page title.
3. Search.
4. Filters.
5. Sort.
6. Pagination.
7. Empty state.
8. Skeleton loading.
9. Error state.
10. Retry action.
11. Toast notification.
12. Confirmation modal untuk destructive action.
13. Unsaved-changes warning.
14. Form validation message yang jelas.
15. Accessible labels.
16. Keyboard-friendly navigation.
17. Visible focus state.
18. Status badges.
19. Posting preview.
20. Audit information pada detail dokumen.
21. Responsive table atau mobile card fallback.
22. Jangan menampilkan tombol yang tidak diizinkan.
23. Tetap lakukan authorization server-side walaupun tombol disembunyikan.
24. Jangan membuat tombol palsu yang tidak berfungsi.
25. Jangan membuat halaman hanya berisi placeholder “Coming Soon” untuk modul core.

Gunakan form handling dan schema validation yang konsisten.

Gunakan:

- Zod atau schema validator setara
- React Hook Form jika kompatibel dan diperlukan
- reusable money input
- reusable date input
- reusable contact selector
- reusable account selector
- reusable tax selector
- reusable line-item editor

====================================================================== 17. NOMOR DOKUMEN
======================================================================

Buat document_sequences yang configurable.

Contoh pola:

- SI-{YYYY}-{MM}-{####}
- SO-{YYYY}-{MM}-{####}
- PI-{YYYY}-{MM}-{####}
- PO-{YYYY}-{MM}-{####}
- JV-{YYYY}-{MM}-{####}
- RCPT-{YYYY}-{MM}-{####}

Dukung token:

- document type
- company code
- branch code
- year
- month
- sequence

Aturan:

- unique per company
- dapat di-reset per tahun atau bulan
- dihasilkan database
- concurrency-safe
- nomor yang sudah dipakai tidak boleh dipakai ulang
- cancellation tidak mengubah nomor transaksi lain
- perubahan format hanya berlaku untuk nomor berikutnya

====================================================================== 18. AUDIT TRAIL
======================================================================

Audit log harus bersifat append-only.

Simpan:

- company_id
- actor_user_id
- actor role
- action
- entity_type
- entity_id
- document_number
- before JSONB
- after JSONB
- changed fields
- reason/comment
- request correlation ID
- IP jika tersedia dan aman
- user agent jika tersedia dan aman
- created_at

Audit action minimum:

- create
- update
- submit
- recall
- approve
- reject
- post
- reverse
- void
- close period
- reopen period
- export tax
- change permission
- change account mapping
- change tax configuration
- login-sensitive event bila tersedia

Aturan:

1. Audit log tidak boleh diedit dari UI.
2. Audit log tidak boleh dihapus user biasa.
3. Viewer/Auditor hanya dapat membaca.
4. Jangan simpan password, token, service key, atau secret pada before/after snapshot.
5. Mask data sensitif bila perlu.
6. Critical-table audit sebaiknya diperkuat dengan database trigger, bukan hanya aplikasi.

====================================================================== 19. FILE DAN ATTACHMENT
======================================================================

Gunakan Supabase Storage private bucket.

Fitur:

- attachment pada invoice
- attachment pada purchase document
- bukti pembayaran
- dokumen pajak
- dokumen fixed asset

Aturan:

- file private
- akses melalui signed URL
- permission dan company scope diperiksa
- validasi MIME type
- validasi ukuran file
- nama file disanitasi
- jangan percaya extension
- jangan menggunakan public bucket untuk dokumen keuangan
- simpan metadata file
- hapus attachment draft secara aman
- attachment posted document tidak boleh diganti tanpa audit

====================================================================== 20. SECURITY
======================================================================

Terapkan defense in depth.

Wajib:

1. RLS pada seluruh tabel exposed.
2. Least privilege.
3. Server-side permission check.
4. Object-level authorization.
5. Input validation.
6. Output encoding.
7. Secure environment handling.
8. Tidak ada secret di browser bundle.
9. Tidak ada service-role key di NEXT_PUBLIC_*.
10. Tidak menggunakan dangerouslySetInnerHTML untuk konten user.
11. File upload validation.
12. Rate limiting atau abuse protection untuk endpoint sensitif jika diperlukan.
13. Safe error message.
14. Security headers yang sesuai:
    - Content-Security-Policy yang realistis
    - X-Content-Type-Options
    - Referrer-Policy
    - frame-ancestors
15. Secure cookie behavior mengikuti Supabase SSR.
16. Jangan mempercayai company_id, role, harga, diskon, pajak, total, atau status dari client.
17. Gunakan server-calculated totals.
18. Log security-relevant failures tanpa membocorkan data sensitif.
19. Jangan memasukkan data keuangan user lain dalam cache.
20. Jangan menggunakan shared caching pada personalized authenticated response tanpa key yang benar.
21. Periksa potensi IDOR pada setiap detail route.
22. Periksa SQL injection walaupun menggunakan Supabase.
23. Jangan menggunakan dynamic SQL dari input user.
24. Jangan memberikan execute permission database function kepada public secara default.
25. Pastikan attachment policy mengikuti membership perusahaan.
26. Tambahkan test RLS dan permission negatif.

====================================================================== 21. DEMO DATA
======================================================================

Buat demo seed yang repeatable dan hanya berjalan secara eksplisit.

Perusahaan demo:
PT Dasol Demo Indonesia

Konfigurasi:

- Currency: IDR
- Locale: id-ID
- Timezone: Asia/Jakarta
- Fiscal year: tahun kalender
- Inventory method: moving weighted average
- Negative stock: disabled
- Self approval: disabled

Buat sample:

- dua cabang
- dua gudang
- chart of accounts
- account mappings
- tax codes contoh
- customer
- supplier
- beberapa inventory products
- service product
- opening journal yang balance
- sales order
- sales invoice
- customer receipt
- purchase order
- goods receipt
- purchase invoice
- supplier payment
- inventory movement
- fixed asset
- approval request
- posted journals

Buat akun demo melalui server-only script, bukan melalui hard-coded production seed.

Gunakan environment seperti:

- DEMO_ADMIN_EMAIL
- DEMO_ADMIN_PASSWORD
- DEMO_ACCOUNTANT_EMAIL
- DEMO_ACCOUNTANT_PASSWORD
- DEMO_OPERATOR_EMAIL
- DEMO_OPERATOR_PASSWORD
- DEMO_APPROVER_EMAIL
- DEMO_APPROVER_PASSWORD
- DEMO_VIEWER_EMAIL
- DEMO_VIEWER_PASSWORD

Aturan:

1. Jangan commit password riil.
2. Gunakan password development dari environment.
3. Script harus menolak berjalan di production kecuali explicit override yang aman.
4. Dokumentasikan command seed.
5. Seed dapat dijalankan ulang tanpa membuat duplikasi.
6. Semua contoh jurnal harus balance.
7. Semua contoh stok harus dapat direkonsiliasi.

Seed chart of accounts minimal mencakup:

ASET

- Kas
- Bank
- Piutang Usaha
- Persediaan
- Pajak Dibayar di Muka / Pajak Masukan
- Beban Dibayar di Muka
- Aset Tetap
- Akumulasi Penyusutan

LIABILITAS

- Utang Usaha
- GRNI
- Pajak Keluaran
- Utang Pajak Potong
- Beban Akrual

EKUITAS

- Modal
- Saldo Laba

PENDAPATAN

- Penjualan Produk
- Pendapatan Jasa
- Retur dan Potongan Penjualan

HPP

- Harga Pokok Penjualan

BEBAN

- Beban Gaji
- Beban Sewa
- Beban Utilitas
- Beban Penyusutan
- Beban Administrasi
- Beban Bank

LAIN-LAIN

- Pendapatan Lain
- Beban Lain
- Selisih Kurs
- Selisih Pembulatan
- Purchase Price Variance

Gunakan kode akun yang rapi, tetapi jangan mengklaim sebagai satu-satunya standar resmi.

====================================================================== 22. TESTING
======================================================================

Gunakan test pyramid.

A. UNIT TEST

Gunakan Vitest atau test runner yang kompatibel.

Test minimum:

- money parsing
- money formatting
- Decimal calculation
- tax inclusive calculation
- tax exclusive calculation
- tax rate effective date
- rounding
- invoice subtotal
- discount
- document total
- journal generation
- journal balancing
- inventory average cost
- negative stock check
- document state transition
- permission evaluation
- numbering token formatting

B. DATABASE TEST

Gunakan Supabase local development dan SQL/pgTAP jika tersedia.

Test:

- RLS Company A vs Company B
- role permission
- unique document number
- concurrent numbering
- idempotent posting
- duplicate source protection
- period lock
- journal balance constraint
- immutable posted journal
- reversal
- tax version lookup
- inventory movement
- negative stock
- control account restriction
- function execute privileges

C. INTEGRATION TEST

Test:

- create invoice kemudian post
- post membentuk journal
- post membentuk AR
- customer receipt mengurangi AR
- purchase invoice membentuk AP
- supplier payment mengurangi AP
- inventory delivery mengurangi stok
- goods receipt menambah stok
- tax report sesuai jurnal
- report hanya menggunakan posted journal

D. END-TO-END TEST

Gunakan Playwright.

Skenario minimum:

Scenario 1:

- login sebagai Administrator
- pilih perusahaan
- buat user membership
- lihat dashboard

Scenario 2:

- login sebagai Operator
- buat customer
- buat product
- buat sales invoice
- submit
- pastikan operator tidak dapat approve

Scenario 3:

- login sebagai Approver
- approve invoice
- post invoice
- lihat journal impact

Scenario 4:

- login sebagai Accountant
- catat customer receipt
- alokasikan ke invoice
- pastikan invoice paid
- pastikan AR aging berubah

Scenario 5:

- buat purchase order
- goods receipt
- purchase invoice
- supplier payment
- pastikan AP dan inventory benar

Scenario 6:

- tutup accounting period
- coba post ke periode tertutup
- pastikan ditolak

Scenario 7:

- viewer membuka report
- viewer mencoba mutation
- pastikan ditolak

Scenario 8:

- user Company A mencoba akses URL entity Company B
- pastikan 403 atau not found yang aman

Scenario 9:

- klik post dua kali atau kirim concurrent request
- pastikan hanya satu journal terbentuk

Scenario 10:

- reverse posted journal
- pastikan jurnal asal tetap immutable
- pastikan reversal balance

E. ACCOUNTING PROPERTY TEST

Tambahkan test invariant:

- setiap posted journal balance
- trial balance balance
- balance sheet equation terpenuhi
- AR subledger sama dengan AR control account
- AP subledger sama dengan AP control account
- inventory valuation sama dengan inventory control account dalam skenario teruji
- cash flow ending cash sama dengan cash/bank ledger

====================================================================== 23. GITHUB ACTIONS
======================================================================

Buat .github/workflows/ci.yml.

Trigger:

- pull_request
- push ke main
- push ke development branch jika digunakan

Job minimum:

1. Checkout.
2. Setup Node sesuai .nvmrc atau engines.
3. Enable package manager cache.
4. Install dependency menggunakan frozen lockfile.
5. Lint.
6. Typecheck.
7. Unit test.
8. Build.
9. Upload test artifact atau coverage bila tersedia.

Jika integration test Supabase local dapat dijalankan stabil:

- start Supabase
- reset database
- run database tests
- run integration tests
- stop Supabase

Jangan menggunakan production Supabase untuk CI.

Tambahkan scripts yang konsisten pada package.json:

- dev
- lint
- typecheck
- test
- test:unit
- test:integration
- test:e2e
- build
- db:start
- db:stop
- db:reset
- db:test
- db:types
- seed:demo
- verify:accounting

Gunakan command sesuai package manager repository.

====================================================================== 24. ENVIRONMENT VARIABLES
======================================================================

Buat .env.example tanpa nilai secret.

Minimum:

NEXT_PUBLIC_APP_NAME=Dasol
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_PROJECT_ID=
DATABASE_URL=
DEMO_SEED_ENABLED=false
DEMO_ADMIN_EMAIL=
DEMO_ADMIN_PASSWORD=
DEMO_ACCOUNTANT_EMAIL=
DEMO_ACCOUNTANT_PASSWORD=
DEMO_OPERATOR_EMAIL=
DEMO_OPERATOR_PASSWORD=
DEMO_APPROVER_EMAIL=
DEMO_APPROVER_PASSWORD=
DEMO_VIEWER_EMAIL=
DEMO_VIEWER_PASSWORD=

Aturan:

- Validasi environment ketika aplikasi start/build.
- Public variable dan private variable harus dipisah.
- SUPABASE_SERVICE_ROLE_KEY hanya boleh diimport oleh server-only module.
- Tambahkan guard agar server-only module gagal bila diimport client.
- Dokumentasikan development, preview, dan production environment.
- Jangan log nilai environment.

====================================================================== 25. DEPLOYMENT VERCEL
======================================================================

Siapkan aplikasi agar dapat dideploy ke Vercel.

Persyaratan:

1. Production build berhasil.
2. Tidak bergantung pada filesystem lokal persisten.
3. Environment variable terdokumentasi.
4. Preview dan production dapat menggunakan Supabase project berbeda.
5. Migration tidak dijalankan otomatis secara sembarangan saat request pertama.
6. Dokumentasikan migration deployment workflow.
7. Jangan menjalankan seed demo di production.
8. Gunakan Git integration.
9. Pastikan route handler kompatibel dengan runtime yang dipilih.
10. Jangan memilih Edge Runtime untuk library yang tidak kompatibel.
11. Gunakan Node runtime untuk operasi yang memerlukan library Node.
12. Pastikan server actions dan Supabase SSR bekerja pada Vercel.
13. Jika Vercel CLI atau login tersedia, deploy preview.
14. Jika login tidak tersedia, jangan mengarang URL deployment.
15. Berikan exact deployment command dan checklist.

====================================================================== 26. DOKUMENTASI
======================================================================

README.md wajib memuat:

- deskripsi Dasol
- fitur
- screenshot placeholder hanya jika screenshot benar-benar dibuat
- arsitektur singkat
- prerequisites
- instalasi
- setup Supabase
- local development
- migration
- generated database types
- demo seed
- test
- build
- deployment Vercel
- troubleshooting
- security note
- tax compliance disclaimer

docs/ARCHITECTURE.md:

- component diagram
- request flow
- auth flow
- data flow
- posting flow
- module boundaries

docs/DATABASE.md:

- schema overview
- key tables
- RLS strategy
- function privileges
- indexing
- migration process

docs/ACCOUNTING_RULES.md:

- double entry
- lifecycle
- posting matrix
- inventory costing
- period lock
- reversal
- reconciliation

docs/PERMISSIONS.md:

- role matrix
- permission codes
- self approval rule
- RLS mapping

docs/TAX_ENGINE.md:

- versioned tax rates
- calculation
- account mapping
- export adapter
- Coretax template onboarding
- disclaimer

docs/DEPLOYMENT.md:

- GitHub
- Supabase
- Vercel
- environment
- migration
- rollback

docs/DEMO_GUIDE.md:

- akun demo
- alur presentasi
- transaksi contoh
- laporan yang diperlihatkan
- batasan demo

docs/DECISIONS.md:

- keputusan teknis
- asumsi
- trade-off
- deferred scope

====================================================================== 27. PHASE IMPLEMENTASI
======================================================================

Kerjakan berurutan, tetapi jangan berhenti setelah membuat rencana.

PHASE 0 — REPOSITORY AUDIT

- inspect repository
- document current state
- detect package manager
- detect TailAdmin version
- detect Next.js version
- detect Supabase setup
- create implementation plan
- create AGENTS.md

PHASE 1 — FOUNDATION

- configure TypeScript strict
- environment validation
- Supabase clients
- auth
- protected routes
- app layout
- company selection
- error handling
- basic CI

PHASE 2 — MULTI-COMPANY, RBAC, DAN RLS

- schema organization
- roles
- permissions
- membership
- RLS
- permission helpers
- tests

PHASE 3 — ACCOUNTING FOUNDATION

- accounting periods
- chart of accounts
- account mapping
- document sequence
- journal entries
- journal lines
- posting functions
- reversal
- accounting tests

PHASE 4 — MASTER DATA

- contacts
- products
- units
- warehouse
- tax configuration
- UI dan validation

PHASE 5 — SALES DAN AR

- sales order
- delivery
- invoice
- approval
- posting
- receipt
- AR aging
- tests

PHASE 6 — PURCHASE DAN AP

- purchase order
- goods receipt
- purchase invoice
- approval
- posting
- supplier payment
- AP aging
- tests

PHASE 7 — INVENTORY

- movement
- balance
- average cost
- stock adjustment
- stock opname
- transfer
- valuation
- tests

PHASE 8 — CASH, BANK, DAN RECONCILIATION

- cash transaction
- bank account
- statement import
- reconciliation
- report
- tests

PHASE 9 — TAX

- tax engine
- tax rates versioning
- reconciliation
- export profiles
- generic CSV/XML
- Coretax adapter framework
- tests

PHASE 10 — REPORTING

- GL
- trial balance
- P&L
- balance sheet
- cash flow
- sales/purchase reports
- inventory reports
- tax reports
- export

PHASE 11 — FIXED ASSETS

- asset register
- depreciation
- disposal
- journal posting
- report
- tests

PHASE 12 — AUDIT, HARDENING, DAN E2E

- audit log
- storage
- security headers
- negative authorization tests
- E2E tests
- performance review
- accessibility review

PHASE 13 — DEMO DAN DEPLOYMENT

- demo seed
- demo guide
- clean database reset
- all tests
- production build
- GitHub workflow
- Vercel readiness
- final documentation

Setelah setiap phase:

- update docs/IMPLEMENTATION_PLAN.md
- update docs/DECISIONS.md
- run relevant tests
- commit only if green

====================================================================== 28. DEFINITION OF DONE
======================================================================

Pekerjaan hanya boleh dinyatakan selesai jika:

[ ] Fresh dependency install berhasil.
[ ] TypeScript strict aktif.
[ ] Tidak ada TypeScript error.
[ ] Lint lulus.
[ ] Unit test lulus.
[ ] Database test lulus.
[ ] Integration test lulus untuk alur core.
[ ] E2E core lulus.
[ ] Production build lulus.
[ ] Supabase migration dapat dijalankan dari database kosong.
[ ] Demo seed dapat dijalankan ulang.
[ ] Semua exposed table memiliki RLS.
[ ] RLS cross-company sudah diuji.
[ ] Service-role key tidak masuk client bundle.
[ ] Setiap posted journal balance.
[ ] Double posting dicegah.
[ ] Concurrent numbering aman.
[ ] Locked period benar-benar memblokir posting.
[ ] Posted journal immutable.
[ ] Reversal bekerja.
[ ] AR subledger dapat direkonsiliasi.
[ ] AP subledger dapat direkonsiliasi.
[ ] Inventory movement dan valuation teruji.
[ ] Tax rate version teruji.
[ ] Tax export diberi version dan status.
[ ] Tidak ada fake Coretax API.
[ ] Tidak ada fabricated XML official schema.
[ ] Role dan permission bekerja.
[ ] Self approval diblokir secara default.
[ ] Viewer benar-benar read-only.
[ ] Audit log tersedia.
[ ] Loading, empty, error, dan unauthorized state tersedia.
[ ] Tidak ada tombol core yang tidak berfungsi.
[ ] Tidak ada placeholder pada modul core.
[ ] README lengkap.
[ ] Architecture documentation lengkap.
[ ] Deployment documentation lengkap.
[ ] .env.example lengkap dan tanpa secret.
[ ] GitHub Actions tersedia.
[ ] Vercel build-ready.
[ ] Tidak ada critical TODO.
[ ] Tidak ada unresolved security issue severity tinggi.
[ ] Tidak ada data lintas perusahaan.
[ ] Tidak ada klaim compliance pajak yang belum diverifikasi.

====================================================================== 29. VERIFIKASI AKHIR WAJIB
======================================================================

Sebelum memberikan jawaban akhir:

1. Jalankan Git status.
2. Jalankan install check menggunakan lockfile.
3. Jalankan lint.
4. Jalankan typecheck.
5. Jalankan unit tests.
6. Jalankan database tests.
7. Jalankan integration tests.
8. Jalankan E2E core jika environment memungkinkan.
9. Jalankan production build.
10. Reset Supabase local dari migration.
11. Jalankan demo seed.
12. Jalankan verify:accounting.
13. Verifikasi semua posted journals balance.
14. Verifikasi trial balance balance.
15. Verifikasi Balance Sheet equation.
16. Verifikasi role access.
17. Verifikasi cross-company isolation.
18. Verifikasi double-post protection.
19. Verifikasi period lock.
20. Verifikasi tidak ada secret pada tracked files.
21. Periksa browser console pada alur demo.
22. Periksa server log pada alur demo.
23. Periksa responsive layout.
24. Periksa halaman 403, 404, loading, dan error.
25. Periksa semua link sidebar.

Jika ada command yang gagal:

- perbaiki akar masalah
- jalankan kembali command terkait
- jangan hanya mengabaikan kegagalan
- jangan menyatakan selesai

====================================================================== 30. FORMAT LAPORAN AKHIR DARI ANDA
======================================================================

Pada akhir pekerjaan, laporkan secara ringkas tetapi lengkap:

1. Ringkasan implementasi.
2. Arsitektur yang digunakan.
3. Modul yang selesai.
4. File penting yang dibuat atau diubah.
5. Migration yang dibuat.
6. RLS dan security policy yang dibuat.
7. Posting rules yang diterapkan.
8. Test yang dijalankan.
9. Hasil exact dari:
   - lint
   - typecheck
   - unit test
   - integration test
   - E2E
   - build
10. Cara menjalankan aplikasi.
11. Cara menjalankan Supabase.
12. Cara menjalankan demo seed.
13. Cara login dengan akun demo melalui environment.
14. Cara deploy ke Vercel.
15. Asumsi yang dibuat.
16. Batasan yang masih tersisa.
17. Risiko yang masih perlu ditangani.
18. Jangan mengarang hasil test.
19. Jangan mengarang deployment URL.
20. Jangan mengatakan production-ready jika masih ada test kritis yang gagal.

Mulai sekarang dengan mengaudit repository, membuat IMPLEMENTATION_PLAN.md dan AGENTS.md, lalu lanjutkan implementasi secara bertahap sampai seluruh core flow Dasol dapat didemonstrasikan dan semua quality gate yang relevan lulus.

MAKE NO MISTAKE
