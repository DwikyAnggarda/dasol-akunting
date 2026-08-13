# DASOL — FULL CRUD, ACTIONS & FUNCTIONAL COMPLETION MASTER PROMPT

ANDA SEKARANG BERTINDAK SEBAGAI:

* Principal Fullstack Engineer
* Senior Next.js Architect
* Senior Supabase/PostgreSQL Engineer
* Senior Accounting Software Engineer
* Senior UX Engineer
* Senior Security Engineer
* Senior QA Automation Engineer

DENGAN PENGALAMAN LEBIH DARI 15 TAHUN MEMBANGUN APLIKASI WEB ENTERPRISE, ERP, ACCOUNTING SYSTEM, FINANCE SYSTEM, INVENTORY SYSTEM, DAN TAX-READY BUSINESS APPLICATION.

======================================================================
MISSION
=======

Aplikasi bernama:

DASOL

sudah memiliki implementasi awal berdasarkan prompt sebelumnya.

MASALAH SAAT INI:

Banyak menu dan halaman sudah tersedia, tetapi sebagian besar hanya:

* menampilkan data;
* menampilkan tabel;
* menampilkan dashboard;
* menampilkan detail;
* memiliki tombol yang belum berfungsi;
* belum mempunyai Create;
* belum mempunyai Edit;
* belum mempunyai Delete/Archive;
* belum mempunyai Submit;
* belum mempunyai Approval;
* belum mempunyai Posting;
* belum mempunyai Reversal;
* belum mempunyai Payment;
* belum mempunyai workflow transaksi secara end-to-end;
* atau UI sudah ada tetapi belum benar-benar tersambung ke Supabase/database.

TUGAS ANDA SEKARANG ADALAH MENYEMPURNAKAN REPOSITORY DASOL YANG SUDAH ADA.

JANGAN MEMBUAT PROJECT BARU.

JANGAN MENGGANTI ARSITEKTUR SECARA SEMBARANGAN.

JANGAN MENGHAPUS IMPLEMENTASI YANG SUDAH BENAR.

JANGAN HANYA MEMBUAT MOCKUP.

JANGAN HANYA MEMBUAT BUTTON TANPA ACTION.

JANGAN HANYA MEMBUAT FORM TANPA DATABASE MUTATION.

JANGAN HANYA MEMBUAT DATABASE FUNCTION TANPA UI.

JANGAN MENYATAKAN FITUR SELESAI JIKA USER BELUM BISA MENJALANKAN ALUR TERSEBUT MELALUI UI.

TARGET AKHIR:

SETIAP MENU DASOL HARUS BENAR-BENAR FUNCTIONAL DAN MEMILIKI CRUD + BUSINESS ACTION YANG SESUAI DENGAN DOMAIN-NYA.

======================================================================

1. FIRST ACTION: AUDIT SELURUH REPOSITORY
   ======================================================================

SEBELUM MENULIS KODE:

Audit seluruh repository.

Periksa:

* seluruh route di src/app;
* seluruh navigation item;
* seluruh halaman;
* seluruh tabel;
* seluruh modal;
* seluruh form;
* seluruh button;
* seluruh dropdown action;
* seluruh server action;
* seluruh API route;
* seluruh Supabase query;
* seluruh mutation;
* seluruh database migration;
* seluruh PostgreSQL function;
* seluruh RLS policy;
* seluruh permission;
* seluruh test;
* seluruh TODO;
* seluruh FIXME;
* seluruh placeholder;
* seluruh hard-coded sample data;
* seluruh mock data;
* seluruh button dengan href="#";
* seluruh button tanpa handler;
* seluruh form tanpa submit handler;
* seluruh fitur yang hanya membaca data;
* seluruh menu yang belum memiliki create/edit/detail/action.

Cari secara aktif pola seperti:

* TODO
* FIXME
* MOCK
* SAMPLE
* PLACEHOLDER
* coming soon
* href="#"
* console.log
* alert(...)
* dummyData
* mockData
* fakeData
* disabled button
* empty onClick
* empty action
* hard-coded rows

Buat:

docs/FUNCTIONAL_GAP_AUDIT.md

Isi dokumen tersebut dengan tabel:

| Module | Route | List | Create | Detail | Edit | Delete/Archive | Submit | Approve | Post | Reverse | Export | Status |
| ------ | ----- | ---- | ------ | ------ | ---- | -------------- | ------ | ------- | ---- | ------- | ------ | ------ |

Gunakan status:

* DONE
* PARTIAL
* MISSING
* NOT APPLICABLE

JANGAN BERHENTI SETELAH MEMBUAT AUDIT.

Setelah audit selesai, LANGSUNG LANJUTKAN IMPLEMENTASI.

======================================================================
2. GOLDEN RULE: NO READ-ONLY FEATURE UNLESS INTENTIONALLY READ-ONLY
===================================================================

Setiap menu yang merupakan master data wajib mempunyai minimal:

CREATE
READ
UPDATE
ARCHIVE / DEACTIVATE

Setiap menu transaksi wajib mempunyai minimal:

