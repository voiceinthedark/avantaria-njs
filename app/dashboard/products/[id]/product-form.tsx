"use client";

import { useActionState, useState } from "react";
import { updateProductAction } from "./actions";
import { Field } from "../../_components/field";
import { FormMessage } from "../../_components/form-message";
import { buttonClass, inputClass } from "../../_components/form-styles";

type ProductFormProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    /** Prisma Decimal serialized as a string (e.g. "129.00"); Decimals can't cross to the client. */
    basePrice: string;
    categoryId: string;
    isFeatured: boolean;
    isActive: boolean;
  };
  categories: { id: string; name: string }[];
};

/**
 * Edits the product's own fields. Variants and images have their own forms,
 * so they are deliberately not part of this one.
 */
export default function ProductForm({ product, categories }: ProductFormProps) {
  const [state, action, pending] = useActionState(updateProductAction, undefined);

  // The saved values (props refresh after the action revalidates the page).
  const saved = {
    name: product.name,
    slug: product.slug,
    description: product.description,
    basePrice: product.basePrice,
    categoryId: product.categoryId,
    isFeatured: product.isFeatured,
    isActive: product.isActive,
  };
  // Controlled, so a failed save doesn't wipe what the admin typed.
  const [values, setValues] = useState(saved);

  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const unchanged = (Object.keys(saved) as (keyof typeof saved)[]).every(
    (key) => values[key] === saved[key],
  );

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={product.id} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="product-name">
          <input
            id="product-name"
            name="name"
            type="text"
            required
            minLength={2}
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field
          label="Slug"
          htmlFor="product-slug"
          hint="Lower-case and hyphenated. Changing it changes the product's public URL."
        >
          <input
            id="product-slug"
            name="slug"
            type="text"
            required
            minLength={2}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            value={values.slug}
            onChange={(e) => set("slug", e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Description" htmlFor="product-description" hint="At least 10 characters.">
        <textarea
          id="product-description"
          name="description"
          required
          minLength={10}
          rows={5}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          className={inputClass}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Base price"
          htmlFor="product-base-price"
          hint="Variants can add or subtract from this."
        >
          <input
            id="product-base-price"
            name="basePrice"
            type="number"
            inputMode="decimal"
            required
            min="0.01"
            step="0.01"
            value={values.basePrice}
            onChange={(e) => set("basePrice", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Category" htmlFor="product-category">
          <select
            id="product-category"
            name="categoryId"
            value={values.categoryId}
            onChange={(e) => set("categoryId", e.target.value)}
            className={inputClass}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/*
        Both checkboxes must be in the form: the action reads an absent
        checkbox as "false", so leaving them out would deactivate and
        unfeature the product on every save.
      */}
      <div className="flex flex-wrap gap-6 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isActive"
            checked={values.isActive}
            onChange={(e) => set("isActive", e.target.checked)}
          />
          Active (visible in the store)
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isFeatured"
            checked={values.isFeatured}
            onChange={(e) => set("isFeatured", e.target.checked)}
          />
          Featured
        </label>
      </div>

      {/* Hide a stale "saved" message as soon as the form is edited again. */}
      <FormMessage state={state?.ok && !unchanged ? undefined : state} />

      <button type="submit" className={buttonClass} disabled={pending || unchanged}>
        {pending ? "Saving…" : "Save product"}
      </button>
    </form>
  );
}
