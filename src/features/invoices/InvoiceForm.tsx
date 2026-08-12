"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import {
  initialMutationState,
  type MutationState,
} from "@/features/shared/mutation-state";

export type InvoiceLineInput = {
  description: string;
  discountAmount: string;
  productId: string;
  quantity: string;
  taxRateVersionId: string;
  unitPrice: string;
  warehouseId: string;
};

type Option = { label: string; value: string };
type ProductOption = Option & {
  name: string;
  productType: string;
  purchasePrice: string;
  salesPrice: string;
};

type Props = {
  action: (state: MutationState, formData: FormData) => Promise<MutationState>;
  branches: Option[];
  cancelHref: string;
  contacts: Option[];
  defaultDates: { documentDate: string; dueDate: string; postingDate: string };
  initial?: {
    branchId: string;
    contactId: string;
    currencyCode?: string;
    documentDate: string;
    dueDate: string;
    exchangeRate?: string;
    id: string;
    lines: InvoiceLineInput[];
    notes?: string | null;
    postingDate: string;
    supplierReference?: string | null;
    version: string;
  };
  kind: "purchase" | "sales";
  products: ProductOption[];
  taxRates: Option[];
  warehouses: Option[];
};

const emptyLine = (): InvoiceLineInput => ({
  description: "",
  discountAmount: "0",
  productId: "",
  quantity: "1",
  taxRateVersionId: "",
  unitPrice: "0",
  warehouseId: "",
});