CREATE
READ
UPDATE DRAFT
DELETE/CANCEL DRAFT
SUBMIT
APPROVE / REJECT jika membutuhkan approval
POST
PRINT / PREVIEW jika relevan
REVERSE / RETURN / VOID jika relevan

Setiap report wajib mempunyai:

FILTER
SEARCH
SORT
EXPORT
PRINT-FRIENDLY VIEW

Viewer/Auditor memang read-only.

Tetapi role lain harus mendapatkan action sesuai permission.

======================================================================
3. STANDARD CRUD UX
===================

UNTUK SETIAP MASTER DATA:

List page wajib mempunyai:

* tombol “Tambah”
* search
* filter
* sort
* pagination
* status Active/Inactive
* row action menu

Row action minimal:

* Lihat
* Edit
* Nonaktifkan / Arsipkan

Jika record belum pernah digunakan dan aman untuk dihapus:

* Hapus

Jika sudah pernah digunakan pada transaksi:

JANGAN HARD DELETE.

Gunakan:

* inactive
* archived
* deleted_at apabila sesuai

Create page/form wajib mempunyai:

* validation
* field labels
* required indicators
* save button
* save & add another jika relevan
* cancel
* loading state
* error handling
* duplicate detection
* success notification

Edit wajib:

* load current data
* permission check
* validation
* optimistic concurrency/version check
* save
* cancel
* audit log

Detail wajib:

* informasi utama
* status
* created by
* created at
* updated by
* updated at
* related transactions jika ada
* audit history jika relevan
* action menu sesuai permission

Delete/Archive wajib:

* confirmation dialog
* server-side permission
* relational dependency validation
* meaningful error message
* audit log

======================================================================
4. STANDARD TRANSACTION UX
==========================

Setiap transaksi harus memiliki lifecycle yang jelas.

Minimal:

DRAFT
SUBMITTED
PENDING_APPROVAL
APPROVED
REJECTED
POSTED
PARTIALLY_PAID
PAID
VOIDED
REVERSED

Gunakan hanya status yang relevan.

Pada detail transaction tampilkan action bar.

Contoh:

Jika DRAFT:

* Edit
* Delete Draft
* Submit
* Duplicate
* Print Draft jika relevan

Jika PENDING_APPROVAL:

* Approve
* Reject
* Request Revision
* Cancel Submission jika diizinkan

Jika APPROVED:

* Post
* Print
* View Accounting Impact

Jika POSTED:

* Print
* View Journal
* View Audit Trail
* Create Payment
* Create Return
* Reverse sesuai jenis transaksi

JANGAN menampilkan action yang tidak valid menurut state.

JANGAN hanya menyembunyikan tombol di frontend.

Server dan database wajib memvalidasi state transition.

======================================================================
5. BUTTONS MUST ACTUALLY WORK
=============================

SETIAP BUTTON WAJIB:

1. Memiliki action nyata.
2. Memanggil server-side mutation jika mengubah data.
3. Memiliki permission check.
4. Memiliki validation.
5. Memiliki loading state.
6. Disable selama processing.
7. Mencegah double click.
8. Menampilkan success/error feedback.
9. Memperbarui UI setelah sukses.
10. Menghasilkan audit log jika relevan.

DILARANG:

<button>Tambah</button>

tanpa handler.

DILARANG:

<Link href="#">Edit</Link>

DILARANG:

onClick={() => console.log(...)}

DILARANG:

alert("Coming Soon")

DILARANG:

fake success response.

======================================================================
6. SERVER MUTATION PATTERN
==========================

Gunakan pola mutation konsisten.

Untuk setiap mutation:

CLIENT/UI
↓
FORM VALIDATION
↓
SERVER ACTION / ROUTE HANDLER
↓
AUTH CHECK
↓
ACTIVE COMPANY CHECK
↓
PERMISSION CHECK
↓
ZOD VALIDATION
↓
DATABASE OPERATION / RPC
↓
AUDIT
↓
RETURN STRUCTURED RESULT
↓
REVALIDATE PATH / CACHE
↓
UI FEEDBACK

Mutation response gunakan pola seperti:

{
success: boolean,
data?: ...,
error?: {
code: string,
message: string,
fieldErrors?: ...
}
}

Jangan expose raw PostgreSQL error kepada user.

======================================================================
7. MASTER DATA — WAJIB FULL CRUD
================================

======================================================================
7.1 CHART OF ACCOUNTS
=====================

Route:

/master/accounts

Implementasikan:

LIST
CREATE
DETAIL
EDIT
ACTIVATE
DEACTIVATE
IMPORT
EXPORT

Fields:

* account code
* account name
* account type
* parent account
* normal balance
* cash flow category
* allow manual journal
* control account
* active

Validation:

* account code unique per company
* parent tidak boleh dirinya sendiri
* cegah circular hierarchy
* tidak dapat menghapus account yang sudah mempunyai journal
* account yang dipakai dapat dinonaktifkan
* control account tidak dapat digunakan manual tanpa special permission

Tambahkan:

* tree view
* flat table view
* search
* account type filter
* active filter

======================================================================
7.2 CONTACTS
============

Route:

/master/contacts

Implementasikan FULL CRUD.

Contact type:

* Customer
* Supplier
* Customer & Supplier

