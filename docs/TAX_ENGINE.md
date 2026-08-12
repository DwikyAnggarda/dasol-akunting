# Tax engine

Tax codes are company-owned configuration. Rate versions preserve effective dates, calculation basis, inclusive/exclusive behavior, rounding mode/scale, source reference, and notes. An exclusion constraint prevents overlapping active versions for one code.

Application calculations use Decimal; posting recalculates numeric bases and amounts in PostgreSQL. Tax snapshots retain code/rate version/base/rate/amount for historical audit and ledger reconciliation.

`TaxExportAdapter` exposes versioned validation and generation. The initial `generic_csv` and `generic_xml` adapters escape content, validate decimal/date fields, and label artifacts `DEMO / NOT FOR OFFICIAL SUBMISSION`.

No official Coretax endpoint, API response, XML element, or upload claim is included. To onboard a verified template:

1. Store the official source reference, effective date, checksum, and immutable fixture.
2. Add a new adapter/profile version without changing old batches.
3. Map fields, validate against the official schema, and add regression fixtures.
4. Have tax/legal owners approve the mapping.
5. Mark final batches immutable and stale them when source transactions change.