export function InvoiceForm({
  action,
  branches,
  cancelHref,
  contacts,
  defaultDates,
  initial,
  kind,
  products,
  taxRates,
  warehouses,
}: Props) {
  const [state, formAction, pending] = useActionState(
    action,
    initialMutationState,
  );
  const [lines, setLines] = useState<InvoiceLineInput[]>(
    initial?.lines.length ? initial.lines : [emptyLine()],
  );
  const inputClass =
    "h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white";
  const total = useMemo(
    () =>
      lines.reduce(
        (sum, line) =>
          sum +
          Math.max(
            0,
            Number(line.quantity || 0) * Number(line.unitPrice || 0) -
              Number(line.discountAmount || 0),
          ),
        0,
      ),
    [lines],
  );

  const updateLine = (index: number, patch: Partial<InvoiceLineInput>) => {
    setLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index ? { ...line, ...patch } : line,
      ),
    );
  };
  const selectProduct = (index: number, productId: string) => {
    const product = products.find((item) => item.value === productId);
    updateLine(index, {
      description: product?.name ?? "",
      productId,
      unitPrice: product
        ? kind === "sales"
          ? product.salesPrice
          : product.purchasePrice
        : "0",
      warehouseId:
        product?.productType === "inventory" ? lines[index].warehouseId : "",
    });
  };

  return (
    <form action={formAction} className="space-y-6">
      <input name="kind" type="hidden" value={kind} />
      <input name="lines" type="hidden" value={JSON.stringify(lines)} />
      {initial ? (
        <>
          <input name="id" type="hidden" value={initial.id} />
          <input name="version" type="hidden" value={initial.version} />
        </>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <Field label="Cabang">
          <select
            className={inputClass}
            defaultValue={initial?.branchId}
            name="branchId"
            required
          >
            <option value="">Pilih…</option>
            {branches.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={kind === "sales" ? "Pelanggan" : "Pemasok"}>
          <select
            className={inputClass}
            defaultValue={initial?.contactId}
            name="contactId"
            required
          >
            <option value="">Pilih…</option>
            {contacts.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        {kind === "purchase" ? (
          <Field label="Referensi pemasok">
            <input
              className={inputClass}
              defaultValue={initial?.supplierReference ?? ""}
              name="supplierReference"
            />
          </Field>
        ) : null}
        <Field label="Tanggal dokumen">
          <input
            className={inputClass}
            defaultValue={initial?.documentDate ?? defaultDates.documentDate}
            name="documentDate"
            required
            type="date"
          />
        </Field>
        <Field label="Tanggal posting">
          <input
            className={inputClass}
            defaultValue={initial?.postingDate ?? defaultDates.postingDate}
            name="postingDate"
            required
            type="date"
          />
        </Field>
        <Field label="Jatuh tempo">
          <input
            className={inputClass}
            defaultValue={initial?.dueDate ?? defaultDates.dueDate}
            name="dueDate"
            required
            type="date"
          />
        </Field>
        {kind === "sales" ? (
          <>
            <Field label="Mata uang">
              <input
                className={inputClass}
                defaultValue={initial?.currencyCode ?? "IDR"}
                maxLength={3}
                name="currencyCode"
                required
              />
            </Field>
            <Field label="Kurs">
              <input
                className={inputClass}
                defaultValue={initial?.exchangeRate ?? "1"}
                min="0.0000000001"
                name="exchangeRate"
                required
                step="0.0000000001"
                type="number"
              />
            </Field>
          </>
        ) : (
          <>
            <input name="currencyCode" type="hidden" value="IDR" />
            <input name="exchangeRate" type="hidden" value="1" />
          </>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Baris Invoice
          </h2>
          <button
            className="border-brand-300 text-brand-600 rounded-lg border px-3 py-2 text-xs font-semibold"
            onClick={() => setLines((current) => [...current, emptyLine()])}
            type="button"
          >
            Tambah baris
          </button>
        </div>
        <div className="space-y-4">
          {lines.map((line, index) => {
            const product = products.find(
              (item) => item.value === line.productId,
            );
            return (
              <fieldset
                className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
                key={index}
              >
                <legend className="px-2 text-xs font-semibold text-gray-500">
                  Baris {index + 1}
                </legend>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Field label="Produk">
                    <select
                      aria-label={`Produk baris ${index + 1}`}
                      className={inputClass}
                      onChange={(event) =>
                        selectProduct(index, event.target.value)
                      }
                      required
                      value={line.productId}
                    >
                      <option value="">Pilih…</option>
                      {products.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Deskripsi">
                    <input
                      aria-label={`Deskripsi baris ${index + 1}`}
                      className={inputClass}
                      onChange={(event) =>
                        updateLine(index, { description: event.target.value })
                      }
                      required
                      value={line.description}
                    />
                  </Field>
                  <Field label="Kuantitas">
                    <input
                      aria-label={`Kuantitas baris ${index + 1}`}
                      className={inputClass}
                      min="0.000001"
                      onChange={(event) =>
                        updateLine(index, { quantity: event.target.value })
                      }
                      required
                      step="0.000001"
                      type="number"
                      value={line.quantity}
                    />
                  </Field>
                  <Field label={kind === "sales" ? "Harga jual" : "Harga beli"}>
                    <input
                      aria-label={`Harga baris ${index + 1}`}
                      className={inputClass}
                      min="0"
                      onChange={(event) =>
                        updateLine(index, { unitPrice: event.target.value })
                      }
                      required
                      step="0.000001"
                      type="number"
                      value={line.unitPrice}
                    />
                  </Field>
                  <Field label="Diskon">
                    <input
                      aria-label={`Diskon baris ${index + 1}`}
                      className={inputClass}
                      min="0"
                      onChange={(event) =>
                        updateLine(index, {
                          discountAmount: event.target.value,
                        })
                      }
                      step="0.0001"
                      type="number"
                      value={line.discountAmount}
                    />
                  </Field>
                  <Field label="Gudang">
                    <select
                      aria-label={`Gudang baris ${index + 1}`}
                      className={inputClass}
                      onChange={(event) =>
                        updateLine(index, { warehouseId: event.target.value })
                      }
                      required={product?.productType === "inventory"}
                      value={line.warehouseId}
                    >
                      <option value="">Tanpa gudang</option>
                      {warehouses.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Tarif pajak">
                    <select
                      aria-label={`Pajak baris ${index + 1}`}
                      className={inputClass}
                      onChange={(event) =>
                        updateLine(index, {
                          taxRateVersionId: event.target.value,
                        })
                      }
                      value={line.taxRateVersionId}
                    >
                      <option value="">Tanpa pajak</option>
                      {taxRates.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <div className="flex items-end">
                    <button
                      className="border-error-200 text-error-700 h-11 rounded-lg border px-3 text-xs font-semibold disabled:opacity-40"
                      disabled={lines.length === 1}
                      onClick={() =>
                        setLines((current) =>
                          current.filter((_, lineIndex) => lineIndex !== index),
                        )
                      }
                      type="button"
                    >
                      Hapus baris
                    </button>
                  </div>
                </div>
              </fieldset>
            );
          })}
        </div>
      </div>

      <Field label="Catatan">
        <textarea
          className={`${inputClass} min-h-24 py-3`}
          defaultValue={initial?.notes ?? ""}
          name="notes"
        />
      </Field>
      <div className="flex items-center justify-between border-t border-gray-100 pt-5 dark:border-gray-800">
        <p className="text-sm text-gray-500">
          Subtotal sebelum pajak:{" "}
          <strong className="text-gray-900 dark:text-white">
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
            }).format(total)}
          </strong>
        </p>
        <div className="flex gap-3">
          <Link
            className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300"
            href={cancelHref}
          >
            Batal
          </Link>
          <button
            className="bg-brand-500 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            disabled={pending}
            type="submit"
          >
            {pending ? "Menyimpan…" : "Simpan draft"}
          </button>
        </div>
      </div>
      {state.status === "error" ? (
        <div
          className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-sm"
          role="alert"
        >
          <p>{state.error.message}</p>
          {state.error.fieldErrors ? (
            <ul className="mt-1 list-disc pl-5">
              {Object.values(state.error.fieldErrors)
                .flat()
                .map((error) => (
                  <li key={error}>{error}</li>
                ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}

function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </span>
      {children}
    </label>
  );
}