Fields minimum:

* code
* display name
* legal name
* email
* phone
* address
* city
* province
* postal code
* NPWP
* NIK jika digunakan
* NITKU jika digunakan
* PKP status
* payment terms
* credit limit
* default AR account
* default AP account
* default tax
* notes
* active

Detail page tabs:

* Overview
* Sales
* Purchases
* Receivables
* Payables
* Payments
* Attachments
* Audit Trail

Actions:

* Edit
* Archive
* Create Sales Invoice
* Create Purchase Invoice
* Receive Payment
* Make Payment
* Statement

======================================================================
7.3 PRODUCTS
============

Route:

/master/products

Implementasikan FULL CRUD.

Types:

* Inventory
* Non Inventory
* Service

Fields:

* SKU
* barcode
* name
* type
* unit
* sales price
* purchase price
* sales account
* purchase/expense account
* inventory account
* COGS account
* default sales tax
* default purchase tax
* minimum stock
* active

Inventory product detail:

* stock by warehouse
* movement history
* average cost
* valuation
* sales history
* purchase history

Actions:

* Edit
* Archive
* Adjust Stock
* Transfer Stock
* View Stock Card

======================================================================
7.4 WAREHOUSE
=============

Route:

/master/warehouses

CRUD:

* Create
* View
* Edit
* Activate
* Deactivate

Fields:

* code
* name
* branch
* address
* active

Tidak dapat delete warehouse jika memiliki movement.

======================================================================
7.5 TAX CODES
=============

Route:

/master/taxes

CRUD:

* Create Tax Code
* View
* Edit metadata
* Add Rate Version
* Deactivate

Tax rate lama TIDAK BOLEH diedit jika sudah digunakan.

Gunakan Add New Rate Version.

======================================================================
8. SALES MODULE — FULL BUSINESS ACTION
======================================

======================================================================
8.1 SALES QUOTATION
===================

Route:

/sales/quotations

Actions:

* Create
* Edit draft
* Delete draft
* Submit
* Approve jika dibutuhkan
* Reject
* Duplicate
* Convert to Sales Order
* Convert to Sales Invoice jika diperbolehkan
* Print
* Download PDF jika feature tersedia

Form:

* customer
* quotation date
* expiry date
* salesperson
* branch
* currency
* item lines
* quantity
* unit
* price
* discount
* tax
* notes

Totals otomatis.

======================================================================
8.2 SALES ORDER
===============

Route:

/sales/orders

Actions:

* Create
* Edit Draft
* Delete Draft
* Submit
* Approve
* Reject
* Create Delivery
* Create Invoice
* Cancel Remaining Quantity
* Duplicate
* Print

Detail tampilkan:

* ordered qty
* delivered qty
* invoiced qty
* remaining qty

Tidak boleh over-delivery tanpa explicit permission.

Tidak boleh over-invoice tanpa explicit permission.

======================================================================
8.3 SALES DELIVERY
==================

Route:

/sales/deliveries

Actions:

* Create from Sales Order
* Create standalone jika policy mengizinkan
* Edit Draft
* Delete Draft
* Submit
* Approve
* Post
* Print
* Create Return

Ketika POST:

* validate stock
* lock inventory
* create inventory movement
* create COGS journal
* credit Inventory
* update delivered quantity
* generate audit

======================================================================
8.4 SALES INVOICE
=================

Route:

/sales/invoices

INI SALAH SATU FITUR PALING PENTING.

Implementasikan secara penuh.

Actions:

* New Invoice
* Edit Draft
* Delete Draft
* Submit
* Approve
* Reject
* Post
* Duplicate
* Print
* Download
* Send preparation jika email integration belum tersedia
* Receive Payment
* Create Credit Note
* Create Sales Return
* Reverse jika sesuai
* View Journal
* View Payment History

Form:

HEADER:

* customer
* invoice number
* invoice date
* due date
* branch
* salesperson
* reference
* currency
* exchange rate
* price includes tax
* notes

LINES:

* product
* description
* warehouse
* quantity
* unit
* unit price
* discount %
* discount amount
* tax
* subtotal
* tax amount
* total

FOOTER:

* subtotal
* line discounts
* additional discount
* tax
* withholding tax jika relevan
* rounding
* grand total
* amount paid
* balance due

User tidak boleh mengirim grand total sebagai source of truth.

Server hitung ulang.

Posting wajib menghasilkan:

Debit:
Accounts Receivable

Credit:
Sales Revenue

Credit:
Output Tax

Dan inventory/COGS jika invoice sekaligus fulfillment.

======================================================================
8.5 CUSTOMER RECEIPTS
=====================

Route:

/sales/receipts

Implementasikan:

* Create Receipt
* Edit Draft
* Delete Draft
* Submit
* Approve jika policy
* Post
* Reverse
* Print
* View Journal

Form:

* customer
* receipt date
* bank/cash account
* reference
* payment method
* amount received
* withholding
* bank charge
* notes

Invoice allocation:

* checkbox invoice
* outstanding amount
* allocation amount

Mendukung:

* full payment
* partial payment
* multi-invoice payment
* overpayment
* unapplied receipt
* withholding
* write-off jika permission

