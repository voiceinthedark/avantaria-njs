"use client";

import { useState, useActionState } from "react";
import { updateVariantAction, deleteVariantAction } from "./actions";
import { Field } from "../../_components/field";
import { FormMessage } from "../../_components/form-message";
import { buttonClass, inputClass, secondaryButtonClass } from "../../_components/form-styles";

type VariantRowProps = {
  variant: {
    productId: string;
    id: string;
    sku: string;
    size: string;
    color: string;
    stockQty: number;
    /** Prisma Decimal serialized as a string; Decimals can't cross to the client. */
    priceDelta: string;
  };
};

/** Edits or deletes a single variant. Creating variants lives in VariantForm. */
export default function VariantRow({ variant }: VariantRowProps) {
  const [state, updateAction, pending] = useActionState(updateVariantAction, undefined);
  const [deleteState, deleteAction, deleting] = useActionState(deleteVariantAction, undefined);

  // The saved values (props refresh after the action revalidates the page).
  const saved = {
    sku: variant.sku,
    size: variant.size,
    color: variant.color,
    stockQty: String(variant.stockQty),
    priceDelta: variant.priceDelta,
  };
  // Controlled, so a failed save doesn't wipe what the admin typed.
  const [values, setValues] = useState(saved);

  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  // Numbers compare numerically, so "5" and the saved "5.00" count as equal.
  const numeric = new Set<keyof typeof saved>(["stockQty", "priceDelta"]);
  const unchanged = (Object.keys(saved) as (keyof typeof saved)[]).every((key) =>
    numeric.has(key) ? Number(values[key]) === Number(saved[key]) : values[key] === saved[key],
  );

  const id = variant.id;

  return (
    <li className="space-y-2 p-3">
      <form
        action={updateAction}
        className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-[repeat(5,1fr)_auto] lg:items-end"
      >
        <input type="hidden" name="productId" value={variant.productId} />
        <input type="hidden" name="variantId" value={id} />

        <Field label="SKU" htmlFor={`variant-sku-${id}`}>
          <input
            id={`variant-sku-${id}`}
            name="sku"
            type="text"
            required
            minLength={3}
            className={inputClass}
            value={values.sku}
            onChange={(e) => set("sku", e.target.value)}
          />
        </Field>

        {/* TODO: Size should be a select with the sizes the product supports. */}
        <Field label="Size" htmlFor={`variant-size-${id}`}>
          <input
            id={`variant-size-${id}`}
            name="size"
            type="text"
            required
            className={inputClass}
            value={values.size}
            onChange={(e) => set("size", e.target.value)}
          />
        </Field>

        <Field label="Color" htmlFor={`variant-color-${id}`}>
          <input
            id={`variant-color-${id}`}
            name="color"
            type="text"
            required
            className={inputClass}
            value={values.color}
            onChange={(e) => set("color", e.target.value)}
          />
        </Field>

        <Field label="Stock quantity" htmlFor={`variant-stockQty-${id}`}>
          <input
            id={`variant-stockQty-${id}`}
            name="stockQty"
            type="number"
            required
            min={0}
            step={1}
            className={inputClass}
            value={values.stockQty}
            onChange={(e) => set("stockQty", e.target.value)}
          />
        </Field>

        <Field label="Price delta" htmlFor={`variant-priceDelta-${id}`}>
          <input
            id={`variant-priceDelta-${id}`}
            name="priceDelta"
            type="number"
            inputMode="decimal"
            step={0.01}
            className={inputClass}
            value={values.priceDelta}
            onChange={(e) => set("priceDelta", e.target.value)}
          />
        </Field>

        <button type="submit" disabled={unchanged || pending} className={buttonClass}>
          {pending ? "Saving…" : "Save"}
        </button>
      </form>

      <FormMessage state={state?.ok && !unchanged ? undefined : state} />

      <form
        action={deleteAction}
        onSubmit={(e) => {
          if (!confirm(`Delete variant ${variant.sku}?`)) e.preventDefault();
        }}
        className="flex items-center gap-3"
      >
        <input type="hidden" name="productId" value={variant.productId} />
        <input type="hidden" name="variantId" value={id} />
        <button type="submit" disabled={deleting} className={secondaryButtonClass}>
          {deleting ? "Deleting…" : "Delete"}
        </button>
        <FormMessage state={deleteState} />
      </form>
    </li>
  );
}
