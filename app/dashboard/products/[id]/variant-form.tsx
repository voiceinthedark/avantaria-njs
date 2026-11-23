"use client";

import { useActionState, useState } from "react";
import { createVariantAction } from "./actions";
import { Field } from "../../_components/field";
import { FormMessage, type ActionState } from "../../_components/form-message";
import { buttonClass, inputClass } from "../../_components/form-styles";

const EMPTY = { sku: "", size: "", color: "", stockQty: "", priceDelta: "" };

type VariantFormProps = {
  productId: string;
};

/**
 * Creates a new variant for the product. The variant's own fields are edited
 * in a separate form after creation.
 * */
export default function VariantForm({ productId }: VariantFormProps) {
  const [values, setValues] = useState(EMPTY);

  // Clear the fields only on success, so a failed save keeps what was typed.
  const [state, action, pending] = useActionState(async (prev: ActionState, formData: FormData) => {
    const result = await createVariantAction(prev, formData);
    if (result?.ok) setValues(EMPTY);
    return result;
  }, undefined);

  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="productId" value={productId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Variant Size" htmlFor="variant-size">
          <input
            id="variant-size"
            name="size"
            type="text"
            required
            value={values.size}
            onChange={(e) => set("size", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="SKU" htmlFor="variant-sku">
          <input
            id="variant-sku"
            name="sku"
            type="text"
            required
            minLength={3}
            value={values.sku}
            onChange={(e) => set("sku", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Variant Color" htmlFor="variant-color">
          <input
            id="variant-color"
            name="color"
            type="text"
            required
            value={values.color}
            onChange={(e) => set("color", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Stock Quantity" htmlFor="variant-stockQty">
          <input
            id="variant-stockQty"
            name="stockQty"
            type="number"
            required
            min={0}
            step={1}
            value={values.stockQty}
            onChange={(e) => set("stockQty", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Price Delta" htmlFor="variant-priceDelta">
          <input
            id="variant-priceDelta"
            name="priceDelta"
            type="number"
            step={0.01}
            value={values.priceDelta}
            onChange={(e) => set("priceDelta", e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <FormMessage state={state} />

      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Creating..." : "Create variant"}
      </button>
    </form>
  );
}