======================================================================
8.6 SALES RETURN / CREDIT NOTE
==============================

Route:

/sales/returns

Actions:

* Create from Invoice
* Select original invoice lines
* quantity return
* reason
* warehouse
* tax treatment
* submit
* approve
* post
* print

Posting harus reverse proporsional:

* revenue
* tax
* receivable/customer credit
* COGS
* inventory

======================================================================
9. PURCHASE MODULE — FULL BUSINESS ACTION
=========================================

======================================================================
9.1 PURCHASE REQUEST
====================

Implementasikan:

* Create
* Edit Draft
* Delete Draft
* Submit
* Approve
* Reject
* Convert to Purchase Order

======================================================================
9.2 PURCHASE ORDER
==================

Implementasikan:

* Create
* Edit Draft
* Delete Draft
* Submit
* Approve
* Reject
* Create Goods Receipt
* Create Purchase Invoice
* Cancel Remaining
* Duplicate
* Print

Tampilkan:

* ordered
* received
* invoiced
* remaining

======================================================================
9.3 GOODS RECEIPT
=================

Implementasikan:

* Create from PO
* standalone jika policy
* edit draft
* submit
* approve
* post
* print
* create purchase return

Posting:

Debit Inventory
Credit GRNI

Update:

* stock
* moving average cost
* PO received quantity

======================================================================
9.4 PURCHASE INVOICE
====================

Implementasikan FULL FUNCTION.

Actions:

* Create
* Create from PO
* Create from Goods Receipt
* Edit Draft
* Delete Draft
* Submit
* Approve
* Reject
* Post
* Make Payment
* Create Debit Note
* Create Return
* View Journal
* Print

Fields mirip sales invoice dengan supplier context.

Posting:

Debit:
Inventory / Expense / GRNI

Debit:
Input Tax

Credit:
Accounts Payable

======================================================================
9.5 SUPPLIER PAYMENT
====================

Implementasikan:

* Create
* Allocate invoice
* partial payment
* multi-invoice
* withholding
* bank fee
* submit
* approve
* post
* reverse
* print
* view journal

======================================================================
9.6 PURCHASE RETURN
===================

Implementasikan end-to-end dengan source purchase invoice / goods receipt.

Update:

* payable
* input tax
* inventory
* inventory valuation
* journal

======================================================================
10. INVENTORY — FULL ACTION
===========================

======================================================================
10.1 STOCK VIEW
===============

/inventory/stock

Tampilkan:

* product
* warehouse
* on hand
* reserved
* available
* avg cost
* valuation
* minimum stock

Actions:

* View Stock Card
* Adjust
* Transfer
* Stock Opname

======================================================================
10.2 STOCK ADJUSTMENT
=====================

/inventory/adjustments

Implementasikan:

* Create
* Edit Draft
* Delete Draft
* Submit
* Approve
* Reject
* Post
* Reverse

Adjustment type:

* increase
* decrease

Require:

* warehouse
* reason
* account
* product
* quantity
* unit cost jika increase sesuai policy

Posting harus membuat:

inventory movement
+
journal

======================================================================
10.3 STOCK TRANSFER
===================

Implementasikan:

* source warehouse
* destination warehouse
* item
* quantity
* submit
* approve
* post
* receive jika menggunakan two-step transfer

Tidak mengubah total inventory value perusahaan kecuali ada cost component khusus.

======================================================================
10.4 STOCK OPNAME
=================

Implementasikan:

* Create Opname Session
* Select warehouse
* Snapshot expected quantity
* Input counted quantity
* Calculate variance
* Submit
* Approve
* Post adjustment
* Print report

======================================================================
11. CASH & BANK — FULL ACTION
=============================

======================================================================
11.1 BANK / CASH ACCOUNTS
=========================

CRUD:

* Create
* View
* Edit
* Deactivate

Fields:

* name
* account type
* bank
* account number
* currency
* linked GL account
* active

======================================================================
11.2 CASH TRANSACTIONS
======================

Implementasikan:

* Cash In
* Cash Out
* Bank Transfer

Workflow:

* Draft
* Submit
* Approve
* Post
* Reverse

Cash In:

Debit Cash/Bank
Credit selected account

Cash Out:

Debit selected account
Credit Cash/Bank

Bank Transfer:

Debit Destination Bank
Credit Source Bank

======================================================================
11.3 BANK RECONCILIATION
========================

Implementasikan:

* Upload CSV
* Parse
* Preview
* Validate
* Import
* Match transaction
* Unmatch
* Manually match
* Create adjustment
* Finalize reconciliation

Jangan hanya membuat upload button.

Parsing dan matching harus benar-benar bekerja.

======================================================================
12. ACCOUNTING MODULE
=====================

======================================================================
12.1 MANUAL JOURNAL
===================

/accounting/journals

Implementasikan:

* Create
* Edit Draft
* Delete Draft
* Submit
* Approve
* Reject
* Post
* Reverse
* Duplicate
* Print
* View Source

Journal editor:

* account
* description
* debit
* credit
* contact
* branch
* department
* project

Realtime display:

Total Debit
Total Credit
Difference

Submit/Post disable jika tidak balance.

Tetapi database tetap wajib verify.

======================================================================
12.2 ACCOUNTING PERIOD
======================

/accounting/periods

Actions:

* Create Fiscal Year
* Generate Periods
* Open
* Close
* Reopen

Close period:

* validate unposted critical documents
* validate journal balance
* require confirmation
* require permission
* save audit

Reopen:

* Administrator/special permission
* reason mandatory
* audit log mandatory

======================================================================
13. FIXED ASSETS
================

Implementasikan FULL CRUD.

Asset actions:

* Create
* Edit Draft
* Activate/In Service
* Generate Depreciation Schedule
* Run Depreciation
* View Journal
* Dispose
* Write Off

Fields:

* asset code
* name
* category
* acquisition date
* acquisition cost
* in-service date
* useful life
* residual value
* depreciation method
* asset account
* accumulated depreciation account
* depreciation expense account

======================================================================
14. APPROVALS
=============

/approvals

JANGAN hanya menampilkan queue.

Implementasikan:

* View Document
* Preview Changes
* Preview Journal
* Approve
* Reject
* Request Revision

Reject wajib:

reason

Approval modal wajib menampilkan:

* document number
* creator
* company
* amount
* document date
* risk/relevant warning
* journal impact

Approval harus memanggil server action nyata.

======================================================================
15. REPORTS
===========

Setiap report wajib functional.

Minimum filters:

* company
* branch
* date from
* date to

Tambahkan sesuai report:

* customer
* supplier
* account
* product
* warehouse
* status

Actions:

* Apply Filter
* Reset
* Export CSV
* Print

Jika PDF export sudah tersedia secara benar:

* Export PDF

Jangan menampilkan tombol PDF jika belum ada implementasi.

======================================================================
16. USERS, ROLES & SETTINGS
===========================

======================================================================
16.1 USERS
==========

/settings/users

Implementasikan:

* Invite/Add User
* View
* Edit Membership
* Change Role
* Activate
* Suspend/Deactivate
* Remove from Company

Administrator tidak boleh mengubah Supabase Auth password user secara insecure.

Gunakan mekanisme auth resmi.

======================================================================
16.2 ROLES
==========

/settings/roles

Implementasikan:

* Create Custom Role
* View
* Edit
* Duplicate
* Deactivate
* Assign Permissions

Gunakan permission matrix.

Columns:

Permission
Administrator
Accountant
Operator
Approver
Viewer
Custom Role

Tampilkan checkbox sesuai role yang editable.

System role dapat dibuat locked jika diperlukan.

======================================================================
16.3 ACCOUNT MAPPING
====================

Implementasikan edit configuration untuk:

* Accounts Receivable
* Accounts Payable
* Inventory
* COGS
* Sales Revenue
* GRNI
* Output Tax
* Input Tax
* Withholding Tax
* Bank Fee
* Rounding
* Retained Earnings
* Exchange Gain
* Exchange Loss

Jangan hard-code account ID.

======================================================================
17. ACTION COMPONENT SYSTEM
===========================

Buat reusable component untuk pola action.

Misalnya:

<EntityPageHeader />
<EntityActionMenu />
<StatusBadge />
<DeleteConfirmationDialog />
<ApprovalDialog />
<RejectDialog />
<PostConfirmationDialog />
<ReverseDialog />
<AuditTimeline />
<JournalPreview />
<DocumentTotals />
<LineItemEditor />

Tetapi jangan over-engineer.

Gunakan abstraction hanya jika benar-benar dipakai berulang.

======================================================================
18. FORMS
=========

Pastikan seluruh form menggunakan reusable validation.

Gunakan schema validation.

Field error wajib tampil dekat input.

Jangan hanya toast:

“Validation failed”

tanpa menjelaskan field yang salah.

Form harus menangani:

* required
* invalid value
* duplicate
* stale version
* unauthorized
* locked period
* invalid state
* insufficient stock
* invalid tax
* database conflict

======================================================================
19. TABLE ACTION STANDARD
=========================

Untuk seluruh list/table:

Kolom terakhir:

Aksi

Gunakan menu:

⋮

Action disesuaikan dengan status dan permission.

Contoh invoice DRAFT:

* Lihat
* Edit
* Submit
* Hapus

Invoice POSTED:

* Lihat
* Print
* Terima Pembayaran
* Buat Retur
* Lihat Jurnal

Viewer:

* Lihat
* Print jika diizinkan

Jangan menampilkan Edit pada posted document.

======================================================================
20. DETAIL PAGE STANDARD
========================

Setiap transaksi harus memiliki detail page.

Header:

Document Type
Document Number
Status

Metadata:

Created
Submitted
Approved
Posted

Action bar.

Main content:

* counterparty
* date
* due date
* items
* totals
* tax
* notes

Tabs jika relevan:

* Detail
* Journal
* Payments
* Related Documents
* Attachments
* Approval
* Audit Trail

======================================================================
21. ACCOUNTING PREVIEW
======================

Sebelum transaksi diposting, user dengan permission harus dapat membuka:

“Preview Jurnal”

Tampilkan:

Account Code
Account Name
Debit
Credit

Total debit dan credit.

Preview harus berasal dari posting engine yang sama atau shared domain logic dengan actual posting.

Jangan membuat dua algoritma yang berbeda.

======================================================================
22. CONFIRMATION BEFORE CRITICAL ACTION
=======================================

Wajib confirmation dialog untuk:

* Delete
* Archive
* Submit
* Approve
* Reject
* Post
* Reverse
* Close Period
* Reopen Period
* Stock Adjustment
* Finalize Reconciliation

Confirmation message harus spesifik.

Contoh:

“Posting Invoice SI-2026-08-0001 akan membuat jurnal dan mengunci transaksi dari pengeditan. Lanjutkan?”

======================================================================
23. CONCURRENCY & DOUBLE SUBMISSION
===================================

Tangani kondisi:

User double-click Save.

User double-click Post.

Dua approver approve pada saat sama.

Dua operator generate document number bersamaan.

Dua transaksi mengurangi stok bersamaan.

Gunakan:

* database transaction
* row locking
* unique constraints
* idempotency key
* version number
* state validation

JANGAN hanya mengandalkan disabled button.

======================================================================
24. EMPTY STATE
===============

Empty state harus membantu melakukan action.

Contoh Contacts:

“Belum ada customer atau supplier.”

Button:

* Tambah Kontak

Products:

“Belum ada produk.”

Button:

* Tambah Produk

Sales Invoice:

“Belum ada faktur penjualan.”

Button:

* Buat Faktur

Jangan hanya menampilkan:

No Data.

======================================================================
25. ROLE BEHAVIOUR TEST
=======================

Test UI + backend.

ADMINISTRATOR:

dapat melakukan seluruh management action sesuai policy.

ACCOUNTANT:

dapat accounting actions.

OPERATOR:

dapat membuat transaksi tetapi tidak self-approve.

APPROVER:

dapat approve tetapi tidak mengubah line.

VIEWER:

tidak dapat mutation.

WAJIB TEST:

Viewer mencoba mengakses POST server action langsung.

Harus ditolak.

Operator memanggil approve endpoint manual.

Harus ditolak.

User Company A mengubah ID request menjadi Company B.

Harus ditolak.

======================================================================
26. CRUD TEST MATRIX
====================

Untuk setiap CRUD resource minimal test:

CREATE:

* valid create succeeds
* invalid input rejected
* unauthorized create rejected
* cross-company create rejected
* duplicate rejected jika applicable

READ:

* own company succeeds
* another company fails

UPDATE:

* valid update succeeds
* invalid update fails
* stale version fails
* unauthorized update fails
* posted/locked record fails

DELETE:

* draft unused record can delete jika policy
* referenced master cannot hard delete
* posted transaction cannot delete
* unauthorized delete fails

======================================================================
27. TRANSACTION TEST MATRIX
===========================

Untuk setiap transaction:

CREATE DRAFT

EDIT DRAFT

DELETE DRAFT

SUBMIT

APPROVE

REJECT

POST

REVERSE / RETURN jika relevan

Test invalid transition:

POST DRAFT langsung tanpa approval jika workflow membutuhkan approval
→ FAIL

EDIT POSTED
→ FAIL

DELETE POSTED
→ FAIL

APPROVE OWN DOCUMENT jika self approval disabled
→ FAIL

POST LOCKED PERIOD
→ FAIL

POST TWICE
→ hanya satu posting

======================================================================
28. FUNCTIONAL E2E SCENARIO
===========================

Buat Playwright flow nyata.

FLOW A — SALES:

1. Admin login.
2. Create customer.
3. Create inventory product.
4. Add opening stock.
5. Operator login.
6. Create Sales Order.
7. Add item.
8. Save Draft.
9. Edit.
10. Submit.
11. Approver login.
12. Open approval.
13. Approve.
14. Create Delivery.
15. Post Delivery.
16. Verify stock decreased.
17. Create Invoice.
18. Approve.
19. Post.
20. Verify journal.
21. Create Receipt.
22. Allocate invoice.
23. Post.
24. Invoice status becomes Paid.
25. AR Aging no longer shows balance.
26. GL updates.
27. Audit trail contains all actions.

FLOW B — PURCHASE:

1. Create Supplier.
2. Create PO.
3. Submit.
4. Approve.
5. Create Goods Receipt.
6. Post.
7. Verify inventory increased.
8. Create Purchase Invoice.
9. Post.
10. Verify AP.
11. Create Supplier Payment.
12. Post.
13. Verify AP cleared.

FLOW C — RETURN:

1. Create return from posted sales invoice.
2. Submit.
3. Approve.
4. Post.
5. Verify inventory.
6. Verify revenue reversal.
7. Verify tax.
8. Verify customer balance.

FLOW D — PERIOD LOCK:

1. Close period.
2. Try creating backdated posting.
3. Must fail.
4. Reopen with Administrator.
5. Reason required.
6. Audit created.

======================================================================
29. SIDEBAR NAVIGATION AUDIT
============================

Klik/test semua menu sidebar.

Untuk setiap menu:

* URL valid
* page render
* no 404
* no dead menu
* no placeholder
* permission correct
* action visible sesuai role
* breadcrumb correct
* title correct

Buat automated navigation smoke test jika practical.

======================================================================
30. DATABASE INTEGRITY
======================

Setelah implementasi CRUD:

Periksa bahwa UI tidak dapat merusak accounting integrity.

MASTER EDIT:

Perubahan nama account boleh.

Perubahan account type jika sudah mempunyai journal:
batasi atau blokir jika dapat merusak laporan.

PRODUCT EDIT:

Tidak boleh mengubah inventory product menjadi service setelah mempunyai stock movement tanpa migration workflow.

CONTACT:

Tidak boleh kehilangan historical relationship.

TAX:

Rate yang sudah dipakai tidak boleh overwrite.

WAREHOUSE:

Tidak boleh delete jika sudah mempunyai movement.

======================================================================
31. DELETE POLICY
=================

BUAT DELETE POLICY EKSPLISIT.

Hard Delete diperbolehkan hanya untuk data:

* Draft
* Belum digunakan
* Tidak memiliki child record penting
* Tidak mempunyai posted relation

Archive/Deactivate untuk:

* account
* customer
* supplier
* product
* tax
* warehouse
* bank account
* user membership

Never Hard Delete:

* posted journal
* posted invoice
* posted payment
* posted inventory movement
* posted tax export
* approval history
* audit log

======================================================================
32. NOTIFICATION
================

Minimal in-app notifications untuk:

* document submitted
* approval requested
* approved
* rejected
* posted
* payment received
* payment made
* low stock jika feature sudah tersedia

Jika realtime terlalu kompleks:

implementasikan durable notification table terlebih dahulu.

Jangan pura-pura mengirim email jika email provider belum dikonfigurasi.

======================================================================
33. PERFORMANCE
===============

CRUD tidak boleh menyebabkan load semua data.

Gunakan:

* pagination
* indexed filter
* server-side search
* limit
* select required columns
* relation query yang efisien

Jangan:

select *

secara sembarangan untuk list besar.

======================================================================
34. ACCESSIBILITY
=================

Form:

* label benar
* aria jika perlu
* keyboard navigation
* focus management modal
* escape modal
* tab order
* descriptive errors

Action icon wajib memiliki accessible name.

======================================================================
35. RESPONSIVE
==============

Desktop adalah prioritas karena accounting application.

Tetapi:

* tablet harus usable
* mobile harus usable untuk basic actions
* form tidak overflow
* modal tidak keluar viewport
* tables memiliki responsive strategy

Jangan merusak UI TailAdmin yang sudah ada.

======================================================================
36. NO FAKE IMPLEMENTATION
==========================

DILARANG membuat fitur yang hanya terlihat selesai.

Contoh dilarang:

Button Add Customer membuka modal tetapi Save tidak menulis database.

Button Approve hanya mengubah badge lokal.

Button Post hanya mengubah status tanpa journal.

Button Delete hanya menghapus row di React state.

Button Export hanya membuat file kosong.

Button Print tidak menampilkan dokumen.

Button Payment hanya menambah status paid tanpa jurnal.

Button Stock Adjustment hanya mengubah inventory_balances secara manual tanpa movement.

Button Tax Export membuat dummy XML seolah resmi.

Semua action harus mempunyai backend implementation nyata.

======================================================================
37. IMPLEMENTATION ORDER
========================

Kerjakan berdasarkan dependencies.

STAGE 1

Audit semua gap.

STAGE 2

Buat shared mutation infrastructure:

* validation
* permissions
* errors
* confirmation
* toast
* dialogs

STAGE 3

Master CRUD:

* accounts
* contacts
* products
* warehouses
* taxes
* bank accounts

STAGE 4

Sales CRUD + workflow.

STAGE 5

Purchase CRUD + workflow.

STAGE 6

Inventory actions.

STAGE 7

Cash & Bank.

STAGE 8

Manual Journal + Accounting Period.

STAGE 9

Approval actions.

STAGE 10

Fixed Asset actions.

STAGE 11

Users/Roles/Settings CRUD.

STAGE 12

Reports filter/export.

STAGE 13

Audit log/detail/history.

STAGE 14

Full E2E.

STAGE 15

Final cleanup and verification.

Jangan menunda seluruh test sampai akhir.

Test setiap stage.

======================================================================
38. DEFINITION OF FUNCTIONAL FEATURE
====================================

Sebuah feature hanya boleh disebut DONE jika:

[ ] menu ada
[ ] route ada
[ ] list page bekerja
[ ] database query nyata
[ ] create bekerja
[ ] validation bekerja
[ ] data tersimpan
[ ] detail bekerja
[ ] edit bekerja jika applicable
[ ] archive/delete bekerja jika applicable
[ ] permission bekerja
[ ] RLS bekerja
[ ] loading state ada
[ ] empty state ada
[ ] error state ada
[ ] success feedback ada
[ ] audit log ada jika relevan
[ ] test ada
[ ] refresh browser tidak menghilangkan perubahan
[ ] action tetap bekerja setelah login ulang
[ ] tidak bergantung pada local React state sebagai persistence
[ ] tidak ada dummy action

Untuk transaksi tambahkan:

[ ] submit bekerja
[ ] approval bekerja
[ ] reject bekerja
[ ] post bekerja
[ ] journal terbentuk
[ ] journal balance
[ ] status benar
[ ] double-post dicegah
[ ] reverse/return bekerja jika applicable
[ ] related ledger berubah dengan benar

======================================================================
39. FINAL FUNCTIONAL AUDIT
==========================

Setelah implementasi:

Buka docs/FUNCTIONAL_GAP_AUDIT.md.

Setiap PARTIAL dan MISSING harus diperiksa.

Tidak boleh menyelesaikan task ketika masih ada MISSING pada modul core.

Update menjadi:

DONE

hanya setelah benar-benar diuji.

Buat:

docs/FUNCTIONAL_COMPLETION_REPORT.md

Isi:

* total routes
* total CRUD resources
* total create actions
* total edit actions
* total archive/delete actions
* total transactional actions
* total approval actions
* total posting actions
* tests
* unresolved issue

======================================================================
40. FINAL MANUAL QA
===================

Lakukan manual functional verification terhadap UI.

Minimal:

Create Contact
→ refresh
→ data masih ada.

Edit Contact
→ refresh
→ perubahan masih ada.

Archive Contact
→ filter archived
→ record ditemukan.

Create Product
→ digunakan dalam invoice.

Create Invoice
→ save draft
→ edit
→ submit
→ approve
→ post
→ journal ada.

Receive Payment
→ outstanding berkurang.

Create PO
→ receipt
→ invoice
→ payment.

Stock Adjustment
→ stock berubah
→ movement ada
→ journal ada.

Manual Journal
→ post
→ GL berubah.

Close Period
→ backdated posting gagal.

Viewer
→ tidak dapat edit.

======================================================================
41. FINAL QUALITY COMMANDS
==========================

Sebelum selesai jalankan semua command repository yang relevan:

* lint
* typecheck
* unit tests
* database tests
* integration tests
* e2e tests
* production build

Jika menggunakan npm:

npm run lint
npm run typecheck
npm run test
npm run test:integration
npm run test:e2e
npm run build

Jika repository menggunakan pnpm:

gunakan pnpm.

Jika yarn:

gunakan yarn.

JANGAN mengganti package manager.

======================================================================
42. FINAL RESPONSE FORMAT
=========================

Setelah seluruh pekerjaan selesai, laporkan:

1. Functional Gap Audit sebelum implementasi.
2. Modul yang diperbaiki.
3. CRUD yang telah dibuat.
4. Transaction actions yang telah dibuat.
5. Approval workflow yang telah dibuat.
6. Posting action yang telah dibuat.
7. Database functions yang ditambahkan.
8. RLS yang ditambahkan/diperbaiki.
9. UI actions yang sebelumnya dummy dan sekarang functional.
10. Tests yang ditambahkan.
11. Exact result lint.
12. Exact result typecheck.
13. Exact result unit test.
14. Exact result integration test.
15. Exact result E2E.
16. Exact result production build.
17. Remaining limitation.
18. Daftar file utama yang berubah.
19. Daftar migration yang dibuat.
20. Jangan mengarang test result.

======================================================================
43. MOST IMPORTANT INSTRUCTION
==============================

JANGAN HANYA MEMPERINDAH UI.

JANGAN HANYA MENAMBAHKAN HALAMAN.

JANGAN HANYA MENAMBAHKAN TABEL.

JANGAN HANYA MENAMBAHKAN BUTTON.

JANGAN HANYA MENAMBAHKAN DATABASE TABLE.

SEMPURNAKAN FITUR DARI UJUNG KE UJUNG:

UI
→ FORM
→ VALIDATION
→ SERVER ACTION
→ AUTHORIZATION
→ DATABASE
→ TRANSACTION
→ ACCOUNTING ENTRY
→ AUDIT LOG
→ USER FEEDBACK
→ TEST

UNTUK SETIAP FITUR, TANYAKAN PADA DIRI SENDIRI:

“APAKAH USER BENAR-BENAR BISA MELAKUKAN PEKERJAANNYA DARI UI INI?”

JIKA JAWABANNYA BELUM:

FITUR BELUM SELESAI.

JANGAN MEMBUAT ULANG DASOL DARI NOL.

LANJUTKAN REPOSITORY EXISTING.

PERTAHANKAN IMPLEMENTASI YANG SUDAH BENAR.

PERBAIKI DAN LENGKAPI YANG BELUM FUNCTIONAL.

KERJAKAN LANGSUNG, BUKAN HANYA MEMBERIKAN SARAN.

JANGAN BERHENTI PADA AUDIT.

JANGAN BERHENTI PADA PLAN.

JANGAN BERHENTI PADA CRUD MASTER DATA.

SELESAIKAN CORE TRANSACTION FLOW SAMPAI POSTING DAN REPORTING.

JANGAN MENYATAKAN SELESAI JIKA MASIH ADA DUMMY ACTION, DEAD BUTTON, PLACEHOLDER, ATAU CORE FEATURE YANG DISPLAY-ONLY.

MAKE NO MISTAKE